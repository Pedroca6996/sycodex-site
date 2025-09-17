// =================================================================================
// Versão 8.3 - The "Neon" Revolution
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

// --- Configurações Visuais ---
const colors = {
    background: 'rgba(10, 4, 13, 0.95)',
    player: '#39a34a',
    enemy1: '#e53d00',
    enemySpecial: '#ffd300',
    bulletPlayer: '#96e6b3',
    bulletEnemy: '#e01e5a',
    text: '#f0f6fc',
    glow: '#39a34a',
    powerup: '#a371f7'
};

// --- Fundo Estrelado ---
let stars = [];
function createStars(count) {
    for (let i = 0; i < count; i++) {
        stars.push({
            x: Math.random() * bgCanvas.width,
            y: Math.random() * bgCanvas.height,
            radius: Math.random() * 1.5 + 0.5,
            speed: Math.random() * 0.4 + 0.1
        });
    }
}
function drawAndUpdateStars() {
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    bgCtx.fillStyle = 'white';
    stars.forEach(star => {
        star.y += star.speed;
        if (star.y > bgCanvas.height) { star.y = 0; star.x = Math.random() * bgCanvas.width; }
        bgCtx.beginPath();
        bgCtx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        bgCtx.fill();
    });
}

// --- Áudio ---
// (Lógica de áudio permanece a mesma da versão anterior)
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
const keys = {};

// --- Funções de Inicialização e Reset ---
function initializePlayer() {
    player = {
        x: gameCanvas.width / 2 - 25, y: gameCanvas.height - 70, width: 50, height: 25,
        speed: 5, doubleShot: false, isHit: false, hitTimer: 0
    };
}
function resetGame() {
    score = 0; lives = 3; level = 1; enemySpeed = 1.5;
    bullets = []; enemyBullets = []; powerUps = [];
    initializePlayer();
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

// --- Lógica de Update (Jogo) ---
function updateGame() {
    handlePlayerMovement();
    handleShooting();
    updateBullets();
    updateEnemies();
    handleEnemyShooting();
    updateEnemyBullets();
    checkCollisions();
    // (Outras lógicas de update como powerups podem ser adicionadas aqui)
    if (player.isHit && Date.now() - player.hitTimer > 2000) player.isHit = false;
}
function handlePlayerMovement() { if (keys["ArrowLeft"] && player.x > 0) player.x -= player.speed; if (keys["ArrowRight"] && player.x + player.width < gameCanvas.width) player.x += player.speed; }
function handleShooting() { if (keys[" "] && Date.now() - lastShotTime > shotInterval) { playSound('shoot'); lastShotTime = Date.now(); const base = { y: player.y, width: 5, height: 15, speed: 7 }; bullets.push({ ...base, x: player.x + player.width / 2 - base.width / 2 }); } }
function updateBullets() { for (let i = bullets.length - 1; i >= 0; i--) { bullets[i].y -= bullets[i].speed; if (bullets[i].y < 0) bullets.splice(i, 1); } }
function updateEnemies() { let hitEdge = false; enemies.forEach(e => { e.x += enemyDirection * enemySpeed; if (e.x < 0 || e.x + e.width > gameCanvas.width) hitEdge = true; }); if (hitEdge) { enemyDirection *= -1; enemies.forEach(e => { e.y += 20; if (e.y + e.height >= player.y) endGame(); }); } }
function handleEnemyShooting() { if (Math.random() < 0.003 + (level * 0.0005) && enemies.length > 0) { const shooter = enemies[Math.floor(Math.random() * enemies.length)]; enemyBullets.push({ x: shooter.x + shooter.width / 2 - 2, y: shooter.y + shooter.height, width: 4, height: 12, speed: 4.5 + level * 0.2 }); } }
function updateEnemyBullets() { for (let i = enemyBullets.length - 1; i >= 0; i--) { enemyBullets[i].y += enemyBullets[i].speed; if (enemyBullets[i].y > gameCanvas.height) enemyBullets.splice(i, 1); } }
function checkCollisions() {
    for (let bIndex = bullets.length - 1; bIndex >= 0; bIndex--) {
        for (let eIndex = enemies.length - 1; eIndex >= 0; eIndex--) {
            const b = bullets[bIndex]; const e = enemies[eIndex];
            if (b && b.x < e.x + e.width && b.x + b.width > e.x && b.y < e.y + e.height && b.y + b.height > e.y) {
                playSound('explosion'); score += e.points; enemies.splice(eIndex, 1); bullets.splice(bIndex, 1); break;
            }
        }
    }
    if (enemies.length === 0) { level++; enemySpeed += 0.5; createEnemies(); }
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const b = enemyBullets[i];
        if (!player.isHit && b.x < player.x + player.width && b.x + b.width > player.x && b.y < player.y + player.height && b.y + b.height > player.y) {
            enemyBullets.splice(i, 1); lives--; playSound('playerHit');
            if (lives > 0) { player.isHit = true; player.hitTimer = Date.now(); } else { endGame(); }
        }
    }
}
function endGame() { playSound('gameOver'); if (checkIfHighScore(score)) { gameState = 'enteringName'; highScoreFormContainer.classList.remove("hidden"); playerNameInput.focus(); } else { gameState = 'gameOver'; } }

