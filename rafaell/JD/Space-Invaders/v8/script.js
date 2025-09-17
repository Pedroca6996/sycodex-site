// =================================================================================
// Versão 8.6 - O CÓDIGO COMPLETO (FINALMENTE)
// =================================================================================
// NOTA: Este script assume que seu HTML tem <canvas id="backgroundCanvas"></canvas>
// e <canvas id="gameCanvas"></canvas>, como discutido anteriormente.
// =================================================================================

// --- Elementos do Canvas e HTML ---
const gameCanvas = document.getElementById("gameCanvas");
const ctx = gameCanvas.getContext("2d");
const bgCanvas = document.getElementById("backgroundCanvas");
const bgCtx = bgCanvas.getContext('2d');
const highScoreFormContainer = document.getElementById("highScoreFormContainer");
const highScoreForm = document.getElementById("highScoreForm");
const playerNameInput = document.getElementById("playerName");

// Ajusta o tamanho do canvas de fundo
bgCanvas.width = window.innerWidth;
bgCanvas.height = window.innerHeight;

// --- Estado do Jogo ---
let gameState = 'menu';
let audioEnabled = false;
const FONT_FAMILY = '"Orbitron", sans-serif';

// --- Configurações Visuais ---
const colors = {
    background: 'rgba(10, 4, 13, 0.85)',
    player: '#00ff7f',
    enemy1: '#ff41be',
    enemySpecial: '#ffd300',
    bulletPlayer: '#96e6b3',
    bulletEnemy: '#ff41be',
    text: '#f0f6fc',
    glow: '#00ff7f',
    powerup: '#a371f7'
};

// --- Fundo Estrelado ---
let stars = [];
function createStars(count) { for (let i = 0; i < count; i++) { stars.push({ x: Math.random() * bgCanvas.width, y: Math.random() * bgCanvas.height, radius: Math.random() * 1.5 + 0.5, speed: Math.random() * 0.4 + 0.1 }); } }
function drawAndUpdateStars() { bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height); bgCtx.fillStyle = '#FFFFFF'; stars.forEach(star => { star.y += star.speed; if (star.y > bgCanvas.height) { star.y = 0; star.x = Math.random() * bgCanvas.width; } bgCtx.beginPath(); bgCtx.arc(star.x, star.y, star.radius, 0, Math.PI * 2); bgCtx.fill(); }); }

// --- Áudio ---
const sounds = { shoot: new Audio("../sounds/shoot.mp3"), explosion: new Audio("../sounds/explosion.mp3"), powerup: new Audio("../sounds/powerup.mp3"), gameOver: new Audio("../sounds/game-over.mp3"), playerHit: new Audio("../sounds/explosion.mp3") };
let volumes = JSON.parse(localStorage.getItem('gameVolumes')) || { shoot: 0.4, explosion: 0.5, powerup: 0.7, gameOver: 0.6, playerHit: 0.6 };
function playSound(type) { if (!audioEnabled) return; const sound = sounds[type]; sound.currentTime = 0; sound.volume = volumes[type]; sound.play().catch(e => {}); }

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
function initializePlayer() { player = { x: gameCanvas.width / 2 - 25, y: gameCanvas.height - 70, width: 50, height: 25, baseWidth: 50, speed: 5, doubleShot: false, isHit: false, hitTimer: 0 }; }
function resetGame() { score = 0; lives = 3; level = 1; enemySpeed = 1.5; bullets = []; enemyBullets = []; enemies = []; powerUps = []; initializePlayer(); powerUpTimers = { doubleShot: 0, wideShip: 0, explosive: 0, piercing: 0 }; bulletType = "normal"; highScoreFormContainer.classList.add("hidden"); createEnemies(); gameState = 'playing'; }
function createEnemies() { const eRows = 4, eCols = 10, eSize = 35; for (let r = 0; r < eRows; r++) { for (let c = 0; c < eCols; c++) { const isSpecial = Math.random() < 0.1; enemies.push({ x: c * (eSize + 15) + 60, y: r * (eSize + 15) + 50, width: eSize, height: eSize, isSpecial: isSpecial, points: isSpecial ? 500 : 100 }); } } }

