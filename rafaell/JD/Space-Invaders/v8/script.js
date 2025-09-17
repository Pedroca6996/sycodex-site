// =================================================================================
// Versão 8.0 - Space Invaders com Menus, Gráficos Melhorados e Lógica Avançada
// =================================================================================

// --- Elementos do Canvas e HTML ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const highScoreFormContainer = document.getElementById("highScoreFormContainer");
const highScoreForm = document.getElementById("highScoreForm");
const playerNameInput = document.getElementById("playerName");

// --- Configurações e Estado do Jogo ---
let gameState = 'menu'; // 'menu', 'playing', 'ranking', 'settings', 'gameOver', 'enteringName'
let audioEnabled = false;

const colors = {
    background: '#0D050E',
    player: '#3DDC97',
    enemy1: '#FF495C',
    enemySpecial: '#FFD166',
    bulletPlayer: '#96E6B3',
    bulletEnemy: '#EF6F6C',
    text: '#FFFFFF',
    button: '#3DDC97',
    buttonText: '#0D050E'
};

// --- Áudio ---
const sounds = {
    shoot: new Audio("../sounds/shoot.mp3"),
    explosion: new Audio("../sounds/explosion.mp3"),
    powerup: new Audio("../sounds/powerup.mp3"),
    gameOver: new Audio("../sounds/game-over.mp3"),
    playerHit: new Audio("../sounds/explosion.mp3") // Reutilizando som
};

let volumes = JSON.parse(localStorage.getItem('gameVolumes')) || {
    shoot: 0.4,
    explosion: 0.5,
    powerup: 0.7,
    gameOver: 0.6,
    playerHit: 0.6
};

function playSound(type) {
    if (!audioEnabled) return;
    const sound = sounds[type];
    sound.currentTime = 0;
    sound.volume = volumes[type];
    sound.play().catch(e => {});
}

// --- Entidades do Jogo ---
let player = {};
let bullets = [];
let enemyBullets = [];
let enemies = [];
let powerUps = [];

// --- Variáveis de Jogo ---
let score = 0;
let lives = 3;
let level = 1;
let enemyDirection = 1;
let enemySpeed = 1.5;
let lastShotTime = 0;
const shotInterval = 500;
let bulletType = "normal";
let powerUpTimers = {};
const POWER_UP_DURATION = 10000;

// --- Funções de Inicialização e Reset ---
function initializePlayer() {
    player = {
        x: canvas.width / 2 - 25,
        y: canvas.height - 60,
        width: 50,
        height: 30,
        baseWidth: 50,
        speed: 5,
        doubleShot: false,
        isHit: false,
        hitTimer: 0
    };
}

function resetGame() {
    score = 0;
    lives = 3;
    level = 1;
    enemySpeed = 1.5;
    
    bullets = [];
    enemyBullets = [];
    powerUps = [];
    
    initializePlayer();
    
    powerUpTimers = { doubleShot: 0, wideShip: 0, explosive: 0, piercing: 0 };
    
    highScoreFormContainer.classList.add("hidden");
    createEnemies();
    gameState = 'playing';
}

function createEnemies() {
    enemies = [];
    const enemyRows = 4 + Math.min(Math.floor(level / 3), 3);
    const enemyCols = 10;
    const enemySize = 35;
    
    for (let row = 0; row < enemyRows; row++) {
        for (let col = 0; col < enemyCols; col++) {
            const isSpecial = Math.random() < 0.15;
            enemies.push({
                x: col * (enemySize + 15) + 60,
                y: row * (enemySize + 15) + 50,
                width: enemySize,
                height: enemySize,
                isSpecial: isSpecial,
                points: isSpecial ? 500 : 100
            });
        }
    }
}

// --- Lógica de Jogo (Funções de Update) ---

