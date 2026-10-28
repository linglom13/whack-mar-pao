// Add this line at the top of script.js to unlock Safari touch states
document.addEventListener("touchstart", function() {}, false);

// --- IMAGE PRELOADING CODE ---
const imagesToPreload = [
  'images/mole1.png', 
  'images/mole1-hit-stick1.png', 
  'images/mole1-hit-stick2.png',
  'images/mole1-hit-broom.png',
  'images/mole2.png', 
  'images/mole2-hit-stick1.png', 
  'images/mole2-hit-stick2.png',
  'images/mole2-hit-broom.png',
  'images/mole3.png', 
  'images/mole3-hit-stick1.png', 
  'images/mole3-hit-stick2.png',
  'images/mole3-hit-broom.png',
  'images/mole4.png', 
  'images/mole4-hit-stick1.png', 
  'images/mole4-hit-stick2.png',
  'images/mole4-hit-broom.png',
  'images/mole5.png', 
  'images/mole5-hit-stick1.png', 
  'images/mole5-hit-stick2.png',
  'images/mole5-hit-broom.png'
];

imagesToPreload.forEach(src => {
  const img = new Image();
  img.src = src;
});

// 🛠️ 1. Create a dictionary map to store all three decoded audio buffers
const gameAudioBuffers = {
  ไม้ตีสุนัข: null,
  ก้านมะยม: null,
  ไม้กวาด: null
};

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

// 🛠️ 2. Helper function to fetch and load individual audio channels into memory
function loadGameSound(key, url) {
  fetch(url)
    .then(response => response.arrayBuffer())
    .then(data => audioCtx.decodeAudioData(data))
    .then(buffer => {
      gameAudioBuffers[key] = buffer;
      console.log(`Audio Loaded successfully: ${key}`);
    })
    .catch(err => console.log(`Audio load error [${key}]:`, err));
}

// 🛠️ 3. Trigger individual assets downloads (Replace URLs with your custom mp3 files if needed!)
loadGameSound("ไม้ตีสุนัข", "audio/hit1.mp3");
loadGameSound("ก้านมะยม", "audio/hit2.mp3"); 
loadGameSound("ไม้กวาด", "audio/hit3.mp3"); 

// Fix iPad Safari audio lockout policy
function unlockAudio() {
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}
window.addEventListener("click", unlockAudio);
window.addEventListener("touchstart", unlockAudio);

// 🛠️ 4. Global reusable play function to trigger any loaded asset by name
function playSound(key, volume = 0.3) {
  const activeBuffer = gameAudioBuffers[key];
  
  if (activeBuffer && audioCtx) {
    const soundSource = audioCtx.createBufferSource();
    soundSource.buffer = activeBuffer;
    
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = volume; // Dynamic volume controller
    
    soundSource.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    soundSource.start(0); // Plays instantly and safely registers concurrent overlapping clicks
  }
}

const holes = document.querySelectorAll(".hole");
const scoreBoard = document.getElementById("score");
const timeLeftDisplay = document.getElementById("time-left");
const gameBoard = document.getElementById("board");
const moles = document.querySelectorAll(".mole");

const setupPanel = document.getElementById("setup-panel");
const controlsPanel = document.getElementById("controls-panel");
const weaponElement = document.getElementById("weapon-element");

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
  },
  {
	normal: 'images/mole4.png',
	hitStick1: 'images/mole4-hit-stick1.png',
	hitStick2: 'images/mole4-hit-stick2.png',
	hitBroom: 'images/mole4-hit-broom.png'
  },
  {
	normal: 'images/mole5.png',
	hitStick1: 'images/mole5-hit-stick1.png',
	hitStick2: 'images/mole5-hit-stick2.png',
	hitBroom: 'images/mole5-hit-broom.png'
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

let currentCombo = 0;
const comboBanner = document.getElementById("combo-banner");
const comboCountDisplay = document.getElementById("combo-count");

// Track custom graphic movement inline with real hardware engine tracking coordinate states
window.addEventListener("mousemove", (e) => {
  weaponElement.style.left = e.clientX + "px";
  weaponElement.style.top = e.clientY + 'px';
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
  const minTime = (chosenWeapon === "ไม้กวาด") ? 450 : 600;
  const maxTime = (chosenWeapon === "ไม้กวาด") ? 900 : 1100;
  
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
  timeLeft = 10;
  timeUp = false;

  currentCombo = 0;
  if (comboBanner) comboBanner.style.display = "none";
	
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

      // 🛠️ จุดสำคัญ: เรียกใช้ฟังก์ชันที่แชร์มาจากไฟล์ข้ามโมดูลเพื่อบันทึกประวัติลงฐานข้อมูล
      if (typeof window.saveMatchHistory === "function") {
        window.saveMatchHistory(score, totalClicks, chosenWeapon);
      }
		
      alert("Game Over! Final Score with " + chosenWeapon.toUpperCase() + ": " + score);
    }
  }, 1000);
}
window.startGame = startGame; // เปิดให้ HTML เรียกใช้ได้

