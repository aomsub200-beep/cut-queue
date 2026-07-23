import { db } from "../firebase/config.js";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export async function syncUserData(user) {
  const userRef = doc(db, "Users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const newUser = {
      uid: user.uid,
      name: user.displayName || "User",
      email: user.email || "",
      phone: user.phoneNumber || "",
      photo: user.photoURL || "",
      role: "user",
      phoneVerified: false,
      createdAt: serverTimestamp()
    };
    await setDoc(userRef, newUser);
    return newUser;
  }
  return userSnap.data();
}

// อัปเดตสถานะการยืนยันเบอร์โทร (ใช้ชื่อ updatePhoneStatus)
export async function updatePhoneStatus(uid, phone) {
  try {
    const userRef = doc(db, "Users", uid); // 👈 เช็กตรงนี้ให้เป็น "Users"
    await updateDoc(userRef, {
      phone: phone,
      phoneVerified: true
    });
  } catch (error) {
    console.error("Error updating phone status:", error);
  }
}