// --- Lógica de Update (Jogo) ---
function updateGame() { handlePlayerMovement(); handleShooting(); updateBullets(); updateEnemies(); handleEnemyShooting(); updateEnemyBullets(); spawnPowerUp(); updatePowerUps(); checkCollisions(); updatePowerUpTimers(); if (player.isHit && Date.now() - player.hitTimer > 2000) player.isHit = false; }
function handlePlayerMovement() { if (keys["ArrowLeft"] && player.x > 0) player.x -= player.speed; if (keys["ArrowRight"] && player.x + player.width < gameCanvas.width) player.x += player.speed; }
function handleShooting() { if (keys[" "] && Date.now() - lastShotTime > shotInterval) { shootBullet(); lastShotTime = Date.now(); } }
function shootBullet() {
    playSound('shoot');
    const base = {
        y: player.y,
        width: 5,
        height: 15,
        type: bulletType,
        speed: bulletType === "piercing" ? 9 : 7
    };
    if (player.doubleShot) {
        bullets.push({ ...base, x: player.x + player.width * 0.2 });
        bullets.push({ ...base, x: player.x + player.width * 0.8 - base.width });
    } else {
        bullets.push({ ...base, x: player.x + player.width / 2 - base.width / 2 });
    }
}
function updateBullets() { for (let i = bullets.length - 1; i >= 0; i--) { bullets[i].y -= bullets[i].speed; if (bullets[i].y < 0) bullets.splice(i, 1); } }
function updateEnemies() { let hitEdge = false; enemies.forEach(e => { e.x += enemyDirection * enemySpeed; if (e.x < 0 || e.x + e.width > gameCanvas.width) hitEdge = true; }); if (hitEdge) { enemyDirection *= -1; enemies.forEach(e => { e.y += 20; if (e.y + e.height >= player.y) endGame(); }); } }
function handleEnemyShooting() { if (Math.random() < 0.003 + (level * 0.0005) && enemies.length > 0) { const shooter = enemies[Math.floor(Math.random() * enemies.length)]; enemyBullets.push({ x: shooter.x + shooter.width / 2 - 2, y: shooter.y + shooter.height, width: 4, height: 12, speed: 4.5 + level * 0.2 }); } }
function updateEnemyBullets() { for (let i = enemyBullets.length - 1; i >= 0; i--) { enemyBullets[i].y += enemyBullets[i].speed; if (enemyBullets[i].y > gameCanvas.height) enemyBullets.splice(i, 1); } }

