// ดึงฟังก์ชันที่จำเป็นจาก Firebase SDK ตรงตาม Connection ที่กำหนด
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getDatabase, ref, push, onValue, query, limitToLast } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCdNAeQyUHsOuevZOb29r7Ok2zEkv276BU",
  authDomain: "my-simple-games.firebaseapp.com",
  projectId: "my-simple-games",
  storageBucket: "my-simple-games.firebasestorage.app",
  messagingSenderId: "148777694804",
  appId: "1:148777694804:web:e57cc24cdd958dcb3d9fc1",
  databaseURL: "https://my-simple-games-default-rtdb.asia-southeast1.firebasedatabase.app" 
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
    // 🛠️ ถ้ายังไม่มีประวัติ ให้แสดงเป็น 0 ครั้งไปก่อน
    const totalHitsBanner = document.getElementById("total-hits-banner");
    if (totalHitsBanner) totalHitsBanner.textContent = "💥 โดนตีรวม 0 ครั้ง";
    return;
  }

  let htmlResult = "";
  const dataList = [];

  // 🛠️ เพิ่มตัวแปรสำหรับสะสมแต้มรวมทั้งหมด
  let aggregateScore = 0;
  let aggregateHits = 0;
  
  snapshot.forEach((childSnapshot) => {
    const data = childSnapshot.val();
    dataList.push(data);
    
    // คำนวณบวกสะสมค่าจากทุกรายการที่ดึงมา
    if (data.score) aggregateScore += Number(data.score);
    if (data.totalClicks) aggregateHits += Number(data.totalClicks);
  });

  // 🛠️ เพิ่มบรรทัดชุดนี้เข้าไป: เพื่อส่งค่าจำนวนครั้งรวมไปแสดงใต้ <h1> บนหน้าแรก
  const totalHitsBanner = document.getElementById("total-hits-banner");
  if (totalHitsBanner) {
    totalHitsBanner.innerHTML = `💥 โดนตีรวม ${aggregateHits} ครั้ง`;
  }
  
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

  // 2. 🛠️ สร้างแถวพิเศษสรุปผลรวม (Total Summary) ไว้ที่บรรทัดล่างสุด
  htmlResult += `
    <div style="padding: 12px 0 4px 0; margin-top: 5px; font-size: 0.95rem; display: flex; justify-content: space-between; align-items: center; border-top: 2px dashed #888; font-weight: bold; background: rgba(255, 255, 255, 0.05); border-radius: 0 0 10px 10px;">
      <div style="margin-left: 5px; color: #e0e0e0;">📊 สรุปยอดรวม (Total):</div>
      <div>
        <span style="color: #26ff91; margin-right: 10px; text-shadow: 0 0 5px rgba(38,255,145,0.4);">🏆 คะแนนรวม: ${aggregateScore}</span>
        <span style="color: #ffb74d; margin-right: 5px; text-shadow: 0 0 5px rgba(255,183,77,0.4);">💥 ตีโดนรวม: ${aggregateHits} ครั้ง</span>
      </div>
    </div>
  `;

  historyList.innerHTML = htmlResult;
});
