// js/admin.js - เพิ่มระบบจัดการบริการ (Services CRUD)
import { auth, db } from "../firebase/config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let selectedBookingForCancel = null;

// ฟังก์ชันแปลงไฟล์เป็น Base64
const convertFileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = (error) => reject(error);
});

onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = "login.html"; return; }

  const userDoc = await getDoc(doc(db, "Users", user.uid));
  if (!userDoc.exists() || userDoc.data().role !== 'admin') {
    alert("เฉพาะแอดมินเท่านั้นที่สามารถเข้าถึงหน้านี้ได้");
    window.location.href = "home.html";
    return;
  }

  listenToBookings();
  listenToServices();
});

// ------------------- 1. ระบบจัดการรายการจองคิว -------------------
function listenToBookings() {
  onSnapshot(collection(db, "Bookings"), (snapshot) => {
    let total = 0, todayCount = 0, revenue = 0;
    let pending = 0, confirmed = 0, cancelled = 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const tbody = document.getElementById('admin-booking-rows');
    tbody.innerHTML = '';

    snapshot.docs.forEach(docSnap => {
      const data = docSnap.data();
      const id = docSnap.id;
      total++;

      if (data.date === todayStr) todayCount++;
      if (data.status === 'Confirmed') revenue += Number(data.price || 0);

      if (data.status === 'Pending') pending++;
      if (data.status === 'Confirmed') confirmed++;
      if (data.status === 'Cancelled') cancelled++;

      let badgeClass = "badge-pending";
      if (data.status === "Confirmed") badgeClass = "badge-confirmed";
      if (data.status === "Cancelled") badgeClass = "badge-cancelled";

      const slipImage = data.slipUrl || data.slipURL || "";
      const name = data.userName || data.customerName || "ลูกค้า";

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${name}</td>
        <td>${data.phone || '-'}</td>
        <td>${data.serviceName || '-'}</td>
        <td>${data.date || '-'} (${data.time || '-'})</td>
        <td>
          ${data.paymentMethod === 'cash' ? '💵 เงินสด' : '💳 โอนเงิน'}
          ${slipImage ? `<br><button onclick="viewSlip('${id}')" class="btn-sm" style="margin-top: 4px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); cursor: pointer;">🖼️ ดูสลิป</button>` : ''}
        </td>
        <td><span class="badge ${badgeClass}">${data.status}</span></td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button onclick="updateStatus('${id}', 'Confirmed')" class="btn-sm btn-confirm">Confirm</button>
            <button onclick="openCancelModal('${id}')" class="btn-sm btn-cancel-action">Cancel</button>
            <button onclick="deleteBooking('${id}')" class="btn-sm" style="background: rgba(239, 68, 68, 0.2); color: #F87171; border: 1px solid rgba(239, 68, 68, 0.3);">🗑️ ลบ</button>
          </div>
        </td>
      `;

      if (slipImage) tr.dataset.slip = slipImage;
      tbody.appendChild(tr);
    });

    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-today').innerText = todayCount;
    document.getElementById('stat-revenue').innerText = `${revenue.toLocaleString()} ฿`;
    document.getElementById('stat-pending').innerText = pending;
    document.getElementById('stat-confirmed').innerText = confirmed;
    document.getElementById('stat-cancelled').innerText = cancelled;
  });
}

// ------------------- 2. ระบบจัดการบริการ (Services) -------------------
function listenToServices() {
  onSnapshot(collection(db, "Services"), (snapshot) => {
    const tbody = document.getElementById('admin-services-rows');
    tbody.innerHTML = '';

    if (snapshot.empty) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">ยังไม่มีรายการบริการ กดปุ่ม "+ เพิ่มบริการใหม่" เพื่อเริ่มสร้างได้เลยครับ</td></tr>`;
      return;
    }

    snapshot.docs.forEach(docSnap => {
      const service = docSnap.data();
      const id = docSnap.id;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${service.name || '-'}</strong></td>
        <td><span style="color: #34D399;">${service.price || 0} ฿</span></td>
        <td>${service.duration || '-'} นาที</td>
        <td>
          <button onclick="deleteService('${id}')" class="btn-sm" style="background: rgba(239, 68, 68, 0.2); color: #F87171; border: 1px solid rgba(239, 68, 68, 0.3);">🗑️ ลบ</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  });
}

// เปิด/ปิด Modal เพิ่มบริการ
document.getElementById('open-add-service-modal')?.addEventListener('click', () => {
  document.getElementById('service-name-input').value = '';
  document.getElementById('service-price-input').value = '';
  document.getElementById('service-duration-input').value = '';
  if (document.getElementById('service-file-input')) document.getElementById('service-file-input').value = '';
  document.getElementById('service-modal').style.display = 'flex';
});

document.getElementById('close-service-modal-btn')?.addEventListener('click', () => {
  document.getElementById('service-modal').style.display = 'none';
});

// บันทึกบริการใหม่ลง Firestore
document.getElementById('save-service-btn')?.addEventListener('click', async () => {
  const name = document.getElementById('service-name-input').value.trim();
  const price = document.getElementById('service-price-input').value.trim();
  const duration = document.getElementById('service-duration-input').value.trim();
  const fileInput = document.getElementById('service-file-input');

  if (!name || !price) {
    alert("กรุณากรอกชื่อบริการและราคาให้ครบถ้วนครับ");
    return;
  }

  const saveBtn = document.getElementById('save-service-btn');
  saveBtn.disabled = true;
  saveBtn.innerText = "กำลังบันทึก...";

  try {
    let imageUrl = "";
    if (fileInput && fileInput.files && fileInput.files[0]) {
      imageUrl = await convertFileToBase64(fileInput.files[0]);
    }

    await addDoc(collection(db, "Services"), {
      name: name,
      price: Number(price),
      duration: duration ? Number(duration) : 30,
      imageUrl: imageUrl
    });

    alert("เพิ่มบริการเรียบร้อยแล้ว!");
    document.getElementById('service-modal').style.display = 'none';
  } catch (error) {
    console.error("Add Service Error:", error);
    alert("เกิดข้อผิดพลาดในการบันทึก: " + error.message);
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerText = "บันทึกบริการ";
  }
});

// ฟังก์ชันลบบริการ
window.deleteService = async function(id) {
  if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบบริการนี้?")) {
    try {
      await deleteDoc(doc(db, "Services", id));
      alert("ลบบริการเรียบร้อยแล้ว!");
    } catch (error) {
      console.error("Delete Service Error:", error);
      alert("เกิดข้อผิดพลาดในการลบ: " + error.message);
    }
  }
};

// ------------------- 3. Event Listeners & Functions เดิม -------------------
window.deleteBooking = async function(id) {
  if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรายการจองนี้ออกจากระบบถาวร?")) {
    try {
      await deleteDoc(doc(db, "Bookings", id));
      alert("ลบรายการจองเรียบร้อยแล้ว!");
    } catch (error) {
      console.error("Delete Error:", error);
      alert("เกิดข้อผิดพลาดในการลบ: " + error.message);
    }
  }
};

window.viewSlip = function(id) {
  const rows = document.querySelectorAll('#admin-booking-rows tr');
  rows.forEach(tr => {
    if (tr.querySelector(`button[onclick="viewSlip('${id}')"]`)) {
      const slipData = tr.dataset.slip;
      if (slipData) {
        document.getElementById('slip-modal-img').src = slipData;
        document.getElementById('slip-modal').style.display = 'flex';
      }
    }
  });
};

document.getElementById('close-slip-modal-btn')?.addEventListener('click', () => {
  document.getElementById('slip-modal').style.display = 'none';
});

window.updateStatus = async function(id, status) {
  await updateDoc(doc(db, "Bookings", id), { status: status });
};

window.openCancelModal = function(id) {
  selectedBookingForCancel = id;
  document.getElementById('cancel-modal').style.display = 'flex';
};

document.getElementById('close-modal-btn')?.addEventListener('click', () => {
  document.getElementById('cancel-modal').style.display = 'none';
});

document.getElementById('confirm-cancel-btn')?.addEventListener('click', async () => {
  const reason = document.getElementById('cancel-reason-input').value.trim() || 'ช่างไม่ว่าง';
  if (selectedBookingForCancel) {
    await updateDoc(doc(db, "Bookings", selectedBookingForCancel), {
      status: "Cancelled",
      cancelReason: reason
    });
    document.getElementById('cancel-modal').style.display = 'none';
    document.getElementById('cancel-reason-input').value = '';
  }
});

document.getElementById('admin-logout-btn')?.addEventListener('click', async () => {
  await signOut(auth);
  window.location.href = "login.html";
});