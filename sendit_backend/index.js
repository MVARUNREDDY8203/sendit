const express = require("express");
const multer = require("multer");
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
const Redis = require("redis");
const admin = require("firebase-admin");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();
const app = express();
const upload = multer({ memory: true });

const corsOptions = {
    origin: "*", // Allow all origins (or specify your domain)
    methods: ["GET", "POST"], // Ensure GET and POST are allowed
    allowedHeaders: ["Content-Type", "Authorization"], // Include necessary headers
};

app.use(cors(corsOptions));

// Force HTTPS middleware
app.use((req, res, next) => {
    if (req.headers["x-forwarded-proto"] !== "https") {
        return res.redirect(`https://${req.get("host")}${req.url}`);
    }
    next();
});

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_KEY)),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

const bucket = admin.storage().bucket();
const db = admin.firestore();

// Initialize Redis client with Upstash credentials
const redisClient = Redis.createClient({
    url: process.env.REDIS_URL,
    socket: {
        reconnectStrategy: (retries) => {
            console.log(`Reconnect attempt #${retries}`);
            if (retries > 100000) {
                return new Error("Too many retries, stopping...");
            }
            return Math.min(retries * 100, 10000);
        },
    },
});

redisClient.on("error", (err) => console.error("Redis Client Error:", err));
redisClient.on("connect", () => console.log("Connected to Upstash Redis"));

(async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        console.error("Failed to connect to Redis:", err);
    }
})();

// Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_ID,
        pass: process.env.EMAIL_PWD,
    },
});

// Rate limiting middleware
const rateLimiter = async (req, res, next) => {
    const ip = req.ip;
    const current = await redisClient.incr(ip);

    if (current > 1000) {
        return res.status(429).send("Too many requests");
    }

    if (current === 1) {
        await redisClient.expire(ip, 3600);
    }

    next();
};

app.post("/upload", rateLimiter, upload.single("file"), async (req, res) => {
    try {
        const { file } = req;
        const { email } = req.body;

        // Generate unique filename
        const file_org_name = file.originalname;
        const filename = `${uuidv4()}-${file_org_name}`;

        // Upload file to Firebase Storage under 'files' folder
        const fileBuffer = file.buffer;
        const fileUpload = bucket.file(`files/${filename}`);
        await fileUpload.save(fileBuffer, {
            metadata: {
                contentType: file.mimetype,
            },
        });

        // Generate signed URL
        const [url] = await fileUpload.getSignedUrl({
            action: "read",
            expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        // Store metadata in Firestore
        const expiryTimestamp = admin.firestore.Timestamp.fromMillis(
            Date.now() + 7 * 24 * 60 * 60 * 1000
        );
        const docRef = await db.collection("files").add({
            filename,
            email,
            uploadDate: admin.firestore.FieldValue.serverTimestamp(),
            expiryDate: expiryTimestamp,
        });

        // Create a download URL that points to our new endpoint
        // const downloadUrl = `${req.protocol}://${req.get("host")}/download/${
        //     docRef.id
        // }`;
        const downloadUrl = `https://${req.get("host")}/download/${docRef.id}`;

        const expiryDate = expiryTimestamp.toDate();
        const day = String(expiryDate.getDate()).padStart(2, "0");
        const month = String(expiryDate.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
        const year = expiryDate.getFullYear();

        const formattedDate = `${day}-${month}-${year}`;
        // Send email with download link
        await transporter.sendMail({
            from: "your-email@gmail.com",
            to: email,
            subject: `Your file ${file_org_name} is ready for download`,
            text: `You can download your file here: ${downloadUrl}`,
            html: `<p>You can download your file: ${file_org_name} <br>Link expires on: ${formattedDate} <br><a href="${downloadUrl}">click here to download</a>.</p>`,
        });

        res.status(200).json({
            message: "File uploaded and email sent successfully",
            downloadUrl,
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "An error occurred" });
    }
});

// New download endpoint
app.get("/download/:fileId", async (req, res) => {
    try {
        const fileId = req.params.fileId;
        const fileDoc = await db.collection("files").doc(fileId).get();

        if (!fileDoc.exists) {
            return res.status(404).send("File not found");
        }

        const fileData = fileDoc.data();
        const file = bucket.file(`files/${fileData.filename}`);

        const [url] = await file.getSignedUrl({
            action: "read",
            expires: Date.now() + 15 * 60 * 1000, // URL valid for 15 minutes
        });

        const response = await axios({
            method: "get",
            url: url,
            responseType: "stream",
        });

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${fileData.filename}"`
        );
        res.setHeader("Content-Type", response.headers["content-type"]);

        response.data.pipe(res);
    } catch (error) {
        console.error("Error in download:", error);
        res.status(500).send("An error occurred while downloading the file");
    }
});

app.get("/warmup", (req, res) => {
    res.status(200).send("OK");
});

// Function to delete expired files
const deleteExpiredFiles = async () => {
    console.log("Checking for expired files...");
    const now = admin.firestore.Timestamp.now();

    try {
        const expiredFiles = await db
            .collection("files")
            .where("expiryDate", "<=", now)
            .get();

        const deletePromises = expiredFiles.docs.map(async (doc) => {
            const { filename } = doc.data();
            try {
                // console.log(bucket.file(filename).exists());
                await bucket.file(`files/${filename}`).delete();
                await doc.ref.delete();
                console.log(`Deleted expired file: ${filename}`);
            } catch (error) {
                console.error(`Error deleting file ${filename}:`, error);
            }
        });

        await Promise.all(deletePromises);
        console.log(
            `Deletion check complete. Processed ${deletePromises.length} files.`
        );
    } catch (error) {
        console.error("Error in deleteExpiredFiles:", error);
    }
};

// Schedule the deletion check every 12 hours
setInterval(deleteExpiredFiles, 12 * 60 * 60 * 1000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port localhost:${PORT}`);
    // Run initial check for expired files on server start
    deleteExpiredFiles();
});
