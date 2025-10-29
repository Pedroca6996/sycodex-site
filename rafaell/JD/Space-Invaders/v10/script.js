// =================================================================================
// Versão 9 Mobile - Space Invaders
// =================================================================================

// --- Elementos do Canvas e HTML --- (sem alterações)
const gameCanvas = document.getElementById("gameCanvas");
const ctx = gameCanvas.getContext("2d");
const bgCanvas = document.getElementById("backgroundCanvas");
const bgCtx = bgCanvas.getContext('2d');
const highScoreFormContainer = document.getElementById("highScoreFormContainer");
const highScoreForm = document.getElementById("highScoreForm");
const playerNameInput = document.getElementById("playerName");

bgCanvas.width = window.innerWidth;
bgCanvas.height = window.innerHeight;


// --- Estado do Jogo --- (sem alterações)
let gameState = 'menu';
let audioEnabled = false;
const FONT_FAMILY = '"Orbitron", sans-serif';

// --- Configurações Visuais --- (sem alterações)
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

// --- Sprites Pré-renderizados --- (sem alterações)
const sprites = {};

// --- Fundo Estrelado --- (sem alterações)
let stars = [];
function createStars(count) { 
    for (let i = 0; i < count; i++) { 
        stars.push({ 
            x: Math.random() * bgCanvas.width, y: Math.random() * bgCanvas.height, radius: Math.random() * 1.5 + 0.5, speed: Math.random() * 0.4 + 0.1 
        }); 
    } 
}
function drawAndUpdateStars() { 
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height); 
    bgCtx.fillStyle = '#FFFFFF'; 
    stars.forEach(star => { 
        star.y += star.speed; if (star.y > bgCanvas.height) { 
            star.y = 0; 
            star.x = Math.random() * bgCanvas.width; 
        } bgCtx.beginPath(); 
        bgCtx.arc(star.x, star.y, star.radius, 0, Math.PI * 2); 
        bgCtx.fill(); 
    }); 
}

// --- Áudio --- (sem alterações, incluindo preloadAudio)
const sounds = { 
    shoot: new Audio("../sounds/shoot.mp3"), 
    explosion: new Audio("../sounds/explosion.mp3"), 
    powerup: new Audio("../sounds/powerup.mp3"), 
    gameOver: new Audio("../sounds/game-over.mp3"), 
    playerHit: new Audio("../sounds/explosion.mp3") 
};
let volumes = JSON.parse(localStorage.getItem('gameVolumes')) || { 
    shoot: 0.4, 
    explosion: 0.5, 
    powerup: 0.7, 
    gameOver: 0.6, 
    playerHit: 0.6 
};
function preloadAudio() {
    console.log("Iniciando pré-carregamento de áudio...");
    const promises = Object.values(sounds).map(sound => {
        return new Promise((resolve) => {
            // O evento 'canplaythrough' é disparado quando o browser pode tocar o som até o fim
            sound.addEventListener('canplaythrough', resolve, { once: true });
        });
    });

    return Promise.all(promises).then(() => {
        console.log("Áudio pré-carregado com sucesso!");
    });
}
function playSound(type) { 
    if (!audioEnabled) return; 
    const sound = sounds[type]; 
    sound.currentTime = 0; 
    sound.volume = volumes[type]; 
    sound.play().catch(e => {}); 
}

// --- Entidades e Variáveis do Jogo --- (sem alterações)
let player;
let bullets = [], enemyBullets = [], enemies = [], powerUps = [];
let score = 0, lives = 2, level = 1, enemyDirection = 1, enemySpeed = 1.5, lastShotTime = 0;
const shotInterval = 500;
let bulletType = "normal";
let powerUpTimers = {};
const POWER_UP_DURATION = 5000;
const keys = {};
const MAX_POWERUPS_ON_SCREEN = 4;
let uiActionInProgress = false;
let nextLifeScore = 1500;
let hoveredButton = null;

// --- NOVAS: Variáveis de Controle por Toque ---
let touchLeft = false;  // Indica se a metade esquerda está sendo tocada
let touchRight = false; // Indica se a metade direita está sendo tocada
let touchTap = false;   // Indica se ocorreu um toque rápido (tap)

