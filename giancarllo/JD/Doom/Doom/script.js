// ===== MENU E CONFIGURAÇÕES =====
const playBtn = document.getElementById("playBtn");
const instructionsBtn = document.getElementById("instructionsBtn");
const settingsBtn = document.getElementById("settingsBtn");
const popups = document.querySelectorAll(".popup");
const closeBtns = document.querySelectorAll(".closeBtn");
const sensitivityInput = document.getElementById("sensitivity");
const sensValue = document.getElementById("sensValue");
const menu = document.getElementById("menu");
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let sensitivity = 1;
let gameRunning = false;

sensitivityInput.oninput = () => {
  sensitivity = parseFloat(sensitivityInput.value);
  sensValue.textContent = sensitivity.toFixed(1);
};

function openPopup(id) {
  document.getElementById(id).style.display = "block";
}
function closePopups() {
  popups.forEach(p => p.style.display = "none");
}

instructionsBtn.onclick = () => openPopup("instructions");
settingsBtn.onclick = () => openPopup("settings");
closeBtns.forEach(b => b.onclick = closePopups);

playBtn.onclick = () => {
  menu.style.display = "none";
  canvas.style.display = "block";
  startGame();
};

// ===== JOGO =====
let player = { x: 400, y: 300, r: 15, speed: 3 };
let enemies = [];
const keys = {};

window.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
window.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);
window.addEventListener("resize", resizeCanvas);

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();

function startGame() {
  enemies = [];
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  gameRunning = true;
  spawnEnemies();
  loop();
}

function spawnEnemies() {
  setInterval(() => {
    if (!gameRunning) return;
    let side = Math.floor(Math.random() * 4);
    let x, y;
    if (side === 0) { x = 0; y = Math.random() * canvas.height; }
    if (side === 1) { x = canvas.width; y = Math.random() * canvas.height; }
    if (side === 2) { x = Math.random() * canvas.width; y = 0; }
    if (side === 3) { x = Math.random() * canvas.width; y = canvas.height; }

    enemies.push({ x, y, r: 12, speed: 1 + Math.random() });
  }, 1200);
}

function update() {
  if (keys["w"]) player.y -= player.speed * sensitivity;
  if (keys["s"]) player.y += player.speed * sensitivity;
  if (keys["a"]) player.x -= player.speed * sensitivity;
  if (keys["d"]) player.x += player.speed * sensitivity;

  // Manter dentro da tela
  player.x = Math.max(player.r, Math.min(canvas.width - player.r, player.x));
  player.y = Math.max(player.r, Math.min(canvas.height - player.r, player.y));

  // Movimento dos inimigos
  enemies.forEach(e => {
    let dx = player.x - e.x;
    let dy = player.y - e.y;
    let dist = Math.hypot(dx, dy);
    e.x += (dx / dist) * e.speed;
    e.y += (dy / dist) * e.speed;

    // colisão
    if (dist < e.r + player.r) {
      gameOver();
    }
  });
}

function draw() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // player
  ctx.fillStyle = "#e03c31";
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fill();

  // inimigos
  ctx.fillStyle = "#0f0";
  enemies.forEach(e => {
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

function loop() {
  if (!gameRunning) return;
  update();
  draw();
  requestAnimationFrame(loop);
}

function gameOver() {
  gameRunning = false;
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#e03c31";
  ctx.font = "bold 40px Arial";
  ctx.textAlign = "center";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
  setTimeout(() => {
    enemies = [];
    menu.style.display = "flex";
    canvas.style.display = "none";
  }, 2000);
}
