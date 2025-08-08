// DOM Refs
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const playerCountInput = document.getElementById('player-count');
const countdownOverlay = document.getElementById('countdown-overlay');
const countdownNumber = document.getElementById('countdown-number');
const gameScreen = document.getElementById('game-screen');
const celebrityImg = document.getElementById('celebrity');
const slider = document.getElementById('emoji-slider');
const turnIndicator = document.getElementById('turn-indicator');
const doneBtn = document.getElementById('done-placements');
const scoreboard = document.getElementById('scoreboard');
const rankList = document.getElementById('rank-list');
const proceedWebcamBtn = document.getElementById('proceed-webcam');
const webcamModal = document.getElementById('webcam-modal');
const videoEl = document.getElementById('video');
const videoOverlay = document.getElementById('video-overlay');
const snapBtn = document.getElementById('snap-btn');
const closeWebcamBtn = document.getElementById('close-webcam');
const downloadLink = document.getElementById('download-link');
const portraitImage = document.getElementById('celebrity');


// Game State
let playerCount = 1;
let currentPlayer = 1;
let placements = [];
let selectedEmoji = null;

// Emojis
const commonEmojis = ['😀','😎','😂','🔥','🎯','❤️','💙','💚','💛','💜','🌟','✨','👑','🤡','🥳','🔴','🔵','🟢'];

// Build slider
function buildSlider() {
  slider.innerHTML = '';
  commonEmojis.forEach(e => {
    const item = document.createElement('div');
    item.className = 'emoji-item';
    item.textContent = e;
    item.addEventListener('click', () => {
      selectedEmoji = e;
      document.querySelectorAll('.emoji-item').forEach(el => el.classList.remove('selected'));
      item.classList.add('selected');
    });
    slider.appendChild(item);
  });
}

// Countdown
function showCountdown(start = 3, cb) {
  countdownOverlay.classList.remove('hidden');
  let n = start;
  countdownNumber.textContent = n;
  const interval = setInterval(() => {
    n -= 1;
    if (n <= 0) {
      countdownNumber.textContent = 'GO!';
      clearInterval(interval);
      setTimeout(() => {
        countdownOverlay.classList.add('hidden');
        cb && cb();
      }, 600);
    } else {
      countdownNumber.textContent = n;
    }
  }, 800);
}

// //Random Spin
function startSpinAndHide(durationMs = 3000) {
  const spins = [360, -360, 720, -720];
  const randomSpin = spins[Math.floor(Math.random() * spins.length)];

  celebrityImg.style.transform = `rotate(0deg)`;
  celebrityImg.style.transition = `transform ${durationMs / 1000}s linear`;
  setTimeout(() => {
    celebrityImg.style.transform = `rotate(${randomSpin}deg)`;
  });
  
  setTimeout(() => {
    celebrityImg.style.opacity = '0';
    setTimeout(() => {
      celebrityImg.style.display = 'none';
      document.getElementById('bottom-bar').style.display = 'flex';
    }, 500);
  }, durationMs);
}

//  const portrait = document.getElementById('portrait');
//  let angle = 0;
//  let x = 100, y = 100;
//  let dx = 2, dy = 2;

//  function animate() {
//    // Rotate
//    angle += 2;

//    // Move
//    x += dx;
//    y += dy;

//    // Bounce on edges
//    if (x <= 0 || x + portrait.width >= window.innerWidth) dx *= -1;
//    if (y <= 0 || y + portrait.height >= window.innerHeight) dy *= -1;

//    // Apply transform
//    portrait.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;

// //   requestAnimationFrame(animate);
//  }

//  animate();

// function startSpinAndHide(durationMs = 3000) {
//   let startTime = Date.now();
//   let speed = 30; // rotation speed multiplier
//   let x = window.innerWidth / 2;
//   let y = window.innerHeight / 2;
//   let vx = (Math.random() * 10) + 8; // horizontal velocity
//   let vy = (Math.random() * 10) + 8; // vertical velocity
//   let angle = 0;

//   celebrityImg.style.display = 'block';
//   celebrityImg.style.opacity = '1';
//   celebrityImg.style.position = 'fixed'; // move freely
//   celebrityImg.style.left = `${x}px`;
//   celebrityImg.style.top = `${y}px`;
//   celebrityImg.style.transition = 'none';