// --- Funções de Inicialização e Reset --- (sem alterações)
function initializePlayer() { 
    player = { 
        x: gameCanvas.width / 2 - 25, y: gameCanvas.height - 70, width: 50, height: 25, baseWidth: 50, speed: 5, doubleShot: false, isHit: false, hitTimer: 0 
    }; 
}
function resetGame() { 
    score = 0; 
    lives = 2; 
    level = 1; 
    enemySpeed = 1.5; 
    nextLifeScore = 1000; 
    bullets = []; 
    enemyBullets = []; 
    enemies = []; 
    powerUps = []; 
    initializePlayer(); 
    powerUpTimers = { 
        doubleShot: 0, 
        wideShip: 0, 
        piercing: 0 
    }; 
    bulletType = "normal"; 
    highScoreFormContainer.classList.add("hidden"); 
    createEnemies(); 
    gameState = 'playing'; 
}
function createEnemies() { 
    const eRows = 4, eCols = 10, eSize = 35; 
    enemies = []; 
    for (let r = 0; r < eRows; r++) { 
        for (let c = 0; c < eCols; c++) { 
            const isSpecial = Math.random() < 0.1; enemies.push({ 
                x: c * (eSize + 15) + 60, y: r * (eSize + 15) + 50, width: eSize, height: eSize, isSpecial: isSpecial, points: isSpecial ? 100 : 20 
            }); 
        } 
    } 
}

