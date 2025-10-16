window.addEventListener('load', function() {
    // --- ELEMENTOS DO DOM ---
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const startScreen = document.getElementById('startScreen');
    const endScreen = document.getElementById('endScreen');
    const gameUI = document.getElementById('gameUI');
    const soundPermissionScreen = document.getElementById('soundPermissionScreen');
    
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

    // --- CONFIGURAÇÃO DE ÁUDIO ---
    let soundEnabled = false;
    const backgroundMusic = new Audio('background.mp3'); // <-- COLOQUE O NOME DA SUA MÚSICA AQUI
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.5;

    const player1HitSound = new Audio('player1_hit.mp3');
    const player2HitSound = new Audio('player2_hit.mp3');
    const wallHitSound = new Audio('wall_hit.mp3');
    const player1ScoreSound = new Audio('player1_score.mp3');
    const player2ScoreSound = new Audio('player2_score.mp3');

    function playSound(sound) {
        if (soundEnabled) {
            sound.currentTime = 0;
            sound.play();
        }
    }
    function tryToPlayMusic() {
        if (soundEnabled && backgroundMusic.paused) {
            backgroundMusic.play().catch(e => console.warn("Navegador bloqueou a música."));
        }
    }
    function stopMusic() {
        if (soundEnabled) {
            backgroundMusic.pause();
            backgroundMusic.currentTime = 0;
        }
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
        constructor(x, y, width, height, color, glow) { this.x = x; this.y = y; this.width = width; this.height = height; this.color = color; this.glow = glow; this.speed = 8; this.score = 0; }
        draw() { ctx.fillStyle = this.color; ctx.shadowColor = this.glow; ctx.shadowBlur = 15; ctx.fillRect(this.x, this.y, this.width, this.height); ctx.shadowBlur = 0; }
    }
    
    class Ball {
        constructor(x, y, radius) {
            this.baseSpeedX = 5; this.baseSpeedY = 5; this.x = x; this.y = y; this.radius = radius;
            this.color = '#ffd700'; this.glow = '#ffd700'; this.reset();
        }
        reset() {
            this.x = canvas.width / 2; this.y = canvas.height / 2;
            this.speedX = this.baseSpeedX * (Math.random() > 0.5 ? 1 : -1);
            this.speedY = this.baseSpeedY * (Math.random() > 0.5 ? 1 : -1);
            this.color = '#ffd700'; this.glow = '#ffd700';
        }
        draw() {
            ctx.beginPath(); ctx.fillStyle = this.color; ctx.shadowColor = this.glow; ctx.shadowBlur = 20;
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
        }
        update(player1, player2) {
            this.x += this.speedX; this.y += this.speedY;
            if (this.y - this.radius < 0 || this.y + this.radius > canvas.height) { this.speedY *= -1; playSound(wallHitSound); }
            if (this.x - this.radius < player1.x + player1.width && this.y > player1.y && this.y < player1.y + player1.height) {
                this.speedX *= -1.1; this.color = player1.color; this.glow = player1.glow; playSound(player1HitSound);
            }
            if (this.x + this.radius > player2.x && this.y > player2.y && this.y < player2.y + player2.height) {
                this.speedX *= -1.1; this.color = player2.color; this.glow = player2.glow; playSound(player2HitSound);
            }
            if (this.x - this.radius < 0) { player2.score++; playSound(player2ScoreSound); this.reset(); }
            if (this.x + this.radius > canvas.width) { player1.score++; playSound(player1ScoreSound); this.reset(); }
        }
    }

    // --- VARIÁVEIS DO JOGO ---
    let player1, player2, ball;

    // --- FUNÇÕES PRINCIPAIS DO JOGO ---
    function startGame() {
        startScreen.classList.add('hidden'); endScreen.classList.add('hidden');
        gameUI.classList.remove('hidden'); canvas.classList.remove('hidden');
        player1 = new Paddle(10, canvas.height / 2 - 50, 15, 100, '#ffffff', '#00f0ff');
        player2 = new Paddle(canvas.width - 25, canvas.height / 2 - 50, 15, 100, '#c700ff', '#ff00ff');
        ball = new Ball(canvas.width / 2, canvas.height / 2, 10);
        if (stars.length === 0) { initStars(); }
        gameLoop();
    }
    function gameLoop() {
        if ((keys['w'] || keys['W']) && player1.y > 0) player1.y -= player1.speed;
        if ((keys['s'] || keys['S']) && player1.y < canvas.height - player1.height) player1.y += player1.speed;
        if (gameMode === '2P') {
            if (keys['ArrowUp'] && player2.y > 0) player2.y -= player2.speed;
            if (keys['ArrowDown'] && player2.y < canvas.height - player2.height) player2.y += player2.speed;
        } else {
            const targetY = ball.y - player2.height / 2;
            if (player2.y < targetY && player2.y < canvas.height - player2.height) player2.y += player2.speed * 0.8;
            if (player2.y > targetY && player2.y > 0) player2.y -= player2.speed * 0.8;
        }
        ball.update(player1, player2);
        ctx.fillStyle = '#08081a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        handleStars(); player1.draw(); player2.draw(); ball.draw();
        player1ScoreEl.textContent = player1.score; player2ScoreEl.textContent = player2.score;
        if (player1.score >= WINNING_SCORE || player2.score >= WINNING_SCORE) { endGame(); } else { requestAnimationFrame(gameLoop); }
    }
    function endGame() {
        gameUI.classList.add('hidden'); canvas.classList.add('hidden'); endScreen.classList.remove('hidden');
        stopMusic();
        if (player1.score >= WINNING_SCORE) {
            endTitleEl.textContent = "A Luz Prevaleceu";
            endMessageEl.textContent = "O equilíbrio foi restaurado. A luz da criação prevaleceu, e a harmonia reinará... por enquanto.";
        } else {
            endTitleEl.textContent = "A Sombra Venceu";
            endMessageEl.textContent = "O silêncio venceu. A energia foi absorvida pelo vazio, e um frio eterno se espalha pelo cosmos.";
        }
    }

    // --- EVENT LISTENERS ---
    acceptSoundButton.addEventListener('click', () => {
        soundEnabled = true; tryToPlayMusic();
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
    window.addEventListener('keydown', (e) => { keys[e.key] = true; });
    window.addEventListener('keyup', (e) => { keys[e.key] = false; });
});