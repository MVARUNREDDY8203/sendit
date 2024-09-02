import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyBlHDtLn9Wg0uZ_CY1tzj_w7S2EJz5aWdI",
    authDomain: "sendit-ca2fd.firebaseapp.com",
    projectId: "sendit-ca2fd",
    storageBucket: "sendit-ca2fd.appspot.com",
    messagingSenderId: "341462094487",
    appId: "1:341462094487:web:e684cdf8339d598027cfd2",
    measurementId: "G-F6S2T3DX95",
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getDatabase(app);

export { storage, db };
