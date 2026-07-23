// js/booking.js - Slots loading and Selection handling
import { auth, db } from "../firebase/config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const AVAILABLE_SLOTS = ["10:00", "13:00", "15:00", "17:00"];

let selectedServiceData = null;
let selectedDateVal = null;
let selectedTimeVal = null;

// Auth check & load stored service
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const storedService = sessionStorage.getItem('selectedService');
  if (!storedService) {
    window.location.href = "home.html";
    return;
  }

  selectedServiceData = JSON.parse(storedService);
  document.getElementById('service-title').innerText = selectedServiceData.name;
  document.getElementById('service-price').innerText = `${selectedServiceData.price} ฿`;

  initDatePicker();
});

function initDatePicker() {
  const dateInput = document.getElementById('booking-date');
  const today = new Date().toISOString().split('T')[0];
  
  dateInput.min = today;
  dateInput.value = today;
  selectedDateVal = today;

  loadTimeSlots(today);

  dateInput.addEventListener('change', (e) => {
    selectedDateVal = e.target.value;
    selectedTimeVal = null;
    updateProceedButton();
    loadTimeSlots(selectedDateVal);
  });
}

async function loadTimeSlots(targetDate) {
  const container = document.getElementById('time-slots-grid');
  container.innerHTML = '<p style="color: var(--text-muted); grid-column: 1/-1;">กำลังตรวจสอบเวลาว่าง...</p>';

  try {
    // ดึงเฉพาะ Booking ที่ถูกจองในวันที่เลือกและไม่ได้ถูก Cancel
    const q = query(
      collection(db, "Bookings"),
      where("date", "==", targetDate),
      where("status", "in", ["Pending", "Confirmed"])
    );

    const querySnapshot = await getDocs(q);
    const bookedTimes = querySnapshot.docs.map(doc => doc.data().time);

    container.innerHTML = '';

    AVAILABLE_SLOTS.forEach(timeStr => {
      const btn = document.createElement('button');
      btn.className = 'time-slot-btn btn-ripple';
      btn.innerText = timeStr;

      const isBooked = bookedTimes.includes(timeStr);
      if (isBooked) {
        btn.disabled = true;
      } else {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.time-slot-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          selectedTimeVal = timeStr;
          updateProceedButton();
        });
      }

      container.appendChild(btn);
    });

  } catch (error) {
    console.error("Error loading slots:", error);
    container.innerHTML = '<p style="color: #F87171;">เกิดข้อผิดพลาดในการโหลดรอบเวลา</p>';
  }
}

function updateProceedButton() {
  const proceedBtn = document.getElementById('proceed-pay-btn');
  if (selectedDateVal && selectedTimeVal) {
    proceedBtn.disabled = false;
  } else {
    proceedBtn.disabled = true;
  }
}

document.getElementById('proceed-pay-btn')?.addEventListener('click', () => {
  // บันทึกแยกคีย์ตามที่ payment.js เรียกใช้
  sessionStorage.setItem('selectedDate', selectedDateVal);
  sessionStorage.setItem('selectedTime', selectedTimeVal);

  window.location.href = "payment.html";
});