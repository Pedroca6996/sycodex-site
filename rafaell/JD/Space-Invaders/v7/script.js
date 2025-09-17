// --- Elementos do Canvas e HTML ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const highScoreFormContainer = document.getElementById("highScoreFormContainer");
const highScoreForm = document.getElementById("highScoreForm");
const playerNameInput = document.getElementById("playerName");

// --- Sons do Jogo ---
const shootSound = new Audio("../sounds/shoot.mp3");
const explosionSound = new Audio("../sounds/explosion.mp3");
const powerupSound = new Audio("../sounds/powerup.mp3");
const gameOverSound = new Audio("../sounds/game-over.mp3");

// --- Estado do Jogo ---
let audioEnabled = false;

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

// Flags de controle do fluxo do jogo
let gameOver = false;
let scoreSaved = false;
let enteringName = false; // Controla se estamos na tela de inserir nome

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

// --- Event Listeners ---

document.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (!audioEnabled) {
        audioEnabled = true;
    }
});

document.addEventListener("keyup", (e) => {
    keys[e.key] = false;
});

// Listener para o clique do mouse (usado para reiniciar)
const restartButton = {
    x: canvas.width / 2 - 75,
    y: canvas.height / 2 + 180,
    width: 150,
    height: 40
};

canvas.addEventListener("click", (e) => {
    if (gameOver) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (
            mouseX >= restartButton.x &&
            mouseX <= restartButton.x + restartButton.width &&
            mouseY >= restartButton.y &&
            mouseY <= restartButton.y + restartButton.height
        ) {
            restartGame();
        }
    }
});

// Listener para o envio do formulário de high score
highScoreForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const playerName = playerNameInput.value.toUpperCase() || "AAA";
    saveHighScore(playerName, score);
    
    highScoreFormContainer.classList.add("hidden");
    enteringName = false;
    gameOver = true;
    scoreSaved = true;
});

// --- Funções de High Score ---

/**
 * Busca as pontuações mais altas (com nomes).
 * @returns {{name: string, score: number}[]}
 */
function getHighScores() {
    const scores = localStorage.getItem("highScores");
    return scores ? JSON.parse(scores) : [];
}

/**
 * Salva uma nova pontuação com nome no ranking.
 * @param {string} name - O nome do jogador.
 * @param {number} newScore - A pontuação.
 */
function saveHighScore(name, newScore) {
    if (newScore === 0) return;

    const highScores = getHighScores();
    highScores.push({ name, score: newScore });
    highScores.sort((a, b) => b.score - a.score);
    const topScores = highScores.slice(0, 5);
    
    localStorage.setItem("highScores", JSON.stringify(topScores));
}

/**
 * Verifica se a pontuação atual é alta o suficiente para entrar no ranking.
 * @param {number} currentScore
 * @returns {boolean}
 */
function checkIfHighScore(currentScore) {
    const highScores = getHighScores();
    if (currentScore === 0) return false;
    if (highScores.length < 5) return true;
    
    const lowestScore = highScores[highScores.length - 1].score;
    return currentScore > lowestScore;
}


// --- Funções Principais do Jogo ---

function restartGame() {
    score = 0;
    lives = 3;
    level = 1;
    enemySpeed = 1.5;
    gameOver = false;
    scoreSaved = false;
    enteringName = false;
    
    bullets.length = 0;
    powerUps.length = 0;
    
    player.x = canvas.width / 2 - 25;
    player.y = canvas.height - 50;
    player.width = player.baseWidth;
    player.doubleShot = false;
    bulletType = "normal";
    
    for (let key in powerUpTimers) {
        powerUpTimers[key] = 0;
    }
    
    highScoreFormContainer.classList.add("hidden");
    createEnemies();
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
                points: isSpecial ? 500 : 100,
                isFlashing: false,
                flashTimer: 0
            });
        }
    }
}

