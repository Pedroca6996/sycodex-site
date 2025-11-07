// Espera a página carregar para garantir que todos os elementos HTML existam
window.addEventListener('load', function() {
    // --- ELEMENTOS DO DOM ---
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const startScreen = document.getElementById('startScreen');
    const endScreen = document.getElementById('endScreen');
    const gameUI = document.getElementById('gameUI');
    const soundPermissionScreen = document.getElementById('soundPermissionScreen');
    
    // NOVO: Elementos de Pausa
    const pauseButton = document.getElementById('pauseButton');
    const pauseMenu = document.getElementById('pauseMenu');
    const resumeButton = document.getElementById('resumeButton');
    const quitButton = document.getElementById('quitButton');
    
    const onePlayerButton = document.getElementById('onePlayerButton');
    const twoPlayerButton = document.getElementById('twoPlayerButton');
    const restartButton = document.getElementById('restartButton');
    const acceptSoundButton = document.getElementById('acceptSoundButton');
    const declineSoundButton = document.getElementById('declineSoundButton');
    
    const player1ScoreEl = document.getElementById('player1Score');
    const player2ScoreEl = document.getElementById('player2Score');
    const endTitleEl = document.getElementById('endTitle');
    const endMessageEl = document.getElementById('endMessage');

    // --- CONFIGURAÇÕES DO JOGO ---
    canvas.width = 800;
    canvas.height = 600;

    // --- ESTADO DO JOGO ---
    let gameMode = '1P';
    let keys = {};
    const WINNING_SCORE = 7;
    
    // NOVO: Estado de Pausa
    let isPaused = false;
    let animationFrameId; // Para armazenar o ID do loop e poder pará-lo

    // --- CONFIGURAÇÃO DE ÁUDIO ---
    let soundEnabled = false;
    const backgroundMusic = new Audio('./sounds/background.mp3'); 
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.5;

    const player1HitSound = new Audio('./sounds/player1_hit.mp3');
    const player2HitSound = new Audio('./sounds/player2_hit.mp3');
    const wallHitSound = new Audio('./sounds/wall_hit.mp3');
    const player1ScoreSound = new Audio('./sounds/player1_score.mp3');
    const player2ScoreSound = new Audio('./sounds/player2_score.mp3');

    function playSound(sound) {
        if (soundEnabled) {
            sound.currentTime = 0;
            sound.play();
        }
    }
    function tryToPlayMusic() {
        // MODIFICADO: Só toca se não estiver pausado
        if (soundEnabled && backgroundMusic.paused && !isPaused) {
            backgroundMusic.play().catch(e => console.warn("Navegador bloqueou a música."));
        }
    }
    function stopMusic() {
        if (soundEnabled) {
            backgroundMusic.pause();
            // Não reseta o tempo, para poder continuar de onde parou
        }
    }

    // --- VARIÁVEIS DE TOQUE ---
    const activeTouches = {}; 
    let canvasRect = canvas.getBoundingClientRect(); 
    let scaleX = canvas.width / canvasRect.width;   
    let scaleY = canvas.height / canvasRect.height; 

    // --- HELPER DE TOQUE ---
    function mapTouchCoords(touch) {
        const clientX = touch.clientX - canvasRect.left;
        const clientY = touch.clientY - canvasRect.top;
        return {
            x: clientX * scaleX,
            y: clientY * scaleY
        };
    }

    // --- ELEMENTOS DE FUNDO (ESTRELAS) ---
    let stars = [];
    const numStars = 100;
    class Star {
        constructor() { this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height; this.size = Math.random() * 2 + 1; this.speed = Math.random() * 2 + 0.5; }
        update() { this.y += this.speed; if (this.y > canvas.height) { this.y = 0; this.x = Math.random() * canvas.width; } }
        draw() { ctx.fillStyle = `rgba(255, 255, 255, 0.8)`; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); }
    }
    function initStars() { stars = []; for (let i = 0; i < numStars; i++) { stars.push(new Star()); } }
    function handleStars() { stars.forEach(star => { star.update(); star.draw(); }); }

    // --- CLASSES DO JOGO ---
    class Paddle {
        constructor(x, y, width, height, color, glow) { 
            this.x = x; this.y = y; this.width = width; this.height = height; this.color = color; this.glow = glow; 
            this.baseSpeed = 4; // Era 8
            this.speed = this.baseSpeed; 
            this.score = 0; 
        }
        draw() { ctx.fillStyle = this.color; ctx.shadowColor = this.glow; ctx.shadowBlur = 15; ctx.fillRect(this.x, this.y, this.width, this.height); ctx.shadowBlur = 0; }
        resetSpeed() {
            this.speed = this.baseSpeed;
        }
    }
    
    class Ball {
        constructor(x, y, radius) {
            this.baseSpeedX = 2.5; // Era 5
            this.baseSpeedY = 2.5; // Era 5
            this.x = x; this.y = y; this.radius = radius;
            this.color = '#ffd700'; this.glow = '#ffd700'; this.reset();
        }
        reset() {
            this.x = canvas.width / 2; this.y = canvas.height / 2;
            this.speedX = this.baseSpeedX * (Math.random() > 0.5 ? 1 : -1);
            this.speedY = this.baseSpeedY * (Math.random() > 0.5 ? 1 : -1);
            this.color = '#ffd700'; this.glow = '#ffd700';
            if(player1) player1.resetSpeed();
            if(player2) player2.resetSpeed();
        }
        draw() {
            ctx.beginPath(); ctx.fillStyle = this.color; ctx.shadowColor = this.glow; ctx.shadowBlur = 20;
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
        }
        update(player1, player2) {
            this.x += this.speedX; this.y += this.speedY;
            if (this.y - this.radius < 0 || this.y + this.radius > canvas.height) { this.speedY *= -1; playSound(wallHitSound); }
            if (this.x - this.radius < player1.x + player1.width && this.y > player1.y && this.y < player1.y + player1.height) {
                this.speedX *= -1.1; 
                player1.speed *= 1.05; 
                this.color = player1.color; this.glow = player1.glow; playSound(player1HitSound);
            }
            if (this.x + this.radius > player2.x && this.y > player2.y && this.y < player2.y + player2.height) {
                this.speedX *= -1.1; 
                player2.speed *= 1.05; 
                this.color = player2.color; this.glow = player2.glow; playSound(player2HitSound);
            }
            if (this.x - this.radius < 0) { player2.score++; playSound(player2ScoreSound); this.reset(); }
            if (this.x + this.radius > canvas.width) { player1.score++; playSound(player1ScoreSound); this.reset(); }
        }
    }

    // --- VARIÁVEIS DO JOGO ---
    let player1, player2, ball;

    // --- NOVO: FUNÇÃO DE PAUSA ---
    function togglePause() {
        isPaused = !isPaused; // Inverte o estado
        
        if (isPaused) {
            // PAUSA O JOGO
            pauseMenu.classList.remove('hidden'); // Mostra o menu de pausa
            stopMusic(); // Para a música
            // Para o loop de animação
            cancelAnimationFrame(animationFrameId);
        } else {
            // RETOMA O JOGO
            pauseMenu.classList.add('hidden'); // Esconde o menu de pausa
            tryToPlayMusic(); // Tenta retomar a música
            gameLoop(); // Reinicia o loop de animação
        }
    }

    // --- FUNÇÕES PRINCIPAIS DO JOGO ---
    function startGame() {
        startScreen.classList.add('hidden'); endScreen.classList.add('hidden');
        gameUI.classList.remove('hidden'); canvas.classList.remove('hidden');
        
        // MODIFICADO: Garante que o jogo comece despausado
        isPaused = false; 
        pauseMenu.classList.add('hidden'); // Garante que o menu de pausa esteja escondido

        player1 = new Paddle(10, canvas.height / 2 - 50, 15, 100, '#ffffff', '#00f0ff');
        player2 = new Paddle(canvas.width - 25, canvas.height / 2 - 50, 15, 100, '#c700ff', '#ff00ff');
        ball = new Ball(canvas.width / 2, canvas.height / 2, 10);
        
        if (stars.length === 0) { initStars(); }
        
        tryToPlayMusic();
        
        gameLoop();
    }

    function gameLoop() {
        // MODIFICADO: Se estiver pausado, interrompe a execução do loop
        if (isPaused) {
            return;
        }

        // --- LÓGICA DE CONTROLE (TECLADO) ---
        if ((keys['w'] || keys['W']) && player1.y > 0) player1.y -= player1.speed;
        if ((keys['s'] || keys['S']) && player1.y < canvas.height - player1.height) player1.y += player1.speed;
        
        if (gameMode === '2P') {
            if (keys['ArrowUp'] && player2.y > 0) player2.y -= player2.speed;
            if (keys['ArrowDown'] && player2.y < canvas.height - player2.height) player2.y += player2.speed;
        } else {
            const targetY = ball.y - player2.height / 2;
            const aiSpeed = player2.speed * 0.8;
            if (player2.y < targetY && player2.y < canvas.height - player2.height) player2.y += aiSpeed;
            if (player2.y > targetY && player2.y > 0) player2.y -= aiSpeed;
        }

        ball.update(player1, player2);
        
        ctx.fillStyle = '#08081a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        handleStars(); 
        player1.draw(); 
        player2.draw(); 
        ball.draw();
        
        player1ScoreEl.textContent = player1.score; 
        player2ScoreEl.textContent = player2.score;
        
        if (player1.score >= WINNING_SCORE || player2.score >= WINNING_SCORE) { 
            endGame(); 
        } else { 
            // MODIFICADO: Armazena o ID do frame para podermos cancelar
            animationFrameId = requestAnimationFrame(gameLoop); 
        }
    }

    function endGame() {
        gameUI.classList.add('hidden'); canvas.classList.add('hidden'); endScreen.classList.remove('hidden');
        stopMusic();
        // Zera o tempo da música para o reinício
        if (soundEnabled) backgroundMusic.currentTime = 0;
        
        if (player1.score >= WINNING_SCORE) {
            endTitleEl.textContent = "A Luz Prevaleceu";
            endMessageEl.textContent = "O equilíbrio foi restaurado. A luz da criação prevaleceu, e a harmonia reinará... por enquanto.";
        } else {
            endTitleEl.textContent = "A Sombra Venceu";
            endMessageEl.textContent = "O silêncio venceu. A energia foi absorvida pelo vazio, e um frio eterno se espalha pelo cosmos.";
        }
    }

    // --- EVENT LISTENERS (BOTÕES HTML) ---
    acceptSoundButton.addEventListener('click', () => {
        soundEnabled = true; 
        tryToPlayMusic(); 
        soundPermissionScreen.classList.add('hidden'); startScreen.classList.remove('hidden');
    });
    declineSoundButton.addEventListener('click', () => {
        soundEnabled = false;
        soundPermissionScreen.classList.add('hidden'); startScreen.classList.remove('hidden');
    });
    onePlayerButton.addEventListener('click', () => { gameMode = '1P'; startGame(); });
    twoPlayerButton.addEventListener('click', () => { gameMode = '2P'; startGame(); });
    restartButton.addEventListener('click', () => {
        endScreen.classList.add('hidden'); startScreen.classList.remove('hidden');
        tryToPlayMusic();
    });

    // --- NOVOS: LISTENERS DE PAUSA ---
    pauseButton.addEventListener('click', togglePause);
    resumeButton.addEventListener('click', togglePause); // Reutiliza a função
    quitButton.addEventListener('click', () => {
        // Volta ao menu principal
        isPaused = false;
        pauseMenu.classList.add('hidden');
        gameUI.classList.add('hidden');
        canvas.classList.add('hidden');
        startScreen.classList.remove('hidden');
        stopMusic();
        if (soundEnabled) backgroundMusic.currentTime = 0; // Reseta a música
    });


    // --- EVENT LISTENERS (TECLADO) ---
    window.addEventListener('keydown', (e) => { 
        keys[e.key] = true; 
        
        // NOVO: Atalho de pausa (só funciona se o jogo estiver em andamento)
        if ((e.key === 'p' || e.key === 'P' || e.key === 'Escape') && !gameUI.classList.contains('hidden')) {
            e.preventDefault(); // Previne comportamento padrão (como 'Esc' sair de tela cheia)
            togglePause();
        }
    });
    window.addEventListener('keyup', (e) => { keys[e.key] = false; });

    // --- LISTENERS DE TOQUE (MOBILE) ---
    function handleTouchMove(touch) {
        const gamePos = mapTouchCoords(touch);
        const touchInfo = activeTouches[touch.identifier];
        if (touchInfo) {
            const paddle = touchInfo.paddle;
            paddle.y = gamePos.y - paddle.height / 2;
            if (paddle.y < 0) paddle.y = 0;
            if (paddle.y + paddle.height > canvas.height) paddle.y = canvas.height - paddle.height;
        }
    }

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault(); 
        // MODIFICADO: Não faz nada se estiver pausado
        if (isPaused) return;

        tryToPlayMusic();
        for (const touch of e.changedTouches) {
            const gamePos = mapTouchCoords(touch);
            let paddleToControl = null;
            if (gameMode === '2P') {
                if (gamePos.x < canvas.width / 2) paddleToControl = player1;
                else paddleToControl = player2;
            } else {
                if (gamePos.x < canvas.width / 2) paddleToControl = player1;
            }
            if (paddleToControl) {
                activeTouches[touch.identifier] = { paddle: paddleToControl };
                handleTouchMove(touch); 
            }
        }
    }, { passive: false }); 

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        // MODIFICADO: Não faz nada se estiver pausado
        if (isPaused) return;
        for (const touch of e.changedTouches) {
            handleTouchMove(touch); 
        }
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        // MODIFICADO: Só precisa limpar os toques
        for (const touch of e.changedTouches) {
            delete activeTouches[touch.identifier];
        }
    }, false);

    canvas.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        for (const touch of e.changedTouches) {
            delete activeTouches[touch.identifier];
        }
    }, false);

    // --- ATUALIZA ESCALA NO RESIZE ---
    window.addEventListener('resize', () => {
        canvasRect = canvas.getBoundingClientRect();
        scaleX = canvas.width / canvasRect.width;
        scaleY = canvas.height / canvasRect.height;
    });

}); // Fim do window.addEventListener('load')