// --- Lógica de Update (Jogo) ---
function updateGame() {
    handlePlayerMovement(); // Agora considera o toque
    handleShooting();      // Agora considera o toque
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

// MODIFICADO: handlePlayerMovement agora usa touchLeft e touchRight
function handlePlayerMovement() {
    // Teclado (mantido para PC/debug)
    if (keys["ArrowLeft"] && player.x > 0) player.x -= player.speed;
    if (keys["ArrowRight"] && player.x + player.width < gameCanvas.width) player.x += player.speed;

    // Toque
    if (touchLeft && player.x > 0) player.x -= player.speed;
    if (touchRight && player.x + player.width < gameCanvas.width) player.x += player.speed;
}

// MODIFICADO: handleShooting agora usa touchTap
function handleShooting() {
    const now = Date.now();
    // Teclado (mantido para PC/debug)
    if (keys[" "] && now - lastShotTime > shotInterval) {
        shootBullet();
        lastShotTime = now;
    }

    // Toque (Tap)
    if (touchTap && now - lastShotTime > shotInterval) {
        shootBullet();
        lastShotTime = now;
        touchTap = false; // Reseta o tap após atirar
    }
}

function shootBullet() { 
    playSound('shoot'); 
    const base = { y: player.y, width: 5, height: 15, type: bulletType, speed: bulletType === "piercing" ? 9 : 7, angle: 0 }; 
    if (player.doubleShot) { 
    bullets.push({ ...base, x: player.x + player.width * 0.2 }); 
    bullets.push({ ...base, x: player.x + player.width * 0.8 - base.width }); 
    } 
    else { 
    bullets.push({ ...base, x: player.x + player.width / 2 - base.width / 2 }); 
    } 
    if (player.width > player.baseWidth) { 
    bullets.push({ ...base, x: player.x, angle: -0.25 }); 
    bullets.push({ ...base, x: player.x + player.width, angle: 0.25 }); 
    } 
}
function updateBullets() { 
    for (let i = bullets.length - 1; i >= 0; i--) { 
        const b = bullets[i]; 
        b.y -= b.speed; 
        if (b.angle) { 
            b.x += b.angle * b.speed; 
        } if (b.y + b.height < 0) bullets.splice(i, 1); 
    } 
}
function updateEnemies() { 
    let hitEdge = false; 
    enemies.forEach(e => { 
        e.x += enemyDirection * enemySpeed; 
        if (e.x < 0 || e.x + e.width > gameCanvas.width) hitEdge = true; 
    }); 
    if (hitEdge) { 
        enemyDirection *= -1; 
        enemies.forEach(e => { 
            e.y += 20; 
            if (e.y + e.height >= player.y) endGame(); 
        }); 
    } 
}
function handleEnemyShooting() { 
    if (Math.random() < 0.003 + (level * 0.0005) && enemies.length > 0) { 
        const shooter = enemies[Math.floor(Math.random() * enemies.length)]; 
        enemyBullets.push({ 
            x: shooter.x + shooter.width / 2 - 2, y: shooter.y + shooter.height, width: 4, height: 12, speed: 4.5 + level * 0.2 
        }); 
    } 
}
function updateEnemyBullets() { 
    for (let i = enemyBullets.length - 1; i >= 0; i--) { 
        enemyBullets[i].y += enemyBullets[i].speed; 
        if (enemyBullets[i].y > gameCanvas.height) enemyBullets.splice(i, 1); 
    } 
}

// Spawnar Power Ups
function spawnPowerUp() {
    if (powerUps.length >= MAX_POWERUPS_ON_SCREEN) {
        return;
    }
    const spawnChance = 0.008 + level * 0.001;
    if (Math.random() < spawnChance) {
        const types = [
            "doubleShot", "wideShip", "piercing",
            "doubleShot", "wideShip", "piercing",
            "doubleShot", "wideShip", "piercing",
            "bomb" 
        ];
        const type = types[Math.floor(Math.random() * types.length)];
        const speedMap = {
            "bomb": 9,
            "piercing": 6,
            "wideShip": 5,
            "doubleShot": 5
        };
        const speed = speedMap[type] || 5;

        powerUps.push({
            x: Math.random() * (gameCanvas.width - 30),
            y: 0,
            width: 30,
            height: 30,
            type,
            speed: speed
        });
    }
}
function updatePowerUps() { 
    for (let i = powerUps.length - 1; i >= 0; i--) { 
        powerUps[i].y += powerUps[i].speed; 
        if (powerUps[i].y > gameCanvas.height) powerUps.splice(i, 1); 
    } 
}
function checkCollisions() {
    for (let bIndex = bullets.length - 1; bIndex >= 0; bIndex--) {
        const b = bullets[bIndex];
        for (let eIndex = enemies.length - 1; eIndex >= 0; eIndex--) {
            const e = enemies[eIndex];
            if (b && e && b.x < e.x + e.width && b.x + b.width > e.x && b.y < e.y + e.height && b.y + b.height > e.y) { playSound('explosion'); score += e.points; if (score >= nextLifeScore) { lives++; nextLifeScore += 1000; } enemies.splice(eIndex, 1); if (b.type !== 'piercing') { bullets.splice(bIndex, 1); break; } }
        }
    }
    if (enemies.length === 0 && gameState === 'playing') { 
        level++; enemySpeed += 0.5; createEnemies(); 
    }
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
        enemies.forEach(e => {score += e.points; 
            if (score >= nextLifeScore) { 
                lives++; nextLifeScore += 1000; 
            }
        }); 
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
// Game-Over
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
// --- Funções de Desenho --- (sem alterações)
function setNeonStyle(targetCtx, color, blur = 10) { 
    targetCtx.fillStyle = color; 
    targetCtx.shadowColor = color; 
    targetCtx.shadowBlur = blur; 
}
function resetShadow(targetCtx) { 
    targetCtx.shadowBlur = 0; 
}
function createSprite(width, height, drawFunction) { 
    const tC = document.createElement('canvas'); 
    const tCtx = tC.getContext('2d'); 
    tC.width = width; 
    tC.height = height; 
    const margin = 15; 
    const obj = { 
        x: margin, y: margin, width: width - (margin * 2), height: height - (margin * 2), centerX: width / 2, centerY: height / 2 
    }; 
    drawFunction(tCtx, obj); 
    return tC; 
}
function createAllSprites() {
    sprites.player = createSprite(player.width + 30, player.height + 30, (tCtx, p) => {
        setNeonStyle(tCtx, colors.player); 
        tCtx.beginPath(); 
        tCtx.moveTo(p.x + p.width / 2, p.y); 
        tCtx.lineTo(p.x, p.y + p.height); 
        tCtx.lineTo(p.x + p.width, p.y + p.height); 
        tCtx.closePath(); 
        tCtx.fill();
        tCtx.fillStyle = colors.background; 
        tCtx.fillRect(p.x + p.width / 2 - 5, p.y + 12, 10, 8); 
        resetShadow(tCtx);
    });
    const createEnemySprite = (isSpecial) => {
        return createSprite(35 + 30, 35 + 30, (tCtx, e) => {
            const ufoBodyColor = isSpecial ? colors.enemySpecial : '#C0C0C0';
            setNeonStyle(tCtx, ufoBodyColor, 8); 
            tCtx.beginPath(); 
            tCtx.ellipse(e.centerX, e.centerY + 5, e.width / 2, e.height / 4, 0, 0, Math.PI * 2); 
            tCtx.fill(); 
            resetShadow(tCtx);
            tCtx.fillStyle = colors.player; 
            tCtx.beginPath(); 
            tCtx.arc(e.centerX, e.centerY, e.width / 8, 0, Math.PI * 2); 
            tCtx.fill();
            tCtx.fillStyle = 'rgba(200, 220, 255, 0.4)'; 
            tCtx.beginPath(); 
            tCtx.arc(e.centerX, e.centerY, e.width / 4, Math.PI, 0); 
            tCtx.fill();
            tCtx.fillStyle = 'rgba(255, 255, 255, 0.7)'; 
            tCtx.beginPath(); 
            tCtx.arc(e.centerX - e.width * 0.1, e.centerY - e.height * 0.1, e.width / 12, 0, Math.PI * 2); 
            tCtx.fill();
        });
    };
    sprites.enemy = createEnemySprite(false);
    sprites.enemySpecial = createEnemySprite(true);
}
function drawGame() { 
    ctx.fillStyle = colors.background; 
    ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height); 
    drawPlayer(); 
    bullets.forEach(drawPlayerBullet); 
    enemies.forEach(drawEnemy); 
    enemyBullets.forEach(drawEnemyBullet); 
    powerUps.forEach(drawPowerUp); 
    drawHUD(); 
    drawPowerUpHUD(); 
}
function drawPlayer() { 
    if (player.isHit && Math.floor((Date.now() - player.hitTimer) / 100) % 2 === 0) return; 
    if(sprites.player) ctx.drawImage(sprites.player, player.x - 15, player.y - 15); 
}
function drawEnemy(e) { 
    const spriteToDraw = e.isSpecial ? sprites.enemySpecial : sprites.enemy; 
    if(spriteToDraw) ctx.drawImage(spriteToDraw, e.x - 15, e.y - 15); 
}
function drawPlayerBullet(b) { 
    setNeonStyle(ctx, colors.bulletPlayer, 8); 
    ctx.beginPath(); 
    ctx.rect(b.x, b.y, b.width, b.height); 
    ctx.moveTo(b.x, b.y); 
    ctx.lineTo(b.x + b.width / 2, b.y - 5); 
    ctx.lineTo(b.x + b.width, b.y); 
    ctx.moveTo(b.x, b.y + b.height); 
    ctx.lineTo(b.x - 2, b.y + b.height + 4); 
    ctx.lineTo(b.x + 2, b.y + b.height); 
    ctx.moveTo(b.x + b.width, b.y + b.height); 
    ctx.lineTo(b.x + b.width - 2, b.y + b.height); 
    ctx.lineTo(b.x + b.width + 2, b.y + b.height + 4); 
    ctx.fill(); 
    resetShadow(ctx); 
}
function drawEnemyBullet(b) { 
    const cX = b.x + b.width / 2, cY = b.y + b.height / 2; const pR = b.width * (1.2 + Math.random() * 0.4); 
    const grad = ctx.createRadialGradient(cX, cY, 0, cX, cY, pR); 
    grad.addColorStop(0, 'white'); 
    grad.addColorStop(0.4, '#FFD700'); 
    grad.addColorStop(1, colors.bulletEnemy); 
    ctx.shadowColor = colors.bulletEnemy; 
    ctx.shadowBlur = 15; 
    ctx.fillStyle = grad; 
    ctx.beginPath(); 
    ctx.arc(cX, cY, pR, 0, Math.PI * 2); 
    ctx.fill(); resetShadow(ctx); 
}
function drawDoubleShotIcon(ctx, x, y, size) { 
    const mW = size * 0.15, mH = size * 0.6; 
    const drawM = (mx) => { 
        ctx.fillStyle = colors.player; 
        ctx.beginPath(); 
        ctx.rect(mx, y - mH / 2, mW, mH); 
        ctx.fill(); 
        setNeonStyle(ctx, '#FFFFFF', 5); 
        ctx.beginPath(); 
        ctx.moveTo(mx, y - mH / 2); 
        ctx.lineTo(mx + mW / 2, y - mH / 2 - 6); 
        ctx.lineTo(mx + mW, y - mH / 2); 
        ctx.fill(); 
        resetShadow(ctx); 
    }; 
    drawM(x - size * 0.3); 
    drawM(x + size * 0.15); 
}
function drawWideShipIcon(ctx, x, y, size) { 
    setNeonStyle(ctx, '#FFFFFF', 15); 
    ctx.beginPath(); 
    ctx.moveTo(x - size * 0.4, y - size * 0.5); 
    ctx.lineTo(x + size * 0.4, y - size * 0.5); 
    ctx.lineTo(x + size * 0.4, y + size * 0.2); 
    ctx.quadraticCurveTo(x, y + size * 0.6, x - size * 0.4, y + size * 0.2); 
    ctx.closePath(); 
    ctx.fill(); 
    resetShadow(ctx); 
    setNeonStyle(ctx, colors.powerup, 10); 
    ctx.beginPath(); 
    ctx.moveTo(x - size * 0.3, y - size * 0.4); 
    ctx.lineTo(x + size * 0.3, y - size * 0.4); 
    ctx.lineTo(x + size * 0.3, y + size * 0.15); 
    ctx.quadraticCurveTo(x, y + size * 0.45, x - size * 0.3, y + size * 0.15); 
    ctx.closePath(); 
    ctx.fill(); 
    resetShadow(ctx); 
}
function drawPiercingIcon(ctx, x, y, size) { 
    ctx.fillStyle = colors.powerup; 
    ctx.fillRect(x - 2, y - size * 0.1, 4, size * 0.6); 
    setNeonStyle(ctx, '#FFFFFF', 10); 
    ctx.beginPath(); 
    ctx.moveTo(x, y - size * 0.5); 
    ctx.lineTo(x + size * 0.4, y); 
    ctx.lineTo(x - size * 0.4, y); 
    ctx.closePath(); 
    ctx.fill(); 
    resetShadow(ctx); 
}
function drawNukeIcon(ctx, x, y, size) { 
    ctx.fillStyle = '#A9A9A9'; 
    ctx.beginPath(); 
    ctx.moveTo(x - size * 0.4, y - size * 0.5); 
    ctx.lineTo(x - size * 0.2, y - size * 0.3); 
    ctx.lineTo(x, y - size * 0.5); 
    ctx.moveTo(x + size * 0.4, y - size * 0.5); 
    ctx.lineTo(x + size * 0.2, y - size * 0.3); 
    ctx.lineTo(x, y - size * 0.5); 
    ctx.fill(); 
    ctx.fillStyle = '#C0C0C0'; 
    ctx.fillRect(x - size * 0.2, y - size * 0.3, size * 0.4, size * 0.4); 
    setNeonStyle(ctx, colors.enemySpecial, 15); 
    ctx.beginPath(); 
    ctx.arc(x, y + size * 0.1, size * 0.35, 0, Math.PI * 2); 
    ctx.fill(); 
    resetShadow(ctx); 
}
function drawPowerUp(p) { 
    const cX = p.x + p.width/2; 
    const cY = p.y + p.height/2; 
    const size = p.width; 
    switch (p.type) { 
        case 'doubleShot': drawDoubleShotIcon(ctx, cX, cY, size); 
        break; 
        case 'wideShip': drawWideShipIcon(ctx, cX, cY, size); 
        break; 
        case 'piercing': drawPiercingIcon(ctx, cX, cY, size); 
        break; 
        case 'bomb': drawNukeIcon(ctx, cX, cY, size); 
        break; 
    } 
}
function drawHUD() { 
    setNeonStyle(ctx, colors.text, 5); 
    ctx.font = `20px ${FONT_FAMILY}`; 
    ctx.textAlign = 'start'; 
    ctx.fillText(`PONTUAÇÃO: ${score}`, 10, 30); 
    ctx.textAlign = 'center'; 
    ctx.fillText(`NÍVEL: ${level}`, gameCanvas.width / 2, 30); 
    ctx.textAlign = 'end'; 
    ctx.fillText(`VIDAS: ${lives}`, gameCanvas.width - 10, 30); 
    resetShadow(ctx); 
}
function drawPowerUpHUD() { 
    const now = Date.now(); 
    const active = Object.entries(powerUpTimers).filter(([type, end]) => end > 0 && end > now); 
    if (active.length === 0) return; 
    let yPos = 60; 
    ctx.font = `bold 14px ${FONT_FAMILY}`; 
    ctx.textAlign = 'start'; 
    setNeonStyle(ctx, colors.text, 3); 
    ctx.fillText("PODERES ATIVOS:", 10, yPos); 
    resetShadow(ctx); 
    yPos += 5; 
    active.forEach(([type, end]) => { 
        yPos += 25; 
        const timeLeft = Math.max(0, end - now); 
        const percent = timeLeft / POWER_UP_DURATION; 
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)"; 
        ctx.fillRect(10, yPos, 150, 10); 
        ctx.fillStyle = colors.player; 
        ctx.fillRect(10, yPos, 150 * percent, 10); 
        setNeonStyle(ctx, colors.text, 3); 
        ctx.font = `12px ${FONT_FAMILY}`; 
        ctx.fillText(type.toUpperCase(), 170, yPos + 9); 
        resetShadow(ctx); 
    }); 
}

