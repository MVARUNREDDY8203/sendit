import React, { useState } from "react";
import axios from "axios"; // Install axios with `npm install axios`

const FileUpload = () => {
    const [file, setFile] = useState(null);
    const [email, setEmail] = useState("");
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState("");

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
    };

    const handleUpload = async () => {
        if (!file || !email) {
            alert("Please select a file and enter an email address.");
            return;
        }

        setUploading(true);
        setMessage("");

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("email", email);

            const response = await axios.post(
                "http://localhost:3000/upload",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            setMessage(response.data.message);
        } catch (error) {
            console.error("Error uploading file:", error);
            setMessage("Error uploading file");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            <h1>Upload File</h1>
            <input type='file' onChange={handleFileChange} />
            <input
                type='email'
                value={email}
                onChange={handleEmailChange}
                placeholder='Enter email'
            />
            <button onClick={handleUpload} disabled={uploading}>
                {uploading ? "Uploading..." : "Upload"}
            </button>
            <p>{message}</p>
        </div>
    );
};

export default FileUpload;
