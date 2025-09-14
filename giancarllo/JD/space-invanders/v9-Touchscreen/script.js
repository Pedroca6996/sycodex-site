const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const menuScreen = document.getElementById("menuScreen");
const instructionsScreen = document.getElementById("instructionsScreen");
const touchControls = document.getElementById("touchControls");
const playBtn = document.getElementById("playBtn");
const instructionsBtn = document.getElementById("instructionsBtn");
const backFromInstructions = document.getElementById("backFromInstructions");
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const shootBtn = document.getElementById("shootBtn");

const footer = document.getElementById("footer");

// Detecta se é mobile
const isMobile = /Mobi|Android/i.test(navigator.userAgent);

// ---------------------- Ajuste responsivo ----------------------
function resizeCanvas() {
  // Mantém proporção 4:3
  const maxWidth = window.innerWidth;
  const maxHeight = window.innerHeight - footer.offsetHeight - 20;
  let width = maxWidth;
  let height = (width * 3) / 4;

  if (height > maxHeight) {
    height = maxHeight;
    width = (height * 4) / 3;
  }

  canvas.width = width;
  canvas.height = height;

  // Centraliza canvas
  canvas.style.display = "block";
  canvas.style.margin = "0 auto";
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// ---------------------- Dados do jogador ----------------------
let player = {
  x: canvas.width / 2 - 25,
  y: canvas.height - 60,
  width: 50,
  height: 30,
  speed: 7,
  powerTriple: false,
  powerTimer: 0
};

// ---------------------- Variáveis do jogo ----------------------
let bullets = [];
let enemyBullets = [];
let enemies = [];
let specialEnemies = [];
let powerUps = [];
let explosions = [];
let score = 0;
let lives = 3;
let gameOver = false;
let level = 1;
let shootCooldown = 0;

const shootSound = new Audio("sounds/shoot.mp3");
const explosionSound = new Audio("sounds/explosion.mp3");

// ---------------------- Controle teclado ----------------------
let rightPressed = false;
let leftPressed = false;

document.addEventListener("keydown", (e) => {
  if (e.code === "ArrowRight") rightPressed = true;
  if (e.code === "ArrowLeft") leftPressed = true;
  if (e.code === "Space" && shootCooldown <= 0 && !gameOver) {
    shoot();
    shootCooldown = 20;
  }
});

document.addEventListener("keyup", (e) => {
  if (e.code === "ArrowRight") rightPressed = false;
  if (e.code === "ArrowLeft") leftPressed = false;
});

// ---------------------- Controle touchscreen ----------------------
if (isMobile) {
  touchControls.style.display = "flex";
  leftBtn.addEventListener("touchstart", () => leftPressed = true);
  leftBtn.addEventListener("touchend", () => leftPressed = false);
  rightBtn.addEventListener("touchstart", () => rightPressed = true);
  rightBtn.addEventListener("touchend", () => rightPressed = false);
  shootBtn.addEventListener("touchstart", () => { if(shootCooldown<=0) {shoot(); shootCooldown=20;} });
} else {
  touchControls.style.display = "none";
}

// ---------------------- Funções do jogo ----------------------
function createEnemies() {
  enemies = [];
  specialEnemies = [];
  for (let i = 0; i < 6; i++) {
    enemies.push({ x: i * 90 + 30, y: 30, width: 40, height: 30, dx: 1 + level * 0.7, points: 10, color: "#f00" });
  }
  for (let i = 0; i < 2; i++) {
    specialEnemies.push({ x: i * 180 + 60, y: 70, width: 40, height: 30, dx: 1.2 + level * 0.9, points: 50, color: "#0ff" });
  }
}
createEnemies();

function shoot() {
  if (player.powerTriple) {
    bullets.push({ x: player.x + player.width / 2 - 20, y: player.y, width: 6, height: 15, dy: -5 });
    bullets.push({ x: player.x + player.width / 2, y: player.y, width: 6, height: 15, dy: -5 });
    bullets.push({ x: player.x + player.width / 2 + 20, y: player.y, width: 6, height: 15, dy: -5 });
  } else {
    bullets.push({ x: player.x + player.width / 2 - 3, y: player.y, width: 6, height: 15, dy: -5 });
  }
  shootSound.currentTime = 0;
  shootSound.play();
}

function spawnPowerUp() {
  if (Math.random() < 0.004) {
    const type = Math.floor(Math.random() * 4);
    let color = "#ff0";
    if (type === 0) color = "#22d3ee";
    if (type === 1) color = "#f43f5e";
    if (type === 2) color = "#34d399";
    if (type === 3) color = "#facc15";
    powerUps.push({ x: Math.random() * (canvas.width - 20), y: 0, width: 20, height: 20, dy: 2, type, color });
  }
}

// ---------------------- Explosões ----------------------
function createExplosion(x, y) {
  explosions.push({ x, y, radius: 0, maxRadius: 20 });
}

// ---------------------- Pontuação ----------------------
function saveScore(score) {
  let scores = JSON.parse(localStorage.getItem("topScores")) || [];
  if (!scores.includes(score)) scores.push(score);
  scores.sort((a, b) => b - a);
  if (scores.length > 5) scores = scores.slice(0, 5);
  localStorage.setItem("topScores", JSON.stringify(scores));
}

// ---------------------- Atualização ----------------------
function update() {
  if (gameOver) return;

  if (rightPressed && player.x < canvas.width - player.width) player.x += player.speed;
  if (leftPressed && player.x > 0) player.x -= player.speed;
  if (shootCooldown > 0) shootCooldown--;

  bullets.forEach((bullet, bIndex) => {
    bullet.y += bullet.dy;
    if (bullet.y < 0) bullets.splice(bIndex, 1);
  });

  enemyBullets.forEach((bullet, bIndex) => {
    bullet.y += bullet.dy;
    if (bullet.x < player.x + player.width &&
        bullet.x + bullet.width > player.x &&
        bullet.y < player.y + player.height &&
        bullet.y + bullet.height > player.y) {
      lives--;
      enemyBullets.splice(bIndex, 1);
      if (lives <= 0 && !gameOver) {
        gameOver = true;
        saveScore(score);
        shootSound.pause();
        explosionSound.pause();
      }
    }
    if (bullet.y > canvas.height) enemyBullets.splice(bIndex, 1);
  });

  const allEnemies = enemies.concat(specialEnemies);
  allEnemies.forEach((enemy) => {
    enemy.x += enemy.dx;
    if (enemy.x + enemy.width > canvas.width || enemy.x < 0) {
      enemy.dx *= -1;
      enemy.y += 15;
    }

    bullets.forEach((bullet, bIndex) => {
      if (bullet.x < enemy.x + enemy.width &&
          bullet.x + bullet.width > enemy.x &&
          bullet.y < enemy.y + enemy.height &&
          bullet.y + bullet.height > enemy.y) {
        if (enemies.includes(enemy)) enemies.splice(enemies.indexOf(enemy), 1);
        else specialEnemies.splice(specialEnemies.indexOf(enemy), 1);
        bullets.splice(bIndex, 1);
        score += enemy.points;
        explosionSound.currentTime = 0;
        explosionSound.play();
        createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
      }
    });

    if (enemy.y + enemy.height >= canvas.height - player.height) {
      lives--;
      if (enemies.includes(enemy)) enemies.splice(enemies.indexOf(enemy), 1);
      else specialEnemies.splice(specialEnemies.indexOf(enemy), 1);
      if (lives <= 0 && !gameOver) {
        gameOver = true;
        saveScore(score);
        shootSound.pause();
        explosionSound.pause();
      }
    }
  });

  powerUps.forEach((p, pIndex) => {
    p.y += p.dy;
    if (p.x < player.x + player.width &&
        p.x + p.width > player.x &&
        p.y < player.y + player.height &&
        p.y + p.height > player.y) {
      if (p.type === 0) player.width = 80;
      if (p.type === 1) player.speed = 12;
      if (p.type === 2) lives++;
      if (p.type === 3) player.powerTriple = true;
      player.powerTimer = 7 * 60;
      powerUps.splice(pIndex, 1);
    }
    if (p.y > canvas.height) powerUps.splice(pIndex, 1);
  });

  explosions.forEach((ex, index) => {
    ex.radius += 2;
    if (ex.radius > ex.maxRadius) explosions.splice(index, 1);
  });

  if (player.powerTimer > 0) player.powerTimer--;
  else {
    player.width = 50;
    player.speed = 7;
    player.powerTriple = false;
  }

  if (enemies.length === 0 && specialEnemies.length === 0) {
    level++;
    createEnemies();
  }

  // Tiros inimigos
  if (!gameOver) {
    const shooters = enemies.concat(specialEnemies);
    if (shooters.length > 0 && Math.random() < 0.002) {
      const shooter = shooters[Math.floor(Math.random() * shooters.length)];
      enemyBullets.push({ x: shooter.x + shooter.width / 2 - 3, y: shooter.y + shooter.height, width: 6, height: 15, dy: 4 });
    }
  }
}

// ---------------------- Desenho ----------------------
function draw() {
  ctx.fillStyle = "#0b1020";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Desenho do jogador, inimigos, tiros, powerups e explosões
  ctx.fillStyle = "#0f0";
  ctx.fillRect(player.x, player.y, player.width, player.height);

  ctx.fillStyle = "#ff0";
  bullets.forEach(bullet => ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height));

  ctx.fillStyle = "#f43f5e";
  enemyBullets.forEach(bullet => ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height));

  [...enemies, ...specialEnemies].forEach(enemy => {
    ctx.fillStyle = enemy.color;
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
  });

  powerUps.forEach(p => {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.width, p.height);
  });

  explosions.forEach(ex => {
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, ex.radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,0,0.5)";
    ctx.fill();
  });

  ctx.fillStyle = "#fff";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 20, 30);
  ctx.fillText("Vidas: " + lives, canvas.width - 100, 30);
  ctx.fillText("Level: " + level, canvas.width / 2 - 30, 30);

  let powerTextY = 55;
  if (player.powerTriple) {
    ctx.fillStyle = "#facc15";
    ctx.fillText("Tiro Triplo: " + Math.ceil(player.powerTimer / 60) + "s", 20, powerTextY);
    powerTextY += 25;
  }
  if (player.speed > 7) {
    ctx.fillStyle = "#f43f5e";
    ctx.fillText("Tiros Rápidos: " + Math.ceil(player.powerTimer / 60) + "s", 20, powerTextY);
    powerTextY += 25;
  }
  if (player.width > 50) {
    ctx.fillStyle = "#22d3ee";
    ctx.fillText("Nave Larga: " + Math.ceil(player.powerTimer / 60) + "s", 20, powerTextY);
  }
}

