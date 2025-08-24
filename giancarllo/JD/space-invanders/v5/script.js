const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let player = {
  x: canvas.width / 2 - 25,
  y: canvas.height - 60,
  width: 50,
  height: 30,
  speed: 7,
  powerUp: false // indica se o power-up está ativo
};

let bullets = [];
let enemies = [];
let specialEnemies = [];
let powerUps = [];
let score = 0;
let lives = 3;
let gameOver = false;
let level = 1;

// Criar inimigos normais
function createEnemies() {
  enemies = [];
  specialEnemies = [];
  for (let i = 0; i < 6; i++) {
    enemies.push({
      x: i * 90 + 30,
      y: 30,
      width: 40,
      height: 30,
      dx: 2 + level * 0.5,
      points: 10,
      color: "#f00" // vermelho
    });
  }
  // Criar 2 inimigos especiais por nível
  for (let i = 0; i < 2; i++) {
    specialEnemies.push({
      x: i * 180 + 60,
      y: 70,
      width: 40,
      height: 30,
      dx: 3 + level * 0.5,
      points: 50,
      color: "#0ff" // ciano
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

// Criar power-ups aleatórios
function spawnPowerUp() {
  if (Math.random() < 0.005) { // chance de aparecer
    powerUps.push({
      x: Math.random() * (canvas.width - 20),
      y: 0,
      width: 20,
      height: 20,
      dy: 2
    });
  }
}

// Atualizar jogo
function update() {
  if (rightPressed && player.x < canvas.width - player.width) player.x += player.speed;
  if (leftPressed && player.x > 0) player.x -= player.speed;

  if (spacePressed) {
    shoot();
    spacePressed = false;
  }

  bullets.forEach((bullet, bIndex) => {
    bullet.y += bullet.dy;
    if (bullet.y < 0) bullets.splice(bIndex, 1);
  });

  const allEnemies = enemies.concat(specialEnemies);

  allEnemies.forEach((enemy, eIndex) => {
    enemy.x += enemy.dx;
    if (enemy.x + enemy.width > canvas.width || enemy.x < 0) {
      enemy.dx *= -1;
      enemy.y += 20;
    }

    if (enemy.y + enemy.height >= canvas.height - player.height) {
      lives--;
      if (enemies.includes(enemy)) enemies.splice(enemies.indexOf(enemy), 1);
      else specialEnemies.splice(specialEnemies.indexOf(enemy), 1);
      if (lives <= 0) gameOver = true;
    }

    bullets.forEach((bullet, bIndex) => {
      if (
        bullet.x < enemy.x + enemy.width &&
        bullet.x + bullet.width > enemy.x &&
        bullet.y < enemy.y + enemy.height &&
        bullet.y + bullet.height > enemy.y
      ) {
        if (enemies.includes(enemy)) enemies.splice(enemies.indexOf(enemy), 1);
        else specialEnemies.splice(specialEnemies.indexOf(enemy), 1);
        bullets.splice(bIndex, 1);
        score += enemy.points;
      }
    });
  });

  // Atualizar power-ups
  powerUps.forEach((p, pIndex) => {
    p.y += p.dy;

    // colisão com jogador
    if (
      p.x < player.x + player.width &&
      p.x + p.width > player.x &&
      p.y < player.y + player.height &&
      p.y + p.height > player.y
    ) {
      player.powerUp = true;
      player.width = 80; // nave maior
      powerUps.splice(pIndex, 1);

      setTimeout(() => {
        player.width = 50; // volta ao normal após 10s
        player.powerUp = false;
      }, 10000);
    }

    if (p.y > canvas.height) powerUps.splice(pIndex, 1);
  });

  // Avançar nível se todos inimigos forem derrotados
  if (enemies.length === 0 && specialEnemies.length === 0) {
    level++;
    createEnemies();
  }

  spawnPowerUp();
}

// Desenhar jogo
function draw() {
  ctx.fillStyle = "#0b1020";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

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
  bullets.forEach((bullet) => ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height));

  [...enemies, ...specialEnemies].forEach((enemy) => {
    ctx.fillStyle = enemy.color;
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
  });

  ctx.fillStyle = "#ff0";
  powerUps.forEach((p) => ctx.fillRect(p.x, p.y, p.width, p.height));

  ctx.fillStyle = "#fff";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 20, 30);
  ctx.fillText("Vidas: " + lives, canvas.width - 100, 30);
  ctx.fillText("Level: " + level, canvas.width / 2 - 30, 30);
}

// Loop principal
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
