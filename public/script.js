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

// Random Spin
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

// Webcam
let stream;
let modelsLoaded = false;
async function openWebcam() {
  webcamModal.classList.remove('hidden');

  if (!modelsLoaded) {
    await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    await faceapi.nets.faceLandmark68TinyNet.loadFromUri('/models');
    modelsLoaded = true;
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
    videoEl.srcObject = stream;
    await videoEl.play();
    videoOverlay.width = videoEl.videoWidth || videoEl.clientWidth;
    videoOverlay.height = videoEl.videoHeight || videoEl.clientHeight;

    async function drawOverlay() {
      const ctx = videoOverlay.getContext('2d');
      ctx.clearRect(0, 0, videoOverlay.width, videoOverlay.height);

      const detections = await faceapi
        .detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks(true);

      if (detections && detections.landmarks) {
        const leftBrow = detections.landmarks.getLeftEyeBrow();
        const rightBrow = detections.landmarks.getRightEyeBrow();

        const browCenterX = (leftBrow[2].x + rightBrow[2].x) / 2;
        const browCenterY = (leftBrow[2].y + rightBrow[2].y) / 2;

        const radius = Math.max(10, Math.round(videoOverlay.width * 0.04));
        ctx.beginPath();
        ctx.fillStyle = 'rgba(220,20,60,0.9)';
        ctx.arc(browCenterX, browCenterY, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(drawOverlay);
    }
    requestAnimationFrame(drawOverlay);
  } catch (err) {
    alert('Could not open webcam: ' + err.message);
  }
}

function closeWebcam() {
  webcamModal.classList.add('hidden');
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
}

// Snapshot with landmark-based bindi position
snapBtn.addEventListener('click', async () => {
  const w = videoEl.videoWidth || videoEl.clientWidth;
  const h = videoEl.videoHeight || videoEl.clientHeight;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoEl, 0, 0, w, h);

  const detections = await faceapi
    .detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks(true);

  if (detections && detections.landmarks) {
    const leftBrow = detections.landmarks.getLeftEyeBrow();
    const rightBrow = detections.landmarks.getRightEyeBrow();

    const browCenterX = (leftBrow[2].x + rightBrow[2].x) / 2;
    const browCenterY = (leftBrow[2].y + rightBrow[2].y) / 2;

    const radius = Math.max(10, Math.round(w * 0.04));
    ctx.beginPath();
    ctx.fillStyle = 'rgba(220,20,60,0.95)';
    ctx.arc(browCenterX, browCenterY, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  downloadLink.href = canvas.toDataURL('image/png');
  downloadLink.classList.remove('hidden');
  downloadLink.click();
});

closeWebcamBtn.addEventListener('click', closeWebcam);
proceedWebcamBtn.addEventListener('click', () => {
  scoreboard.classList.add('hidden');
  openWebcam();
});
doneBtn.addEventListener('click', computeAndShowScoreboard);

startBtn.addEventListener('click', () => {
  playerCount = Math.max(2, Math.min(5, parseInt(playerCountInput.value || '3', 10)));
  currentPlayer = 1;
  placements = [];
  startScreen.classList.add('hidden');
  showCountdown(3, () => {
    gameScreen.classList.remove('hidden');
    startSpinAndHide(3000);
    buildSlider();
    enableClickPlacement();
    turnIndicator.textContent = `Player ${currentPlayer}'s Turn`;
    document.getElementById('bottom-bar').style.display = 'none';
    doneBtn.classList.add('hidden');
    scoreboard.classList.add('hidden');
  });
});

buildSlider();
