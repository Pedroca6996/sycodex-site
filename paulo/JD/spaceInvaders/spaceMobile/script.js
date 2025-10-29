// ======================================================
// SPACE INVADERS MOBILE — versão responsiva com música,
// jogador imortal e ondas infinitas de inimigos 👽🚀
// ======================================================

// Seleciona o canvas e o contexto
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 🎵 Música de fundo
const bgMusic = document.getElementById("bgMusic");

// Função para iniciar música (necessário interação no mobile)
function startMusic() {
  bgMusic.volume = 0.6;
  bgMusic.play().catch(() => {});
}

// Inicia música ao interagir com o jogo
window.addEventListener("click", startMusic);
window.addEventListener("touchstart", startMusic);
window.addEventListener("keydown", startMusic);

// ------------------------------------------------------
// 1️⃣ Dimensões fixas do jogo
// ------------------------------------------------------
const GAME_WIDTH = 480;
const GAME_HEIGHT = 640;
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// Ajuste visual
function resizeCanvas() {
  const scale = Math.min(window.innerWidth / GAME_WIDTH, window.innerHeight / GAME_HEIGHT);
  canvas.style.width = GAME_WIDTH * scale + 'px';
  canvas.style.height = GAME_HEIGHT * scale + 'px';
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ------------------------------------------------------
// 2️⃣ Variáveis do jogo
// ------------------------------------------------------
let player = { x: GAME_WIDTH / 2 - 15, y: GAME_HEIGHT - 60, width: 30, height: 20, speed: 6 };
let bullets = [];
let enemies = [];
let enemyRows = 4;
let enemyCols = 8;
let enemyDirection = 1;

// Cria inimigos centralizados
function createEnemies() {
  enemies = [];
  const startX = 40;
  const startY = 60;
  const spacingX = 50;
  const spacingY = 40;

  for (let r = 0; r < enemyRows; r++) {
    for (let c = 0; c < enemyCols; c++) {
      enemies.push({
        x: startX + c * spacingX,
        y: startY + r * spacingY,
        width: 30,
        height: 20
      });
    }
  }
}
createEnemies();

// ------------------------------------------------------
// 3️⃣ Controles
// ------------------------------------------------------
let leftPressed = false;
let rightPressed = false;

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') leftPressed = true;
  if (e.key === 'ArrowRight') rightPressed = true;
  if (e.key === ' ') shoot();
});
document.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft') leftPressed = false;
  if (e.key === 'ArrowRight') rightPressed = false;
});

document.getElementById('leftBtn').addEventListener('touchstart', () => leftPressed = true);
document.getElementById('leftBtn').addEventListener('touchend', () => leftPressed = false);

document.getElementById('rightBtn').addEventListener('touchstart', () => rightPressed = true);
document.getElementById('rightBtn').addEventListener('touchend', () => rightPressed = false);

document.getElementById('shootBtn').addEventListener('touchstart', shoot);

// ------------------------------------------------------
// 4️⃣ Funções principais do jogo
// ------------------------------------------------------
function shoot() {
  bullets.push({ x: player.x + player.width / 2 - 2, y: player.y, width: 4, height: 10 });
  startMusic();
}

function update() {
  // Movimento do jogador
  if (leftPressed && player.x > 0) player.x -= player.speed;
  if (rightPressed && player.x + player.width < GAME_WIDTH) player.x += player.speed;

  // Movimento dos tiros
  bullets.forEach(b => b.y -= 8);
  bullets = bullets.filter(b => b.y > 0);

  // Movimento dos inimigos
  let hitEdge = false;
  enemies.forEach(e => {
    e.x += enemyDirection * 1.5;
    if (e.x + e.width >= GAME_WIDTH - 10 || e.x <= 10) hitEdge = true;
  });

  if (hitEdge) {
    enemyDirection *= -1;
    enemies.forEach(e => e.y += 20);
  }

  // Colisão tiro-inimigo
  enemies.forEach((e, ei) => {
    bullets.forEach((b, bi) => {
      if (
        b.x < e.x + e.width &&
        b.x + b.width > e.x &&
        b.y < e.y + e.height &&
        b.y + b.height > e.y
      ) {
        enemies.splice(ei, 1);
        bullets.splice(bi, 1);
      }
    });
  });

  // ✅ Se inimigos passarem da parte inferior -> nova wave
  let enemyReachedBottom = enemies.some(e => e.y > GAME_HEIGHT - 50);
  if (enemyReachedBottom) {
    enemyDirection = 1;
    createEnemies();
  }

  // ✅ Vitória desativada porque waves são infinitas 😄
}

function draw() {
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Player
  ctx.fillStyle = '#0f0';
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // Inimigos
  ctx.fillStyle = '#f00';
  enemies.forEach(e => ctx.fillRect(e.x, e.y, e.width, e.height));

  // Balas
  ctx.fillStyle = '#fff';
  bullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));
}

// Loop principal
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}
gameLoop();