// --- Funções de Desenho ---
function drawGame() {
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
    drawPlayer();
    bullets.forEach(b => { ctx.fillStyle = colors.bulletPlayer; ctx.fillRect(b.x, b.y, b.width, b.height); });
    enemies.forEach(drawEnemy);
    enemyBullets.forEach(b => { ctx.fillStyle = colors.bulletEnemy; ctx.fillRect(b.x, b.y, b.width, b.height); });
    drawHUD();
}
function drawPlayer() {
    if (player.isHit && Math.floor((Date.now() - player.hitTimer) / 100) % 2 === 0) return;
    ctx.fillStyle = colors.player;
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x, player.y + player.height);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.closePath();
    ctx.fill();
    resetShadow();
}
function drawEnemy(enemy) {
    ctx.fillStyle = enemy.isSpecial ? colors.enemySpecial : colors.enemy1;
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    const w = enemy.width, h = enemy.height;
    ctx.moveTo(enemy.x, enemy.y + h * 0.5); ctx.lineTo(enemy.x + w * 0.25, enemy.y + h * 0.25);
    ctx.lineTo(enemy.x + w * 0.4, enemy.y); ctx.lineTo(enemy.x + w * 0.6, enemy.y);
    ctx.lineTo(enemy.x + w * 0.75, enemy.y + h * 0.25); ctx.lineTo(enemy.x + w, enemy.y + h * 0.5);
    ctx.lineTo(enemy.x + w * 0.75, enemy.y + h); ctx.lineTo(enemy.x + w * 0.25, enemy.y + h);
    ctx.closePath();
    ctx.fill();
    resetShadow();
}
function drawHUD() {
    ctx.fillStyle = colors.text; ctx.font = `20px "Orbitron", sans-serif`; ctx.textAlign = 'start';
    ctx.fillText(`PONTUAÇÃO: ${score}`, 10, 30);
    ctx.textAlign = 'center'; ctx.fillText(`NÍVEL: ${level}`, gameCanvas.width / 2, 30);
    ctx.textAlign = 'end'; ctx.fillText(`VIDAS: ${lives}`, gameCanvas.width - 10, 30);
    ctx.textAlign = 'start';
}
function resetShadow() { ctx.shadowBlur = 0; }

// --- Funções de UI (Menus, Telas) ---
const menuButtons = {
    play: { x: 300, y: 300, width: 200, height: 50, text: 'JOGAR' },
    ranking: { x: 300, y: 370, width: 200, height: 50, text: 'RANKING' },
    settings: { x: 300, y: 440, width: 200, height: 50, text: 'OPÇÕES' }
};
const backButton = { x: 300, y: 500, width: 200, height: 50, text: 'VOLTAR' };