// --- Funções de UI (Menus, Telas) --- (sem alterações)
const menuButtons = { 
    play: { 
        x: 300, y: 300, width: 200, height: 50, text: 'JOGAR' 
    }, 
    ranking: { 
        x: 300, y: 370, width: 200, height: 50, text: 'RANKING' 
    }, 
    settings: { 
        x: 300, y: 440, width: 200, height: 50, text: 'OPÇÕES' 
    } 
};
const backButton = { 
    x: 300, y: 500, width: 200, height: 50, text: 'VOLTAR' 
};
const gameOverButtons = { 
    tryAgain: { 
        x: 300, y: 280, width: 200, height: 50, text: 'JOGAR NOVAMENTE' 
    }, 
    ranking: { 
        x: 300, y: 350, width: 200, height: 50, text: 'RANKING' 
    }, 
    mainMenu: { 
        x: 300, y: 420, width: 200, height: 50, text: 'MENU' 
    } 
};
let settingsButtons = {};
function drawMenu() { 
    drawScreenTemplate('SPACE INVADERS', 180, menuButtons, 80, true); 
}
function drawRankingScreen() { 
    drawScreenTemplate('RANKING', 100, { back: backButton }, 50); 
    const hs = getHighScores(); 
    ctx.font = `24px ${FONT_FAMILY}`; 
    ctx.textAlign = 'center'; 
    setNeonStyle(ctx, colors.text, 5); 
    if (hs.length === 0) { 
        ctx.fillText('NENHUM RECORDE', gameCanvas.width / 2, 200); 
    } else { 
        hs.forEach((s, i) => ctx.fillText(`${i + 1}. ${s.name.padEnd(5, ' ')} - ${s.score}`, gameCanvas.width / 2, 180 + i * 40)); 
    } resetShadow(ctx); 
}
function drawSettingsScreen() {
    drawScreenTemplate('OPÇÕES', 100, { back: backButton }, 50);
    ctx.font = `22px ${FONT_FAMILY}`;
    settingsButtons = {}; let y = 180;
    const totalContentWidth = 380; const startX = (gameCanvas.width - totalContentWidth) / 2;
    for (const key in volumes) {
        const text = `${key.charAt(0).toUpperCase() + key.slice(1)}: ${Math.round(volumes[key] * 100)}%`;
        const minusBtn = { x: startX, y: y - 25, width: 50, height: 40, text: '-' };
        const plusBtn = { x: startX + totalContentWidth - 50, y: y - 25, width: 50, height: 40, text: '+' };
        settingsButtons[`minus_${key}`] = minusBtn; settingsButtons[`plus_${key}`] = plusBtn;
        drawButton(minusBtn);
        setNeonStyle(ctx, colors.text, 5); ctx.textAlign = 'center'; ctx.fillText(text, startX + (totalContentWidth / 2), y); 
        resetShadow(ctx);
        drawButton(plusBtn);
        y += 60;
    }
    ctx.textAlign = 'start';
}
function drawGameOver() { 
    drawScreenTemplate('FIM DE JOGO', 150, gameOverButtons, 60); 
    setNeonStyle(ctx, colors.text, 5); 
    ctx.font = `24px ${FONT_FAMILY}`; 
    ctx.textAlign = 'center'; 
    ctx.fillText(`PONTUAÇÃO FINAL: ${score}`, gameCanvas.width / 2, 220); 
    resetShadow(ctx); 
}
function drawScreenTemplate(title, y, buttons, fontSize, isMainMenu = false) {
    ctx.fillStyle = colors.background; 
    ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
    if (isMainMenu) {
        setNeonStyle(ctx, colors.glow, 15); 
        ctx.font = `bold 80px ${FONT_FAMILY}`; 
        ctx.textAlign = 'center';
        ctx.fillText('SPACE', gameCanvas.width / 2, 160);
        ctx.fillText('INVADERS', gameCanvas.width / 2, 240);
        resetShadow(ctx);
    } else if (title) {
        setNeonStyle(ctx, colors.glow, 15); 
        ctx.font = `bold ${fontSize}px ${FONT_FAMILY}`; 
        ctx.textAlign = 'center'; 
        ctx.fillText(title, gameCanvas.width / 2, y); 
        resetShadow(ctx);
    }
    Object.values(buttons).forEach(b => drawButton(b));
}
function drawButton(b) {
    const isHovered = hoveredButton && b.x === hoveredButton.x && b.y === hoveredButton.y && b.text === hoveredButton.text;
    const scale = isHovered ? 1.05 : 1.0; 
    const newWidth = b.width * scale; 
    const newHeight = b.height * scale; 
    const newX = b.x - (newWidth - b.width) / 2; 
    const newY = b.y - (newHeight - b.height) / 2;
    if (isHovered) {
        ctx.shadowColor = '#FFFFFF'; 
        ctx.shadowBlur = 20; 
        ctx.fillStyle = colors.player;
        drawRoundedRect(newX, newY, newWidth, newHeight, 12); 
        ctx.fill(); 
        resetShadow(ctx);
        ctx.fillStyle = colors.background; 
        ctx.font = `bold ${b.text.length > 10 ? '17' : '19'}px ${FONT_FAMILY}`; 
        ctx.textAlign = 'center'; 
        ctx.fillText(b.text, newX + newWidth / 2, newY + newHeight / 2 + 8);
    } else {
        setNeonStyle(ctx, colors.glow, 10); 
        ctx.strokeStyle = colors.glow; 
        ctx.lineWidth = 2;
        drawRoundedRect(b.x, b.y, b.width, b.height, 10); 
        ctx.stroke();
        ctx.font = `bold ${b.text.length > 10 ? '16' : '18'}px ${FONT_FAMILY}`; 
        ctx.textAlign = 'center'; 
        ctx.fillText(b.text, b.x + b.width / 2, b.y + b.height / 2 + 8);
    }
    resetShadow(ctx); ctx.textAlign = 'start';
}
function drawRoundedRect(x, y, w, h, r) { 
    ctx.beginPath(); 
    ctx.moveTo(x + r, y); 
    ctx.lineTo(x + w - r, y); 
    ctx.arcTo(x + w, y, x + w, y + r, r); 
    ctx.lineTo(x + w, y + h - r); 
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r); 
    ctx.lineTo(x + r, y + h); 
    ctx.arcTo(x, y + h, x, y + h - r, r); 
    ctx.lineTo(x, y + r); 
    ctx.arcTo(x, y, x + r, y, r); 
    ctx.closePath(); 
}