function updateGame() {
    handlePlayerMovement();
    handleShooting();
    updateBullets();
    updateEnemies();
    handleEnemyShooting();
    updateEnemyBullets();
    spawnPowerUp();
    updatePowerUps();
    checkCollisions();
    updatePowerUpTimers();
}

function handlePlayerMovement() {
    if (keys["ArrowLeft"] && player.x > 0) player.x -= player.speed;
    if (keys["ArrowRight"] && player.x + player.width < canvas.width) player.x += player.speed;
}

const keys = {};
document.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (!audioEnabled) audioEnabled = true;
});
document.addEventListener("keyup", (e) => keys[e.key] = false);

function handleShooting() {
    const now = Date.now();
    if (keys[" "] && now - lastShotTime > shotInterval) {
        shootBullet();
        lastShotTime = now;
    }
}

function shootBullet() {
    playSound('shoot');
    const baseBullet = {
        y: player.y,
        width: 5,
        height: 15,
        speed: 7,
        type: bulletType
    };

    if (player.doubleShot) {
        bullets.push({ ...baseBullet, x: player.x + player.width * 0.2 });
        bullets.push({ ...baseBullet, x: player.x + player.width * 0.8 - baseBullet.width });
    } else {
        bullets.push({ ...baseBullet, x: player.x + player.width / 2 - baseBullet.width / 2 });
    }
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= bullets[i].speed;
        if (bullets[i].y + bullets[i].height < 0) {
            bullets.splice(i, 1);
        }
    }
}

function updateEnemies() {
    let hitEdge = false;
    enemies.forEach(enemy => {
        enemy.x += enemyDirection * enemySpeed;
        if (enemy.x + enemy.width > canvas.width || enemy.x < 0) {
            hitEdge = true;
        }
    });

    if (hitEdge) {
        enemyDirection *= -1;
        enemies.forEach(enemy => {
            enemy.y += 20;
            if (enemy.y + enemy.height >= player.y) {
                endGame();
            }
        });
    }
}

function handleEnemyShooting() {
    const fireChance = 0.002 + (level * 0.0005) + (1 / (enemies.length + 1)) * 0.005;
    if (Math.random() < fireChance && enemies.length > 0) {
        const shooters = [];
        const columns = {};
        enemies.forEach(enemy => {
            if (!columns[enemy.x] || columns[enemy.x].y < enemy.y) {
                columns[enemy.x] = enemy;
            }
        });
        Object.values(columns).forEach(shooter => shooters.push(shooter));
        
        const shooter = shooters[Math.floor(Math.random() * shooters.length)];
        if (shooter) {
            enemyBullets.push({
                x: shooter.x + shooter.width / 2 - 2,
                y: shooter.y + shooter.height,
                width: 4,
                height: 12,
                speed: 4 + level * 0.2,
                color: colors.bulletEnemy
            });
        }
    }
}

function updateEnemyBullets() {
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        enemyBullets[i].y += enemyBullets[i].speed;
        if (enemyBullets[i].y > canvas.height) {
            enemyBullets.splice(i, 1);
        }
    }
}

function spawnPowerUp() { /* ... (mesma lógica de antes) ... */ }
function updatePowerUps() { /* ... */ }
function updatePowerUpTimers() { /* ... */ }

function checkCollisions() {
    // Tiros do jogador vs inimigos
    for (let bIndex = bullets.length - 1; bIndex >= 0; bIndex--) {
        for (let eIndex = enemies.length - 1; eIndex >= 0; eIndex--) {
            // ... (lógica de colisão similar a anterior) ...
        }
    }
    
    // Tiros inimigos vs jogador
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        if (!player.isHit && bullet.x < player.x + player.width && bullet.x + bullet.width > player.x && bullet.y < player.y + player.height && bullet.y + bullet.height > player.y) {
            enemyBullets.splice(i, 1);
            lives--;
            playSound('playerHit');
            player.isHit = true;
            player.hitTimer = Date.now();
            if (lives <= 0) {
                endGame();
            }
        }
    }
    
    // ... (colisão power-ups vs jogador) ...
}