//   function animate() {
//     let elapsed = Date.now() - startTime;
//     if (elapsed > durationMs) {
//       celebrityImg.style.opacity = '0';
//       setTimeout(() => {
//         celebrityImg.style.display = 'none';
//         document.getElementById('bottom-bar').style.display = 'flex';
//       }, 500);
//       return;
//     }

//     // Update position
//     x += vx;
//     y += vy;

//     // Bounce from walls
//     if (x <= 0 || x + celebrityImg.width >= window.innerWidth) {
//       vx = -vx;
//     }
//     if (y <= 0 || y + celebrityImg.height >= window.innerHeight) {
//       vy = -vy;
//     }

//     // Update angle
//     angle += speed;

//     // Apply transform
//     celebrityImg.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;

//     requestAnimationFrame(animate);
//   }

//   animate();



// Click Anywhere Placement
function enableClickPlacement() {
  document.addEventListener('click', (ev) => {
    if (slider.contains(ev.target)) return; // ignore emoji bar clicks
    if (!selectedEmoji) return;

    registerPlacementForCurrentPlayer({
      playerNum: currentPlayer,
      emoji: selectedEmoji,
      x: ev.clientX,
      y: ev.clientY
    });
    selectedEmoji = null;
    document.querySelectorAll('.emoji-item').forEach(el => el.classList.remove('selected'));
  });
}

// Place emoji visually
function placeEmojiVisual(emoji, x, y, playerName) {
  const el = document.createElement('div');
  el.className = 'placed-emoji';
  el.style.position = 'absolute';
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.transform = 'translate(-50%, -50%)';
  el.innerHTML = `<div style="font-size:2.2rem;line-height:1">${emoji}</div><div class="placed-label">${playerName}</div>`;
  document.body.appendChild(el);
}

// Register placement
function registerPlacementForCurrentPlayer({ playerNum, emoji, x, y }) {
  if (placements.some(p => p.playerNum === playerNum)) {
    alert(`Player ${playerNum} already placed.`);
    return;
  }
  const playerName = `Player ${playerNum}`;
  placeEmojiVisual(emoji, x, y, playerName);
  placements.push({ playerNum, player: playerName, emoji, x, y });
  currentPlayer += 1;
  if (currentPlayer > playerCount) {
    turnIndicator.textContent = `All done`;
    doneBtn.classList.remove('hidden');
    setTimeout(() => {
      celebrityImg.style.display = 'block';
      celebrityImg.style.opacity = '1';
      computeAndShowScoreboard();
    }, 1000);
  } else {
    turnIndicator.textContent = `Player ${currentPlayer}'s Turn`;
  }
}

// Scoreboard
async function computeAndShowScoreboard() {
  const imgRect = celebrityImg.getBoundingClientRect();
  const imageWidth = imgRect.width;
  const imageHeight = imgRect.height;
  let serverData = null;
  try {
    const resp = await fetch('/compute_score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        placements: placements.map(p => ({ player: p.player, emoji: p.emoji, x: p.x, y: p.y })),
        imageWidth, imageHeight
      })
    });
    serverData = await resp.json();
  } catch {}
  rankList.innerHTML = '';
  (serverData?.ranked || []).forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${row.player}</td><td>${row.emoji} (${row.tokenCount})</td><td>${row.distance.toFixed(1)}</td>`;
    rankList.appendChild(tr);
  });
  scoreboard.classList.remove('hidden');
  confetti({ particleCount: 150, spread: 60, origin: { y: 0.3 } });
}

startBtn.addEventListener('click', () => {
  // Read player count
  playerCount = parseInt(playerCountInput.value, 10) || 2;
  currentPlayer = 1;
  placements = [];

  // Hide start screen, show game screen
  startScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');

  // Update first player's turn text
  turnIndicator.textContent = `Player ${currentPlayer}'s Turn`;

  // Make sure portrait is hidden during countdown
  portraitImage.style.display = "none";

  // Start countdown
  showCountdown(3, () => {
    // After countdown: show portrait and start game
    portraitImage.style.display = "block";
    startSpinAndHide(3000);
    enableClickPlacement();
  });
});


buildSlider();
