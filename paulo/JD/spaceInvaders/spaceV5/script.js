// Seleciona o canvas e contexto
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Variáveis do jogador
let player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 60,
    width: 50,
    height: 30,
    speed: 5,
    doubleShot: false // 🆕 tiro duplo
};

// Variáveis de jogo
let bullets = [];
let enemies = [];
let powerUps = []; // 🆕 array de power-ups
let score = 0;
let lives = 3;
let level = 1;
let gameOver = false;

// Intervalo entre tiros
let canShoot = true;
const shootInterval = 400; // ms

// Controles de movimento
let rightPressed = false;
let leftPressed = false;

// Eventos de teclado
document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);

function keyDownHandler(e) {
    if (e.key === "ArrowRight") rightPressed = true;
    else if (e.key === "ArrowLeft") leftPressed = true;
    else if (e.key === " ") {
        if (canShoot) {
            // 🆕 Tiro simples ou duplo
            if (player.doubleShot) {
                bullets.push({ x: player.x + 5, y: player.y, width: 5, height: 10, speed: 7 });
                bullets.push({ x: player.x + player.width - 10, y: player.y, width: 5, height: 10, speed: 7 });
            } else {
                bullets.push({ x: player.x + player.width / 2 - 2, y: player.y, width: 5, height: 10, speed: 7 });
            }
            canShoot = false;
            setTimeout(() => canShoot = true, shootInterval);
        }
    }
}

function keyUpHandler(e) {
    if (e.key === "ArrowRight") rightPressed = false;
    else if (e.key === "ArrowLeft") leftPressed = false;
}

// Cria inimigos e inimigos especiais
function createEnemies() {
    enemies = [];
    const rows = 3;
    const cols = 8;
    const hSpacing = 90;
    const vSpacing = 50;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            let isSpecial = Math.random() < 0.2; // 20% de chance de inimigo especial
            enemies.push({
                x: c * hSpacing + 30,
                y: r * vSpacing + 50,
                width: 40,
                height: 30,
                speed: 2 + level * 0.5,
                direction: 1,
                special: isSpecial,
                points: isSpecial ? 50 : 10 // pontos diferentes
            });
        }
    }
}
createEnemies();

// Desenha jogador
function drawPlayer() {
    ctx.fillStyle = "lime";
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

// Desenha projéteis
function drawBullets() {
    ctx.fillStyle = "red";
    bullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));
}

// Desenha inimigos
function drawEnemies() {
    enemies.forEach(e => {
        ctx.fillStyle = e.special ? "gold" : "white"; // inimigo especial dourado
        ctx.fillRect(e.x, e.y, e.width, e.height);
    });
}

// 🆕 Desenha power-ups
function drawPowerUps() {
    powerUps.forEach(p => {
        ctx.fillStyle = p.type === "doubleShot" ? "cyan" : "magenta";
        ctx.fillRect(p.x, p.y, p.width, p.height);
    });
}

// Desenha HUD
function drawHUD() {
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, 20, 30);
    ctx.fillText("Lives: " + lives, canvas.width - 120, 30);
    ctx.fillText("Level: " + level, canvas.width / 2 - 40, 30);
}

// Atualiza projéteis
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= bullets[i].speed;
        if (bullets[i].y < 0) bullets.splice(i, 1);
    }
}

// Atualiza inimigos
function updateEnemies() {
    for (let i = 0; i < enemies.length; i++) {
        let e = enemies[i];

        e.x += e.speed * e.direction;

        if (e.x + e.width > canvas.width || e.x < 0) {
            e.direction *= -1;
            e.y += 20;
        }

        if (e.y + e.height >= canvas.height) {
            lives--;
            enemies.splice(i, 1);
            i--;
            if (lives <= 0) gameOver = true;
        }
    }
}

// 🆕 Atualiza power-ups
function updatePowerUps() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        powerUps[i].y += 2; // desce lentamente
        // coleta pelo jogador
        if (powerUps[i].x < player.x + player.width &&
            powerUps[i].x + powerUps[i].width > player.x &&
            powerUps[i].y < player.y + player.height &&
            powerUps[i].y + powerUps[i].height > player.y) {

            if (powerUps[i].type === "doubleShot") player.doubleShot = true;
            else if (powerUps[i].type === "wider") player.width = 80;

            powerUps.splice(i, 1);
        } else if (powerUps[i].y > canvas.height) {
            powerUps.splice(i, 1); // remove se sair da tela
        }
    }
}

// Verifica colisões tiros x inimigos
function checkCollisions() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            let b = bullets[i];
            let e = enemies[j];

            if (b.x < e.x + e.width &&
                b.x + b.width > e.x &&
                b.y < e.y + e.height &&
                b.y + b.height > e.y) {

                score += e.points;
                enemies.splice(j, 1);
                bullets.splice(i, 1);

                // chance de spawn de power-up
                if (Math.random() < 0.1) { // 10% de chance
                    powerUps.push({
                        x: e.x + e.width / 2 - 10,
                        y: e.y,
                        width: 20,
                        height: 20,
                        type: Math.random() < 0.5 ? "doubleShot" : "wider"
                    });
                }

                break;
            }
        }
    }
}

// Verifica fim de nível
function checkLevelCompletion() {
    if (enemies.length === 0) {
        level++;
        createEnemies();
        bullets = [];
    }
}

// Loop do jogo
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!gameOver) {
        if (rightPressed && player.x < canvas.width - player.width) player.x += player.speed;
        if (leftPressed && player.x > 0) player.x -= player.speed;

        updateBullets();
        updateEnemies();
        updatePowerUps(); // 🆕
        checkCollisions();
        checkLevelCompletion();

        drawPlayer();
        drawBullets();
        drawEnemies();
        drawPowerUps(); // 🆕
        drawHUD();

        requestAnimationFrame(gameLoop);
    } else {
        ctx.fillStyle = "red";
        ctx.font = "50px Arial";
        ctx.fillText("GAME OVER", canvas.width / 2 - 150, canvas.height / 2);
    }
}

// Inicia o jogo
gameLoop();
