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

// เริ่มต้นใช้งาน Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const whackMarPaoRef = ref(db, "whackMarPao");


const holes = document.querySelectorAll(".hole");
const scoreBoard = document.getElementById("score");
const timeLeftDisplay = document.getElementById("time-left");
const gameBoard = document.getElementById("board");
const moles = document.querySelectorAll(".mole");

const setupPanel = document.getElementById("setup-panel");
const controlsPanel = document.getElementById("controls-panel");
const weaponElement = document.getElementById("weapon-element");
const historyList = document.getElementById("history-list");

// Database configuration matrix for mole variations
const moleTypes = [
  {
	normal: 'images/mole1.png',
	hitStick1: 'images/mole1-hit-stick1.png', 	// Dizzy
	hitStick2: 'images/mole1-hit-stick2.png', 	// Dizzy
	hitBroom: 'images/mole1-hit-broom.png'   	// Slash effect placeholder
  },
  {
	normal: 'images/mole2.png',
	hitStick1: 'images/mole2-hit-stick1.png',
	hitStick2: 'images/mole2-hit-stick2.png',
	hitBroom: 'images/mole2-hit-broom.png',
  },
  {
	normal: 'images/mole3.png',
	hitStick1: 'images/mole3-hit-stick1.png',
	hitStick2: 'images/mole3-hit-stick2.png',
	hitBroom: 'images/mole3-hit-broom.png'
  }
];

// Weapon parameters asset system mapping
const weaponAssets = {
	ไม้ตีสุนัข: { url: 'images/stick1.png', points: 1 },
	ก้านมะยม: { url: 'images/stick2.png', points: 2 },
	ไม้กวาด: { url: 'images/broom.png', points: 3 }
};

let chosenWeapon = "ไม้ตีสุนัข"; 
let lastHole;
let timeUp = false;
let score = 0;
let totalClicks = 0; // ตัวแปรเก็บจำนวนครั้งที่ตีทั้งหมดในรอบนั้น
let countdown;
let peepTimeout;
let timeLeft = 10;
let currentMoleConfig = null;

// Track custom graphic movement inline with real hardware engine tracking coordinate states
window.addEventListener("mousemove", (e) => {
  weaponElement.style.left = e.clientX + "px";
  weaponElement.style.top = e.clientY + 'px';
});

// นับจำนวนครั้งที่ผู้เล่นเหวี่ยงอาวุธตี (ไม่ว่าจะโดนตุ่นหรือไม่ก็ตาม)
window.addEventListener("click", (e) => {
  if (document.body.classList.contains("game-active") && e.isTrusted) {
    // ป้องกันการนับเบิ้ลหากกดโดนปุ่ม Back
    if (!e.target.classList.contains("back-btn")) {
      totalClicks++;
    }
  }
});

function selectWeapon(weaponType, element) {
  chosenWeapon = weaponType;
  document.querySelectorAll(".weapon-card").forEach(card => card.classList.remove("selected"));
  element.classList.add("selected");
}

function randomTime(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}

function randomHole(holesList) {
  const idx = Math.floor(Math.random() * holesList.length);
  const hole = holesList[idx];
  if (hole === lastHole) {
    return randomHole(holesList);
  }
  lastHole = hole;
  return hole;
}

function peep() {
  const minTime = (chosenWeapon === "sword") ? 450 : 600;
  const maxTime = (chosenWeapon === "sword") ? 900 : 1100;
  
  const time = randomTime(minTime, maxTime); 
  const hole = randomHole(holes);
  const mole = hole.querySelector(".mole");
  
  currentMoleConfig = moleTypes[Math.floor(Math.random() * moleTypes.length)];
  
  mole.dataset.normalUrl = currentMoleConfig.normal;
  mole.dataset.stick1Url = currentMoleConfig.hitStick1;
  mole.dataset.stick2Url = currentMoleConfig.hitStick2;
  mole.dataset.broomUrl = currentMoleConfig.hitBroom;
  
  mole.style.backgroundImage = "url('" + currentMoleConfig.normal + "')";
  
  hole.classList.add("up");

  peepTimeout = setTimeout(() => {
    hole.classList.remove("up");
    if (!timeUp) peep();
  }, time);
}