function spawnPowerUp() {
    // Chance base reduzida para 1%
    if (Math.random() < 0.01 + level * 0.002) {
        // Lista ajustada para "bomb" ser mais raro
        const types = [
            "doubleShot", "wideShip", "explosive", "piercing", 
            "doubleShot", "wideShip", "explosive", "piercing", 
            "bomb"
        ];
        const type = types[Math.floor(Math.random() * types.length)];
        
        // Velocidade da "bomb" aumentada
        const speed = type === "bomb" ? 9 :
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
    if (audioEnabled) {
        shootSound.currentTime = 0;
        shootSound.play().catch(e => console.error("Erro ao tocar som de tiro:", e));
    }

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

function checkCollisions() {
    for (let bIndex = bullets.length - 1; bIndex >= 0; bIndex--) {
        const bullet = bullets[bIndex];
        for (let eIndex = enemies.length - 1; eIndex >= 0; eIndex--) {
            const enemy = enemies[eIndex];
            const collided =
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y;

            if (collided) {
                enemy.isFlashing = true;
                enemy.flashTimer = Date.now() + 50;

                if (audioEnabled) {
                    explosionSound.currentTime = 0;
                    explosionSound.play().catch(e => console.error("Erro ao tocar som de explosão:", e));
                }

                if (bullet.type === "explosive") {
                    enemies = enemies.filter((e) => {
                        const dist = Math.hypot(e.x - enemy.x, e.y - enemy.y);
                        if (dist < 50) score += e.points;
                        return dist >= 50;
                    });
                    bullets.splice(bIndex, 1);
                    break;
                } else if (bullet.type === "piercing") {
                    score += enemy.points;
                    enemies.splice(eIndex, 1);
                } else {
                    score += enemy.points;
                    enemies.splice(eIndex, 1);
                    bullets.splice(bIndex, 1);
                    break;
                }
            }
        }
    }

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

// --- Funções de Desenho ---

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
        
        if (enemy.isFlashing) {
            ctx.fillStyle = "white";
            if (Date.now() > enemy.flashTimer) {
                enemy.isFlashing = false;
            }
        } else {
            ctx.fillStyle = enemy.color;
        }
        
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });

    if (hitEdge) {
        enemyDirection *= -1;
        enemies.forEach((enemy) => {
            enemy.y += 20;
            if (enemy.y + enemy.height >= player.y) {
                lives--;
                if (lives <= 0) {
                    if (checkIfHighScore(score)) {
                        enteringName = true;
                        highScoreFormContainer.classList.remove("hidden");
                        playerNameInput.focus();
                    } else {
                        gameOver = true;
                    }
                    scoreSaved = false;
                    if (audioEnabled) {
                        gameOverSound.currentTime = 0;
                        gameOverSound.play().catch(e => console.error("Erro ao tocar som de game over:", e));
                    }
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
            if (audioEnabled) {
                powerupSound.currentTime = 0;
                powerupSound.play().catch(e => console.error("Erro ao tocar som de power-up:", e));
            }

            const now = Date.now();
            if (p.type === "doubleShot") player.doubleShot = true, powerUpTimers.doubleShot = now + POWER_UP_DURATION;
            if (p.type === "wideShip") player.width = player.baseWidth + 20, powerUpTimers.wideShip = now + POWER_UP_DURATION;
            if (p.type === "explosive") bulletType = "explosive", powerUpTimers.explosive = now + POWER_UP_DURATION;
            if (p.type === "piercing") bulletType = "piercing", powerUpTimers.piercing = now + POWER_UP_DURATION;
            if (p.type === "bomb") enemies = [];

            powerUps.splice(index, 1);
        }

        if (p.y > canvas.height) powerUps.splice(index, 1);
    });
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
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 100);

    ctx.font = "24px Arial";
    ctx.fillText(`Sua Pontuação: ${score}`, canvas.width / 2, canvas.height / 2 - 50);

    ctx.font = "20px Arial";
    ctx.fillText("Ranking - Top 5", canvas.width / 2, canvas.height / 2 + 20);

    const highScores = getHighScores();

    if (highScores.length === 0) {
        // Isso será exibido se o ranking estiver vazio
    } else {
        highScores.forEach((s, index) => {
            if (s && typeof s.name === 'string' && typeof s.score === 'number') {
                const text = `${index + 1}. ${s.name.padEnd(5, ' ')} ... ${s.score}`;
                ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 60 + index * 30);
            }
        });
    }

    ctx.fillStyle = "lime";
    ctx.fillRect(restartButton.x, restartButton.y, restartButton.width, restartButton.height);
    ctx.fillStyle = "black";
    ctx.font = "22px Arial";
    ctx.fillText("Reiniciar", canvas.width / 2, restartButton.y + 28);

    ctx.textAlign = "start";
}


// --- Game Loop ---

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (enteringName) {
        // Pausa o jogo e exibe o HUD por baixo enquanto o formulário HTML está ativo
        drawHUD();
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (!gameOver) {
        // Jogo rodando
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
        // Tela de Game Over final
        drawGameOver();
    }

    requestAnimationFrame(gameLoop);
}

// --- Início do Jogo ---
createEnemies();
gameLoop();