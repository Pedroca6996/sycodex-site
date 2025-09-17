// =================================================================================
// Versão 8.2 - The "Soul" Update (Melhorias Visuais e Correções)
// =================================================================================

// --- Elementos do Canvas e HTML ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const highScoreFormContainer = document.getElementById("highScoreFormContainer");
const highScoreForm = document.getElementById("highScoreForm");
const playerNameInput = document.getElementById("playerName");

// --- Estado do Jogo ---
let gameState = 'menu';
let audioEnabled = false;

// --- Configurações Visuais ---
const colors = {
    background: '#0a040d',
    player: '#39a34a',
    enemy1: '#e53d00',
    enemySpecial: '#ffd300',
    bulletPlayer: '#96e6b3',
    bulletEnemy: '#e01e5a',
    text: '#f0f6fc',
    buttonFill: 'rgba(57, 163, 74, 0.7)',
    buttonBorder: '#96e6b3',
    buttonText: '#f0f6fc',
    powerup: '#a371f7'
};

// --- Fundo Estrelado ---
let stars = [];
function createStars(count) {
    for (let i = 0; i < count; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 1.5 + 0.5,
            speed: Math.random() * 0.5 + 0.2
        });
    }
}

// --- Áudio ---
const sounds = {
    shoot: new Audio("../sounds/shoot.mp3"),
    explosion: new Audio("../sounds/explosion.mp3"),
    powerup: new Audio("../sounds/powerup.mp3"),
    gameOver: new Audio("../sounds/game-over.mp3"),
    playerHit: new Audio("../sounds/explosion.mp3")
};
let volumes = JSON.parse(localStorage.getItem('gameVolumes')) || { shoot: 0.4, explosion: 0.5, powerup: 0.7, gameOver: 0.6, playerHit: 0.6 };
function playSound(type) {
    if (!audioEnabled) return;
    const sound = sounds[type];
    sound.currentTime = 0;
    sound.volume = volumes[type];
    sound.play().catch(e => {});
}

// --- Entidades e Variáveis do Jogo ---
let player;
let bullets = [], enemyBullets = [], enemies = [], powerUps = [];
let score = 0, lives = 3, level = 1, enemyDirection = 1, enemySpeed = 1.5, lastShotTime = 0;
const shotInterval = 500;
let bulletType = "normal";
let powerUpTimers = {};
const POWER_UP_DURATION = 10000;
const keys = {};

