// Canvas e contexto
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Jogador
const player = {
  x: canvas.width / 2 - 25,
  y: canvas.height - 50,
  width: 50,
  height: 30,
  speed: 5,
  color: "lime"
};

// Tiros, inimigos e controle
const bullets = [];
let enemies = [];
const enemyRows = 4;
const enemyCols = 10;
const enemySize = 40;
let enemyDirection = 1;
let enemySpeed = 1.5; // ← velocidade base dos inimigos

// HUD e controle de jogo
let score = 0;
let lives = 3;
let level = 1;
let gameOver = false;

// Teclas e disparo
const keys = {};
let lastShotTime = 0;
const shotInterval = 600;

// Eventos de teclado
document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
});
document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

// Criação dos inimigos
function createEnemies() {
  enemies = [];
  for (let row = 0; row < enemyRows; row++) {
    for (let col = 0; col < enemyCols; col++) {
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

// Movimento do jogador
function handlePlayerMovement() {
  if (keys["ArrowLeft"] && player.x > 0) {
    player.x -= player.speed;
  }
  if (keys["ArrowRight"] && player.x + player.width < canvas.width) {
    player.x += player.speed;
  }
}

// Disparo contínuo
function handleShooting() {
  const now = Date.now();
  if (keys[" "] && now - lastShotTime > shotInterval) {
    bullets.push({
      x: player.x + player.width / 2 - 2,
      y: player.y,
      width: 4,
      height: 10,
      speed: 7
    });
    lastShotTime = now;
  }
}

// Desenho do jogador
function drawPlayer() {
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

// Desenho dos tiros
function drawBullets() {
  ctx.fillStyle = "white";
  bullets.forEach((bullet, index) => {
    bullet.y -= bullet.speed;
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);

    if (bullet.y + bullet.height < 0) {
      bullets.splice(index, 1);
    }
  });
}

// Desenho dos inimigos
function drawEnemies() {
  let hitEdge = false;

  enemies.forEach((enemy) => {
    enemy.x += enemyDirection * enemySpeed;

    if (enemy.x + enemy.width > canvas.width || enemy.x < 0) {
      hitEdge = true;
    }

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
        }
      }
    });
  }
}

// Colisões
function checkCollisions() {
  bullets.forEach((bullet, bIndex) => {
    enemies.forEach((enemy, eIndex) => {
      const collided =
        bullet.x < enemy.x + enemy.width &&
        bullet.x + bullet.width > enemy.x &&
        bullet.y < enemy.y + enemy.height &&
        bullet.y + bullet.height > enemy.y;

      if (collided) {
        enemies.splice(eIndex, 1);
        bullets.splice(bIndex, 1);
        score += 100;
      }
    });
  });

  // Verifica se todos os inimigos foram destruídos
  if (enemies.length === 0) {
    level++;
    enemySpeed += 0.5; // ← aumenta a velocidade a cada nível
    createEnemies();    // ← reinicia os inimigos
  }
}

// HUD com nível
function drawHUD() {
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText(`Pontuação: ${score}`, 10, 25);
  ctx.fillText(`Vidas: ${lives}`, canvas.width - 100, 25);
  ctx.fillText(`Nível: ${level}`, canvas.width / 2 - 40, 25);
}

// Game Over
function drawGameOver() {
  ctx.fillStyle = "white";
  ctx.font = "40px Arial";
  ctx.fillText("GAME OVER", canvas.width / 2 - 120, canvas.height / 2);
}

// Loop principal
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!gameOver) {
    handlePlayerMovement();
    handleShooting();
    drawPlayer();
    drawBullets();
    drawEnemies();
    checkCollisions();
    drawHUD();
  } else {
    drawGameOver();
  }

  requestAnimationFrame(gameLoop);
}

// Inicialização
createEnemies();
gameLoop();