function startGame() {
  score = 0;
  totalClicks = 0; // รีเซ็ตจำนวนครั้งที่ตี
  timeLeft = 20;
  timeUp = false;
  
  scoreBoard.textContent = score;
  timeLeftDisplay.textContent = timeLeft;
  
  setupPanel.style.display = "none";
  controlsPanel.style.display = "block";
  gameBoard.classList.add("playable");
  
  document.body.classList.add("game-active", "weapon-" + chosenWeapon);
  weaponElement.style.backgroundImage = "url('" + weaponAssets[chosenWeapon].url + "')";
  weaponElement.style.display = "block";

  peep();
  
  countdown = setInterval(() => {
    timeLeft--;
    timeLeftDisplay.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(countdown);
      clearTimeout(peepTimeout);
      timeUp = true;
      
      document.body.classList.remove("game-active", "weapon-ไม้ตีสุนัข", "weapon-ก้านมะยม", "weapon-ไม้กวาด");
      weaponElement.style.display = "none";
      gameBoard.classList.remove("playable");
      setupPanel.style.display = "inline-block";
      controlsPanel.style.display = "none";
      
      holes.forEach(hole => hole.classList.remove("up"));
      
      alert("Game Over! Final Score with " + chosenWeapon.toUpperCase() + ": " + score);
    }
  }, 1000);
}
window.startGame = startGame; // เปิดให้ HTML เรียกใช้ได้

// ---> ADD THIS FUNCTION ANYWHERE IN SCRIPT.JS <---
function resetToMenu() {
  // 1. Force halt all active game loops and timers
  clearInterval(countdown);
  clearTimeout(peepTimeout);
  timeUp = true;

  // 2. Clear out game state tracking data sets
  score = 0;
  totalClicks = 0;
  timeLeft = 20;
  scoreBoard.textContent = score;
  timeLeftDisplay.textContent = timeLeft;

  // 3. Revert all game character class settings back to defaults
  document.body.classList.remove("game-active", "weapon-ไม้ตีสุนัข", "weapon-ก้านมะยม", "weapon-ไม้กวาด");
  weaponElement.style.display = "none";
  gameBoard.classList.remove("playable");
  
  // 4. Force all moles back down into their holes immediately
  holes.forEach(hole => hole.classList.remove("up"));

  // 5. Flip the UI view back to selection layout panel screen
  setupPanel.style.display = "inline-block";
  controlsPanel.style.display = "none";
}
window.resetToMenu = resetToMenu; // เปิดให้ HTML เรียกใช้ได้

function bonk(e) {
  if(!e.isTrusted) return; 
  
  score += weaponAssets[chosenWeapon].points;
  scoreBoard.textContent = score;
  
  if (chosenWeapon === "ไม้ตีสุนัข") {
		this.style.backgroundImage = "url('" + this.dataset.stick1Url + "')";

		const hitSound = document.getElementById("hit1-sound");
		hitSound.volume = 0.5; 
		hitSound.currentTime = 0; // Rewinds to the start so it can play instantly on rapid clicks
		hitSound.play();
  
  } else if (chosenWeapon === "ก้านมะยม") {
		this.style.backgroundImage = "url('" + this.dataset.stick2Url + "')";
		
		const hitSound = document.getElementById("hit2-sound");
		hitSound.volume = 0.5; 
		hitSound.currentTime = 0; // Rewinds to the start so it can play instantly on rapid clicks
		hitSound.play();
		
  } else {
		this.style.backgroundImage = "url('" + this.dataset.broomUrl + "')";
		
		const hitSound = document.getElementById("hit3-sound");
		hitSound.volume = 0.3; 
		hitSound.currentTime = 0; // Rewinds to the start so it can play instantly on rapid clicks
		hitSound.play();
  }
  
  this.style.pointerEvents = "none";
  const pullDownDelay = (chosenWeapon === "sword") ? 150 : 300;
  
  setTimeout(() => {
    this.parentNode.classList.remove('up');
    this.style.pointerEvents = ""; 
  }, pullDownDelay);
}

moles.forEach(mole => mole.addEventListener("click", bonk));

// --- ส่วนดึงข้อมูลแสดงผลหน้าแรก (ดึง 10 รายการล่าสุด) ---
const recentScoresQuery = query(whackMarPaoRef, limitToLast(10));

onValue(recentScoresQuery, (snapshot) => {
  if (!snapshot.exists()) {
    historyList.innerHTML = "<div style='color: #aaa;'>No match history found.</div>";
    return;
  }

  let htmlResult = "";
  const dataList = [];

  // วนลูปเก็บข้อมูลจาก Firebase เข้า Array
  snapshot.forEach((childSnapshot) => {
    dataList.push(childSnapshot.val());
  });

  // พลิกกลับเอาข้อมูลล่าสุดขึ้นมาแสดงด้านบน (Reverse Array)
  dataList.reverse();

  // สร้างโครงสร้าง HTML แสดงผล
  dataList.forEach((data) => {
    const date = new Date(data.timestamp).toLocaleTimeString();
    htmlResult += `
      <div style="padding: 5px 0; border-bottom: 1px solid #444; font-size: 0.9rem;">
        <strong>[${date}]</strong> อาวุธ: ${data.weapon} | 
        <span style="color: #00e676;">คะแนน: ${data.score}</span> | 
        <span style="color: #ff9800;">จำนวนที่ตี: ${data.totalClicks}</span>
      </div>
    `;
  });

  historyList.innerHTML = htmlResult;
});
