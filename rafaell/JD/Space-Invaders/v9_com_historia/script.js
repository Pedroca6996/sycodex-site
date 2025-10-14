// Aguarda o carregamento do DOM para iniciar
window.addEventListener('load', function() {
    // --- ELEMENTOS DO DOM ---
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const startScreen = document.getElementById('startScreen');
    const endScreen = document.getElementById('endScreen');
    const gameUI = document.getElementById('gameUI');
    const startButton = document.getElementById('startButton');
    const restartButton = document.getElementById('restartButton');
    const scoreEl = document.getElementById('score');
    const phaseEl = document.getElementById('phase');
    const timerEl = document.getElementById('timer');
    const hitsEl = document.getElementById('hits');
    const endTitleEl = document.getElementById('endTitle');
    const endMessageEl = document.getElementById('endMessage');

    // --- CONFIGURAÇÕES DO JOGO ---
    canvas.width = 800;
    canvas.height = 600;

    // --- ESTADO DO JOGO ---
    let gameState = {
        running: false,
        paused: false,
        score: 0,
        hits: 0,
        currentRound: 1,
        startTime: 0,
        enemiesKilledForPowerUp: 0,
        isBossFight: false,
    };

    let keys = {}; // Objeto para armazenar as teclas pressionadas

    // --- CLASSES E OBJETOS DO JOGO ---

    // CLASSE DO JOGADOR (NAVE GEODE)
    class Player {
        constructor() {
            this.width = 52;
            this.height = 48;
            this.x = canvas.width / 2 - this.width / 2;
            this.y = canvas.height - this.height - 20;
            this.speed = 7;
            this.isHit = false;
            this.invincibilityTimer = 0;
            this.shootCooldown = 0;
            this.rapidFireActive = false;
            this.rapidFireTimer = 0;
        }

        draw() {
            ctx.fillStyle = '#d3d3d3'; // Light gray
            ctx.beginPath();
            // Corpo principal hexagonal
            ctx.moveTo(this.x + this.width * 0.5, this.y);
            ctx.lineTo(this.x + this.width, this.y + this.height * 0.3);
            ctx.lineTo(this.x + this.width, this.y + this.height * 0.7);
            ctx.lineTo(this.x + this.width * 0.5, this.y + this.height);
            ctx.lineTo(this.x, this.y + this.height * 0.7);
            ctx.lineTo(this.x, this.y + this.height * 0.3);
            ctx.closePath();
            ctx.fill();
            // Cockpit
            ctx.fillStyle = '#00f0ff';
            ctx.beginPath();
            ctx.moveTo(this.x + this.width * 0.5, this.y + this.height * 0.1);
            ctx.lineTo(this.x + this.width * 0.7, this.y + this.height * 0.3);
            ctx.lineTo(this.x + this.width * 0.3, this.y + this.height * 0.3);
            ctx.closePath();
            ctx.fill();

            if (this.isHit) {
                ctx.strokeStyle = this.rapidFireActive ? '#ffdd00' : '#00f0ff';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 1.5, 0, Math.PI * 2);
                ctx.stroke();
            } else if (this.rapidFireActive) {
                ctx.strokeStyle = '#ffdd00';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 1.5, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        update() {
            if (keys['ArrowLeft'] || keys['a']) this.x -= this.speed;
            if (keys['ArrowRight'] || keys['d']) this.x += this.speed;
            if (this.x < 0) this.x = 0;
            if (this.x > canvas.width - this.width) this.x = canvas.width - this.width;

            if (this.shootCooldown > 0) this.shootCooldown--;
            if (keys[' '] && this.shootCooldown === 0) this.shoot();
            
            if (this.isHit) {
                this.invincibilityTimer--;
                if (this.invincibilityTimer <= 0) this.isHit = false;
            }
            if(this.rapidFireActive){
                this.rapidFireTimer--;
                if(this.rapidFireTimer <= 0) this.rapidFireActive = false;
            }
        }

        shoot() {
            bullets.push(new Bullet(this.x + this.width / 2 - 2.5, this.y, 5, 10, '#00f0ff', -10));
            this.shootCooldown = this.rapidFireActive ? 5 : 20;
        }

        hit() {
            if (!this.isHit) {
                this.isHit = true;
                this.invincibilityTimer = 120; // 2s
                gameState.hits++;
            }
        }
        
        activateRapidFire() {
            this.rapidFireActive = true;
            this.rapidFireTimer = 300; // 5s
        }
    }

    class Bullet { /* ... (sem alterações) ... */ }

    // CLASSE DOS INIMIGOS
    class Enemy {
        constructor(x, y, type) {
            this.x = x;
            this.y = y;
            this.type = type;
            if (type === 'Sonda') {
                this.width = 35; this.height = 30; this.color = '#ff4500';
            } else if (type === 'Comando') {
                this.width = 45; this.height = 40; this.color = '#da70d6';
            }
        }

        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            if (this.type === 'Sonda') {
                ctx.moveTo(this.x + this.width / 2, this.y);
                ctx.lineTo(this.x + this.width, this.y + this.height);
                ctx.lineTo(this.x, this.y + this.height);
            } else { // Comando
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x + this.width, this.y);
                ctx.lineTo(this.x + this.width * 0.75, this.y + this.height);
                ctx.lineTo(this.x + this.width * 0.25, this.y + this.height);
            }
            ctx.closePath();
            ctx.fill();
        }

        update(speedX) {
            this.x += speedX;
        }
    }

    // CLASSE DOS CHEFÕES
    class Boss extends Enemy {
        constructor(type) {
            let width, height, health, color;
            if (type === 1) { // Broca Criogênica
                width = 100; height = 150; health = 100; color = '#add8e6';
            } else { // Supervisor Cryo
                width = 150; height = 100; health = 150; color = '#8a2be2';
            }
            super(canvas.width / 2 - width / 2, 50, 'Boss');
            this.width = width; this.height = height;
            this.health = health; this.maxHealth = health; this.color = color;
            this.speedX = 2; this.shootTimer = 0;
            this.bossType = type;
        }

        draw() {
            // Desenho do Chefão
            ctx.fillStyle = this.color;
            if (this.bossType === 1) { // Broca
                ctx.fillRect(this.x, this.y, this.width, this.height * 0.8);
                ctx.beginPath();
                ctx.moveTo(this.x, this.y + this.height * 0.8);
                ctx.lineTo(this.x + this.width, this.y + this.height * 0.8);
                ctx.lineTo(this.x + this.width / 2, this.y + this.height);
                ctx.closePath();
                ctx.fill();
            } else { // Supervisor
                ctx.fillRect(this.x, this.y, this.width, this.height);
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(this.x + this.width/2 - 15, this.y + this.height/2 - 5, 30, 10);
            }

            // Barra de Vida
            ctx.fillStyle = 'red';
            ctx.fillRect(canvas.width / 4, 20, canvas.width / 2, 20);
            ctx.fillStyle = 'green';
            ctx.fillRect(canvas.width / 4, 20, (canvas.width / 2) * (this.health / this.maxHealth), 20);
        }

        update() {
            this.x += this.speedX;
            if (this.x <= 0 || this.x + this.width >= canvas.width) this.speedX *= -1;

            this.shootTimer--;
            if (this.shootTimer <= 0) {
                if (this.bossType === 1) { // Broca dispara 3 tiros
                    for(let i = 0; i < 3; i++){
                        enemyBullets.push(new Bullet(this.x + (i * this.width/2), this.y + this.height, 8, 15, '#ff5555', 4));
                    }
                    this.shootTimer = 80;
                } else { // Supervisor dispara rajada
                     for(let i = 0; i < 5; i++){
                        enemyBullets.push(new Bullet(this.x + (i * this.width/4), this.y + this.height, 6, 12, '#ff00ff', 6));
                    }
                    this.shootTimer = 60;
                }
            }
        }

        takeDamage(amount) {
            this.health -= amount;
        }
    }


    // --- VARIÁVEIS DO JOGO ---
    let player, bullets, enemies, enemyBullets, boss;
    let enemyDirection = 1, enemySpeedX = 1;

    // --- FUNÇÕES DE SETUP ---
    function setupNormalRound(round) {
        gameState.isBossFight = false;
        enemies = [];
        enemySpeedX = 1 + (round * 0.2);
        let rows = 5, cols = 10;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                let x = c * 60 + 50, y = r * 50 + 50;
                let type = (r < 2) ? 'Comando' : 'Sonda';
                enemies.push(new Enemy(x, y, type));
            }
        }
    }
    
    function setupBossFight(bossType) {
        gameState.isBossFight = true;
        enemies = []; // Limpa inimigos normais
        boss = new Boss(bossType);
        phaseEl.textContent = `CHEFE ${bossType}`;
    }

    // --- FUNÇÕES PRINCIPAIS DO JOGO ---
    function startGame() {
        Object.assign(gameState, {
            running: true, paused: false, score: 0, hits: 0, currentRound: 1,
            enemiesKilledForPowerUp: 0, isBossFight: false,
        });
        gameState.startTime = Date.now();
        player = new Player();
        bullets = []; enemyBullets = []; boss = null;
        setupNormalRound(gameState.currentRound);

        startScreen.classList.add('hidden');
        endScreen.classList.add('hidden');
        gameUI.classList.remove('hidden');
        canvas.classList.remove('hidden');
        
        gameLoop();
    }

    function endGame(isVictory) {
        gameState.running = false;
        // ... (lógica de tela final igual a anterior)
    }

    function onEnemyKilled() {
        gameState.score += 10;
        gameState.enemiesKilledForPowerUp++;
        if (gameState.enemiesKilledForPowerUp >= 10) {
            player.activateRapidFire();
            gameState.enemiesKilledForPowerUp = 0;
        }

        if(!gameState.isBossFight && enemies.length === 0){
            gameState.currentRound++;
            // Lógica de qual round carregar
            if (gameState.currentRound === 4) {
                setupBossFight(1);
            } else if (gameState.currentRound === 8) {
                setupBossFight(2);
            } else {
                phaseEl.textContent = gameState.currentRound;
                setupNormalRound(gameState.currentRound);
            }
        }
    }

    // --- LOOP E ATUALIZAÇÕES ---
    function gameLoop() {
        if (!gameState.running) return;
        if (!gameState.paused) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            player.update();
            player.draw();
            bullets.forEach((b, i) => { b.update(); b.draw(); if(b.y < 0) bullets.splice(i,1); });
            enemyBullets.forEach((b, i) => { b.update(); b.draw(); if(b.y > canvas.height) enemyBullets.splice(i,1); });

            if (gameState.isBossFight) {
                if (boss) {
                    boss.update();
                    boss.draw();
                }
            } else {
                // ... (lógica de movimento inimigo igual a anterior, usando enemySpeedX)
                 let moveDown = false;
                enemies.forEach(enemy => {
                    if ((enemy.x + enemy.width > canvas.width && enemyDirection > 0) || (enemy.x < 0 && enemyDirection < 0)) {
                        moveDown = true;
                    }
                });

                if (moveDown) {
                    enemyDirection *= -1;
                    enemies.forEach(e => e.y += 20);
                }
                 enemies.forEach(enemy => {
                    enemy.update(enemyDirection * enemySpeedX);
                    enemy.draw();
                     // Tiro aleatório aumenta com o round
                    if(Math.random() < 0.0005 * gameState.currentRound) {
                        enemyBullets.push(new Bullet(enemy.x + enemy.width/2, enemy.y + enemy.height, 4, 8, '#ff5555', 5));
                    }
                });
            }

            checkCollisions();
            updateUI();
        } else {
            // ... (Lógica de pausa igual a anterior)
        }
        requestAnimationFrame(gameLoop);
    }
    
    // --- COLISÕES E UI ---
    function checkCollisions() {
        // Balas do jogador vs Inimigos/Chefe
        bullets.forEach((bullet, bIndex) => {
            if (gameState.isBossFight && boss) {
                if (isColliding(bullet, boss)) {
                    bullets.splice(bIndex, 1);
                    boss.takeDamage(1);
                    if (boss.health <= 0) {
                        gameState.score += 500;
                        if(boss.bossType === 2){
                             endGame(true); // Venceu o jogo!
                        } else {
                            gameState.currentRound++;
                            phaseEl.textContent = gameState.currentRound;
                            boss = null;
                            setupNormalRound(gameState.currentRound);
                        }
                    }
                }
            } else {
                enemies.forEach((enemy, eIndex) => {
                    if (isColliding(bullet, enemy)) {
                        enemies.splice(eIndex, 1);
                        bullets.splice(bIndex, 1);
                        onEnemyKilled();
                    }
                });
            }
        });
        
        // ... (colisões de balas inimigas e inimigos vs jogador igual a anterior)
    }

    function isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    function updateUI() {
         // ... (igual a anterior, usando gameState)
    }

    // --- EVENT LISTENERS (CONTROLES) ---
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', startGame);
    // ... (keydown e keyup igual a anterior, usando gameState)

    // Adicionado para recarregar as classes que não mudaram
    class Bullet { constructor(x, y, width, height, color, speedY) { this.x = x; this.y = y; this.width = width; this.height = height; this.color = color; this.speedY = speedY; } update() { this.y += this.speedY; } draw() { ctx.fillStyle = this.color; ctx.fillRect(this.x, this.y, this.width, this.height); }}
    function endGame(isVictory) { gameState.running = false; setTimeout(() => { canvas.classList.add('hidden'); gameUI.classList.add('hidden'); endScreen.classList.remove('hidden'); if (isVictory) { endTitleEl.textContent = "Vitória!"; endMessageEl.textContent = "Você repeliu os Mineradores! A Terra está salva, mas as cicatrizes da batalha permanecerão."; } else { endTitleEl.textContent = "Fim de Jogo"; endMessageEl.textContent = "A 'Geode' foi destruída. A esperança se foi."; } }, 1000); }
    function updateUI() { scoreEl.textContent = gameState.score; hitsEl.textContent = gameState.hits; const elapsedTime = Math.floor((Date.now() - gameState.startTime) / 1000); timerEl.textContent = `${elapsedTime}s`; }
    window.addEventListener('keydown', (e) => { keys[e.key] = true; if (e.key === 'Enter' && gameState.running) { gameState.paused = !gameState.paused; } });
    window.addEventListener('keyup', (e) => { keys[e.key] = false; });
});