// --- Lógica de High Score --- (sem alterações)
function getHighScores() { 
    return JSON.parse(localStorage.getItem("highScores")) || []; 
}
function checkIfHighScore(s) { 
    const hs = getHighScores(); 
    return s > 0 && (hs.length < 5 || s > hs[hs.length - 1].score); 
}
function saveHighScore(name, newScore) { 
    const hs = getHighScores(); hs.push({ name, score: newScore }); 
    hs.sort((a, b) => b.score - a.score); 
    localStorage.setItem("highScores", JSON.stringify(hs.slice(0, 5))); 
}

// --- NOVAS: Funções Auxiliares de Toque ---
function getTouchPos(canvasDom, touchEvent, index = 0) {
    var rect = canvasDom.getBoundingClientRect();
    const touch = touchEvent.touches[index];
    // Garante que temos um toque válido antes de tentar ler clientX/Y
    if (!touch) return null; 
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
}

function mapToGameCoords(pos) {
    if (!pos) return null; // Retorna nulo se a posição for inválida
    const rect = gameCanvas.getBoundingClientRect();
    // Previne divisão por zero se o canvas não estiver visível
    if (rect.width === 0 || rect.height === 0) return null; 
    const scaleX = gameCanvas.width / rect.width;
    const scaleY = gameCanvas.height / rect.height;
    return { x: pos.x * scaleX, y: pos.y * scaleY };
}

