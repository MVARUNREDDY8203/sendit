import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import React, { useState } from "react";
import { storage } from "../firebase/firebase";

const StorageExample = () => {
    const [file, setFile] = useState(null);
    const [url, setUrl] = useState("");

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (file) {
            const storageRef = ref(storage, `files/${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            setUrl(downloadURL);
            console.log("File uploaded successfully");
        }
    };

    return (
        <div>
            <input type='file' onChange={handleFileChange} />
            <button onClick={handleUpload}>Upload</button>
            {url && <img src={url} alt='Uploaded file' />}
        </div>
    );
};

export default StorageExample;
