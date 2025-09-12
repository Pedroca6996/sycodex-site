const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Sons do jogo
const shootSound = new Audio("../sounds/shoot.mp3");         // som do tiro
const explosionSound = new Audio("../sounds/explosion.mp3"); // som de inimigo destruído
const powerupSound = new Audio("../sounds/powerup.mp3");     // som de power-up

const player = {
  x: canvas.width / 2 - 25,
  y: canvas.height - 50,
  width: 50,
  height: 30,
  baseWidth: 50,
  speed: 5,
  color: "lime",
  doubleShot: false
};

const bullets = [];
let enemies = [];
let powerUps = [];
const enemyRows = 4;
const enemyCols = 10;
const enemySize = 40;
let enemyDirection = 1;
let enemySpeed = 1.5;

let score = 0;
let lives = 3;
let level = 1;
let gameOver = false;

const keys = {};
let lastShotTime = 0;
const shotInterval = 600;

let bulletType = "normal";

let powerUpTimers = {
  doubleShot: 0,
  wideShip: 0,
  explosive: 0,
  piercing: 0
};

const POWER_UP_DURATION = 10000;

document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
});
document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

function playSound(id) {
  const sound = document.getElementById(id);
  if (sound) {
    sound.currentTime = 0;
    sound.play();
  }
}

function createEnemies() {
  enemies = [];
  for (let row = 0; row < enemyRows; row++) {
    for (let col = 0; col < enemyCols; col++) {
      const isSpecial = Math.random() < 0.1;
      enemies.push({
        x: col * (enemySize + 10) + 50,
        y: row * (enemySize + 10) + 30,
        width: enemySize,
        height: enemySize,
        color: isSpecial ? "gold" : "red",
        points: isSpecial ? 500 : 100
      });
    }
  }
}

function spawnPowerUp() {
  if (Math.random() < 0.015 + level * 0.002) {
    const types = ["doubleShot", "wideShip", "explosive", "piercing", "bomb"];
    const type = types[Math.floor(Math.random() * types.length)];
    const speed = type === "bomb" ? 7 :
                  type === "explosive" ? 6 :
                  type === "piercing" ? 5.5 :
                  type === "doubleShot" ? 4.5 : 4;

    powerUps.push({
      x: Math.random() * (canvas.width - 30),
      y: 0,
      width: 30,
      height: 30,
      type,
      color: "magenta",
      speed
    });
  }
}

function handlePlayerMovement() {
  if (keys["ArrowLeft"] && player.x > 0) player.x -= player.speed;
  if (keys["ArrowRight"] && player.x + player.width < canvas.width) player.x += player.speed;
}

function handleShooting() {
  const now = Date.now();
  if (keys[" "] && now - lastShotTime > shotInterval) {
    shootBullet();
    lastShotTime = now;
  }
}

function shootBullet() {
  shootSound.currentTime = 0;
  shootSound.play();

  const baseBullet = {
    x: player.x + player.width / 2 - 2,
    y: player.y,
    width: 4,
    height: 10,
    speed: bulletType === "explosive" ? 4 :
           bulletType === "piercing" ? 7 :
           bulletType === "bomb" ? 2 : 6,
    type: bulletType
  };

  bullets.push({ ...baseBullet });

  if (player.doubleShot) bullets.push({ ...baseBullet, x: baseBullet.x + 8 });

  if (player.width > player.baseWidth) {
    bullets.push({ ...baseBullet, x: baseBullet.x - 10, angle: -0.2 });
    bullets.push({ ...baseBullet, x: baseBullet.x + 10, angle: 0.2 });
  }
}

function drawPlayer() {
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

function drawBullets() {
  ctx.fillStyle = "white";
  bullets.forEach((bullet, index) => {
    bullet.y -= bullet.speed;
    if (bullet.angle) bullet.x += bullet.angle * bullet.speed;
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    if (bullet.y + bullet.height < 0) bullets.splice(index, 1);
  });
}

function drawEnemies() {
  let hitEdge = false;
  enemies.forEach((enemy) => {
    enemy.x += enemyDirection * enemySpeed;
    if (enemy.x + enemy.width > canvas.width || enemy.x < 0) hitEdge = true;
    ctx.fillStyle = enemy.color;
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
  });

  if (hitEdge) {
    enemyDirection *= -1;
    enemies.forEach((enemy) => {
      enemy.y += 20;
      if (enemy.y + enemy.height >= player.y) {
        lives--;
        if (lives <= 0) {
          gameOver = true;
          playSound("gameOverSound");
        }
      }
    });
  }
}

function drawPowerUps() {
  powerUps.forEach((p, index) => {
    p.y += p.speed;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.width, p.height);

    if (
      p.x < player.x + player.width &&
      p.x + p.width > player.x &&
      p.y < player.y + player.height &&
      p.y + p.height > player.y
    ) {
      powerupSound.currentTime = 0;
      powerupSound.play();
      const now = Date.now();
      if (p.type === "doubleShot") {
        player.doubleShot = true;
        powerUpTimers.doubleShot = now + POWER_UP_DURATION;
      }
      if (p.type === "wideShip") {
        player.width = player.baseWidth + 20;
        powerUpTimers.wideShip = now + POWER_UP_DURATION;
      }
      if (p.type === "explosive") {
        bulletType = "explosive";
        powerUpTimers.explosive = now + POWER_UP_DURATION;
      }
      if (p.type === "piercing") {
        bulletType = "piercing";
        powerUpTimers.piercing = now + POWER_UP_DURATION;
      }
      if (p.type === "bomb") enemies = [];

      powerUps.splice(index, 1);
    }

    if (p.y > canvas.height) powerUps.splice(index, 1);
  });
}

