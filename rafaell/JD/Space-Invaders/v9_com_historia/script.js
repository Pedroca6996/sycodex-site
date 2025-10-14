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

    let gameRunning = false;
    let paused = false;
    let score = 0;
    let hits = 0;
    let currentPhase = 1;
    let startTime = 0;
    let keys = {}; // Objeto para armazenar as teclas pressionadas

    // --- CLASSES E OBJETOS DO JOGO ---

    // CLASSE DO JOGADOR (NAVE GEODE)
    class Player {
        constructor() {
            this.width = 50;
            this.height = 40;
            this.x = canvas.width / 2 - this.width / 2;
            this.y = canvas.height - this.height - 20;
            this.speed = 7;
            this.isHit = false;
            this.invincibilityTimer = 0;
            this.shootCooldown = 0;
        }

        // Desenha a nave (hexágono) e o escudo
        draw() {
            ctx.fillStyle = '#c0c0c0'; // Cor prata industrial
            ctx.beginPath();
            ctx.moveTo(this.x + this.width * 0.5, this.y);
            ctx.lineTo(this.x + this.width, this.y + this.height * 0.25);
            ctx.lineTo(this.x + this.width, this.y + this.height * 0.75);
            ctx.lineTo(this.x + this.width * 0.5, this.y + this.height);
            ctx.lineTo(this.x, this.y + this.height * 0.75);
            ctx.lineTo(this.x, this.y + this.height * 0.25);
            ctx.closePath();
            ctx.fill();

            // Desenha o escudo se estiver invencível
            if (this.isHit) {
                ctx.strokeStyle = '#00f0ff';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 1.5, 0, Math.PI * 2);
                ctx.stroke();
                ctx.lineWidth = 1;
            }
        }

        // Atualiza a posição e estado do jogador
        update() {
            // Movimento
            if (keys['ArrowLeft'] || keys['a']) {
                this.x -= this.speed;
            }
            if (keys['ArrowRight'] || keys['d']) {
                this.x += this.speed;
            }

            // Limites da tela
            if (this.x < 0) this.x = 0;
            if (this.x > canvas.width - this.width) this.x = canvas.width - this.width;

            // Lógica de tiro
            if (this.shootCooldown > 0) this.shootCooldown--;
            if (keys[' '] && this.shootCooldown === 0) {
                this.shoot();
                this.shootCooldown = 20; // Cooldown de 20 frames
            }

            // Lógica de invencibilidade
            if (this.isHit) {
                this.invincibilityTimer--;
                if (this.invincibilityTimer <= 0) {
                    this.isHit = false;
                }
            }
        }

        // Cria um novo projétil
        shoot() {
            bullets.push(new Bullet(this.x + this.width / 2 - 2.5, this.y, 5, 10, '#00f0ff', -10));
        }

        // Ativado quando a nave é atingida
        hit() {
            if (!this.isHit) {
                this.isHit = true;
                this.invincibilityTimer = 120; // 2 segundos de invencibilidade (60fps)
                hits++;
                // Vibração da tela (efeito simples)
                document.body.style.animation = 'shake 0.2s';
                setTimeout(() => document.body.style.animation = '', 200);
            }
        }
    }

    // CLASSE DOS PROJÉTEIS
    class Bullet {
        constructor(x, y, width, height, color, speedY) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.color = color;
            this.speedY = speedY;
        }

        update() {
            this.y += this.speedY;
        }

        draw() {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    // CLASSE DOS INIMIGOS
    class Enemy {
        constructor(x, y, type) {
            this.type = type;
            if (type === 'Sonda') {
                this.width = 35;
                this.height = 30;
                this.color = '#ff4500'; // Laranja avermelhado
            } else if (type === 'Comando') {
                this.width = 50;
                this.height = 40;
                this.color = '#da70d6'; // Orquídea
            }
            this.x = x;
            this.y = y;
        }

        draw() {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        update(speedX, speedY) {
            this.x += speedX;
            this.y += speedY;
        }
    }

    // --- VARIÁVEIS DO JOGO ---
    let player;
    let bullets;
    let enemies;
    let enemyBullets;
    let enemyDirection = 1;
    let enemySpeedX = 1;
    let enemyMoveDown = 0;
    
    // --- FUNÇÕES PRINCIPAIS DO JOGO ---

    // INICIA UMA NOVA FASE
    function setupPhase(phase) {
        currentPhase = phase;
        phaseEl.textContent = phase;
        enemies = [];
        let rows = 5;
        let cols = 10;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                let x = c * 60 + 50;
                let y = r * 50 + 50;
                let type = (r < 2) ? 'Comando' : 'Sonda'; // Duas fileiras de 'Comando'
                enemies.push(new Enemy(x, y, type));
            }
        }
        // TODO: Adicionar lógica específica para chefes nas fases 2 e 4
    }

    // INICIA O JOGO
    function startGame() {
        // Reseta as variáveis
        score = 0;
        hits = 0;
        startTime = Date.now();
        scoreEl.textContent = score;
        hitsEl.textContent = hits;
        player = new Player();
        bullets = [];
        enemyBullets = [];
        
        setupPhase(1);

        // Esconde telas e mostra o jogo
        startScreen.classList.add('hidden');
        endScreen.classList.add('hidden');
        gameUI.classList.remove('hidden');
        canvas.classList.remove('hidden');
        
        gameRunning = true;
        paused = false;
        gameLoop();
    }

    // FINALIZA O JOGO
    function endGame(isVictory) {
        gameRunning = false;
        setTimeout(() => {
            canvas.classList.add('hidden');
            gameUI.classList.add('hidden');
            endScreen.classList.remove('hidden');
            
            if (isVictory) {
                endTitleEl.textContent = "Vitória!";
                endMessageEl.textContent = "Você repeliu os Mineradores! A Terra está salva, mas as cicatrizes da batalha permanecerão. Lena e J.A.V.I.S. vigiam o espaço, prontos para o próximo desafio.";
            } else {
                endTitleEl.textContent = "Fim de Jogo";
                endMessageEl.textContent = "A 'Geode' foi destruída. Os Mineradores completaram seu objetivo e o núcleo da Terra começou a congelar. A esperança se foi.";
            }
        }, 1000); // Pequeno delay para mostrar a última explosão
    }

    // LOOP PRINCIPAL DO JOGO
    function gameLoop() {
        if (!gameRunning) return;

        if (!paused) {
            // Limpa o canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Atualiza e desenha o jogador
            player.update();
            player.draw();

            // Atualiza e desenha projéteis
            bullets.forEach((bullet, index) => {
                bullet.update();
                bullet.draw();
                if (bullet.y < 0) bullets.splice(index, 1);
            });
            
            // Atualiza e desenha projéteis inimigos
            enemyBullets.forEach((bullet, index) => {
                bullet.update();
                bullet.draw();
                if (bullet.y > canvas.height) enemyBullets.splice(index, 1);
            });

            // Lógica de movimento e tiro dos inimigos
            let moveDown = false;
            enemies.forEach(enemy => {
                if ((enemy.x + enemy.width > canvas.width && enemyDirection > 0) || (enemy.x < 0 && enemyDirection < 0)) {
                    moveDown = true;
                }
            });

            if (moveDown) {
                enemyDirection *= -1;
                enemyMoveDown = 20; // Desce por 20 pixels
            }

            enemies.forEach(enemy => {
                enemy.update(enemyDirection * enemySpeedX, moveDown ? 1 : 0);
                enemy.draw();
                // Tiro aleatório
                if(Math.random() < 0.001) {
                    enemyBullets.push(new Bullet(enemy.x + enemy.width/2, enemy.y + enemy.height, 4, 8, '#ff5555', 5));
                }
            });

            // CHECAGEM DE COLISÕES
            checkCollisions();

            // ATUALIZA UI
            updateUI();

            // CHECA CONDIÇÃO DE VITÓRIA/DERROTA
            if (enemies.length === 0) {
                 // Por enquanto, isso significa vitória, mas aqui entraria a lógica de fases
                 endGame(true);
            }

        } else {
            // Jogo pausado
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#fff";
            ctx.font = "50px 'Exo 2'";
            ctx.textAlign = "center";
            ctx.fillText("PAUSADO", canvas.width / 2, canvas.height / 2);
        }
        
        requestAnimationFrame(gameLoop);
    }
    
    // FUNÇÃO PARA CHECAR COLISÕES
    function checkCollisions() {
        // Projéteis do jogador vs. Inimigos
        bullets.forEach((bullet, bIndex) => {
            enemies.forEach((enemy, eIndex) => {
                if (bullet.x < enemy.x + enemy.width &&
                    bullet.x + bullet.width > enemy.x &&
                    bullet.y < enemy.y + enemy.height &&
                    bullet.y + bullet.height > enemy.y) {
                    // Colisão!
                    enemies.splice(eIndex, 1);
                    bullets.splice(bIndex, 1);
                    score += 10;
                }
            });
        });
        
        // Projéteis inimigos vs. Jogador
        enemyBullets.forEach((bullet, bIndex) => {
            if (bullet.x < player.x + player.width &&
                bullet.x + bullet.width > player.x &&
                bullet.y < player.y + player.height &&
                bullet.y + bullet.height > player.y) {
                // Colisão!
                enemyBullets.splice(bIndex, 1);
                player.hit();
            }
        });

        // Inimigos vs. Jogador
        enemies.forEach(enemy => {
             if (enemy.x < player.x + player.width &&
                enemy.x + enemy.width > player.x &&
                enemy.y < player.y + player.height &&
                enemy.y + enemy.height > player.y) {
                 endGame(false);
             }
        });
    }
    
    // FUNÇÃO PARA ATUALIZAR A INTERFACE
    function updateUI() {
        scoreEl.textContent = score;
        hitsEl.textContent = hits;
        const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
        timerEl.textContent = `${elapsedTime}s`;
    }

    // --- EVENT LISTENERS (CONTROLES) ---
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', startGame);

    window.addEventListener('keydown', (e) => {
        keys[e.key] = true;
        if (e.key === 'Enter' && gameRunning) {
            paused = !paused;
        }
    });

    window.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });

});
