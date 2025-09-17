// =================================================================================
// Versão 8.6 - O CÓDIGO COMPLETO (FINALMENTE)
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
function createStars(count) { 
    for (let i = 0; i < count; i++) 
        { stars.push({ x: Math.random() * bgCanvas.width, y: Math.random() * bgCanvas.height, radius: Math.random() * 1.5 + 0.5, speed: Math.random() * 0.4 + 0.1 }); 
    } 
}
function drawAndUpdateStars() { 
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height); 
    bgCtx.fillStyle = '#FFFFFF'; 
    stars.forEach(star => { 
        star.y += star.speed; 
        if (star.y > bgCanvas.height) { 
            star.y = 0; star.x = Math.random() * bgCanvas.width; 
        } 
        bgCtx.beginPath(); 
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
const POWER_UP_DURATION = 5000;
const keys = {};
let uiActionInProgress = false;
let nextLifeScore = 1000;
let hoveredButton = null;

// --- Funções de Inicialização e Reset ---
function initializePlayer() { 
    player = { x: gameCanvas.width / 2 - 25, y: gameCanvas.height - 70, width: 50, height: 25, baseWidth: 50, speed: 5, doubleShot: false, isHit: false, hitTimer: 0 }; 
}
// resetGame
function resetGame() {
    score = 0;
    lives = 2; // <-- ALTERADO DE 3 PARA 2
    level = 1;
    enemySpeed = 1.5;
    nextLifeScore = 1000; // <-- ADICIONADO: Reseta o placar para a próxima vida
    bullets = [];
    enemyBullets = [];
    enemies = [];
    powerUps = [];
    initializePlayer();
    powerUpTimers = { doubleShot: 0, wideShip: 0, piercing: 0 };
    bulletType = "normal";
    highScoreFormContainer.classList.add("hidden");
    createEnemies();
    gameState = 'playing';
}
// Substitua sua função createEnemies por esta:
function createEnemies() {
    const eRows = 4, eCols = 10, eSize = 35;
    enemies = []; // Limpa o array antes de preencher
    for (let r = 0; r < eRows; r++) {
        for (let c = 0; c < eCols; c++) {
            const isSpecial = Math.random() < 0.1;
            enemies.push({
                x: c * (eSize + 15) + 60,
                y: r * (eSize + 15) + 50,
                width: eSize,
                height: eSize,
                isSpecial: isSpecial,
                points: isSpecial ? 60 : 10 // <-- ALTERADO DE 500/60 PARA 100/10
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
function handlePlayerMovement() { 
    if (keys["ArrowLeft"] && player.x > 0) player.x -= player.speed; 
    if (keys["ArrowRight"] && player.x + player.width < gameCanvas.width) player.x += player.speed; 
}
function handleShooting() { 
    if (keys[" "] && Date.now() - lastShotTime > shotInterval) { shootBullet(); lastShotTime = Date.now(); } 
}
function shootBullet() {
    playSound('shoot');
    const base = {
        y: player.y,
        width: 5,
        height: 15,
        type: bulletType,
        speed: bulletType === "piercing" ? 9 : 7
    };
    // 1. Tiro(s) Central(is)
    // Sempre dispara pelo menos um tiro central
    bullets.push({ ...base, x: player.x + player.width / 2 - base.width / 2 });
    // Adiciona um segundo tiro central se o doubleShot estiver ativo
    if (player.doubleShot) {
        bullets.push({ ...base, x: player.x + player.width / 2 - base.width / 2 + 10 }); // Leve desvio para não sobrepor
    }
    // 2. Tiros Diagonais se wideShip estiver ativo
    if (player.width > player.baseWidth) {
        bullets.push({ ...base, x: player.x, angle: -0.25 }); // Tiro diagonal esquerdo
        bullets.push({ ...base, x: player.x + player.width - base.width, angle: 0.25 }); // Tiro diagonal direito
    }
}
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.y -= b.speed;
        // LÓGICA: Move o projétil no eixo X se ele tiver um ângulo
        if (b.angle) {
            b.x += b.angle * b.speed;
        }

        if (b.y < 0) {
            bullets.splice(i, 1);
        }
    }
}
function updateEnemies() { 
    let hitEdge = false; enemies.forEach(e => { e.x += enemyDirection * enemySpeed; if (e.x < 0 || e.x + e.width > gameCanvas.width) hitEdge = true; }); 
    if (hitEdge) { enemyDirection *= -1; enemies.forEach(e => { e.y += 20; if (e.y + e.height >= player.y) endGame(); }); } 
}
function handleEnemyShooting() { 
    if (Math.random() < 0.003 + (level * 0.0005) && enemies.length > 0) { const shooter = enemies[Math.floor(Math.random() * enemies.length)]; 
        enemyBullets.push({ x: shooter.x + shooter.width / 2 - 2, y: shooter.y + shooter.height, width: 4, height: 12, speed: 4.5 + level * 0.2 }); 
    } 
}
function updateEnemyBullets() { 
    for (let i = enemyBullets.length - 1; i >= 0; i--) { enemyBullets[i].y += enemyBullets[i].speed; 
        if (enemyBullets[i].y > gameCanvas.height) enemyBullets.splice(i, 1); 
    } 
}
function spawnPowerUp() {
    if (Math.random() < 0.01 + level * 0.002) {
        // REBALANCEAMENTO: "bomb" é mais raro que os outros.
        const types = [
            "doubleShot", "wideShip", "piercing",
            "doubleShot", "wideShip", "piercing",
            "doubleShot", "wideShip", "piercing",
            "bomb" 
        ];
        const type = types[Math.floor(Math.random() * types.length)];
        // REBALANCEAMENTO: "bomb" é o power-up mais rápido.
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

                // LÓGICA DE VIDA EXTRA ADICIONADA AQUI
                if (score >= nextLifeScore) {
                    lives++;
                    nextLifeScore += 1000; // Define o próximo marco
                    // Pode adicionar um som de "vida extra" aqui se quiser!
                }

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
// MODIFIQUE SUA FUNÇÃO drawGame para ficar assim:
function drawGame() {
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
    drawPlayer();
    bullets.forEach(drawPlayerBullet); // Usa a nova função de míssil
    enemies.forEach(drawEnemy);
    enemyBullets.forEach(drawEnemyBullet); // Usa a nova função de plasma
    powerUps.forEach(drawPowerUp);
    drawHUD();
    drawPowerUpHUD();
}
function drawPlayer() {
    if (player.isHit && Math.floor((Date.now() - player.hitTimer) / 100) % 2 === 0) return;
    
    setNeonStyle(colors.player);
    ctx.beginPath();
    
    // Corpo principal da nave
    ctx.moveTo(player.x + player.width / 2, player.y); // Ponta do nariz
    ctx.lineTo(player.x, player.y + player.height * 0.8); // Asa esquerda
    ctx.lineTo(player.x + player.width * 0.2, player.y + player.height); // Traseira esquerda
    ctx.lineTo(player.x + player.width * 0.8, player.y + player.height); // Traseira direita
    ctx.lineTo(player.x + player.width, player.y + player.height * 0.8); // Asa direita
    ctx.closePath();
    ctx.fill();

    // Detalhe da cabine
    ctx.fillStyle = colors.background;
    ctx.fillRect(player.x + player.width / 2 - 5, player.y + 12, 10, 8);
    
    resetShadow();
}
// ADICIONE ESTA FUNÇÃO COMPLETA AO SEU CÓDIGO
function drawPowerUpHUD() {
    const now = Date.now();
    // Filtra apenas os poderes que estão realmente ativos
    const active = Object.entries(powerUpTimers).filter(([type, end]) => end > 0 && end > now);
    
    if (active.length === 0) return;

    let yPos = 60;
    ctx.font = `bold 14px ${FONT_FAMILY}`;
    ctx.textAlign = 'start';
    setNeonStyle(colors.text, 3);
    ctx.fillText("PODERES ATIVOS:", 10, yPos);
    resetShadow();
    yPos += 5;

    active.forEach(([type, end]) => {
        yPos += 25;
        const timeLeft = Math.max(0, end - now);
        const percent = timeLeft / POWER_UP_DURATION;
        
        // Barra de fundo
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.fillRect(10, yPos, 150, 10);
        
        // Barra de tempo
        ctx.fillStyle = colors.player;
        ctx.fillRect(10, yPos, 150 * percent, 10);

        // Texto do poder
        setNeonStyle(colors.text, 3);
        ctx.font = `12px ${FONT_FAMILY}`;
        ctx.fillText(type.toUpperCase(), 170, yPos + 9);
        resetShadow();
    });
}
// drawEnemy
function drawEnemy(e) {
    const w = e.width;
    const h = e.height;
    const centerX = e.x + w / 2;
    const centerY = e.y + h / 2;

    // Define a cor base do UFO (prata ou dourado)
    const ufoBodyColor = e.isSpecial ? colors.enemySpecial : '#C0C0C0'; // Prata para o básico
    
    // --- Desenho do UFO ---
    setNeonStyle(ufoBodyColor, 8);
    
    // 1. Corpo prateado do UFO (disco)
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + 5, w / 2, h / 4, 0, 0, Math.PI * 2);
    ctx.fill();
    resetShadow();

    // 2. Cabeça do Alien (verde)
    ctx.fillStyle = colors.player; // Reutilizando o verde do jogador
    ctx.beginPath();
    ctx.arc(centerX, centerY, w / 8, 0, Math.PI * 2);
    ctx.fill();

    // 3. Cúpula de vidro semi-transparente
    ctx.fillStyle = 'rgba(200, 220, 255, 0.4)'; // Azul-claro com 40% de opacidade
    ctx.beginPath();
    ctx.arc(centerX, centerY, w / 4, Math.PI, 0); // Semicírculo
    ctx.fill();

    // 4. Brilho na cúpula para dar o efeito de vidro
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(centerX - w * 0.1, centerY - h * 0.1, w / 12, 0, Math.PI * 2);
    ctx.fill();
}
// Bala do player
function drawPlayerBullet(b) {
    setNeonStyle(colors.bulletPlayer, 8);
    ctx.beginPath();
    // Corpo do míssil
    ctx.rect(b.x, b.y, b.width, b.height);
    // Ponta
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x + b.width / 2, b.y - 5);
    ctx.lineTo(b.x + b.width, b.y);
    // "Asas" traseiras
    ctx.moveTo(b.x, b.y + b.height);
    ctx.lineTo(b.x - 2, b.y + b.height + 4);
    ctx.lineTo(b.x + 2, b.y + b.height);
    ctx.moveTo(b.x + b.width, b.y + b.height);
    ctx.lineTo(b.x + b.width - 2, b.y + b.height);
    ctx.lineTo(b.x + b.width + 2, b.y + b.height + 4);
    ctx.fill();
    resetShadow();
}

// Bala do inimigo
function drawEnemyBullet(b) {
    const centerX = b.x + b.width / 2;
    const centerY = b.y + b.height / 2;

    // 1. ANIMAÇÃO: O raio do tiro muda aleatoriamente a cada frame para criar um efeito de pulsação.
    // O tamanho vai variar entre 120% e 160% do tamanho base.
    const pulseRadius = b.width * (1.2 + Math.random() * 0.4);

    // 2. COR: Cria um gradiente radial para o efeito "mini-sol".
    const gradient = ctx.createRadialGradient(
        centerX, centerY, 0, // Ponto inicial (centro do tiro, raio 0)
        centerX, centerY, pulseRadius // Ponto final (centro do tiro, raio pulsante)
    );

    // Adiciona as cores ao gradiente
    gradient.addColorStop(0, 'white');         // Núcleo superaquecido branco
    gradient.addColorStop(0.4, '#FFD700');     // Meio do gradiente dourado/amarelo
    gradient.addColorStop(1, colors.bulletEnemy); // Borda com a cor original do tiro inimigo

    // 3. DESENHO: Aplica o gradiente e o brilho neon.
    ctx.shadowColor = colors.bulletEnemy;
    ctx.shadowBlur = 15;
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
    ctx.fill();

    resetShadow();
}
// ========================================================================
// NOVAS FUNÇÕES DE DESENHO DOS ÍCONES (VERSÃO FINAL)
// ========================================================================

function drawDoubleShotIcon(ctx, x, y, size) {
    // Desenha dois mísseis com espaçamento e cores diferentes
    const missileWidth = size * 0.15;
    const missileHeight = size * 0.6;

    // Função auxiliar para desenhar um míssil
    const drawMissile = (mx) => {
        // Corpo do míssil (verde, como o do jogador)
        ctx.fillStyle = colors.player;
        ctx.beginPath();
        ctx.rect(mx, y - missileHeight / 2, missileWidth, missileHeight);
        ctx.fill();
        
        // Ponta do míssil (branca e brilhante)
        setNeonStyle('#FFFFFF', 5);
        ctx.beginPath();
        ctx.moveTo(mx, y - missileHeight / 2);
        ctx.lineTo(mx + missileWidth / 2, y - missileHeight / 2 - 6);
        ctx.lineTo(mx + missileWidth, y - missileHeight / 2);
        ctx.fill();
        resetShadow();
    };

    // Desenha os dois mísseis com um espaçamento claro entre eles
    drawMissile(x - size * 0.3); // Míssil da Esquerda
    drawMissile(x + size * 0.15); // Míssil da Direita
}

function drawWideShipIcon(ctx, x, y, size) {
    // Desenha um escudo com múltiplas cores
    // Camada de fundo do escudo (branca)
    setNeonStyle('#FFFFFF', 15);
    ctx.beginPath();
    ctx.moveTo(x - size * 0.4, y - size * 0.5); 
    ctx.lineTo(x + size * 0.4, y - size * 0.5); 
    ctx.lineTo(x + size * 0.4, y + size * 0.2); 
    ctx.quadraticCurveTo(x, y + size * 0.6, x - size * 0.4, y + size * 0.2); 
    ctx.closePath();
    ctx.fill();
    resetShadow();

    // Camada da frente do escudo (roxa)
    setNeonStyle(colors.powerup, 10);
    ctx.beginPath();
    ctx.moveTo(x - size * 0.3, y - size * 0.4); 
    ctx.lineTo(x + size * 0.3, y - size * 0.4); 
    ctx.lineTo(x + size * 0.3, y + size * 0.15); 
    ctx.quadraticCurveTo(x, y + size * 0.45, x - size * 0.3, y + size * 0.15); 
    ctx.closePath();
    ctx.fill();
    resetShadow();
}

function drawPiercingIcon(ctx, x, y, size) {
    // Flecha com ponta simétrica e grande
    // Corpo da flecha (roxo)
    ctx.fillStyle = colors.powerup;
    ctx.fillRect(x - 2, y - size * 0.1, 4, size * 0.6);

    // Ponta da flecha (branca e afiada)
    setNeonStyle('#FFFFFF', 10);
    ctx.beginPath();
    ctx.moveTo(x, y - size * 0.5); // Ponta de cima
    ctx.lineTo(x + size * 0.4, y); // Canto direito da ponta
    ctx.lineTo(x - size * 0.4, y); // Canto esquerdo da ponta
    ctx.closePath();
    ctx.fill();
    resetShadow();
}

function drawNukeIcon(ctx, x, y, size) {
    // Nuke com corpo, cauda e aletas
    // Aletas da cauda (prata)
    ctx.fillStyle = '#A9A9A9'; // Cinza escuro
    ctx.beginPath();
    ctx.moveTo(x - size * 0.4, y - size * 0.5);
    ctx.lineTo(x - size * 0.2, y - size * 0.3);
    ctx.lineTo(x, y - size * 0.5);
    ctx.moveTo(x + size * 0.4, y - size * 0.5);
    ctx.lineTo(x + size * 0.2, y - size * 0.3);
    ctx.lineTo(x, y - size * 0.5);
    ctx.fill();
    
    // Corpo da cauda (a parte "quadrada")
    ctx.fillStyle = '#C0C0C0'; // Prata
    ctx.fillRect(x - size * 0.2, y - size * 0.3, size * 0.4, size * 0.4);

    // Corpo principal da bomba (amarelo/dourado)
    setNeonStyle(colors.enemySpecial, 15);
    ctx.beginPath();
    ctx.arc(x, y + size * 0.1, size * 0.35, 0, Math.PI * 2);
    ctx.fill();
    resetShadow();
}


// --- FUNÇÃO drawPowerUp PRINCIPAL (SUBSTITUA A SUA POR ESTA) ---
function drawPowerUp(p) {
    const centerX = p.x + p.width / 2;
    const centerY = p.y + p.height / 2;
    const size = p.width; // O tamanho base para o ícone

    ctx.beginPath();

    switch (p.type) {
        case 'doubleShot':
            drawDoubleShotIcon(ctx, centerX, centerY, size);
            break;
        case 'wideShip':
            drawWideShipIcon(ctx, centerX, centerY, size);
            break;
        case 'piercing':
            drawPiercingIcon(ctx, centerX, centerY, size);
            break;
        case 'bomb':
            drawNukeIcon(ctx, centerX, centerY, size);
            break;
    }
}
function drawHUD() { 
    setNeonStyle(colors.text, 5); 
    ctx.font = `20px ${FONT_FAMILY}`; 
    ctx.textAlign = 'start'; 
    ctx.fillText(`PONTUAÇÃO: ${score}`, 10, 30); 
    ctx.textAlign = 'center'; 
    ctx.fillText(`NÍVEL: ${level}`, gameCanvas.width / 2, 30); 
    ctx.textAlign = 'end'; 
    ctx.fillText(`VIDAS: ${lives}`, gameCanvas.width - 10, 30); 
    resetShadow(); 
}

// --- Funções de UI (Menus, Telas) ---
const menuButtons = { 
    play: { x: 300, y: 300, width: 200, height: 50, text: 'JOGAR' }, 
    ranking: { x: 300, y: 370, width: 200, height: 50, text: 'RANKING' }, 
    settings: { x: 300, y: 440, width: 200, height: 50, text: 'OPÇÕES' } };
const backButton = { x: 300, y: 500, width: 200, height: 50, text: 'VOLTAR' };
const gameOverButtons = { 
    tryAgain: { x: 300, y: 280, width: 200, height: 50, text: 'JOGAR NOVAMENTE' }, 
    ranking: { x: 300, y: 350, width: 200, height: 50, text: 'RANKING' }, 
    mainMenu: { x: 300, y: 420, width: 200, height: 50, text: 'MENU' } 
};
let settingsButtons = {};

function drawMenu() {
    // 1. Desenha o fundo da tela de menu
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    // 2. Desenha o título principal em duas linhas
    setNeonStyle(colors.glow, 15);
    ctx.font = `bold 80px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.fillText('SPACE', gameCanvas.width / 2, 160);
    ctx.fillText('INVADERS', gameCanvas.width / 2, 240);
    resetShadow();
    
    // 3. Desenha os botões do menu
    Object.values(menuButtons).forEach(b => drawButton(b));
}
function getActiveButtons() {
    if (gameState === 'menu') return Object.values(menuButtons);
    if (gameState === 'ranking') return [backButton];
    if (gameState === 'settings') return [backButton, ...Object.values(settingsButtons)];
    if (gameState === 'gameOver') return Object.values(gameOverButtons); // Agora usa a constante
    return [];
}
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
    
    settingsButtons = {};
    let y = 180;
    const totalContentWidth = 380; // Largura total do bloco de controle de volume
    const startX = (gameCanvas.width - totalContentWidth) / 2;

    for (const key in volumes) {
        const text = `${key.charAt(0).toUpperCase() + key.slice(1)}: ${Math.round(volumes[key] * 100)}%`;

        // Botão de diminuir (-)
        const minusBtn = { x: startX, y: y - 25, width: 50, height: 40, text: '-' };
        settingsButtons[`minus_${key}`] = minusBtn;
        drawButton(minusBtn);

        // Texto
        setNeonStyle(colors.text, 5);
        ctx.font = `22px ${FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.fillText(text, startX + (totalContentWidth / 2), y);
        resetShadow();

        // Botão de aumentar (+)
        const plusBtn = { x: startX + totalContentWidth - 50, y: y - 25, width: 50, height: 40, text: '+' };
        settingsButtons[`plus_${key}`] = plusBtn;
        drawButton(plusBtn);
        
        y += 60;
    }
    ctx.textAlign = 'start';
}
function drawGameOver() {
    drawScreenTemplate('FIM DE JOGO', 150, gameOverButtons, 60); 
    setNeonStyle(colors.text, 5);
    ctx.font = `24px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.fillText(`PONTUAÇÃO FINAL: ${score}`, gameCanvas.width / 2, 220);
    resetShadow();
}
function drawScreenTemplate(title, y, buttons, fontSize) {
    // 1. Desenha o fundo da tela
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    // 2. Desenha o título (para telas como Ranking, Opções, Fim de Jogo)
    if (title) { // Apenas desenha se um título for fornecido
        setNeonStyle(colors.glow, 15);
        ctx.font = `bold ${fontSize}px ${FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.fillText(title, gameCanvas.width / 2, y);
        resetShadow();
    }
    
    // 3. Desenha os botões da tela
    Object.values(buttons).forEach(b => drawButton(b));
}
// Botões
function drawButton(b) {
    // CORREÇÃO: Compara as propriedades do botão (posição e texto), em vez da referência do objeto.
    // Isso garante que o hover funcione para botões que são recriados a cada frame, como os de volume.
    const isHovered = hoveredButton && b.x === hoveredButton.x && b.y === hoveredButton.y && b.text === hoveredButton.text;
    const scale = isHovered ? 1.05 : 1.0; 
    
    const newWidth = b.width * scale;
    const newHeight = b.height * scale;
    const newX = b.x - (newWidth - b.width) / 2;
    const newY = b.y - (newHeight - b.height) / 2;

    if (isHovered) {
        // --- ESTADO HOVER ---
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = 20;
        ctx.fillStyle = colors.player;
        drawRoundedRect(newX, newY, newWidth, newHeight, 12);
        ctx.fill();
        resetShadow();
        ctx.fillStyle = colors.background;
        ctx.font = `bold ${b.text.length > 10 ? '17' : '19'}px ${FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.fillText(b.text, newX + newWidth / 2, newY + newHeight / 2 + 8);

    } else {
        // --- ESTADO NORMAL ---
        setNeonStyle(colors.glow, 10);
        ctx.strokeStyle = colors.glow;
        ctx.lineWidth = 2;
        drawRoundedRect(b.x, b.y, b.width, b.height, 10);
        ctx.stroke();
        ctx.fillStyle = colors.glow;
        ctx.font = `bold ${b.text.length > 10 ? '16' : '18'}px ${FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.fillText(b.text, b.x + b.width / 2, b.y + b.height / 2 + 8);
    }
    resetShadow();
    ctx.textAlign = 'start';
}
function drawRoundedRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r); ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r); ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r); ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath(); }

// --- Lógica de High Score ---
function getHighScores() { return JSON.parse(localStorage.getItem("highScores")) || []; }
function checkIfHighScore(s) { const hs = getHighScores(); return s > 0 && (hs.length < 5 || s > hs[hs.length - 1].score); }
function saveHighScore(name, newScore) { const hs = getHighScores(); hs.push({ name, score: newScore }); hs.sort((a, b) => b.score - a.score); localStorage.setItem("highScores", JSON.stringify(hs.slice(0, 5))); }

// --- Event Listeners ---
document.addEventListener("keydown", (e) => { keys[e.key] = true; if (!audioEnabled) audioEnabled = true; });
document.addEventListener("keyup", (e) => { keys[e.key] = false; });
highScoreForm.addEventListener("submit", (e) => { e.preventDefault(); saveHighScore(playerNameInput.value.toUpperCase().slice(0, 5) || "AAA", score); highScoreFormContainer.classList.add("hidden"); gameState = 'gameOver'; uiActionInProgress = true;});
gameCanvas.addEventListener('click', (e) => {
    if (uiActionInProgress) {
        uiActionInProgress = false;
        return;
    }
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
// Substitua seu event listener 'mousemove' por este:
gameCanvas.addEventListener('mousemove', (e) => {
    const mouse = { x: e.clientX - gameCanvas.getBoundingClientRect().left, y: e.clientY - gameCanvas.getBoundingClientRect().top };
    const isInside = (p, b) => p.x > b.x && p.x < b.x + b.width && p.y > b.y && p.y < b.y + b.height;

    const activeButtons = getActiveButtons();
    let foundButton = null;

    for (const button of activeButtons) {
        if (isInside(mouse, button)) {
            foundButton = button;
            break;
        }
    }
    
    hoveredButton = foundButton; // Atualiza a variável global
});

// --- Game Loop Principal ---
async function main() {
    await document.fonts.load(`1em ${FONT_FAMILY}`);
    function gameLoop() {
        drawAndUpdateStars();
        ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
        // Gerencia o cursor do mouse com base no estado do hoveredButton
        if (hoveredButton) {
            gameCanvas.style.cursor = 'pointer';
        } else {
            gameCanvas.style.cursor = 'default';
        }
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