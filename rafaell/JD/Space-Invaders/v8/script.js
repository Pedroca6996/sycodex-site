// =================================================================================
// Versão 8.1 - Space Invaders COMPLETO
// =================================================================================

// --- Elementos do Canvas e HTML ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const highScoreFormContainer = document.getElementById("highScoreFormContainer");
const highScoreForm = document.getElementById("highScoreForm");
const playerNameInput = document.getElementById("playerName");

// --- Estado do Jogo ---
let gameState = 'menu'; // 'menu', 'playing', 'ranking', 'settings', 'gameOver', 'enteringName'
let audioEnabled = false;

// --- Configurações Visuais ---
const colors = {
    background: '#0D050E',
    player: '#3DDC97',
    enemy1: '#FF495C',
    enemySpecial: '#FFD166',
    bulletPlayer: '#96E6B3',
    bulletEnemy: '#EF6F6C',
    text: '#FFFFFF',
    button: '#3DDC97',
    buttonText: '#0D050E',
    powerup: 'magenta'
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

// --- Entidades e Variáveis do Jogo ---
let player;
let bullets = [];
let enemyBullets = [];
let enemies = [];
let powerUps = [];

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
const keys = {};

// --- Funções de Inicialização e Reset ---

function initializePlayer() {
    player = {
        x: canvas.width / 2 - 25,
        y: canvas.height - 60,
        width: 50,
        height: 20,
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
    bulletType = "normal";
    
    highScoreFormContainer.classList.add("hidden");
    createEnemies();
    gameState = 'playing';
}

function createEnemies() {
    enemies = [];
    const enemyRows = 4;
    const enemyCols = 10;
    const enemySize = 35;
    
    for (let row = 0; row < enemyRows; row++) {
        for (let col = 0; col < enemyCols; col++) {
            const isSpecial = Math.random() < 0.1;
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

// --- Funções de Update (Lógica do Jogo) ---

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

    // Checa condição de invencibilidade do jogador
    if (player.isHit && Date.now() - player.hitTimer > 2000) {
        player.isHit = false;
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
    playSound('shoot');
    const baseBullet = { y: player.y, width: 5, height: 15, type: bulletType };
    const speedMap = { "explosive": 4, "piercing": 7, "bomb": 2, "normal": 6 };
    baseBullet.speed = speedMap[bulletType] || 6;

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
        if (bullets[i].y + bullets[i].height < 0) bullets.splice(i, 1);
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
            if (enemy.y + enemy.height >= player.y) endGame();
        });
    }
}

function handleEnemyShooting() {
    const fireChance = 0.002 + (level * 0.0005);
    if (Math.random() < fireChance && enemies.length > 0) {
        const shooters = [];
        const columns = {};
        enemies.forEach(enemy => {
            if (!columns[enemy.x] || columns[enemy.x].y < enemy.y) columns[enemy.x] = enemy;
        });
        Object.values(columns).forEach(shooter => shooters.push(shooter));
        
        const shooter = shooters[Math.floor(Math.random() * shooters.length)];
        if (shooter) {
            enemyBullets.push({
                x: shooter.x + shooter.width / 2 - 2,
                y: shooter.y + shooter.height,
                width: 4,
                height: 12,
                speed: 4 + level * 0.2
            });
        }
    }
}

function updateEnemyBullets() {
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        enemyBullets[i].y += enemyBullets[i].speed;
        if (enemyBullets[i].y > canvas.height) enemyBullets.splice(i, 1);
    }
}

function spawnPowerUp() {
    if (Math.random() < 0.01 + level * 0.002) {
        const types = ["doubleShot", "wideShip", "explosive", "piercing", "doubleShot", "wideShip", "bomb"];
        const type = types[Math.floor(Math.random() * types.length)];
        const speedMap = { "bomb": 9, "explosive": 6, "piercing": 5.5, "doubleShot": 4.5, "wideShip": 4 };

        powerUps.push({
            x: Math.random() * (canvas.width - 30),
            y: 0,
            width: 30,
            height: 30,
            type,
            speed: speedMap[type] || 4
        });
    }
}

function updatePowerUps() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const p = powerUps[i];
        p.y += p.speed;
        if (p.y > canvas.height) powerUps.splice(i, 1);
    }
}