function drawMenu() { drawScreenTemplate('SPACE INVADERS', 180, menuButtons, 80); }
function drawRankingScreen() {
    drawScreenTemplate('RANKING', 100, { back: backButton }, 50);
    const hs = getHighScores();
    ctx.font = `24px "Orbitron", sans-serif`; ctx.textAlign = 'center';
    if (hs.length === 0) { ctx.fillText('NENHUM RECORDE', gameCanvas.width / 2, 200); }
    else { hs.forEach((s, i) => ctx.fillText(`${i + 1}. ${s.name.padEnd(5, ' ')} - ${s.score}`, gameCanvas.width / 2, 180 + i * 40)); }
}
function drawSettingsScreen() { /*...*/ } // Pode ser implementado como o ranking
function drawGameOver() {
    drawScreenTemplate('FIM DE JOGO', 150, {
        tryAgain: { x: 300, y: 280, width: 200, height: 50, text: 'JOGAR NOVAMENTE' },
        ranking: { x: 300, y: 350, width: 200, height: 50, text: 'RANKING' },
        mainMenu: { x: 300, y: 420, width: 200, height: 50, text: 'MENU' }
    }, 60);
    ctx.font = `24px "Orbitron", sans-serif`; ctx.textAlign = 'center';
    ctx.fillText(`PONTUAÇÃO FINAL: ${score}`, gameCanvas.width / 2, 220);
}

function drawScreenTemplate(title, y, buttons, fontSize) {
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
    setNeonStyle(colors.text, 15);
    ctx.font = `${fontSize}px "Orbitron", sans-serif`; ctx.textAlign = 'center';
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
    ctx.font = `22px "Orbitron", sans-serif`; ctx.textAlign = 'center';
    ctx.fillText(b.text, b.x + b.width / 2, b.y + b.height / 2 + 8);
    resetShadow();
}

function setNeonStyle(color, blur) {
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
}

function drawRoundedRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r); ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r); ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
}

// --- Lógica de High Score ---
function getHighScores() { return JSON.parse(localStorage.getItem("highScores")) || []; }
function checkIfHighScore(s) { const hs = getHighScores(); return s > 0 && (hs.length < 5 || s > hs[hs.length - 1].score); }
function saveHighScore(name, newScore) { const hs = getHighScores(); hs.push({ name, score: newScore }); hs.sort((a, b) => b.score - a.score); localStorage.setItem("highScores", JSON.stringify(hs.slice(0, 5))); }

// --- Event Listeners ---
document.addEventListener("keydown", (e) => { keys[e.key] = true; if (!audioEnabled) audioEnabled = true; });
document.addEventListener("keyup", (e) => { keys[e.key] = false; });
highScoreForm.addEventListener("submit", (e) => { e.preventDefault(); saveHighScore(playerNameInput.value.toUpperCase().slice(0, 5) || "AAA", score); highScoreFormContainer.classList.add("hidden"); gameState = 'gameOver'; });
canvas.addEventListener('click', (e) => {
    const mouse = { x: e.clientX - gameCanvas.getBoundingClientRect().left, y: e.clientY - gameCanvas.getBoundingClientRect().top };
    const isInside = (p, b) => p.x > b.x && p.x < b.x + b.width && p.y > b.y && p.y < b.y + b.height;

    if (gameState === 'menu') {
        if (isInside(mouse, menuButtons.play)) resetGame();
        if (isInside(mouse, menuButtons.ranking)) gameState = 'ranking';
        if (isInside(mouse, menuButtons.settings)) gameState = 'settings';
    } else if (gameState === 'ranking' && isInside(mouse, backButton)) {
        gameState = 'menu';
    } else if (gameState === 'settings') { /* Implementar aqui */ if (isInside(mouse, backButton)) gameState = 'menu'; }
    else if (gameState === 'gameOver') {
        if (isInside(mouse, { x: 300, y: 280, width: 200, height: 50 })) resetGame();
        if (isInside(mouse, { x: 300, y: 350, width: 200, height: 50 })) gameState = 'ranking';
        if (isInside(mouse, { x: 300, y: 420, width: 200, height: 50 })) gameState = 'menu';
    }
});

// --- Game Loop Principal ---
function gameLoop() {
    // O canvas de fundo é atualizado separadamente
    drawAndUpdateStars();
    
    // O canvas do jogo é limpo e desenhado conforme o estado
    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    switch (gameState) {
        case 'menu': drawMenu(); break;
        case 'playing': updateGame(); drawGame(); break;
        case 'ranking': drawRankingScreen(); break;
        case 'settings': drawSettingsScreen(); break;
        case 'gameOver': drawGameOver(); break;
        case 'enteringName': drawGame(); break; // BUG CORRIGIDO AQUI
    }
    
    requestAnimationFrame(gameLoop);
}

// --- Início do Jogo ---
createStars(300); // Cria mais estrelas para o fundo maior
initializePlayer();
gameLoop();