function spawnPowerUp() {
    if (Math.random() < 0.01 + level * 0.002) {
        const types = ["doubleShot", "wideShip", "piercing", "bomb"];
        const type = types[Math.floor(Math.random() * types.length)];
        powerUps.push({
            x: Math.random() * (gameCanvas.width - 30),
            y: 0,
            width: 30,
            height: 30,
            type,
            speed: 5
        });
    }
}
function updatePowerUps() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        powerUps[i].y += powerUps[i].speed;
        if (powerUps[i].y > gameCanvas.height) {
            powerUps.splice(i, 1);
        }
    }
}
function checkCollisions() {
    // Tiros do jogador vs inimigos
    for (let bIndex = bullets.length - 1; bIndex >= 0; bIndex--) {
        const b = bullets[bIndex];
        for (let eIndex = enemies.length - 1; eIndex >= 0; eIndex--) {
            const e = enemies[eIndex];
            if (b && e && b.x < e.x + e.width && b.x + b.width > e.x && b.y < e.y + e.height && b.y + b.height > e.y) {
                playSound('explosion');
                score += e.points;
                enemies.splice(eIndex, 1);
                if (b.type !== 'piercing') {
                    bullets.splice(bIndex, 1);
                    break; 
                }
            }
        }
    }

    if (enemies.length === 0 && gameState === 'playing') {
        level++;
        enemySpeed += 0.5;
        createEnemies();
    }

    // Tiros inimigos vs jogador
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const b = enemyBullets[i];
        if (!player.isHit && b.x < player.x + player.width && b.x + b.width > player.x && b.y < player.y + player.height && b.y + b.height > player.y) {
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
    if (type === "doubleShot") {
        player.doubleShot = true;
        powerUpTimers.doubleShot = now + POWER_UP_DURATION;
    }
    if (type === "wideShip") {
        player.width = player.baseWidth + 20;
        powerUpTimers.wideShip = now + POWER_UP_DURATION;
    }
    if (type === "piercing") {
        bulletType = "piercing";
        powerUpTimers.piercing = now + POWER_UP_DURATION;
    }
    if (type === "bomb") {
        enemies.forEach(e => score += e.points);
        enemies = [];
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
    if (powerUpTimers.piercing && now > powerUpTimers.piercing) {
        bulletType = "normal";
        powerUpTimers.piercing = 0;
    }
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
function setNeonStyle(color, blur = 10) { ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = blur; }
function resetShadow() { ctx.shadowBlur = 0; }
function drawGame() {
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
    drawPlayer();
    bullets.forEach(b => { setNeonStyle(colors.bulletPlayer, 5); ctx.fillRect(b.x, b.y, b.width, b.height); resetShadow(); });
    enemies.forEach(drawEnemy);
    enemyBullets.forEach(b => { setNeonStyle(colors.bulletEnemy, 5); ctx.fillRect(b.x, b.y, b.width, b.height); resetShadow(); });
    powerUps.forEach(drawPowerUp);
    drawHUD();
}
function drawPlayer() { if (player.isHit && Math.floor((Date.now() - player.hitTimer) / 100) % 2 === 0) return; setNeonStyle(colors.player); ctx.beginPath(); ctx.moveTo(player.x + player.width / 2, player.y); ctx.lineTo(player.x, player.y + player.height); ctx.lineTo(player.x + player.width, player.y + player.height); ctx.closePath(); ctx.fill(); resetShadow(); }
function drawEnemy(e) { setNeonStyle(e.isSpecial ? colors.enemySpecial : colors.enemy1, 8); const w = e.width, h = e.height; ctx.beginPath(); ctx.moveTo(e.x, e.y + h * 0.5); ctx.lineTo(e.x + w * 0.25, e.y + h * 0.25); ctx.lineTo(e.x + w * 0.4, e.y); ctx.lineTo(e.x + w * 0.6, e.y); ctx.lineTo(e.x + w * 0.75, e.y + h * 0.25); ctx.lineTo(e.x + w, e.y + h * 0.5); ctx.lineTo(e.x + w * 0.75, e.y + h); ctx.lineTo(e.x + w * 0.25, e.y + h); ctx.closePath(); ctx.fill(); resetShadow(); }
function drawPowerUp(p) {
    setNeonStyle(colors.powerup);
    ctx.beginPath();
    ctx.arc(p.x + p.width / 2, p.y + p.height / 2, p.width / 2, 0, Math.PI * 2);
    ctx.fill();
    resetShadow();
    ctx.fillStyle = 'white';
    ctx.font = `bold 12px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    let text = '?';
    if (p.type === 'doubleShot') text = '||';
    if (p.type === 'wideShip') text = '<->';
    if (p.type === 'piercing') text = '->';
    if (p.type === 'bomb') text = 'B';
    ctx.fillText(text, p.x + p.width / 2, p.y + p.height / 2 + 5);
    ctx.textAlign = 'start';
}
function drawHUD() { setNeonStyle(colors.text, 5); ctx.font = `20px ${FONT_FAMILY}`; ctx.textAlign = 'start'; ctx.fillText(`PONTUAÇÃO: ${score}`, 10, 30); ctx.textAlign = 'center'; ctx.fillText(`NÍVEL: ${level}`, gameCanvas.width / 2, 30); ctx.textAlign = 'end'; ctx.fillText(`VIDAS: ${lives}`, gameCanvas.width - 10, 30); resetShadow(); }

// --- Funções de UI (Menus, Telas) ---
const menuButtons = { play: { x: 300, y: 300, width: 200, height: 50, text: 'JOGAR' }, ranking: { x: 300, y: 370, width: 200, height: 50, text: 'RANKING' }, settings: { x: 300, y: 440, width: 200, height: 50, text: 'OPÇÕES' } };
const backButton = { x: 300, y: 500, width: 200, height: 50, text: 'VOLTAR' };
let settingsButtons = {};

function drawMenu() { drawScreenTemplate('SPACE INVADERS', 180, menuButtons, 80); }
function drawRankingScreen() {
    drawScreenTemplate('RANKING', 100, { back: backButton }, 50);
    const hs = getHighScores();
    ctx.font = `24px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    setNeonStyle(colors.text, 5);
    if (hs.length === 0) { ctx.fillText('NENHUM RECORDE', gameCanvas.width / 2, 200); }
    else { hs.forEach((s, i) => ctx.fillText(`${i + 1}. ${s.name.padEnd(5, ' ')} - ${s.score}`, gameCanvas.width / 2, 180 + i * 40)); }
    resetShadow();
}
function drawSettingsScreen() {
    drawScreenTemplate('OPÇÕES', 100, { back: backButton }, 50);
    ctx.font = `22px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    settingsButtons = {};
    let y = 180;
    for (const key in volumes) {
        setNeonStyle(colors.text, 5);
        ctx.fillText(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${Math.round(volumes[key] * 100)}%`, gameCanvas.width / 2, y);
        resetShadow();
        const minusBtn = { x: gameCanvas.width / 2 - 140, y: y - 25, width: 50, height: 40, text: '-' };
        const plusBtn = { x: gameCanvas.width / 2 + 90, y: y - 25, width: 50, height: 40, text: '+' };
        settingsButtons[`minus_${key}`] = minusBtn;
        settingsButtons[`plus_${key}`] = plusBtn;
        drawButton(minusBtn);
        drawButton(plusBtn);
        y += 60;
    }
}
function drawGameOver() {
    const gameOverButtons = { tryAgain: { x: 300, y: 280, width: 200, height: 50, text: 'JOGAR NOVAMENTE' }, ranking: { x: 300, y: 350, width: 200, height: 50, text: 'RANKING' }, mainMenu: { x: 300, y: 420, width: 200, height: 50, text: 'MENU' } };
    drawScreenTemplate('FIM DE JOGO', 150, gameOverButtons, 60);
    setNeonStyle(colors.text, 5);
    ctx.font = `24px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.fillText(`PONTUAÇÃO FINAL: ${score}`, gameCanvas.width / 2, 220);
    resetShadow();
}
function drawScreenTemplate(title, y, buttons, fontSize) {
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
    setNeonStyle(colors.glow, 15);
    ctx.font = `bold ${fontSize}px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.fillText(title, gameCanvas.width / 2, y);
    resetShadow();
    Object.values(buttons).forEach(b => drawButton(b));
}
function drawButton(b) {
    setNeonStyle(colors.glow, 10);
    ctx.strokeStyle = colors.glow;
    ctx.lineWidth = 2;
    drawRoundedRect(b.x, b.y, b.width, b.height, 10);
    ctx.stroke();
    ctx.font = `bold ${b.text.length > 10 ? '16' : '18'}px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.fillText(b.text, b.x + b.width / 2, b.y + b.height / 2 + 8);
    resetShadow();
}
function drawRoundedRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r); ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r); ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r); ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath(); }

// --- Lógica de High Score ---
function getHighScores() { return JSON.parse(localStorage.getItem("highScores")) || []; }
function checkIfHighScore(s) { const hs = getHighScores(); return s > 0 && (hs.length < 5 || s > hs[hs.length - 1].score); }
function saveHighScore(name, newScore) { const hs = getHighScores(); hs.push({ name, score: newScore }); hs.sort((a, b) => b.score - a.score); localStorage.setItem("highScores", JSON.stringify(hs.slice(0, 5))); }

// --- Event Listeners ---
document.addEventListener("keydown", (e) => { keys[e.key] = true; if (!audioEnabled) audioEnabled = true; });
document.addEventListener("keyup", (e) => { keys[e.key] = false; });
highScoreForm.addEventListener("submit", (e) => { e.preventDefault(); saveHighScore(playerNameInput.value.toUpperCase().slice(0, 5) || "AAA", score); highScoreFormContainer.classList.add("hidden"); gameState = 'gameOver'; });
gameCanvas.addEventListener('click', (e) => {
    const mouse = { x: e.clientX - gameCanvas.getBoundingClientRect().left, y: e.clientY - gameCanvas.getBoundingClientRect().top };
    const isInside = (p, b) => p.x > b.x && p.x < b.x + b.width && p.y > b.y && p.y < b.y + b.height;
    if (gameState === 'menu') { if (isInside(mouse, menuButtons.play)) resetGame(); if (isInside(mouse, menuButtons.ranking)) gameState = 'ranking'; if (isInside(mouse, menuButtons.settings)) gameState = 'settings'; }
    else if (gameState === 'ranking') { if (isInside(mouse, backButton)) gameState = 'menu'; }
    else if (gameState === 'settings') { if (isInside(mouse, backButton)) gameState = 'menu'; for (const key in settingsButtons) { if (isInside(mouse, settingsButtons[key])) { const [action, volumeType] = key.split('_'); if (action === 'minus') volumes[volumeType] = Math.max(0, volumes[volumeType] - 0.1); if (action === 'plus') volumes[volumeType] = Math.min(1, volumes[volumeType] + 0.1); volumes[volumeType] = parseFloat(volumes[volumeType].toFixed(1)); } } localStorage.setItem('gameVolumes', JSON.stringify(volumes)); }
    else if (gameState === 'gameOver') { const btns = { tryAgain: { x: 300, y: 280, width: 200, height: 50 }, ranking: { x: 300, y: 350, width: 200, height: 50 }, mainMenu: { x: 300, y: 420, width: 200, height: 50 } }; if (isInside(mouse, btns.tryAgain)) resetGame(); if (isInside(mouse, btns.ranking)) gameState = 'ranking'; if (isInside(mouse, btns.mainMenu)) gameState = 'menu'; }
});

// --- Game Loop Principal ---
async function main() {
    await document.fonts.load(`1em ${FONT_FAMILY}`);
    function gameLoop() {
        drawAndUpdateStars();
        ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
        switch (gameState) {
            case 'menu': drawMenu(); break;
            case 'playing': updateGame(); drawGame(); break;
            case 'ranking': drawRankingScreen(); break;
            case 'settings': drawSettingsScreen(); break;
            case 'gameOver': drawGameOver(); break;
            case 'enteringName': drawGame(); break;
        }
        requestAnimationFrame(gameLoop);
    }
    createStars(300);
    initializePlayer();
    gameLoop();
}

main(); // Inicia o jogo