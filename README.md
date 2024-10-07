# [Sendit: A Fast, No SignUp, File Transfer Service](https://justsendit.vercel.app) 🚀

### [Demonstration of working - Video](https://www.youtube.com/watch?v=VypCG90-g5M)

SendIt is a fast, no-signup file transfer service designed to help users send files directly to their email without the hassle of registration. It is particularly useful for students and professionals working in environments where logging into shared systems is slow and cumbersome. Using SendIt, users can upload their files and receive them in their inbox with just a few clicks, solving the issue of network constraints and reducing the risk of forgetting to log out.
![image](https://github.com/user-attachments/assets/1b492f51-245f-45d2-a7d9-5fdff0242000)


## Table of Contents
- [Features](#-features)
- [Technologies Used](#️-technologies-used)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation and Project Setup](#installation-and-project-setup)
    - [Local Setup](#local-setup)
- [API Endpoints](#-api-endpoints)
- [Project Functionality / Documentation](#project-functionality--documentation)
  - [Frontend](#frontend)
  - [Backend](#backend)
- [Deployment](#deployment)
    - [Issues with Backend Deployment on Render](#issues-with-backend-deployment-on-render-and-fix)
    - [Fix #1](#fix-1-currently-using)
    - [Fix #2](#fix-2)


## 🌟 Features

- No User SignUp needed
- Send files directly to your email with a few clicks
- Downloadable URL of file received in email, valid upto 7 days before expiry
- Rate limiting using Redis to prevent spam 
- Automatic file deletion on file expiry using a background worker to keep system tidy

## 🛠️ Technologies Used

- **Backend**: NodeJS
- **Database**: Firebase FireStore (NoSQL based)
- **Storage**: Firebase Storage (object store)
- **Rate Limiting**: Redis [Upstash](upstash.com)
- **Frontend**: ReactJS + ChakraUI
- **Hosting**: [Vercel](vercel.com) (Frontend Hosting) + [Render](render.com) (Backend Node Server Hosting)

## 📁 Project Structure

```
sendit/
|---sendit_frontend/
|   |---public/
|   |---src/
|   |   |---components/
|   |   |   |---InputForm.jsx
|   |   |---hooks/
|   |   |   |---useShowToast.js
|   |   |---App.jsx                 # React App
|   |   |---index.css
|   |   |---main.jsx
|   |   |---theme.js
|   |---index.html
|   |---other.files
|---sendit_backend/ 
|   |---index.js                   # backend entry point
|   |---other.files
```

## 🚀 Getting Started

### Prerequisites

- #### Backend
    - **Firebase**
        - **Firebase Storage** (Object Store)
        - **Firebase FireStore** (NoSQL Database)
    - **NodeJS** (Runtime Environment)
    - **ExpressJS** (for server)
    - **Axios** (HTTP Client): A promise-based HTTP client for making requests to external APIs or services, commonly used for fetching data from URLs.
    - **NodeMailer** (Email Service): A module used to send emails from the server, supporting various email services with easy configuration.
    - **Multer** (File Upload Middleware): A middleware for handling multipart/form-data, primarily used for uploading files to the server.
    - **uuidv4 (Unique ID Generator)**: A library used to generate unique identifiers (UUIDs) for naming files or creating unique database keys.
    - **Redis: upstash.com** (In-memory Data Store): An in-memory key-value data store, commonly used for caching.

- #### Frontend
    - **React + Vite** (JS)
    - **ChakraUI** (for React+Vite): React Component Library

### Installation and Project Setup

#### Local Setup

1. Clone the repository:
   ```sh
   git clone https://github.com/MVARUNREDDY8203/sendit.git
   ```
2. Create a new [Upstash.com](upstash.com) redis client and copy credentials
3. Create a new Firebase project and choose Firebase Storage, Firebase Firestore Services and copy the serive credentials
4. create a .env file inside `/sendit_frontend`:
    ```
    VITE_UPLOAD_ENDPOINT=http://localhost:3000/upload
    VITE_WARMUP_ENDPOINT=http://localhost:3000/warmup
    ```
    and `/sendit_backend`:
    ```
    REDIS_URL=your_upstash_redis_url.upstash.io:6379
    EMAIL_ID=your_emailid@gmail.com
    EMAIL_PWD=your_emails_app_password
    FIREBASE_KEY=<firebase_sercice_credentials>
    FIREBASE_STORAGE_BUCKET=project_name.appspot.com
    ```
5. Start Backend Service
    ```
    cd sendit_backend
    npm install # to install dependencies
    npm run index.jsx
    ```
6. Start Frontend Service
    ```
    cd sendit_frontend
    npm install # to install dependencies
    npm run dev
    ```


## 🔗 API Endpoints

| Method | Endpoint | Description | Payload | Response |
|--------|----------|--------------|-------|------|
| POST | `/upload` | File  Upload, MetaData creation | {file, email} | {Successful_msg, DownloadURL} |
| GET | `/download/:fileID` | File Download  | {} | file download |
| GET | `/warmup` | Server warmup - ping  | {} | {Server_live_message} |

## Project Functionality / Documentation

### Frontend:
- #### UI: Single Page Application
    - ##### Logo (made on Excalidraw.com)
    - ##### Input fields
        - Email
        - Choose File
    - ##### Send Button
    - ##### Server Status Indication
- #### How does the Frontend interract with the Backend:
    - `/sendit_frontend/src/components/InputForm.jsx`
    - First the client side checks if the server is live
        - If not live, shows wait status
        - If live user can proceed with the app nomally
    - After filling the details: email, file, we validate if `file_size <= 25MB` and both fields are there
    - We send a `POST` request to the backend sercvice on the `/upload` endpoint.
    - Show status after every step using the `useShowToast` hook

### Backend:
- single file: `/sendit_backend/index.js`
- #### `/upload` 
    - create a uuid (Unique Identifier) for the file and append filename to it
    - Upload file to Firebase Storage under 'files' folder
    - Store metadata in Firestore
        - `{
            filename,
            email,
            uploadDate,
            expiryDate,
        }`
    - Generate signed URL for download with 7 day expiry that points to the /download endpoint
    - send email with `file_download_URL` and `expiry_date` attached in the body
- #### `/download/:fileId`
    - get `fileId` from parameters of the request
    - check if any file with `fileId` exists in Database
    - create signedURL which is the Firebase Storage reference of the file, valid for 15 mins
    - set `Content-Disposition` headers 
    - serve the signedURL with the headers on the /download endpoint which will automatically download the file
- #### `/warmup`
    - if incoming request, this will activate the render server instance from sleep due to inactivity and respond with `status: 200` `"message": "OK"`
- #### `rateLimiter`: Rate-Limiting Middleware
    - checks the IP address of the incoming request in Redis Cache
    - if `request_count > rate_limiting_threshold`:
        - return `status:4xx` `"Too Many Requests"` response
    - else:
        - forward the message to the `next()` handler
- #### Background Deletion of Files
    - `setInterval(deleteExpiredFiles, 12 * 60 * 60 * 1000)`: runs every 12 hrs to delete expired files
    - `deleteExpiredFiles`:
        - checks database for file metadata: `expiryDate` 
        - if `expiryDate <= current_date`:
            - delete file from Storage

## Deployment
- Frontend is deployed on **Vercel**
    - directory: `/sendit_frontend` is selected as root directory for this deployment
    - after deploying the backend service, the `.env` variables for `/upload` and `/warmup` endpoints are updated according to the new **IP address**
- Backend is deployed on **Render** + **Firebase** + **Upstash**
    - environment variables are loaded as mentioned above
    - #### Issues with Backend deployment on Render and Fix
        - I chose the **free tier** on Render for my node server which comes with a big limitation: the server instance goes to sleep after **15 minutes** of 0 inbound traffic requests. The server takes about **50 seconds** to come back live after detecting some inbound request the instance.
    - #### Fix #1 (currently-using):
        - I developed a new `/warmup` endpoint which the frontend app starts to ping as soon as it is launched in a browser. The status button displays the status of the server if online/ offline for better UX. We wait till the server is online; i.e. after getting a `status:2XX` response from `/warmup` endpoint and then the flow of the app continues normally.
    - #### Fix #2:
        - We can deploy a **cron job** using either [Github Actions](https://github.com/features/actions) or [cron-job.org](cron-job.org), both being free, to send pings to the `/warmup` endpoint **periodically every 15 minutes** for the most busy part of the day **(12-16 hours/ day)** so that we can have **HIGH AVAILABILITY**, while also not surpassing the 750 hours/ month of server instance time of the free tier on Render and still have a lump sum 160+ hours of server time left for requests in the inactive part of the day.
        
