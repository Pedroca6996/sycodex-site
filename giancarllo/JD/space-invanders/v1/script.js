const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const keys = {};

const player = {
  x: canvas.width / 2 - 20,
  y: canvas.height - 60,
  w: 40,
  h: 20,
  speed: 300,
  color: "#22d3ee",
  canShoot: true,
  shootCooldown: 0.25
};

const bullets = [];

const enemyConfig = {
  rows: 1,
  cols: 8,
  w: 40,
  h: 20,
  gapX: 20,
  gapY: 20,
  offsetX: 60,
  offsetY: 60,
  speed: 80
};

let enemies = [];
let enemyDir = 1;
let lastTime = 0;
let shootTimer = 0;

window.addEventListener("keydown", (e) => {
  if (e.code === "Space") e.preventDefault();
  keys[e.code] = true;
});

window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

function spawnEnemies() {
  enemies = [];
  for (let r = 0; r < enemyConfig.rows; r++) {
    for (let c = 0; c < enemyConfig.cols; c++) {
      const x = enemyConfig.offsetX + c * (enemyConfig.w + enemyConfig.gapX);
      const y = enemyConfig.offsetY + r * (enemyConfig.h + enemyConfig.gapY);
      enemies.push({ x, y, w: enemyConfig.w, h: enemyConfig.h, color: "#f97316" });
    }
  }
}

function rectsCollide(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function drawPlayer() {
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(player.x + player.w, player.y);
  ctx.lineTo(player.x + player.w / 2, player.y - 10);
  ctx.closePath();
  ctx.fill();
}

function drawEnemies() {
  enemies.forEach((en) => {
    ctx.fillStyle = en.color;
    ctx.fillRect(en.x, en.y, en.w, en.h);
  });
}

function drawBullets() {
  ctx.fillStyle = "#ffffff";
  bullets.forEach((b) => {
    ctx.fillRect(b.x, b.y, b.w, b.h);
  });
}

function updatePlayer(dt) {
  if (keys["ArrowLeft"]) {
    player.x -= player.speed * dt;
  }
  if (keys["ArrowRight"]) {
    player.x += player.speed * dt;
  }
  player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));

  shootTimer -= dt;
  if (shootTimer < 0) shootTimer = 0;

  if (keys["Space"] && shootTimer === 0) {
    shoot();
    shootTimer = player.shootCooldown;
  }
}

function shoot() {
  const bulletX = player.x + player.w / 2 - 2;
  const bulletY = player.y - 10;
  bullets.push({ x: bulletX, y: bulletY, w: 4, h: 10, speed: 500 });
}

function updateBullets(dt) {
  bullets.forEach((b) => {
    b.y -= b.speed * dt;
  });
  for (let i = bullets.length - 1; i >= 0; i--) {
    if (bullets[i].y + bullets[i].h < 0) {
      bullets.splice(i, 1);
    }
  }
}

function updateEnemies(dt) {
  const dx = enemyConfig.speed * enemyDir * dt;
  enemies.forEach((en) => {
    en.x += dx;
  });

  let hitLeft = false;
  let hitRight = false;

  enemies.forEach((en) => {
    if (en.x <= 0) hitLeft = true;
    if (en.x + en.w >= canvas.width) hitRight = true;
  });

  if (hitLeft || hitRight) {
    enemyDir *= -1;
    enemies.forEach((en) => {
      en.y += 10;
    });
  }
}

function handleCollisions() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    const a = { x: b.x, y: b.y, w: b.w, h: b.h };
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      const c = { x: e.x, y: e.y, w: e.w, h: e.h };
      if (rectsCollide(a, c)) {
        bullets.splice(i, 1);
        enemies.splice(j, 1);
        break;
      }
    }
  }
}

function clear() {
  ctx.fillStyle = "#0b1020";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function draw() {
  drawPlayer();
  drawEnemies();
  drawBullets();
}

function loop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  clear();
  updatePlayer(dt);
  updateBullets(dt);
  updateEnemies(dt);
  handleCollisions();
  draw();

  requestAnimationFrame(loop);
}

spawnEnemies();
requestAnimationFrame(loop);