function checkCollisions() {
    // Tiros do jogador vs inimigos
    for (let bIndex = bullets.length - 1; bIndex >= 0; bIndex--) {
        const bullet = bullets[bIndex];
        for (let eIndex = enemies.length - 1; eIndex >= 0; eIndex--) {
            const enemy = enemies[eIndex];
            if (bullet.x < enemy.x + enemy.width && bullet.x + bullet.width > enemy.x && bullet.y < enemy.y + enemy.height && bullet.y + bullet.height > enemy.y) {
                playSound('explosion');
                score += enemy.points;
                enemies.splice(eIndex, 1);
                if (bullet.type !== 'piercing') {
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
    
    // Tiros inimigos vs jogador
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        if (!player.isHit && bullet.x < player.x + player.width && bullet.x + bullet.width > player.x && bullet.y < player.y + player.height && bullet.y + bullet.height > player.y) {
            enemyBullets.splice(i, 1);
            lives--;
            playSound('playerHit');
            if (lives > 0) {
                player.isHit = true;
                player.hitTimer = Date.now();
            } else {
                endGame();
            }
        }
    }
    
    // Power-ups vs jogador
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const p = powerUps[i];
        if (p.x < player.x + player.width && p.x + p.width > player.x && p.y < player.y + player.height && p.y + p.height > player.y) {
            activatePowerUp(p.type);
            powerUps.splice(i, 1);
        }
    }
}

function activatePowerUp(type) {
    playSound('powerup');
    const now = Date.now();
    if (type === "doubleShot") player.doubleShot = true, powerUpTimers.doubleShot = now + POWER_UP_DURATION;
    if (type === "wideShip") player.width = player.baseWidth + 20, powerUpTimers.wideShip = now + POWER_UP_DURATION;
    if (type === "explosive") bulletType = "explosive", powerUpTimers.explosive = now + POWER_UP_DURATION;
    if (type === "piercing") bulletType = "piercing", powerUpTimers.piercing = now + POWER_UP_DURATION;
    if (type === "bomb") enemies = [];
}

function updatePowerUpTimers() {
    const now = Date.now();
    if (powerUpTimers.doubleShot && now > powerUpTimers.doubleShot) player.doubleShot = false;
    if (powerUpTimers.wideShip && now > powerUpTimers.wideShip) player.width = player.baseWidth;
    if ((powerUpTimers.explosive && now > powerUpTimers.explosive) || (powerUpTimers.piercing && now > powerUpTimers.piercing)) bulletType = "normal";
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
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawPlayer();
    bullets.forEach(drawBullet);
    enemies.forEach(drawEnemy);
    enemyBullets.forEach(drawEnemyBullet);
    powerUps.forEach(drawPowerUp);
    drawHUD();
}

function drawPlayer() {
    if (player.isHit && Math.floor((Date.now() - player.hitTimer) / 100) % 2 === 0) return;
    ctx.fillStyle = colors.player;
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y - 5);
    ctx.lineTo(player.x, player.y + player.height);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.closePath();
    ctx.fill();
}

function drawBullet(b) { ctx.fillStyle = colors.bulletPlayer; ctx.fillRect(b.x, b.y, b.width, b.height); }
function drawEnemyBullet(b) { ctx.fillStyle = colors.bulletEnemy; ctx.fillRect(b.x, b.y, b.width, b.height); }

function drawEnemy(enemy) {
    ctx.fillStyle = enemy.isSpecial ? colors.enemySpecial : colors.enemy1;
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    ctx.fillStyle = colors.background;
    ctx.fillRect(enemy.x + 7, enemy.y + 10, 5, 5);
    ctx.fillRect(enemy.x + enemy.width - 12, enemy.y + 10, 5, 5);
}

function drawPowerUp(p) {
    ctx.fillStyle = colors.powerup;
    ctx.fillRect(p.x, p.y, p.width, p.height);
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    let text = '';
    if (p.type === 'doubleShot') text = '||';
    if (p.type === 'wideShip') text = '<->';
    if (p.type === 'piercing') text = '->';
    if (p.type === 'bomb') text = 'B';
    ctx.fillText(text, p.x + p.width / 2, p.y + p.height / 2 + 5);
    ctx.textAlign = 'start';
}

function drawHUD() {
    ctx.fillStyle = colors.text;
    ctx.font = '20px Arial';
    ctx.textAlign = 'start';
    ctx.fillText(`Pontuação: ${score}`, 10, 25);
    ctx.fillText(`Nível: ${level}`, canvas.width / 2 - 40, 25);
    ctx.textAlign = 'end';
    ctx.fillText(`Vidas: ${lives}`, canvas.width - 10, 25);
    ctx.textAlign = 'start';
}

// --- Funções de UI (Menus, Telas) ---
const menuButtons = {
    play: { x: 300, y: 250, width: 200, height: 50, text: 'Jogar' },
    ranking: { x: 300, y: 320, width: 200, height: 50, text: 'Ranking' },
    settings: { x: 300, y: 390, width: 200, height: 50, text: 'Configurações' }
};
const backButton = { x: 300, y: 500, width: 200, height: 50, text: 'Voltar' };

function drawMenu() {
    drawFullscreenMessage('SPACE INVADERS', 150);
    Object.values(menuButtons).forEach(b => drawButton(b));
}

function drawRankingScreen() {
    drawFullscreenMessage('Ranking - Top 5', 100);
    const highScores = getHighScores();
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    if (highScores.length === 0) {
        ctx.fillText('Nenhuma pontuação registrada!', canvas.width / 2, 200);
    } else {
        highScores.forEach((s, i) => {
            const text = `${i + 1}. ${s.name.padEnd(5, ' ')} ... ${s.score}`;
            ctx.fillText(text, canvas.width / 2, 180 + i * 40);
        });
    }
    drawButton(backButton);
}

function drawSettingsScreen() {
    drawFullscreenMessage('Configurações de Volume', 100);
    ctx.font = '22px Arial';
    ctx.textAlign = 'center';
    let yPos = 180;
    for (const key in volumes) {
        const text = `${key.charAt(0).toUpperCase() + key.slice(1)}: ${Math.round(volumes[key] * 100)}%`;
        ctx.fillText(text, canvas.width / 2, yPos);
        // Desenha botões de + e - (simplificado)
        ctx.fillText('-', canvas.width / 2 - 100, yPos);
        ctx.fillText('+', canvas.width / 2 + 100, yPos);
        yPos += 50;
    }
    drawButton(backButton);
}

function drawGameOver() {
    drawFullscreenMessage('GAME OVER', 150);
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Sua Pontuação Final: ${score}`, canvas.width / 2, 220);
    drawButton({ x: 300, y: 300, width: 200, height: 50, text: 'Tentar Novamente' });
    drawButton({ ...backButton, y: 370, text: 'Menu Principal' });
}

function drawButton(b) {
    ctx.fillStyle = colors.button;
    ctx.fillRect(b.x, b.y, b.width, b.height);
    ctx.fillStyle = colors.buttonText;
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(b.text, b.x + b.width / 2, b.y + 35);
    ctx.textAlign = 'start';
}

function drawFullscreenMessage(text, y) {
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = colors.text;
    ctx.font = '50px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(text, canvas.width / 2, y);
    ctx.textAlign = 'start';
}


// --- Lógica de High Score ---
function getHighScores() { return JSON.parse(localStorage.getItem("highScores")) || []; }
function checkIfHighScore(s) { const hs = getHighScores(); return s > 0 && (hs.length < 5 || s > hs[hs.length - 1].score); }
function saveHighScore(name, newScore) {
    const hs = getHighScores();
    hs.push({ name, score: newScore });
    hs.sort((a, b) => b.score - a.score);
    localStorage.setItem("highScores", JSON.stringify(hs.slice(0, 5)));
}

// --- Event Listeners ---
document.addEventListener("keydown", (e) => { keys[e.key] = true; if (!audioEnabled) audioEnabled = true; });
document.addEventListener("keyup", (e) => { keys[e.key] = false; });

highScoreForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const playerName = playerNameInput.value.toUpperCase().slice(0, 5) || "AAA";
    saveHighScore(playerName, score);
    highScoreFormContainer.classList.add("hidden");
    gameState = 'gameOver';
});

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const isInside = (pos, rect) => pos.x > rect.x && pos.x < rect.x + rect.width && pos.y > rect.y && pos.y < rect.y + rect.height;

    if (gameState === 'menu') {
        if (isInside(mouse, menuButtons.play)) resetGame();
        if (isInside(mouse, menuButtons.ranking)) gameState = 'ranking';
        if (isInside(mouse, menuButtons.settings)) gameState = 'settings';
    } else if (gameState === 'ranking' || gameState === 'settings') {
        if (isInside(mouse, backButton)) gameState = 'menu';
    } else if (gameState === 'settings') {
        // Lógica para aumentar/diminuir volume
        let yPos = 180;
        for (const key in volumes) {
            const minusBtn = { x: canvas.width / 2 - 120, y: yPos - 20, width: 40, height: 30 };
            const plusBtn = { x: canvas.width / 2 + 80, y: yPos - 20, width: 40, height: 30 };
            if (isInside(mouse, minusBtn)) volumes[key] = Math.max(0, volumes[key] - 0.1);
            if (isInside(mouse, plusBtn)) volumes[key] = Math.min(1, volumes[key] + 0.1);
            yPos += 50;
        }
        localStorage.setItem('gameVolumes', JSON.stringify(volumes));
    } else if (gameState === 'gameOver') {
        const tryAgainButton = { x: 300, y: 300, width: 200, height: 50 };
        const mainMenuButton = { ...backButton, y: 370 };
        if (isInside(mouse, tryAgainButton)) resetGame();
        if (isInside(mouse, mainMenuButton)) gameState = 'menu';
    }
});

// --- Game Loop Principal ---
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    switch (gameState) {
        case 'menu': drawMenu(); break;
        case 'playing': updateGame(); drawGame(); break;
        case 'ranking': drawRankingScreen(); break;
        case 'settings': drawSettingsScreen(); break;
        case 'gameOver': drawGameOver(); break;
        case 'enteringName': drawGame(); break; // Continua desenhando o jogo por baixo
    }

    requestAnimationFrame(gameLoop);
}

// --- Início do Jogo ---
initializePlayer();
gameLoop();