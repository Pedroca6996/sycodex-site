// Configurações iniciais
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

// Tiros e inimigos
const bullets = [];
const enemies = [];
const enemyRows = 4;
const enemyCols = 10;
const enemySize = 40;
let enemyDirection = 1;

// Pontuação
let score = 0;

// Teclas pressionadas
const keys = {};

// Eventos de teclado
document.addEventListener("keydown", (e) => {
  keys[e.key] = true;

  // Disparo único por pressionamento
  if (e.key === " " && !keys["spaceFired"]) {
    bullets.push({
      x: player.x + player.width / 2 - 2,
      y: player.y,
      width: 4,
      height: 10,
      speed: 7
    });
    keys["spaceFired"] = true;
  }
});

document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
  if (e.key === " ") keys["spaceFired"] = false;
});

// Criação dos inimigos
function createEnemies() {
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

    // Remove se sair da tela
    if (bullet.y + bullet.height < 0) {
      bullets.splice(index, 1);
    }
  });
}

// Desenho dos inimigos
function drawEnemies() {
  let hitEdge = false;

  enemies.forEach((enemy) => {
    enemy.x += enemyDirection;

    if (enemy.x + enemy.width > canvas.width || enemy.x < 0) {
      hitEdge = true;
    }

    ctx.fillStyle = enemy.color;
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
  });

  // Inverte direção e desce
  if (hitEdge) {
    enemyDirection *= -1;
    enemies.forEach((enemy) => {
      enemy.y += 20;
    });
  }
}

// Colisão entre tiros e inimigos
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
}

// Exibe pontuação
function drawScore() {
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText(`Pontuação: ${score}`, 10, 25);
}

// Loop principal
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  handlePlayerMovement();
  drawPlayer();
  drawBullets();
  drawEnemies();
  checkCollisions();
  drawScore();
  requestAnimationFrame(gameLoop);
}

// Inicialização
createEnemies();
gameLoop();