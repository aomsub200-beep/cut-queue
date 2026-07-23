// js/profile.js
import { auth, db } from "../firebase/config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ตรวจสอบสถานะการล็อกอินและดึงข้อมูลมาแสดง
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      // ดึงข้อมูล User จาก Firestore (Collection: Users)
      const userRef = doc(db, "Users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        
        // แปะข้อมูลลงใน Element ต่างๆ
        const emailInput = document.querySelector('input[type="email"]') || document.getElementById('profile-email');
        const phoneInput = document.querySelectorAll('input[type="text"]')[0] || document.getElementById('profile-phone');
        
        if (emailInput) emailInput.value = userData.email || user.email || "-";
        if (phoneInput) phoneInput.value = userData.phone || user.phoneNumber || "-";

      } else {
        // กรณีไม่มีข้อมูลใน Firestore ให้ดึงจาก Google Auth โดยตรง
        const emailInput = document.querySelector('input[type="email"]');
        if (emailInput) emailInput.value = user.email || "-";
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  } else {
    // ถ้าไม่ได้ล็อกอิน ให้เด้งกลับหน้า Login
    window.location.href = "login.html";
  }
});

// Event ปุ่มออกจากระบบ
document.addEventListener("DOMContentLoaded", () => {
  // ค้นหาปุ่มที่มีคำว่า "ออกจากระบบ"
  const buttons = document.querySelectorAll("button");
  buttons.forEach(button => {
    if (button.textContent.includes("ออกจากระบบ")) {
      button.addEventListener("click", async () => {
        try {
          await signOut(auth);
          alert("ออกจากระบบสำเร็จ");
          window.location.href = "login.html";
        } catch (error) {
          console.error("Sign out error:", error);
        }
      });
    } else if (button.textContent.includes("ย้อนกลับ")) {
      button.addEventListener("click", () => {
        window.location.href = "home.html";
      });
    }
  });
});