// Seleciona o canvas e contexto
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Variáveis do jogador
let player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 60,
    width: 50,
    height: 30,
    speed: 5
};

// Variáveis de jogo
let bullets = [];
let enemies = [];
let score = 0;
let lives = 3;
let gameOver = false;

// Controles de movimento
let rightPressed = false;
let leftPressed = false;

// Eventos de teclado
document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);

function keyDownHandler(e) {
    if (e.key === "ArrowRight") rightPressed = true;
    else if (e.key === "ArrowLeft") leftPressed = true;
    else if (e.key === " ") { // Espaço para atirar
        bullets.push({
            x: player.x + player.width / 2 - 2,
            y: player.y,
            width: 5,
            height: 10,
            speed: 7
        });
    }
}

function keyUpHandler(e) {
    if (e.key === "ArrowRight") rightPressed = false;
    else if (e.key === "ArrowLeft") leftPressed = false;
}

// 🆕 Cria múltiplas linhas de inimigos
function createEnemies() {
    enemies = [];
    const rows = 3;   // número de linhas
    const cols = 8;   // número de inimigos por linha
    const hSpacing = 90; // espaçamento horizontal
    const vSpacing = 50; // espaçamento vertical
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            enemies.push({
                x: c * hSpacing + 30,
                y: r * vSpacing + 50,
                width: 40,
                height: 30,
                speed: 2,
                direction: 1
            });
        }
    }
}
createEnemies();

// Função para desenhar jogador
function drawPlayer() {
    ctx.fillStyle = "lime";
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

// Função para desenhar projéteis
function drawBullets() {
    ctx.fillStyle = "red";
    bullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));
}

// Função para desenhar inimigos
function drawEnemies() {
    ctx.fillStyle = "white";
    enemies.forEach(e => ctx.fillRect(e.x, e.y, e.width, e.height));
}

// Função para desenhar HUD (score e vidas)
function drawHUD() {
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, 20, 30);
    ctx.fillText("Lives: " + lives, canvas.width - 120, 30);
}

// Atualiza posição dos projéteis
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= bullets[i].speed;
        if (bullets[i].y < 0) bullets.splice(i, 1);
    }
}

// Atualiza inimigos
function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        e.x += e.speed * e.direction;

        // Bateu na lateral → muda direção e desce
        if (e.x + e.width > canvas.width || e.x < 0) {
            e.direction *= -1;
            e.y += 20;
        }

        // Se inimigo chegar no chão → perde vida
        if (e.y + e.height >= canvas.height) {
            lives--;
            enemies.splice(i, 1);
            if (lives <= 0) gameOver = true;
        }
    }
}

// Verifica colisões
function checkCollisions() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            let b = bullets[i];
            let e = enemies[j];

            if (b.x < e.x + e.width &&
                b.x + b.width > e.x &&
                b.y < e.y + e.height &&
                b.y + b.height > e.y) {
                
                enemies.splice(j, 1);
                bullets.splice(i, 1);
                score += 10;
                break;
            }
        }
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
        checkCollisions();

        drawPlayer();
        drawBullets();
        drawEnemies();
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
