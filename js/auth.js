// js/auth.js - Phone OTP verification logic
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from "../firebase/config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { updateUserPhone } from "./firebase.js";

let confirmationResult = null;
let currentUser = null;

// Auth Guard Check
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    initRecaptcha();
  } else {
    window.location.href = "login.html";
  }
});

function initRecaptcha() {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible'
    });
  }
}

// Send OTP
document.getElementById('send-otp-btn')?.addEventListener('click', async () => {
  const rawPhone = document.getElementById('phone-input').value.trim();
  if (rawPhone.length < 9) {
    alert("กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง");
    return;
  }

  // แปลงเบอร์เป็นรูปแบบ E.164 (+66)
  const formattedPhone = rawPhone.startsWith('0') 
    ? '+66' + rawPhone.substring(1) 
    : rawPhone;

  try {
    const appVerifier = window.recaptchaVerifier;
    confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
    
    document.getElementById('phone-section').style.display = 'none';
    document.getElementById('otp-section').style.display = 'block';
    alert("ส่งรหัส OTP เรียบร้อยแล้ว!");
  } catch (error) {
    console.error("OTP Error:", error);
    alert("เกิดข้อผิดพลาดในการส่ง OTP: " + error.message);
  }
});

// Verify OTP
document.getElementById('verify-otp-btn')?.addEventListener('click', async () => {
  const otpCode = document.getElementById('otp-input').value.trim();
  if (otpCode.length !== 6) {
    alert("กรุณากรอกรหัส OTP 6 หลัก");
    return;
  }

  try {
    await confirmationResult.confirm(otpCode);
    const phoneVal = document.getElementById('phone-input').value.trim();
    
    // อัปเดต DB ว่า ยืนยันเบอร์เรียบร้อยแล้ว
    await updateUserPhone(currentUser.uid, phoneVal);
    
    alert("ยืนยันเบอร์โทรศัพท์สำเร็จ!");
    window.location.href = "home.html";
  } catch (error) {
    console.error("Verification Error:", error);
    alert("รหัส OTP ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
  }
});