// js/verify-phone.js
import { auth } from "../firebase/config.js";
import { RecaptchaVerifier, signInWithPhoneNumber } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { updatePhoneStatus } from "./firebase.js";

let confirmationResult = null;

// ตั้งค่า reCAPTCHA แบบซ่อนเบื้องหลัง
function setupRecaptcha() {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'send-otp-btn', {
      'size': 'invisible',
      'callback': (response) => {
        // reCAPTCHA solved
      }
    });
  }
}

// Event ปุ่มส่ง OTP
document.getElementById('send-otp-btn')?.addEventListener('click', async () => {
  const phoneInput = document.getElementById('phone-input').value.trim();
  const sendBtn = document.getElementById('send-otp-btn');
  
  if (!phoneInput) {
    alert("กรุณากรอกเบอร์โทรศัพท์");
    return;
  }

  // แปลงเบอร์ 095... ให้เป็น +6695... อัตโนมัติ
  let formattedPhone = phoneInput;
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '+66' + formattedPhone.substring(1);
  } else if (!formattedPhone.startsWith('+66')) {
    formattedPhone = '+66' + formattedPhone;
  }

  try {
    sendBtn.disabled = true;
    sendBtn.innerText = "กำลังส่งรหัส OTP...";

    setupRecaptcha();
    const appVerifier = window.recaptchaVerifier;

    confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
    
    // สลับ UI ไปขั้นตอนใส่รหัส OTP
    document.getElementById('phone-section').style.display = 'none';
    document.getElementById('otp-section').style.display = 'block';
    
  } catch (error) {
    console.error("Phone Auth Error:", error);
    alert("เกิดข้อผิดพลาดในการส่ง OTP: " + error.message);
    sendBtn.disabled = false;
    sendBtn.innerText = "ส่งรหัส OTP";
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
  }
});

// Event ปุ่มยืนยัน OTP
document.getElementById('verify-otp-btn')?.addEventListener('click', async () => {
  const otpInput = document.getElementById('otp-input').value.trim();
  const verifyBtn = document.getElementById('verify-otp-btn');

  if (!otpInput || otpInput.length < 6) {
    alert("กรุณากรอกรหัส OTP ให้ครบ 6 หลัก");
    return;
  }

  try {
    verifyBtn.disabled = true;
    verifyBtn.innerText = "กำลังตรวจสอบ...";

    const result = await confirmationResult.confirm(otpInput);
    const user = result.user;

    // อัปเดตสถานะเบอร์โทรใน Firestore
    const rawPhone = document.getElementById('phone-input').value.trim();
    await updatePhoneStatus(user.uid, rawPhone); // 👈 เพิ่มบรรทัดนี้เข้าไปครับ!

    alert("ยืนยันเบอร์โทรศัพท์สำเร็จ!");
    window.location.href = "index.html";

  } catch (error) {
    console.error("OTP Verification Error:", error);
    alert("รหัส OTP ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
    verifyBtn.disabled = false;
    verifyBtn.innerText = "ยืนยันรหัส OTP";
  }
});