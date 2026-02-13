alert("game.js carregou!");
const gameEl = document.getElementById("game");
const scoreEl = document.getElementById("score");
const timeEl  = document.getElementById("time");
const levelEl = document.getElementById("level");

const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const soundToggle = document.getElementById("soundToggle");

const overlay = document.getElementById("overlay");
const finalScoreEl = document.getElementById("finalScore");
const bestScoreEl = document.getElementById("bestScore");
const playAgainBtn = document.getElementById("playAgainBtn");

const BALLOON_EMOJI = ["🎈","🎉","⭐","🫧"];
const COLORS = ["#ff6b6b","#ffd93d","#6bcBef","#a3ffb0","#b28dff","#ff9fda"];

let score = 0;
let timeLeft = 30;
let level = 1;

let running = false;
let paused = false;

let spawnTimer = null;
let clockTimer = null;

const BEST_KEY = "balloons_best_score_v1";

function rand(min, max){ return Math.random() * (max - min) + min; }
function pick(arr){ return arr[Math.floor(Math.random() * arr.length)]; }

function beep(freq = 520, durationMs = 70){
  if (!soundToggle.checked) return;
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "sine";
  o.frequency.value = freq;
  g.gain.value = 0.07;
  o.connect(g);
  g.connect(ctx.destination);
  o.start();
  setTimeout(() => {
    o.stop();
    ctx.close();
  }, durationMs);
}

function updateHUD(){
  scoreEl.textContent = String(score);
  timeEl.textContent = String(timeLeft);
  levelEl.textContent = String(level);
}

function clearBalloons(){
  [...gameEl.querySelectorAll(".balloon")].forEach(b => b.remove());
}

function setButtons(){
  startBtn.disabled = running && !paused;
  pauseBtn.disabled = !running;
  pauseBtn.textContent = paused ? "Continuar" : "Pausar";
}

function computeLevel(){
  // sobe o nível a cada 10 pontos
  level = Math.floor(score / 10) + 1;
}

function spawnBalloon(){
  if (!running || paused) return;

  const rect = gameEl.getBoundingClientRect();

  const balloon = document.createElement("div");
  balloon.className = "balloon";
  balloon.textContent = pick(BALLOON_EMOJI);

  balloon.style.background = pick(COLORS);

  const x = rand(40, rect.width - 40);
  const y = rand(60, rect.height - 80);

  balloon.style.left = `${x}px`;
  balloon.style.top  = `${y}px`;

  // duração menor conforme nível (mais rápido)
  const ttl = Math.max(550, 1400 - level * 120);

  let removed = false;

  const removeLater = setTimeout(() => {
    if (removed) return;
    removed = true;
    balloon.remove();
    // pequena penalidade por deixar escapar
    score = Math.max(0, score - 1);
    computeLevel();
    updateHUD();
  }, ttl);

  balloon.addEventListener("pointerdown", () => {
    if (!running || paused) return;
    if (removed) return;
    removed = true;

    clearTimeout(removeLater);

    score += 1;
    computeLevel();
    updateHUD();

    beep(520 + level * 25, 60);

    balloon.classList.add("pop");
    setTimeout(() => balloon.remove(), 180);
  });

  gameEl.appendChild(balloon);
}

function startGame(){
  if (running && !paused) return;

  overlay.classList.add("hidden");

  if (!running){
    score = 0;
    timeLeft = 30;
    level = 1;
    clearBalloons();
    updateHUD();
  }

  running = true;
  paused = false;
  setButtons();

  // ritmo de spawn melhora com nível
  if (spawnTimer) clearInterval(spawnTimer);
  spawnTimer = setInterval(() => {
    // cria de 1 a 2 balões dependendo do nível
    spawnBalloon();
    if (level >= 4 && Math.random() < 0.35) spawnBalloon();
  }, 520);

  if (clockTimer) clearInterval(clockTimer);
  clockTimer = setInterval(() => {
    if (!running || paused) return;
    timeLeft -= 1;
    updateHUD();
    if (timeLeft <= 0) endGame();
  }, 1000);
}

function togglePause(){
  if (!running) return;
  paused = !paused;
  setButtons();
}

function endGame(){
  running = false;
  paused = false;
  setButtons();

  if (spawnTimer) clearInterval(spawnTimer);
  if (clockTimer) clearInterval(clockTimer);

  // salva recorde
  const best = Number(localStorage.getItem(BEST_KEY) || "0");
  const newBest = Math.max(best, score);
  localStorage.setItem(BEST_KEY, String(newBest));

  finalScoreEl.textContent = String(score);
  bestScoreEl.textContent = String(newBest);

  overlay.classList.remove("hidden");
  beep(260, 120);
  setTimeout(() => beep(200, 140), 120);
}

function resetGame(){
  running = false;
  paused = false;
  if (spawnTimer) clearInterval(spawnTimer);
  if (clockTimer) clearInterval(clockTimer);

  score = 0;
  timeLeft = 30;
  level = 1;

  clearBalloons();
  overlay.classList.add("hidden");

  updateHUD();
  setButtons();
}

startBtn.addEventListener("click", startGame);
pauseBtn.addEventListener("click", togglePause);
resetBtn.addEventListener("click", resetGame);
playAgainBtn.addEventListener("click", () => {
  resetGame();
  startGame();
});

updateHUD();
setButtons();
bestScoreEl.textContent = String(localStorage.getItem(BEST_KEY) || "0");
