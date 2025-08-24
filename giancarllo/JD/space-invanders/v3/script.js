const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let player = {
  x: canvas.width / 2 - 25,
  y: canvas.height - 60,
  width: 50,
  height: 30,
  speed: 7
};

let bullets = [];
let enemies = [];
let score = 0;
let lives = 3;
let gameOver = false;

// Criar inimigos
function createEnemies() {
  enemies = [];
  for (let i = 0; i < 8; i++) {
    enemies.push({
      x: i * 90 + 30,
      y: 30,
      width: 40,
      height: 30,
      dx: 2
    });
  }
}

createEnemies();

// Movimento com teclado
let rightPressed = false;
let leftPressed = false;
let spacePressed = false;

document.addEventListener("keydown", (e) => {
  if (e.code === "ArrowRight") rightPressed = true;
  if (e.code === "ArrowLeft") leftPressed = true;
  if (e.code === "Space") spacePressed = true;
});

document.addEventListener("keyup", (e) => {
  if (e.code === "ArrowRight") rightPressed = false;
  if (e.code === "ArrowLeft") leftPressed = false;
  if (e.code === "Space") spacePressed = false;
});

// Atirar
function shoot() {
  bullets.push({
    x: player.x + player.width / 2 - 3,
    y: player.y,
    width: 6,
    height: 15,
    dy: -8
  });
}

// Atualizar jogo
function update() {
  if (rightPressed && player.x < canvas.width - player.width) {
    player.x += player.speed;
  }
  if (leftPressed && player.x > 0) {
    player.x -= player.speed;
  }

  if (spacePressed) {
    shoot();
    spacePressed = false;
  }

  bullets.forEach((bullet, bIndex) => {
    bullet.y += bullet.dy;
    if (bullet.y < 0) bullets.splice(bIndex, 1);
  });

  enemies.forEach((enemy, eIndex) => {
    enemy.x += enemy.dx;

    if (enemy.x + enemy.width > canvas.width || enemy.x < 0) {
      enemy.dx *= -1;
      enemy.y += 20;
    }

    // colisão inimigo com chão
    if (enemy.y + enemy.height >= canvas.height - player.height) {
      lives--;
      enemies.splice(eIndex, 1);
      if (lives <= 0) {
        gameOver = true;
      }
    }

    // colisão bala-inimigo
    bullets.forEach((bullet, bIndex) => {
      if (
        bullet.x < enemy.x + enemy.width &&
        bullet.x + bullet.width > enemy.x &&
        bullet.y < enemy.y + enemy.height &&
        bullet.y + bullet.height > enemy.y
      ) {
        enemies.splice(eIndex, 1);
        bullets.splice(bIndex, 1);
        score += 10;
      }
    });
  });
}

// Desenhar jogo
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameOver) {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#f43f5e";
    ctx.font = "48px Arial";
    ctx.fillText("GAME OVER", canvas.width / 2 - 140, canvas.height / 2);

    ctx.fillStyle = "#fff";
    ctx.font = "20px Arial";
    ctx.fillText("Pontuação: " + score, canvas.width / 2 - 60, canvas.height / 2 + 40);

    return;
  }

  ctx.fillStyle = "#0f0";
  ctx.fillRect(player.x, player.y, player.width, player.height);

  ctx.fillStyle = "#ff0";
  bullets.forEach((bullet) => {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });

  ctx.fillStyle = "#f00";
  enemies.forEach((enemy) => {
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
  });

  ctx.fillStyle = "#fff";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 20, 30);
  ctx.fillText("Vidas: " + lives, canvas.width - 100, 30);
}

// Loop principal
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