// ---------------------- Click restart ----------------------
canvas.addEventListener("click", (e) => {
  if (!gameOver) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  if (x > canvas.width / 2 - 60 && x < canvas.width / 2 + 60 &&
      y > canvas.height / 2 + 250 && y < canvas.height / 2 + 290) {
    restartGame();
  }
});

// ---------------------- Restart ----------------------
function restartGame() {
  player = { x: canvas.width / 2 - 25, y: canvas.height - 60, width: 50, height: 30, speed: 7, powerTriple: false, powerTimer: 0 };
  bullets = [];
  enemyBullets = [];
  powerUps = [];
  explosions = [];
  score = 0;
  lives = 3;
  level = 1;
  shootCooldown = 0;
  gameOver = false;
  createEnemies();
}

// ---------------------- Loop principal ----------------------
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// ---------------------- Menu ----------------------
function startGame() {
  menuScreen.style.display = "none";
  instructionsScreen.style.display = "none";
  canvas.style.display = "block";
  if (isMobile) touchControls.style.display = "flex";
  gameLoop();
}

playBtn.addEventListener("click", startGame);
instructionsBtn.addEventListener("click", () => {
  menuScreen.style.display = "none";
  instructionsScreen.style.display = "flex";
});
backFromInstructions.addEventListener("click", () => {
  instructionsScreen.style.display = "none";
  menuScreen.style.display = "flex";
});