function flashEnemy(enemy) {
  ctx.fillStyle = "white";
  ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
}

function checkCollisions() {
  bullets.forEach((bullet, bIndex) => {
    enemies.forEach((enemy, eIndex) => {
      const collided =
        bullet.x < enemy.x + enemy.width &&
        bullet.x + bullet.width > enemy.x &&
        bullet.y < enemy.y + enemy.height &&
        bullet.y + bullet.height > enemy.y;

      if (collided) {
        flashEnemy(enemy);
        explosionSound.currentTime = 0;
        explosionSound.play();

        if (bullet.type === "explosive") {
          enemies = enemies.filter((e) => {
            const dist = Math.hypot(e.x - enemy.x, e.y - enemy.y);
            if (dist < 50) score += e.points;
            return dist >= 50;
          });
          bullets.splice(bIndex, 1);
        } else if (bullet.type === "piercing") {
          score += enemy.points;
          enemies.splice(eIndex, 1);
        } else {
          score += enemy.points;
          enemies.splice(eIndex, 1);
          bullets.splice(bIndex, 1);
        }
      }
    });
  });

  if (enemies.length === 0) {
    level++;
    enemySpeed += 0.5;
    createEnemies();
  }
}

function updatePowerUpTimers() {
  const now = Date.now();
  if (powerUpTimers.doubleShot && now > powerUpTimers.doubleShot) {
    player.doubleShot = false;
    powerUpTimers.doubleShot = 0;
  }
  if (powerUpTimers.wideShip && now > powerUpTimers.wideShip) {
    player.width = player.baseWidth;
    powerUpTimers.wideShip = 0;
  }
  if (powerUpTimers.explosive && now > powerUpTimers.explosive) {
    bulletType = "normal";
    powerUpTimers.explosive = 0;
  }
  if (powerUpTimers.piercing && now > powerUpTimers.piercing) {
    bulletType = "normal";
    powerUpTimers.piercing = 0;
  }
}

function drawPowerUpHUD() {
  const now = Date.now();
  const active = Object.entries(powerUpTimers).filter(([_, end]) => end > now);
  if (active.length === 0) return;

  ctx.font = "14px Arial";
  ctx.fillStyle = "white";
  ctx.fillText("Power-ups:", 10, 50);

  active.forEach(([type, end], i) => {
    const timeLeft = Math.max(0, end - now);
    const percent = timeLeft / POWER_UP_DURATION;
    ctx.fillStyle = "gray";
    ctx.fillRect(10, 70 + i * 25, 100, 10);
    ctx.fillStyle = "lime";
    ctx.fillRect(10, 70 + i * 25, 100 * percent, 10);
    ctx.fillStyle = "white";
    ctx.fillText(`${type}`, 115, 78 + i * 25);
  });
}

function drawHUD() {
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText(`Pontuação: ${score}`, 10, 25);
  ctx.fillText(`Vidas: ${lives}`, canvas.width - 100, 25);
  ctx.fillText(`Nível: ${level}`, canvas.width / 2 - 40, 25);
  ctx.fillText(`Tiro: ${bulletType}`, canvas.width / 2 - 40, 45);
  drawPowerUpHUD();
}

function drawGameOver() {
  ctx.fillStyle = "white";
  ctx.font = "40px Arial";
  ctx.fillText("GAME OVER", canvas.width / 2 - 120, canvas.height / 2);
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!gameOver) {
    handlePlayerMovement();
    handleShooting();
    spawnPowerUp();
    updatePowerUpTimers();
    drawPlayer();
    drawBullets();
    drawEnemies();
    drawPowerUps();
    checkCollisions();
    drawHUD();
  } else {
    drawGameOver();
  }

  requestAnimationFrame(gameLoop);
}

createEnemies();
gameLoop();