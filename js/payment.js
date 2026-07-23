import { auth, db } from "../firebase/config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let currentUser = null;
let userProfileData = {}; // เก็บข้อมูลจาก Users Collection
let selectedService = null;
let selectedDate = null;
let selectedTime = null;

// ฟังก์ชันแปลงไฟล์รูปภาพเป็นข้อความ Base64 String
const convertFileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = (error) => reject(error);
});

// 1. ตรวจสอบการล็อกอิน และดึงข้อมูลโปรไฟล์ผู้ใช้
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    
    // ดึงข้อมูลเบอร์โทร/ชื่อ จาก Users Collection มาเตรียมไว้
    try {
      const userDoc = await getDoc(doc(db, "Users", user.uid));
      if (userDoc.exists()) {
        userProfileData = userDoc.data();
      }
    } catch (e) {
      console.log("Error fetching user profile:", e);
    }

    loadBookingData();
  } else {
    window.location.href = "login.html";
  }
});

function loadBookingData() {
  selectedService = JSON.parse(sessionStorage.getItem('selectedService') || '{}');
  selectedDate = sessionStorage.getItem('selectedDate');
  selectedTime = sessionStorage.getItem('selectedTime');

  if (!selectedService.name || !selectedDate || !selectedTime) {
    alert("กรุณาเลือกบริการและเวลาจองก่อนครับ");
    window.location.href = "home.html";
    return;
  }

  // แสดงผลสรุป
  document.getElementById('summary-service').innerText = selectedService.name;
  document.getElementById('summary-date').innerText = selectedDate;
  document.getElementById('summary-time').innerText = selectedTime + " น.";
  document.getElementById('summary-price').innerText = selectedService.price + " ฿";
}

// 2. สลับการแสดงผล โอนเงิน / เงินสด
const payMethodInputs = document.querySelectorAll('input[name="payMethod"]');
const transferArea = document.getElementById('transfer-area');

payMethodInputs.forEach(input => {
  input.addEventListener('change', (e) => {
    document.querySelectorAll('.method-card').forEach(card => card.classList.remove('active'));
    e.target.closest('.method-card').classList.add('active');

    if (e.target.value === 'transfer') {
      transferArea.style.display = 'block';
    } else {
      transferArea.style.display = 'none';
    }
  });
});

// 3. กดยืนยันการจองคิว
const confirmBtn = document.getElementById('confirm-booking-btn');

confirmBtn.addEventListener('click', async () => {
  const payMethod = document.querySelector('input[name="payMethod"]:checked').value;
  const slipFileInput = document.getElementById('slip-file');
  let slipDataUrl = "";

  if (payMethod === 'transfer') {
    if (!slipFileInput.files || slipFileInput.files.length === 0) {
      alert("กรุณาแนบไฟล์สลิปการโอนเงินด้วยครับ");
      return;
    }
  }

  confirmBtn.disabled = true;
  confirmBtn.innerText = "กำลังประมวลผล...";

  try {
    if (payMethod === 'transfer' && slipFileInput.files[0]) {
      slipDataUrl = await convertFileToBase64(slipFileInput.files[0]);
    }

    confirmBtn.innerText = "กำลังบันทึกข้อมูล...";

    // หาเบอร์โทรศัพท์ (ลองดึงจาก Users collection ก่อน ถ้าไม่มีค่อยดึงจาก auth)
    const userPhone = userProfileData.phone || currentUser.phoneNumber || "-";
    const userName = userProfileData.name || currentUser.displayName || "ผู้ใช้งาน";
    const userEmail = userProfileData.email || currentUser.email || "-";

    // บันทึกลง Firestore
    const bookingDoc = await addDoc(collection(db, "Bookings"), {
      uid: currentUser.uid,
      userName: userName,
      userEmail: userEmail,
      phone: userPhone, // บันทึกเบอร์โทรเข้า Firestore
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      price: selectedService.price,
      date: selectedDate,
      time: selectedTime,
      paymentMethod: payMethod,
      slipUrl: slipDataUrl,
      status: "Pending",
      createdAt: serverTimestamp()
    });

    sessionStorage.setItem('lastBookingID', bookingDoc.id);

    alert("จองคิวสำเร็จ!");
    window.location.href = "success.html";

  } catch (error) {
    console.error("Booking Error:", error);
    alert("เกิดข้อผิดพลาด: " + error.message);
    
    confirmBtn.disabled = false;
    confirmBtn.innerText = "ยืนยันการจองคิว";
  }
});