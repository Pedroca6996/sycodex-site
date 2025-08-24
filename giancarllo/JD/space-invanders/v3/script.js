const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const player = {
  x: canvas.width / 2 - 25,
  y: canvas.height - 40,
  width: 50,
  height: 20,
  speed: 5
};

let bullets = [];
let enemies = [];
const enemyColumn = 8;
const enemySpacing = 70;

for (let c = 0; c < enemyColumn; c++) {
  enemies.push({
    x: 50 + c * enemySpacing,
    y: 50,
    width: 40,
    height: 20,
    dx: 2
  });
}

let keys = {};
let score = 0;
let lives = 3;
let gameOver = false;

document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (e.key === " " && !gameOver) {
    bullets.push({
      x: player.x + player.width / 2 - 2,
      y: player.y,
      width: 4,
      height: 10,
      speed: 7
    });
  }
});

document.addEventListener("keyup", (e) => (keys[e.key] = false));

function update() {
  if (gameOver) return;

  if (keys["ArrowLeft"] && player.x > 0) player.x -= player.speed;
  if (keys["ArrowRight"] && player.x + player.width < canvas.width) player.x += player.speed;

  bullets.forEach((bullet, i) => {
    bullet.y -= bullet.speed;
    if (bullet.y < 0) bullets.splice(i, 1);
  });

  enemies.forEach((enemy) => {
    enemy.x += enemy.dx;
    if (enemy.x + enemy.width > canvas.width || enemy.x < 0) {
      enemy.dx *= -1;
      enemy.y += 20;
    }
    if (enemy.y + enemy.height >= canvas.height) {
      lives--;
      enemy.y = -100;
    }
  });

  for (let bi = bullets.length - 1; bi >= 0; bi--) {
    const b = bullets[bi];
    let hit = false;
    for (let ei = enemies.length - 1; ei >= 0; ei--) {
      const e = enemies[ei];
      if (
        b.x < e.x + e.width &&
        b.x + b.width > e.x &&
        b.y < e.y + e.height &&
        b.y + b.height > e.y
      ) {
        enemies.splice(ei, 1);
        bullets.splice(bi, 1);
        score += 10;
        hit = true;
        break;
      }
    }
    if (hit) continue;
  }

  if (lives <= 0) gameOver = true;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#22d3ee";
  ctx.fillRect(player.x, player.y, player.width, player.height);

  ctx.fillStyle = "#f43f5e";
  bullets.forEach((bullet) => {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });

  ctx.fillStyle = "#facc15";
  enemies.forEach((enemy) => {
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
  });

  ctx.fillStyle = "#ffffff";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 20);
  ctx.fillText("Vidas: " + lives, canvas.width - 110, 20);

  if (gameOver) {
    ctx.fillStyle = "#f43f5e";
    ctx.font = "48px Arial";
    ctx.fillText("GAME OVER", canvas.width / 2 - 140, canvas.height / 2);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
