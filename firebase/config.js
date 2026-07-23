// firebase/config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCWM1Dx_N5TAK-gzo358lHT14kzTmgOY4Q",
  authDomain: "cutqueue-app-4dde7.firebaseapp.com",
  projectId: "cutqueue-app-4dde7",
  storageBucket: "cutqueue-app-4dde7.firebasestorage.app",
  messagingSenderId: "724926901708",
  appId: "1:724926901708:web:a71211f4f46c3be09bc169"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export instances
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);