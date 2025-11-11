// =================================================================================
// Versão 10 - Mobile (Base v8.9.1 + História v9 + Controles)
// =================================================================================

// --- Elementos do Canvas e HTML ---
const gameCanvas = document.getElementById("gameCanvas");
const ctx = gameCanvas.getContext("2d");
const bgCanvas = document.getElementById("backgroundCanvas");
const bgCtx = bgCanvas.getContext('2d');
const highScoreFormContainer = document.getElementById("highScoreFormContainer");
const highScoreForm = document.getElementById("highScoreForm");
const playerNameInput = document.getElementById("playerName");

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

// --- Sprites Pré-renderizados ---
const sprites = {};

// --- Fundo Estrelado ---
let stars = [];
function createStars(count) { 
    stars = []; // Limpa para o resize
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
// --- Áudio ---
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
// MODIFICADO: Função preloadAudio corrigida
function preloadAudio() {
    console.log("Iniciando pré-carregamento de áudio...");
    const promises = Object.values(sounds).map(sound => {
        return new Promise((resolve, reject) => {
            // Verifica se o som já carregou
            if (sound.readyState >= 3) { // HAVE_FUTURE_DATA
                resolve();
                return;
            }
            sound.addEventListener('canplaythrough', resolve, { once: true });
            sound.addEventListener('error', reject, { once: true }); // Adiciona tratamento de erro
        });
    });
    return Promise.all(promises).then(() => {
        console.log("Áudio pré-carregado com sucesso!");
    }).catch(e => {
        console.error("Erro ao pré-carregar áudio:", e);
    });
}
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

// --- NOVAS: Variáveis de Toque ---
let touchLeft = false;
let touchRight = false;
let touchFire = false; // Substitui o 'touchTap'
let canvasRect = gameCanvas.getBoundingClientRect(); // Posição do canvas
let scaleX = gameCanvas.width / canvasRect.width;
let scaleY = gameCanvas.height / canvasRect.height;

// --- NOVO: Botões Virtuais ---
const virtualControls = {
    left:  { x: 50,  y: gameCanvas.height - 80, width: 80, height: 60, symbol: '<', pressed: false },
    right: { x: gameCanvas.width - 130, y: gameCanvas.height - 80, width: 80, height: 60, symbol: '>', pressed: false },
    fire:  { x: gameCanvas.width / 2 - 40, y: gameCanvas.height - 90, width: 80, height: 70, symbol: 'O', pressed: false }
};

// --- Funções de Inicialização e Reset ---
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
// MODIFICADO: para incluir toque
function handlePlayerMovement() { 
    // Teclado
    if (keys["ArrowLeft"] && player.x > 0) player.x -= player.speed; 
    if (keys["ArrowRight"] && player.x + player.width < gameCanvas.width) player.x += player.speed; 
    // Toque
    if (touchLeft && player.x > 0) player.x -= player.speed;
    if (touchRight && player.x + player.width < gameCanvas.width) player.x += player.speed;
}
// MODIFICADO: para incluir toque
function handleShooting() { 
    const now = Date.now();
    let shotFired = false;
    
    // Teclado
    if (keys[" "] && now - lastShotTime > shotInterval) { 
        shootBullet(); 
        lastShotTime = now; 
        shotFired = true;
    }
    // Toque (Botão Pressionado)
    if (!shotFired && virtualControls.fire.pressed && now - lastShotTime > shotInterval) {
        shootBullet();
        lastShotTime = now;
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
// ... (O resto das funções de update (updateBullets, updateEnemies, etc) não mudam) ...
function updateBullets() { for (let i = bullets.length - 1; i >= 0; i--) { const b = bullets[i]; b.y -= b.speed; if (b.angle) { b.x += b.angle * b.speed; } if (b.y + b.height < 0) bullets.splice(i, 1); } }
function updateEnemies() { let hitEdge = false; enemies.forEach(e => { e.x += enemyDirection * enemySpeed; if (e.x < 0 || e.x + e.width > gameCanvas.width) hitEdge = true; }); if (hitEdge) { enemyDirection *= -1; enemies.forEach(e => { e.y += 20; if (e.y + e.height >= player.y) endGame(); }); } }
function handleEnemyShooting() { if (Math.random() < 0.003 + (level * 0.0005) && enemies.length > 0) { const shooter = enemies[Math.floor(Math.random() * enemies.length)]; enemyBullets.push({ x: shooter.x + shooter.width / 2 - 2, y: shooter.y + shooter.height, width: 4, height: 12, speed: 4.5 + level * 0.2 }); } }
function updateEnemyBullets() { for (let i = enemyBullets.length - 1; i >= 0; i--) { enemyBullets[i].y += enemyBullets[i].speed; if (enemyBullets[i].y > gameCanvas.height) enemyBullets.splice(i, 1); } }
function spawnPowerUp() { if (powerUps.length >= MAX_POWERUPS_ON_SCREEN) { return; } const spawnChance = 0.008 + level * 0.001; if (Math.random() < spawnChance) { const types = [ "doubleShot", "wideShip", "piercing", "doubleShot", "wideShip", "piercing", "doubleShot", "wideShip", "piercing", "bomb" ]; const type = types[Math.floor(Math.random() * types.length)]; const speedMap = { "bomb": 9, "piercing": 6, "wideShip": 5, "doubleShot": 5 }; const speed = speedMap[type] || 5; powerUps.push({ x: Math.random() * (gameCanvas.width - 30), y: 0, width: 30, height: 30, type, speed: speed }); } }
function updatePowerUps() { for (let i = powerUps.length - 1; i >= 0; i--) { powerUps[i].y += powerUps[i].speed; if (powerUps[i].y > gameCanvas.height) powerUps.splice(i, 1); } }
function checkCollisions() { for (let bIndex = bullets.length - 1; bIndex >= 0; bIndex--) { const b = bullets[bIndex]; for (let eIndex = enemies.length - 1; eIndex >= 0; eIndex--) { const e = enemies[eIndex]; if (b && e && b.x < e.x + e.width && b.x + b.width > e.x && b.y < e.y + e.height && b.y + b.height > e.y) { playSound('explosion'); score += e.points; if (score >= nextLifeScore) { lives++; nextLifeScore += 1000; } enemies.splice(eIndex, 1); if (b.type !== 'piercing') { bullets.splice(bIndex, 1); break; } } } } if (enemies.length === 0 && gameState === 'playing') { level++; enemySpeed += 0.5; createEnemies(); } for (let i = enemyBullets.length - 1; i >= 0; i--) { const b = enemyBullets[i]; if (!player.isHit && b.x < player.x + player.width && b.x + b.width > player.x && b.y < player.y + player.height && b.y + b.height > player.y) { enemyBullets.splice(i, 1); lives--; playSound('playerHit'); if (lives > 0) { player.isHit = true; player.hitTimer = Date.now(); } else { endGame(); } } } for (let i = powerUps.length - 1; i >= 0; i--) { const p = powerUps[i]; if (p.x < player.x + player.width && p.x + p.width > player.x && p.y < player.y + player.height && p.y + p.height > player.y) { activatePowerUp(p.type); powerUps.splice(i, 1); } } }
function activatePowerUp(type) { playSound('powerup'); const now = Date.now(); if (type === "doubleShot") { player.doubleShot = true; powerUpTimers.doubleShot = now + POWER_UP_DURATION; } if (type === "wideShip") { player.width = player.baseWidth + 20; powerUpTimers.wideShip = now + POWER_UP_DURATION; } if (type === "piercing") { bulletType = "piercing"; powerUpTimers.piercing = now + POWER_UP_DURATION; } if (type === "bomb") { enemies.forEach(e => {score += e.points; if (score >= nextLifeScore) { lives++; nextLifeScore += 1000; }}); enemies = []; } }
function updatePowerUpTimers() { const now = Date.now(); if (powerUpTimers.doubleShot && now > powerUpTimers.doubleShot) { player.doubleShot = false; powerUpTimers.doubleShot = 0;} if (powerUpTimers.wideShip && now > powerUpTimers.wideShip) { player.width = player.baseWidth; powerUpTimers.wideShip = 0;} if (powerUpTimers.piercing && now > powerUpTimers.piercing) { bulletType = "normal"; powerUpTimers.piercing = 0;} }
function endGame() { playSound('gameOver'); if (checkIfHighScore(score)) { gameState = 'enteringName'; highScoreFormContainer.classList.remove("hidden"); playerNameInput.focus(); } else { gameState = 'gameOver'; } }

// --- Funções de Desenho e Sprites ---
function setNeonStyle(targetCtx, color, blur = 10) { targetCtx.fillStyle = color; targetCtx.shadowColor = color; targetCtx.shadowBlur = blur; }
function resetShadow(targetCtx) { targetCtx.shadowBlur = 0; }
function createSprite(width, height, drawFunction) { const tC = document.createElement('canvas'); const tCtx = tC.getContext('2d'); tC.width = width; tC.height = height; const margin = 15; const obj = { x: margin, y: margin, width: width - (margin * 2), height: height - (margin * 2), centerX: width / 2, centerY: height / 2 }; drawFunction(tCtx, obj); return tC; }
function createAllSprites() { sprites.player = createSprite(player.width + 30, player.height + 30, (tCtx, p) => { setNeonStyle(tCtx, colors.player); tCtx.beginPath(); tCtx.moveTo(p.x + p.width / 2, p.y); tCtx.lineTo(p.x, p.y + p.height); tCtx.lineTo(p.x + p.width, p.y + p.height); tCtx.closePath(); tCtx.fill(); tCtx.fillStyle = colors.background; tCtx.fillRect(p.x + p.width / 2 - 5, p.y + 12, 10, 8); resetShadow(tCtx); }); const createEnemySprite = (isSpecial) => { return createSprite(35 + 30, 35 + 30, (tCtx, e) => { const ufoBodyColor = isSpecial ? colors.enemySpecial : '#C0C0C0'; setNeonStyle(tCtx, ufoBodyColor, 8); tCtx.beginPath(); tCtx.ellipse(e.centerX, e.centerY + 5, e.width / 2, e.height / 4, 0, 0, Math.PI * 2); tCtx.fill(); resetShadow(tCtx); tCtx.fillStyle = colors.player; tCtx.beginPath(); tCtx.arc(e.centerX, e.centerY, e.width / 8, 0, Math.PI * 2); tCtx.fill(); tCtx.fillStyle = 'rgba(200, 220, 255, 0.4)'; tCtx.beginPath(); tCtx.arc(e.centerX, e.centerY, e.width / 4, Math.PI, 0); tCtx.fill(); tCtx.fillStyle = 'rgba(255, 255, 255, 0.7)'; tCtx.beginPath(); tCtx.arc(e.centerX - e.width * 0.1, e.centerY - e.height * 0.1, e.width / 12, 0, Math.PI * 2); tCtx.fill(); }); }; sprites.enemy = createEnemySprite(false); sprites.enemySpecial = createEnemySprite(true); }
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
    
    // NOVO: Desenha os controles mobile
    drawMobileControls();
}
function drawPlayer() { if (player.isHit && Math.floor((Date.now() - player.hitTimer) / 100) % 2 === 0) return; if(sprites.player) ctx.drawImage(sprites.player, player.x - 15, player.y - 15); }
function drawEnemy(e) { const spriteToDraw = e.isSpecial ? sprites.enemySpecial : sprites.enemy; if(spriteToDraw) ctx.drawImage(spriteToDraw, e.x - 15, e.y - 15); }
function drawPlayerBullet(b) { setNeonStyle(ctx, colors.bulletPlayer, 8); ctx.beginPath(); ctx.rect(b.x, b.y, b.width, b.height); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + b.width / 2, b.y - 5); ctx.lineTo(b.x + b.width, b.y); ctx.moveTo(b.x, b.y + b.height); ctx.lineTo(b.x - 2, b.y + b.height + 4); ctx.lineTo(b.x + 2, b.y + b.height); ctx.moveTo(b.x + b.width, b.y + b.height); ctx.lineTo(b.x + b.width - 2, b.y + b.height); ctx.lineTo(b.x + b.width + 2, b.y + b.height + 4); ctx.fill(); resetShadow(ctx); }
function drawEnemyBullet(b) { const cX = b.x + b.width / 2, cY = b.y + b.height / 2; const pR = b.width * (1.2 + Math.random() * 0.4); const grad = ctx.createRadialGradient(cX, cY, 0, cX, cY, pR); grad.addColorStop(0, 'white'); grad.addColorStop(0.4, '#FFD700'); grad.addColorStop(1, colors.bulletEnemy); ctx.shadowColor = colors.bulletEnemy; ctx.shadowBlur = 15; ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(cX, cY, pR, 0, Math.PI * 2); ctx.fill(); resetShadow(ctx); }
function drawDoubleShotIcon(ctx, x, y, size) { const mW = size * 0.15, mH = size * 0.6; const drawM = (mx) => { ctx.fillStyle = colors.player; ctx.beginPath(); ctx.rect(mx, y - mH / 2, mW, mH); ctx.fill(); setNeonStyle(ctx, '#FFFFFF', 5); ctx.beginPath(); ctx.moveTo(mx, y - mH / 2); ctx.lineTo(mx + mW / 2, y - mH / 2 - 6); ctx.lineTo(mx + mW, y - mH / 2); ctx.fill(); resetShadow(ctx); }; drawM(x - size * 0.3); drawM(x + size * 0.15); }
function drawWideShipIcon(ctx, x, y, size) { setNeonStyle(ctx, '#FFFFFF', 15); ctx.beginPath(); ctx.moveTo(x - size * 0.4, y - size * 0.5); ctx.lineTo(x + size * 0.4, y - size * 0.5); ctx.lineTo(x + size * 0.4, y + size * 0.2); ctx.quadraticCurveTo(x, y + size * 0.6, x - size * 0.4, y + size * 0.2); ctx.closePath(); ctx.fill(); resetShadow(ctx); setNeonStyle(ctx, colors.powerup, 10); ctx.beginPath(); ctx.moveTo(x - size * 0.3, y - size * 0.4); ctx.lineTo(x + size * 0.3, y - size * 0.4); ctx.lineTo(x + size * 0.3, y + size * 0.15); ctx.quadraticCurveTo(x, y + size * 0.45, x - size * 0.3, y + size * 0.15); ctx.closePath(); ctx.fill(); resetShadow(ctx); }
function drawPiercingIcon(ctx, x, y, size) { ctx.fillStyle = colors.powerup; ctx.fillRect(x - 2, y - size * 0.1, 4, size * 0.6); setNeonStyle(ctx, '#FFFFFF', 10); ctx.beginPath(); ctx.moveTo(x, y - size * 0.5); ctx.lineTo(x + size * 0.4, y); ctx.lineTo(x - size * 0.4, y); ctx.closePath(); ctx.fill(); resetShadow(ctx); }
function drawNukeIcon(ctx, x, y, size) { ctx.fillStyle = '#A9A9A9'; ctx.beginPath(); ctx.moveTo(x - size * 0.4, y - size * 0.5); ctx.lineTo(x - size * 0.2, y - size * 0.3); ctx.lineTo(x, y - size * 0.5); ctx.moveTo(x + size * 0.4, y - size * 0.5); ctx.lineTo(x + size * 0.2, y - size * 0.3); ctx.lineTo(x, y - size * 0.5); ctx.fill(); ctx.fillStyle = '#C0C0C0'; ctx.fillRect(x - size * 0.2, y - size * 0.3, size * 0.4, size * 0.4); setNeonStyle(ctx, colors.enemySpecial, 15); ctx.beginPath(); ctx.arc(x, y + size * 0.1, size * 0.35, 0, Math.PI * 2); ctx.fill(); resetShadow(ctx); }
function drawPowerUp(p) { const cX = p.x + p.width/2; const cY = p.y + p.height/2; const size = p.width; switch (p.type) { case 'doubleShot': drawDoubleShotIcon(ctx, cX, cY, size); break; case 'wideShip': drawWideShipIcon(ctx, cX, cY, size); break; case 'piercing': drawPiercingIcon(ctx, cX, cY, size); break; case 'bomb': drawNukeIcon(ctx, cX, cY, size); break; } }
function drawHUD() { setNeonStyle(ctx, colors.text, 5); ctx.font = `20px ${FONT_FAMILY}`; ctx.textAlign = 'start'; ctx.fillText(`PONTUAÇÃO: ${score}`, 10, 30); ctx.textAlign = 'center'; ctx.fillText(`NÍVEL: ${level}`, gameCanvas.width / 2, 30); ctx.textAlign = 'end'; ctx.fillText(`VIDAS: ${lives}`, gameCanvas.width - 10, 30); resetShadow(ctx); }
function drawPowerUpHUD() { const now = Date.now(); const active = Object.entries(powerUpTimers).filter(([type, end]) => end > 0 && end > now); if (active.length === 0) return; let yPos = 60; ctx.font = `bold 14px ${FONT_FAMILY}`; ctx.textAlign = 'start'; setNeonStyle(ctx, colors.text, 3); ctx.fillText("PODERES ATIVOS:", 10, yPos); resetShadow(ctx); yPos += 5; active.forEach(([type, end]) => { yPos += 25; const timeLeft = Math.max(0, end - now); const percent = timeLeft / POWER_UP_DURATION; ctx.fillStyle = "rgba(255, 255, 255, 0.2)"; ctx.fillRect(10, yPos, 150, 10); ctx.fillStyle = colors.player; ctx.fillRect(10, yPos, 150 * percent, 10); setNeonStyle(ctx, colors.text, 3); ctx.font = `12px ${FONT_FAMILY}`; ctx.fillText(type.toUpperCase(), 170, yPos + 9); resetShadow(ctx); }); }

// --- NOVO: Função para Desenhar Controles Mobile ---
function drawMobileControls() {
    if (gameState !== 'playing') return; // Só desenha no jogo

    Object.values(virtualControls).forEach(button => {
        // Define a aparência base
        ctx.strokeStyle = colors.glow;
        ctx.fillStyle = 'rgba(0, 255, 127, 0.1)'; // Fundo semi-transparente
        ctx.lineWidth = 2;
        ctx.shadowColor = colors.glow;
        ctx.shadowBlur = 10;

        // Muda a aparência se o botão estiver pressionado
        if (button.pressed) {
            ctx.fillStyle = 'rgba(0, 255, 127, 0.4)'; // Fica mais opaco
            ctx.shadowBlur = 20;
        }

        drawRoundedRect(button.x, button.y, button.width, button.height, 10);
        ctx.stroke();
        ctx.fill();

        // Desenha o símbolo do botão
        setNeonStyle(ctx, colors.glow, 10);
        ctx.font = `bold ${button.symbol === 'O' ? 30 : 40}px ${FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.fillText(button.symbol, button.x + button.width / 2, button.y + button.height / 2 + (button.symbol === 'O' ? 10 : 15));
        resetShadow(ctx);
        ctx.textAlign = 'start';
    });
    resetShadow(ctx);
}

// --- Funções de UI (Menus, Telas) ---
const menuButtons = { 
    play: { 
        x: 300, y: 350, width: 200, height: 50, text: 'JOGAR' 
    }, 
    ranking: { 
        x: 300, y: 420, width: 200, height: 50, text: 'RANKING' 
    }, 
    settings: { 
        x: 300, y: 490, width: 200, height: 50, text: 'OPÇÕES' 
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
// MODIFICADO: drawMenu para incluir a história
function drawMenu() { 
    // Título (já feito pelo template)
    drawScreenTemplate('SPACE INVADERS', 180, menuButtons, 80, true); 
    
    // Adiciona o texto da história (NOVO)
    setNeonStyle(ctx, colors.text, 5);
    ctx.font = `14px ${FONT_FAMILY}`; // Fonte menor para o parágrafo
    ctx.textAlign = 'center';
    
    // Quebra a história em linhas
    const storyText = "Uma raça cibernética conhecida como 'Os Mineradores' chegou à Terra. Seu objetivo: congelar o núcleo do planeta para extrair seus recursos, aniquilando toda a vida no processo. A bordo da nave de exploração 'Geode', a geofísica Lena Petrova, guiada pela IA J.A.V.I.S., é a única esperança da humanidade para impedir a devastação.";
    const lines = [];
    const maxWidth = 500; // Largura máxima do texto
    let currentLine = '';
    
    storyText.split(' ').forEach(word => {
        const testLine = currentLine + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine !== '') {
            lines.push(currentLine.trim());
            currentLine = word + ' ';
        } else {
            currentLine = testLine;
        }
    });
    lines.push(currentLine.trim());
    
    // Desenha as linhas da história
    lines.forEach((line, index) => {
        ctx.fillText(line, gameCanvas.width / 2, 280 + index * 20); // Posição Y da história
    });
    
    resetShadow(ctx);
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

// --- Lógica de High Score ---
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

// --- NOVOS: Helpers de Toque ---
function getTouchPos(canvasDom, touchEvent, index = 0) {
    const touch = touchEvent.touches[index] || touchEvent.changedTouches[index];
    if (!touch) return null;
    return { x: touch.clientX - canvasRect.left, y: touch.clientY - canvasRect.top };
}
function mapToGameCoords(pos) {
    if (!pos) return null;
    canvasRect = gameCanvas.getBoundingClientRect(); // Recalcula em caso de resize
    scaleX = gameCanvas.width / canvasRect.width;
    scaleY = gameCanvas.height / canvasRect.height;
    if (canvasRect.width === 0 || canvasRect.height === 0) return null; 
    return { x: pos.x * scaleX, y: pos.y * scaleY };
}
const isInside = (p, b) => p.x > b.x && p.x < b.x + b.width && p.y > b.y && p.y < b.y + b.height;

// --- Event Listeners ---
document.addEventListener("keydown", (e) => { 
    keys[e.key] = true; 
    if (!audioEnabled) audioEnabled = true; 
});
document.addEventListener("keyup", (e) => { 
    keys[e.key] = false; 
});
highScoreForm.addEventListener("submit", (e) => { 
    e.preventDefault(); 
    saveHighScore(playerNameInput.value.toUpperCase().slice(0, 5) || "AAA", score); 
    highScoreFormContainer.classList.add("hidden"); 
    gameState = 'gameOver'; 
    uiActionInProgress = true; 
});

// MODIFICADO: 'click' agora usa mapToGameCoords
gameCanvas.addEventListener('click', (e) => {
    if (uiActionInProgress) { uiActionInProgress = false; return; }
    
    // Converte clique para coordenadas do jogo
    const mouse = { 
        x: e.clientX - gameCanvas.getBoundingClientRect().left, 
        y: e.clientY - gameCanvas.getBoundingClientRect().top 
    };
    const gamePos = mapToGameCoords(mouse);
    if (!gamePos) return;

    if (gameState === 'menu') { 
        if (isInside(gamePos, menuButtons.play)) resetGame(); 
        if (isInside(gamePos, menuButtons.ranking)) gameState = 'ranking'; 
        if (isInside(gamePos, menuButtons.settings)) gameState = 'settings'; 
    }
    else if (gameState === 'ranking') { 
        if (isInside(gamePos, backButton)) gameState = 'menu'; 
    }
    else if (gameState === 'settings') { 
        if (isInside(gamePos, backButton)) gameState = 'menu'; 
        for (const key in settingsButtons) { 
            if (isInside(gamePos, settingsButtons[key])) { 
                const [action, volumeType] = key.split('_'); 
                if (action === 'minus') volumes[volumeType] = Math.max(0, volumes[volumeType] - 0.1); 
                if (action === 'plus') volumes[volumeType] = Math.min(1, volumes[volumeType] + 0.1); 
                volumes[volumeType] = parseFloat(volumes[volumeType].toFixed(1)); 
            } 
        } localStorage.setItem('gameVolumes', JSON.stringify(volumes)); 
    }
    else if (gameState === 'gameOver') { 
        if (isInside(gamePos, gameOverButtons.tryAgain)) resetGame(); 
        if (isInside(gamePos, gameOverButtons.ranking)) gameState = 'ranking'; 
        if (isInside(gamePos, gameOverButtons.mainMenu)) gameState = 'menu'; 
    }
});
// MODIFICADO: 'mousemove' agora usa mapToGameCoords
gameCanvas.addEventListener('mousemove', (e) => {
    const mouse = { 
        x: e.clientX - gameCanvas.getBoundingClientRect().left, 
        y: e.clientY - gameCanvas.getBoundingClientRect().top 
    };
    const gamePos = mapToGameCoords(mouse);
    if (!gamePos) {
        hoveredButton = null;
        return;
    }

    let foundButton = null;
    const getActiveButtons = () => { 
        if (gameState === 'menu') return Object.values(menuButtons); 
        if (gameState === 'ranking') return [backButton]; 
        if (gameState === 'settings') return [backButton, ...Object.values(settingsButtons)]; 
        if (gameState === 'gameOver') return Object.values(gameOverButtons); return []; 
    };
    const activeButtons = getActiveButtons();
    for (const button of activeButtons) { 
        if (isInside(gamePos, button)) { 
            foundButton = button; break; 
        } 
    }
    hoveredButton = foundButton;
});

// --- NOVOS: Listeners de Toque ---
function updateTouchControls(e) {
    // Reseta todos os estados de toque
    touchLeft = false;
    touchRight = false;
    Object.values(virtualControls).forEach(btn => btn.pressed = false);

    for (let i = 0; i < e.touches.length; i++) {
        const pos = getTouchPos(gameCanvas, e, i);
        const gamePos = mapToGameCoords(pos);
        if (!gamePos) continue;

        // Verifica botões virtuais
        if (isInside(gamePos, virtualControls.left)) {
            virtualControls.left.pressed = true;
            touchLeft = true;
        }
        if (isInside(gamePos, virtualControls.right)) {
            virtualControls.right.pressed = true;
            touchRight = true;
        }
        if (isInside(gamePos, virtualControls.fire)) {
            virtualControls.fire.pressed = true;
        }
    }
}

gameCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!audioEnabled) audioEnabled = true;
    
    if (gameState === 'playing') {
        updateTouchControls(e);
    }
}, { passive: false });

gameCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (gameState === 'playing') {
        updateTouchControls(e);
    }
}, { passive: false });

gameCanvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    
    // Se for o último dedo saindo, o 'e.touches' estará vazio
    // Precisamos reavaliar os botões com base nos dedos restantes
    if (gameState === 'playing') {
        updateTouchControls(e);
    }

    // --- Lógica de clique no menu ---
    // Pega o primeiro dedo que saiu da tela
    const pos = getTouchPos(gameCanvas, e, 0); 
    const gamePos = mapToGameCoords(pos);
    if (!gamePos) return;

    if (gameState === 'menu') { 
        if (isInside(gamePos, menuButtons.play)) resetGame(); 
        if (isInside(gamePos, menuButtons.ranking)) gameState = 'ranking'; 
        if (isInside(gamePos, menuButtons.settings)) gameState = 'settings'; 
    }
    else if (gameState === 'ranking') { 
        if (isInside(gamePos, backButton)) gameState = 'menu'; 
    }
    else if (gameState === 'settings') { 
        if (isInside(gamePos, backButton)) gameState = 'menu'; 
        for (const key in settingsButtons) { 
            if (isInside(gamePos, settingsButtons[key])) { 
                const [action, volumeType] = key.split('_'); 
                if (action === 'minus') volumes[volumeType] = Math.max(0, volumes[volumeType] - 0.1); 
                if (action === 'plus') volumes[volumeType] = Math.min(1, volumes[volumeType] + 0.1); 
                volumes[volumeType] = parseFloat(volumes[volumeType].toFixed(1)); 
            } 
        } localStorage.setItem('gameVolumes', JSON.stringify(volumes)); 
    }
    else if (gameState === 'gameOver') { 
        if (isInside(gamePos, gameOverButtons.tryAgain)) resetGame(); 
        if (isInside(gamePos, gameOverButtons.ranking)) gameState = 'ranking'; 
        if (isInside(gamePos, gameOverButtons.mainMenu)) gameState = 'menu'; 
    }
}, false);

gameCanvas.addEventListener('touchcancel', (e) => {
    e.preventDefault();
    // Trata como touchend
    if (gameState === 'playing') {
        updateTouchControls(e);
    }
}, false);

// NOVO: Listener de resize para o bgCanvas
window.addEventListener('resize', () => {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
    createStars(300); // Recria estrelas na nova dimensão
    
    // Recalcula o scale do canvas do jogo
    canvasRect = gameCanvas.getBoundingClientRect();
    scaleX = gameCanvas.width / canvasRect.width;
    scaleY = gameCanvas.height / canvasRect.height;
});

// --- Game Loop Principal ---
async function main() {
    await document.fonts.load(`1em ${FONT_FAMILY}`);
    await preloadAudio();
    initializePlayer();
    createAllSprites();
    function gameLoop() {
        drawAndUpdateStars();
        ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
        
        // Otimização: Só checa hover do mouse se não for mobile (opcional)
        // if (!('ontouchstart' in window)) { ... }
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

main();