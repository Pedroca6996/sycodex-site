"use strict"; // Ativa modo estrito

// =========================
// 1) CONFIGURAÇÕES BÁSICAS
// =========================
const canvas = document.getElementById("game"); // Pega o canvas
const ctx = canvas.getContext("2d"); // Contexto 2D

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const PLAYER_SPEED = 6; // Velocidade da nave
const BULLET_SPEED = 9; // Velocidade do tiro
const BULLET_WIDTH = 4, BULLET_HEIGHT = 12;
const SHOOT_COOLDOWN_MS = 220;

const ENEMY_ROWS = 1, ENEMY_COLS = 10;
const ENEMY_WIDTH = 40, ENEMY_HEIGHT = 24;
const ENEMY_HGAP = 18, ENEMY_VGAP = 18;
let enemySpeed = 2, enemyDirection = 1;
const ENEMY_DROP = 20;

// =========================
// 2) ESTADO DO JOGO
// =========================
const player = {
  width: 50, height: 18,
  x: WIDTH / 2 - 25,
  y: HEIGHT - 50,
  vx: 0,
  canShootAt: 0
};

const bullets = [];
const enemies = [];

const keys = { ArrowLeft: false, ArrowRight: false, Space: false };

// =========================
// 3) CRIAÇÃO DOS INIMIGOS
// =========================
(function spawnEnemies() {
  const totalWidth = ENEMY_COLS * ENEMY_WIDTH + (ENEMY_COLS - 1) * ENEMY_HGAP;
  const startX = (WIDTH - totalWidth) / 2;
  const startY = 60;

  for (let row = 0; row < ENEMY_ROWS; row++) {
    for (let col = 0; col < ENEMY_COLS; col++) {
      const x = startX + col * (ENEMY_WIDTH + ENEMY_HGAP);
      const y = startY + row * (ENEMY_HEIGHT + ENEMY_VGAP);
      enemies.push({ x, y, width: ENEMY_WIDTH, height: ENEMY_HEIGHT, alive: true });
    }
  }
})();

// =========================
// 4) ENTRADAS DO TECLADO
// =========================
window.addEventListener("keydown", (e) => {
  if (e.code === "ArrowLeft") keys.ArrowLeft = true;
  if (e.code === "ArrowRight") keys.ArrowRight = true;
  if (e.code === "Space") { keys.Space = true; tryShoot(); e.preventDefault(); }
});
window.addEventListener("keyup", (e) => {
  if (e.code === "ArrowLeft") keys.ArrowLeft = false;
  if (e.code === "ArrowRight") keys.ArrowRight = false;
  if (e.code === "Space") keys.Space = false;
});

// =========================
// 5) FUNÇÃO DE TIRO
// =========================
function tryShoot() {
  const now = performance.now();
  if (now < player.canShootAt) return;
  player.canShootAt = now + SHOOT_COOLDOWN_MS;

  const bulletX = player.x + player.width / 2 - BULLET_WIDTH / 2;
  const bulletY = player.y - BULLET_HEIGHT;
  bullets.push({ x: bulletX, y: bulletY, width: BULLET_WIDTH, height: BULLET_HEIGHT, vy: -BULLET_SPEED });
}

// =========================
// 6) ATUALIZAÇÃO DO JOGO
// =========================
function update() {
  player.vx = 0;
  if (keys.ArrowLeft) player.vx -= PLAYER_SPEED;
  if (keys.ArrowRight) player.vx += PLAYER_SPEED;
  player.x += player.vx;
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > WIDTH) player.x = WIDTH - player.width;

  let hitEdge = false;
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    enemy.x += enemySpeed * enemyDirection;
    if (enemy.x <= 0 || enemy.x + enemy.width >= WIDTH) hitEdge = true;
  }
  if (hitEdge) {
    enemyDirection *= -1;
    for (const enemy of enemies) if (enemy.alive) enemy.y += ENEMY_DROP;
  }

  for (const b of bullets) b.y += b.vy;
  for (let i = bullets.length - 1; i >= 0; i--) if (bullets[i].y + bullets[i].height < 0) bullets.splice(i, 1);

  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    for (const e of enemies) {
      if (!e.alive) continue;
      if (rectsOverlap(b, e)) {
        e.alive = false;
        bullets.splice(i, 1);
        break;
      }
    }
  }
}

// =========================
// 7) DESENHO DOS ELEMENTOS
// =========================
function draw() {
  ctx.fillStyle = "#111827";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawPlayer();

  ctx.fillStyle = "#e5e7eb";
  for (const b of bullets) ctx.fillRect(b.x, b.y, b.width, b.height);

  for (const enemy of enemies) if (enemy.alive) drawEnemy(enemy);

  ctx.fillStyle = "#9ca3af";
  ctx.font = "16px system-ui, sans-serif";
  ctx.fillText(`Inimigos restantes: ${enemies.filter(e => e.alive).length}`, 16, 24);
}

function drawPlayer() {
  ctx.fillStyle = "#22d3ee";
  ctx.fillRect(player.x, player.y, player.width, player.height);
  ctx.beginPath();
  ctx.moveTo(player.x + player.width / 2, player.y - 8);
  ctx.lineTo(player.x + player.width * 0.7, player.y);
  ctx.lineTo(player.x + player.width * 0.3, player.y);
  ctx.closePath();
  ctx.fill();
}

function drawEnemy(e) {
  ctx.fillStyle = "#f97316";
  ctx.fillRect(e.x, e.y, e.width, e.height);
  ctx.fillRect(e.x + 6, e.y - 8, 4, 8);
  ctx.fillRect(e.x + e.width - 10, e.y - 8, 4, 8);
}

// =========================
// 8) COLISÃO
// =========================
function rectsOverlap(a, b) {
  return (a.x < b.x + b.width &&
          a.x + a.width > b.x &&
          a.y < b.y + b.height &&
          a.y + a.height > b.y);
}

// =========================
// 9) LOOP DO JOGO
// =========================
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
