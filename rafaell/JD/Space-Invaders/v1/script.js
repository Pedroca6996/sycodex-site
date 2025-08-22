const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const player = {
  x: canvas.width / 2 - 25,
  y: canvas.height - 60,
  width: 50,
  height: 30,
  speed: 5,
  color: "lime"
};

const bullets = [];
const enemies = [];
const enemyRow = 5;
const enemyCol = 8;
const enemySize = 40;
let enemyDirection = 1;

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") player.x -= player.speed;
  if (e.key === "ArrowRight") player.x += player.speed;
  if (e.key === " ") {
    bullets.push({ x: player.x + player.width / 2 - 2, y: player.y, width: 4, height: 10, speed: 7 });
  }
});

function createEnemies() {
  for (let row = 0; row < enemyRow; row++) {
    for (let col = 0; col < enemyCol; col++) {
      enemies.push({
        x: col * (enemySize + 10) + 50,
        y: row * (enemySize + 10) + 30,
        width: enemySize,
        height: enemySize,
        color: "red"
      });
    }
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
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    if (bullet.y < 0) bullets.splice(index, 1);
  });
}

function drawEnemies() {
  let hitEdge = false;
  enemies.forEach((enemy) => {
    enemy.x += enemyDirection;
    if (enemy.x + enemy.width > canvas.width || enemy.x < 0) hitEdge = true;
    ctx.fillStyle = enemy.color;
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
  });

  if (hitEdge) {
    enemyDirection *= -1;
    enemies.forEach((enemy) => enemy.y += 20);
  }
}

function checkCollisions() {
  bullets.forEach((bullet, bIndex) => {
    enemies.forEach((enemy, eIndex) => {
      if (
        bullet.x < enemy.x + enemy.width &&
        bullet.x + bullet.width > enemy.x &&
        bullet.y < enemy.y + enemy.height &&
        bullet.y + bullet.height > enemy.y
      ) {
        enemies.splice(eIndex, 1);
        bullets.splice(bIndex, 1);
      }
    });
  });
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawPlayer();
  drawBullets();
  drawEnemies();
  checkCollisions();
  requestAnimationFrame(gameLoop);
}

createEnemies();
gameLoop();