function endGame() {
    playSound('gameOver');
    if (checkIfHighScore(score)) {
        gameState = 'enteringName';
        highScoreFormContainer.classList.remove("hidden");
        playerNameInput.focus();
    } else {
        gameState = 'gameOver';
    }
}

// --- Funções de Desenho ---

function drawGame() {
    // Fundo
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    drawPlayer();
    drawBullets();
    drawEnemies();
    drawEnemyBullets();
    // drawPowerUps();
    drawHUD();
}

function drawPlayer() {
    if (player.isHit) {
        const timeSinceHit = Date.now() - player.hitTimer;
        if (timeSinceHit > 2000) { // 2s de invencibilidade
            player.isHit = false;
        }
        // Pisca a cada 100ms
        if (Math.floor(timeSinceHit / 100) % 2 === 0) {
            return;
        }
    }
    ctx.fillStyle = colors.player;
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x, player.y + player.height);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.closePath();
    ctx.fill();
}

function drawBullets() {
    ctx.fillStyle = colors.bulletPlayer;
    bullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));
}

function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.isSpecial ? colors.enemySpecial : colors.enemy1;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        // "Olhos"
        ctx.fillStyle = colors.background;
        ctx.fillRect(enemy.x + 7, enemy.y + 10, 5, 5);
        ctx.fillRect(enemy.x + enemy.width - 12, enemy.y + 10, 5, 5);
    });
}

function drawEnemyBullets() {
    ctx.fillStyle = colors.bulletEnemy;
    enemyBullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));
}

function drawHUD() { /* ... (desenha score, vidas, etc.) ... */ }

// --- Telas de Menu e UI ---
const menuButtons = {
    play: { x: 300, y: 250, width: 200, height: 50, text: 'Jogar' },
    ranking: { x: 300, y: 320, width: 200, height: 50, text: 'Ranking' },
    settings: { x: 300, y: 390, width: 200, height: 50, text: 'Configurações' }
};

function drawMenu() {
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = colors.text;
    ctx.font = '50px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SPACE INVADERS', canvas.width / 2, 150);
    
    Object.values(menuButtons).forEach(button => {
        ctx.fillStyle = colors.button;
        ctx.fillRect(button.x, button.y, button.width, button.height);
        ctx.fillStyle = colors.buttonText;
        ctx.font = '30px Arial';
        ctx.fillText(button.text, button.x + button.width / 2, button.y + 35);
    });
}

function drawRankingScreen() { /* ... */ }
function drawSettingsScreen() { /* ... */ }
function drawGameOver() { /* ... */ }

// --- Interação do Mouse ---
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    const isInside = (pos, rect) => pos.x > rect.x && pos.x < rect.x + rect.width && pos.y > rect.y && pos.y < rect.y + rect.height;

    if (gameState === 'menu') {
        if (isInside(mouse, menuButtons.play)) resetGame();
        if (isInside(mouse, menuButtons.ranking)) gameState = 'ranking';
        if (isInside(mouse, menuButtons.settings)) gameState = 'settings';
    } else if (gameState === 'gameOver' || gameState === 'ranking' || gameState === 'settings') {
        // Adicionar botão "Voltar" nessas telas
        // if (isInside(mouse, backButton)) gameState = 'menu';
    }
});

// --- High Score (mesmas funções de antes) ---
function getHighScores() { /* ... */ }
function saveHighScore(name, score) { /* ... */ }
function checkIfHighScore(score) { /* ... */ }
// ... e o listener do formulário ...

// --- Game Loop Principal ---
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    switch (gameState) {
        case 'menu':
            drawMenu();
            break;
        case 'playing':
            updateGame();
            drawGame();
            break;
        // ... outros casos
    }

    requestAnimationFrame(gameLoop);
}

// --- Início ---
initializePlayer();
gameLoop();