// --- Funções de Inicialização e Reset ---
function initializePlayer() {
    player = {
        x: canvas.width / 2 - 25, y: canvas.height - 70, width: 50, height: 25,
        baseWidth: 50, speed: 5, doubleShot: false, isHit: false, hitTimer: 0
    };
}
function resetGame() {
    score = 0; lives = 3; level = 1; enemySpeed = 1.5;
    bullets = []; enemyBullets = []; powerUps = [];
    initializePlayer();
    powerUpTimers = { doubleShot: 0, wideShip: 0, explosive: 0, piercing: 0 };
    bulletType = "normal";
    highScoreFormContainer.classList.add("hidden");
    createEnemies();
    gameState = 'playing';
}
function createEnemies() {
    enemies = [];
    const enemyRows = 4, enemyCols = 10, enemySize = 35;
    for (let row = 0; row < enemyRows; row++) {
        for (let col = 0; col < enemyCols; col++) {
            enemies.push({
                x: col * (enemySize + 15) + 60, y: row * (enemySize + 15) + 50,
                width: enemySize, height: enemySize,
                isSpecial: Math.random() < 0.1, points: Math.random() < 0.1 ? 500 : 100
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
    if (player.isHit && Date.now() - player.hitTimer > 2000) player.isHit = false;
}
function handlePlayerMovement() {
    if (keys["ArrowLeft"] && player.x > 0) player.x -= player.speed;
    if (keys["ArrowRight"] && player.x + player.width < canvas.width) player.x += player.speed;
}
function handleShooting() {
    if (keys[" "] && Date.now() - lastShotTime > shotInterval) {
        playSound('shoot');
        lastShotTime = Date.now();
        const base = { y: player.y, width: 5, height: 15, type: bulletType, speed: 7 };
        if (player.doubleShot) {
            bullets.push({ ...base, x: player.x + player.width * 0.2 });
            bullets.push({ ...base, x: player.x + player.width * 0.8 - base.width });
        } else {
            bullets.push({ ...base, x: player.x + player.width / 2 - base.width / 2 });
        }
    }
}
function updateBullets() { for (let i = bullets.length - 1; i >= 0; i--) { bullets[i].y -= bullets[i].speed; if (bullets[i].y < 0) bullets.splice(i, 1); } }
function updateEnemies() {
    let hitEdge = false;
    enemies.forEach(e => { e.x += enemyDirection * enemySpeed; if (e.x < 0 || e.x + e.width > canvas.width) hitEdge = true; });
    if (hitEdge) { enemyDirection *= -1; enemies.forEach(e => { e.y += 20; if (e.y + e.height >= player.y) endGame(); }); }
}
function handleEnemyShooting() {
    if (Math.random() < 0.003 + (level * 0.0005) && enemies.length > 0) {
        const shooter = enemies[Math.floor(Math.random() * enemies.length)];
        enemyBullets.push({ x: shooter.x + shooter.width / 2 - 2, y: shooter.y + shooter.height, width: 4, height: 12, speed: 4.5 + level * 0.2 });
    }
}
function updateEnemyBullets() { for (let i = enemyBullets.length - 1; i >= 0; i--) { enemyBullets[i].y += enemyBullets[i].speed; if (enemyBullets[i].y > canvas.height) enemyBullets.splice(i, 1); } }
function spawnPowerUp() {
    if (Math.random() < 0.008 + level * 0.002) {
        const type = ["doubleShot", "wideShip", "piercing", "bomb"][Math.floor(Math.random() * 4)];
        powerUps.push({ x: Math.random() * (canvas.width - 30), y: 0, width: 30, height: 30, type, speed: 5 });
    }
}
function updatePowerUps() { for (let i = powerUps.length - 1; i >= 0; i--) { powerUps[i].y += powerUps[i].speed; if (powerUps[i].y > canvas.height) powerUps.splice(i, 1); } }
function checkCollisions() {
    for (let bIndex = bullets.length - 1; bIndex >= 0; bIndex--) {
        const bullet = bullets[bIndex];
        for (let eIndex = enemies.length - 1; eIndex >= 0; eIndex--) {
            const enemy = enemies[eIndex];
            if (bullet && bullet.x < enemy.x + enemy.width && bullet.x + bullet.width > enemy.x && bullet.y < enemy.y + enemy.height && bullet.y + bullet.height > enemy.y) {
                playSound('explosion'); score += enemy.points; enemies.splice(eIndex, 1);
                if (bullet.type !== 'piercing') { bullets.splice(bIndex, 1); break; }
            }
        }
    }
    if (enemies.length === 0) { level++; enemySpeed += 0.5; createEnemies(); }
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        if (!player.isHit && bullet.x < player.x + player.width && bullet.x + bullet.width > player.x && bullet.y < player.y + player.height && bullet.y + bullet.height > player.y) {
            enemyBullets.splice(i, 1); lives--; playSound('playerHit');
            if (lives > 0) { player.isHit = true; player.hitTimer = Date.now(); } else { endGame(); }
        }
    }
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const p = powerUps[i];
        if (p.x < player.x + player.width && p.x + p.width > player.x && p.y < player.y + player.height && p.y + p.height > player.y) {
            playSound('powerup'); const now = Date.now();
            if (p.type === "doubleShot") { player.doubleShot = true; powerUpTimers.doubleShot = now + POWER_UP_DURATION; }
            if (p.type === "bomb") enemies = [];
            powerUps.splice(i, 1);
        }
    }
}
function updatePowerUpTimers() { if (powerUpTimers.doubleShot && Date.now() > powerUpTimers.doubleShot) player.doubleShot = false; }
function endGame() { playSound('gameOver'); if (checkIfHighScore(score)) { gameState = 'enteringName'; highScoreFormContainer.classList.remove("hidden"); playerNameInput.focus(); } else { gameState = 'gameOver'; } }

// --- Funções de Desenho ---
function drawAndUpdateStars() {
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    stars.forEach(star => {
        star.y += star.speed;
        if (star.y > canvas.height) { star.y = 0; star.x = Math.random() * canvas.width; }
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}
function drawGame() {
    drawAndUpdateStars();
    drawPlayer();
    bullets.forEach(b => { ctx.fillStyle = colors.bulletPlayer; ctx.fillRect(b.x, b.y, b.width, b.height); });
    enemies.forEach(drawEnemy);
    enemyBullets.forEach(b => { ctx.fillStyle = colors.bulletEnemy; ctx.fillRect(b.x, b.y, b.width, b.height); });
    powerUps.forEach(drawPowerUp);
    drawHUD();
}
function drawPlayer() {
    if (player.isHit && Math.floor((Date.now() - player.hitTimer) / 100) % 2 === 0) return;
    ctx.fillStyle = colors.player;
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x, player.y + player.height);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.closePath();
    ctx.fill();
}
function drawEnemy(enemy) {
    ctx.fillStyle = enemy.isSpecial ? colors.enemySpecial : colors.enemy1;
    ctx.beginPath();
    const w = enemy.width, h = enemy.height;
    ctx.moveTo(enemy.x, enemy.y + h * 0.5);
    ctx.lineTo(enemy.x + w * 0.25, enemy.y + h * 0.25);
    ctx.lineTo(enemy.x + w * 0.4, enemy.y);
    ctx.lineTo(enemy.x + w * 0.6, enemy.y);
    ctx.lineTo(enemy.x + w * 0.75, enemy.y + h * 0.25);
    ctx.lineTo(enemy.x + w, enemy.y + h * 0.5);
    ctx.lineTo(enemy.x + w * 0.75, enemy.y + h);
    ctx.lineTo(enemy.x + w * 0.25, enemy.y + h);
    ctx.closePath();
    ctx.fill();
}
function drawPowerUp(p) { ctx.fillStyle = colors.powerup; ctx.fillRect(p.x, p.y, p.width, p.height); }
function drawHUD() {
    ctx.fillStyle = colors.text; ctx.font = '20px Arial'; ctx.textAlign = 'start';
    ctx.fillText(`Pontuação: ${score}`, 10, 25);
    ctx.fillText(`Nível: ${level}`, canvas.width / 2 - 40, 25);
    ctx.textAlign = 'end'; ctx.fillText(`Vidas: ${lives}`, canvas.width - 10, 25);
    ctx.textAlign = 'start';
}

// --- Funções de UI (Menus, Telas) ---
const menuButtons = {
    play: { x: 300, y: 250, width: 200, height: 50, text: 'Jogar' },
    ranking: { x: 300, y: 320, width: 200, height: 50, text: 'Ranking' },
    settings: { x: 300, y: 390, width: 200, height: 50, text: 'Configurações' }
};
const backButton = { x: 300, y: 500, width: 200, height: 50, text: 'Voltar' };

function drawMenu() { drawScreenTemplate('SPACE INVADERS', 150, menuButtons); }
function drawRankingScreen() {
    drawScreenTemplate('Ranking - Top 5', 100, { back: backButton });
    const hs = getHighScores();
    ctx.font = '24px Arial'; ctx.textAlign = 'center';
    if (hs.length === 0) { ctx.fillText('Nenhuma pontuação registrada!', canvas.width / 2, 200); }
    else { hs.forEach((s, i) => ctx.fillText(`${i + 1}. ${s.name.padEnd(5, ' ')} ... ${s.score}`, canvas.width / 2, 180 + i * 40)); }
}
function drawSettingsScreen() {
    drawScreenTemplate('Configurações', 100, { back: backButton });
    ctx.font = '22px Arial'; ctx.textAlign = 'center';
    let y = 180;
    for (const key in volumes) {
        ctx.fillStyle = colors.text;
        ctx.fillText(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${Math.round(volumes[key] * 100)}%`, canvas.width / 2, y);
        drawButton({ x: canvas.width / 2 - 120, y: y - 20, width: 40, height: 30, text: '-' });
        drawButton({ x: canvas.width / 2 + 80, y: y - 20, width: 40, height: 30, text: '+' });
        y += 50;
    }
}
function drawGameOver() {
    drawScreenTemplate('GAME OVER', 150, {
        tryAgain: { x: 300, y: 280, width: 200, height: 50, text: 'Tentar Novamente' },
        ranking: { x: 300, y: 350, width: 200, height: 50, text: 'Ranking' },
        mainMenu: { x: 300, y: 420, width: 200, height: 50, text: 'Menu Principal' }
    });
    ctx.font = '24px Arial'; ctx.textAlign = 'center';
    ctx.fillText(`Sua Pontuação Final: ${score}`, canvas.width / 2, 220);
}
function drawScreenTemplate(title, y, buttons) {
    drawAndUpdateStars();
    ctx.fillStyle = colors.text; ctx.font = '50px Arial'; ctx.textAlign = 'center';
    ctx.fillText(title, canvas.width / 2, y);
    ctx.textAlign = 'start';
    Object.values(buttons).forEach(b => drawButton(b));
}
function drawButton(b) {
    ctx.fillStyle = colors.buttonFill; ctx.strokeStyle = colors.buttonBorder;
    ctx.lineWidth = 2;
    drawRoundedRect(b.x, b.y, b.width, b.height, 15);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = colors.buttonText; ctx.font = `${b.text.length > 2 ? '22' : '30'}px Arial`; ctx.textAlign = 'center';
    ctx.fillText(b.text, b.x + b.width / 2, b.y + b.height / 2 + 8);
    ctx.textAlign = 'start';
}
function drawRoundedRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r); ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r); ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r); ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
}

// --- Lógica de High Score ---
function getHighScores() { return JSON.parse(localStorage.getItem("highScores")) || []; }
function checkIfHighScore(s) { const hs = getHighScores(); return s > 0 && (hs.length < 5 || s > hs[hs.length - 1].score); }
function saveHighScore(name, newScore) {
    const hs = getHighScores(); hs.push({ name, score: newScore });
    hs.sort((a, b) => b.score - a.score);
    localStorage.setItem("highScores", JSON.stringify(hs.slice(0, 5)));
}

// --- Event Listeners ---
document.addEventListener("keydown", (e) => { keys[e.key] = true; if (!audioEnabled) audioEnabled = true; });
document.addEventListener("keyup", (e) => { keys[e.key] = false; });
highScoreForm.addEventListener("submit", (e) => {
    e.preventDefault();
    saveHighScore(playerNameInput.value.toUpperCase().slice(0, 5) || "AAA", score);
    highScoreFormContainer.classList.add("hidden");
    gameState = 'gameOver';
});
canvas.addEventListener('click', (e) => {
    const mouse = { x: e.clientX - canvas.getBoundingClientRect().left, y: e.clientY - canvas.getBoundingClientRect().top };
    const isInside = (p, b) => p.x > b.x && p.x < b.x + b.width && p.y > b.y && p.y < b.y + b.height;

    if (gameState === 'menu') {
        if (isInside(mouse, menuButtons.play)) resetGame();
        if (isInside(mouse, menuButtons.ranking)) gameState = 'ranking';
        if (isInside(mouse, menuButtons.settings)) gameState = 'settings';
    } else if (gameState === 'ranking' && isInside(mouse, backButton)) {
        gameState = 'menu';
    } else if (gameState === 'settings') {
        if (isInside(mouse, backButton)) gameState = 'menu';
        let y = 180;
        for (const key in volumes) {
            if (isInside(mouse, { x: canvas.width / 2 - 120, y: y - 20, width: 40, height: 30 })) volumes[key] = Math.max(0, volumes[key] - 0.1);
            if (isInside(mouse, { x: canvas.width / 2 + 80, y: y - 20, width: 40, height: 30 })) volumes[key] = Math.min(1, volumes[key] + 0.1);
            y += 50;
        }
        localStorage.setItem('gameVolumes', JSON.stringify(volumes));
    } else if (gameState === 'gameOver') {
        if (isInside(mouse, { x: 300, y: 280, width: 200, height: 50 })) resetGame();
        if (isInside(mouse, { x: 300, y: 350, width: 200, height: 50 })) gameState = 'ranking';
        if (isInside(mouse, { x: 300, y: 420, width: 200, height: 50 })) gameState = 'menu';
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
        case 'enteringName': updateGame(); drawGame(); break;
    }
    requestAnimationFrame(gameLoop);
}

// --- Início do Jogo ---
createStars(200);
initializePlayer();
gameLoop();