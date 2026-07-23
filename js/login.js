// js/login.js - Google Authentication logic
import { auth, googleProvider } from "../firebase/config.js";
import { signInWithPopup } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { syncUserData } from "./firebase.js";

const googleBtn = document.getElementById('google-login-btn');

googleBtn.addEventListener('click', async () => {
  try {
    googleBtn.disabled = true;
    googleBtn.innerText = "กำลังเข้าสู่ระบบ...";

    // 1. Google Sign-In
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // 2. Sync / Check Firestore User Data
    const userData = await syncUserData(user);

    // 3. Routing Check according to logic flow
    if (userData.phoneVerified) {
      window.location.href = "index.html";
    } else {
      window.location.href = "verify-phone.html";
    }

  } catch (error) {
    console.error("Login Error:", error);
    alert("เกิดข้อผิดพลาดในการเข้าสู่ระบบ: " + error.message);
    googleBtn.disabled = false;
    googleBtn.innerText = "เข้าสู่ระบบด้วย Google";
  }
});