// ---> ADD THIS FUNCTION ANYWHERE IN SCRIPT.JS <---
function resetToMenu() {

  currentCombo = 0;
  if (comboBanner) comboBanner.style.display = "none";
	
  // 1. Force halt all active game loops and timers
  clearInterval(countdown);
  clearTimeout(peepTimeout);
  timeUp = true;

  // 2. Clear out game state tracking data sets
  score = 0;
  totalClicks = 0;
  timeLeft = 10;
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

  totalClicks++; 

	// 🔥 Increment combo counter
    currentCombo++;
    
    // 🔥 Dynamic Scoring Matrix: Grant an extra +1 point for every 5 consecutive hits achieved
    const comboBonus = Math.floor(currentCombo / 5);
    score += weaponAssets[chosenWeapon].points + comboBonus;
    scoreBoard.textContent = score;

    // 🔥 Trigger the combo banner UI panel configurations
    if (currentCombo >= 2) {
        comboBanner.style.display = "inline-block";
        comboCountDisplay.textContent = currentCombo;
        // Flash animation effect
        comboBanner.classList.remove("combo-pop");
        void comboBanner.offsetWidth; // Force CSS reflow
        comboBanner.classList.add("combo-pop");
    }

    document.body.classList.add("striking");
    // Rest of your existing bonk structure (sound routing, background swapping, timers)...
	
  scoreBoard.textContent = score;

  document.body.classList.add("striking");
  setTimeout(() => document.body.classList.remove("striking"), 150);
	
  if (chosenWeapon === "ไม้ตีสุนัข") {
		this.style.backgroundImage = "url('" + this.dataset.stick1Url + "')";

		// 🛠️ Trigger the matching sound context dynamically (hammer or sword)
		playSound(chosenWeapon, 0.5);
		/*const hitSound = document.getElementById("hit1-sound");
		hitSound.volume = 0.5; 
		hitSound.currentTime = 0; // Rewinds to the start so it can play instantly on rapid clicks
		hitSound.play();*/
  
  } else if (chosenWeapon === "ก้านมะยม") {
		this.style.backgroundImage = "url('" + this.dataset.stick2Url + "')";

		// 🛠️ Trigger the matching sound context dynamically (hammer or sword)
		playSound(chosenWeapon, 0.5);
		/*const hitSound = document.getElementById("hit2-sound");
		hitSound.volume = 0.5; 
		hitSound.currentTime = 0; // Rewinds to the start so it can play instantly on rapid clicks
		hitSound.play();*/
		
  } else {
		this.style.backgroundImage = "url('" + this.dataset.broomUrl + "')";

	  	// 🛠️ Trigger the matching sound context dynamically (hammer or sword)
		playSound(chosenWeapon, 0.3);
		/*const hitSound = document.getElementById("hit3-sound");
		hitSound.volume = 0.3; 
		hitSound.currentTime = 0; // Rewinds to the start so it can play instantly on rapid clicks
		hitSound.play();*/
  }
  
  this.style.pointerEvents = "none";
  const pullDownDelay = (chosenWeapon === "ไม้กวาด") ? 150 : 300;
  
  setTimeout(() => {
    this.parentNode.classList.remove('up');
    this.style.pointerEvents = ""; 
  }, pullDownDelay);
}

moles.forEach(mole => mole.addEventListener("click", bonk));


// Handles missed clicks on the arena canvas background
gameBoard.addEventListener("click", function(e) {
    // If the click hit a mole, ignore (bonk function handles it)
    if (e.target.classList.contains("mole")) return;
    
    // Only trigger a break if the player actually had an active streak going
    if (currentCombo >= 2) {
        const breakAlert = document.getElementById("combo-break-alert");
        if (breakAlert) {
            breakAlert.style.visibility = "visible";
            
            // Clear any lingering hide timers to prevent flickering on rapid misses
            if (window.breakAlertTimeout) clearTimeout(window.breakAlertTimeout);
            
            // Automatically hide the message after 800ms
            window.breakAlertTimeout = setTimeout(() => {
                breakAlert.style.visibility = "hidden";
            }, 800);
        }
    }
    
    // 🔥 Missed click! Reset combo streak completely
    currentCombo = 0;
    if (comboBanner) {
        comboBanner.style.display = "none";
    }
});