// --- Event Listeners ---

// Teclado (sem alterações)
document.addEventListener("keydown", (e) => { keys[e.key] = true; if (!audioEnabled) audioEnabled = true; });
document.addEventListener("keyup", (e) => { keys[e.key] = false; });

// Formulário High Score (sem alterações)
highScoreForm.addEventListener("submit", (e) => { /* ... */ });

// Clique do Mouse (mantido para menus no PC/debug)
gameCanvas.addEventListener('click', (e) => {
    if (uiActionInProgress) { uiActionInProgress = false; return; }
    const mouse = { x: e.clientX - gameCanvas.getBoundingClientRect().left, y: e.clientY - gameCanvas.getBoundingClientRect().top };
    const isInside = (p, b) => p.x > b.x && p.x < b.x + b.width && p.y > b.y && p.y < b.y + b.height;
    if (gameState === 'menu') { 
        if (isInside(mouse, menuButtons.play)) resetGame(); 
        if (isInside(mouse, menuButtons.ranking)) gameState = 'ranking'; 
        if (isInside(mouse, menuButtons.settings)) gameState = 'settings'; 
    }
    else if (gameState === 'ranking') { 
        if (isInside(mouse, backButton)) gameState = 'menu'; 
    }
    else if (gameState === 'settings') { 
        if (isInside(mouse, backButton)) gameState = 'menu'; 
        for (const key in settingsButtons) { 
            if (isInside(mouse, settingsButtons[key])) { 
                const [action, volumeType] = key.split('_'); 
                if (action === 'minus') volumes[volumeType] = Math.max(0, volumes[volumeType] - 0.1); 
                if (action === 'plus') volumes[volumeType] = Math.min(1, volumes[volumeType] + 0.1); 
                volumes[volumeType] = parseFloat(volumes[volumeType].toFixed(1)); 
            } 
        } localStorage.setItem('gameVolumes', JSON.stringify(volumes)); 
    }
    else if (gameState === 'gameOver') { 
        if (isInside(mouse, gameOverButtons.tryAgain)) resetGame(); 
        if (isInside(mouse, gameOverButtons.ranking)) gameState = 'ranking'; 
        if (isInside(mouse, gameOverButtons.mainMenu)) gameState = 'menu'; 
    }
});

