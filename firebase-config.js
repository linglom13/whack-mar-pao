// โหลดฟังก์ชันจาก Firebase Web SDK
import { initializeApp } from "https://gstatic.com";
import { getDatabase, ref, push, onValue, query, limitToLast } from "https://gstatic.com";

const firebaseConfig = {
  apiKey: "AIzaSyCdNAeQyUHsOuevZOb29r7Ok2zEkv276BU",
  authDomain: "://firebaseapp.com",
  projectId: "my-simple-games",
  storageBucket: "my-simple-games.firebasestorage.app",
  messagingSenderId: "148777694804",
  appId: "1:148777694804:web:e57cc24cdd958dcb3d9fc1",
  databaseURL: "https://firebasedatabase.app" 
};

// เริ่มต้นใช้งานระบบฐานข้อมูล
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const whackMarPaoRef = ref(db, "whackMarPao");

// ผูกฟังก์ชันบันทึกข้อมูลเข้ากับ window เพื่อให้ไฟล์ script.js หลักดึงไปใช้ได้
window.saveMatchHistory = function(finalScore, hitCount, weaponType) {
  push(whackMarPaoRef, {
    score: finalScore,
    totalClicks: hitCount, // เก็บเฉพาะจำนวนครั้งที่ตีโดนสำเร็จ
    weapon: weaponType,
    timestamp: Date.now()
  });
};

// ดึงประวัติ 10 รายการล่าสุดมาแสดงผลแบบเรียลไทม์
const recentScoresQuery = query(whackMarPaoRef, limitToLast(10));
onValue(recentScoresQuery, (snapshot) => {
  const historyList = document.getElementById("history-list");
  if (!historyList) return;

  if (!snapshot.exists()) {
    historyList.innerHTML = "<div style='color: #aaa;'>No match history found.</div>";
    return;
  }

  let htmlResult = "";
  const dataList = [];

  snapshot.forEach((childSnapshot) => {
    dataList.push(childSnapshot.val());
  });

  dataList.reverse(); // เรียงจากรายการล่าสุดไว้ด้านบนสุด

  dataList.forEach((data) => {
    const date = new Date(data.timestamp).toLocaleTimeString();
    // ตรวจสอบประเภทอาวุธเพื่อเลือกไอคอนและข้อความภาษาไทย
    let weaponText = "";
    if (data.weapon === "ไม้ตีสุนัข") {
    	weaponText = "ไม้ตีสุนัข";
    } else if (data.weapon === "ก้านมะยม") {
    	weaponText = "ก้านมะยม";
    } else {
    	weaponText = data.weapon || "ไม่ได้ระบุ";
    }

    htmlResult += `
      <div style="padding: 8px 0; border-bottom: 1px solid #444; font-size: 0.9rem; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <strong>[${date}]</strong> 
          <span style="background: rgba(255,255,255,0.15); padding: 2px 8px; border-radius: 5px; margin-left: 5px;">
            ${weaponText}
          </span>
        </div>
        <div>
          <span style="color: #00e676; margin-right: 10px;">🏆 คะแนน: <strong>${data.score}</strong></span>
          <span style="color: #ff9800;">💥 ตีโดน: <strong>${data.totalClicks}</strong> ครั้ง</span>
        </div>
      </div>
    `;
  });

  historyList.innerHTML = htmlResult;
});