// Mouse Move (mantido para hover no PC/debug)
gameCanvas.addEventListener('mousemove', (e) => {
    const mouse = { x: e.clientX - gameCanvas.getBoundingClientRect().left, y: e.clientY - gameCanvas.getBoundingClientRect().top };
    const isInside = (p, b) => p.x > b.x && p.x < b.x + b.width && p.y > b.y && p.y < b.y + b.height;
    let foundButton = null;
    const getActiveButtons = () => { 
        if (gameState === 'menu') return Object.values(menuButtons); 
        if (gameState === 'ranking') return [backButton]; 
        if (gameState === 'settings') return [backButton, ...Object.values(settingsButtons)]; 
        if (gameState === 'gameOver') return Object.values(gameOverButtons); return []; 
    };
    const activeButtons = getActiveButtons();
    for (const button of activeButtons) { 
        if (isInside(mouse, button)) { 
            foundButton = button; break; 
        } 
    }
    hoveredButton = foundButton;
});

// --- NOVOS: Listeners de Toque para Controle ---
let touchStartTime = 0; // Para diferenciar tap de hold

gameCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    // Só processa toques durante o jogo
    if (gameState !== 'playing') return;

    touchStartTime = Date.now(); // Marca o início do toque

    for (let i = 0; i < e.touches.length; i++) {
        const pos = getTouchPos(gameCanvas, e, i);
        const gamePos = mapToGameCoords(pos);
        if (!gamePos) continue; // Pula se as coordenadas forem inválidas

        // Verifica em qual metade da tela o toque começou
        if (gamePos.x < gameCanvas.width / 2) {
            touchLeft = true;
            touchRight = false; // Garante que apenas um lado esteja ativo
        } else {
            touchRight = true;
            touchLeft = false; // Garante que apenas um lado esteja ativo
        }
    }
}, false);

gameCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (gameState !== 'playing') return;

    // Se houver algum dedo se movendo, verifica a posição do primeiro dedo
    if (e.touches.length > 0) {
        const pos = getTouchPos(gameCanvas, e, 0); // Considera apenas o primeiro dedo para movimento contínuo
        const gamePos = mapToGameCoords(pos);
        if (!gamePos) return;

        // Atualiza a direção com base na posição atual do dedo
        if (gamePos.x < gameCanvas.width / 2) {
            touchLeft = true;
            touchRight = false;
        } else {
            touchRight = true;
            touchLeft = false;
        }
    }
}, false);

gameCanvas.addEventListener('touchend', (e) => {
    e.preventDefault();

    // Reset por toque na tela de Game Over (como no Pong)
    if (gameEnded) { // Assumindo que você tem uma variável 'gameEnded' ou similar
         if (e.changedTouches.length === 1) resetGame();
         return; // Não faz mais nada se estava na tela de game over
    }

    if (gameState !== 'playing') return;

    // Verifica se foi um toque rápido (tap) para atirar
    const touchDuration = Date.now() - touchStartTime;
    if (touchDuration < 200) { // Menos de 200ms = Tap
        touchTap = true;
    }

    // Para de mover quando o dedo sai da tela
    touchLeft = false;
    touchRight = false;

    // Limpa os identificadores de toque se necessário (para lógicas mais complexas)
    // Se o controle simples de zona funcionar, isso pode não ser necessário.
}, false);

gameCanvas.addEventListener('touchcancel', (e) => {
    // Trata como touchend para parar o movimento
    touchLeft = false;
    touchRight = false;
}, false);

// NOVO: Listener para redimensionar o canvas de fundo
window.addEventListener('resize', () => {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
    initParticles(); // Recria partículas na nova dimensão
});


// --- Game Loop Principal --- (sem alterações)
async function main() {
    await document.fonts.load(`1em ${FONT_FAMILY}`);
    await preloadAudio();
    initializePlayer();
    createAllSprites();
    function gameLoop() {
        drawAndUpdateStars();
        ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
        if (hoveredButton) { 
            gameCanvas.style.cursor = 'pointer'; 
        } else { 
            gameCanvas.style.cursor = 'default'; 
        }
        switch (gameState) {
            case 'menu': drawMenu(); 
            break;
            case 'playing': updateGame(); 
            drawGame(); 
            break;
            case 'ranking': drawRankingScreen(); 
            break;
            case 'settings': drawSettingsScreen(); 
            break;
            case 'gameOver': drawGameOver(); 
            break;
            case 'enteringName': drawGame(); 
            break;
        }
        requestAnimationFrame(gameLoop);
    }
    createStars(300);
    gameLoop();
}

// --- Início do Jogo --- (sem alterações)
main();