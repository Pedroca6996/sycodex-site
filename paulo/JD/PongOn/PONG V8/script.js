// ---------------------------
// PONG - VERSÃO 10 FINAL CORRIGIDA
// ---------------------------

// ----- Seleção de telas -----
const menuScreen = document.getElementById('menu-screen');
const instructionsScreen = document.getElementById('instructions-screen');
const settingsScreen = document.getElementById('settings-screen');
const gameCanvas = document.getElementById('gameCanvas');
const ctx = gameCanvas.getContext('2d');

const winMessage = document.createElement('div');
winMessage.id = 'win-message';
document.body.appendChild(winMessage);

// ----- Sons -----
const bounceSound = new Audio('../sounds/bounce.mp3');
const scoreSound = new Audio('../sounds/score2.mp3');
const winSound   = new Audio('../sounds/win2.mp3');

// ----- Configurações padrão -----
let paddleWidth = 10, paddleHeight = 100;
let paddle1Y = gameCanvas.height/2 - paddleHeight/2;
let paddle2Y = gameCanvas.height/2 - paddleHeight/2;
let paddleSpeed = 5;

let ballX = gameCanvas.width/2;
let ballY = gameCanvas.height/2;
let ballSize = 10;
let initialBallSpeed = 2; // velocidade inicial da bola
let ballSpeedX = 0;
let ballSpeedY = 0;
let speedIncrement = 1;

let score1 = 0;
let score2 = 0;
let winningScore = 5;
let gameRunning = true;

let highlightPaddle1 = false;
let highlightPaddle2 = false;

// ----- Partículas -----
let particles = [];

// ----- Menu e Botões -----
document.getElementById('play-btn').addEventListener('click', () => {
    menuScreen.style.display = 'none';
    gameCanvas.style.display = 'block';
    resetGame();
});
document.getElementById('instructions-btn').addEventListener('click', () => {
    menuScreen.style.display = 'none';
    instructionsScreen.style.display = 'block';
});
document.getElementById('settings-btn').addEventListener('click', () => {
    menuScreen.style.display = 'none';
    settingsScreen.style.display = 'block';
});
document.getElementById('back-instructions-btn').addEventListener('click', () => {
    instructionsScreen.style.display = 'none';
    menuScreen.style.display = 'block';
});
document.getElementById('back-settings-btn').addEventListener('click', () => {
    initialBallSpeed = Number(document.getElementById('ball-speed-input').value);
    winningScore = Number(document.getElementById('winning-score-input').value);
    settingsScreen.style.display = 'none';
    menuScreen.style.display = 'block';
});

// ----- Controle do Jogo -----
const keys = {};
document.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (!gameRunning && e.key === 'Enter') resetGame();
    if (['ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault();
});
document.addEventListener('keyup', e => keys[e.key] = false);

function movePaddles() {
    if (keys['w'] && paddle1Y > 0) paddle1Y -= paddleSpeed;
    if (keys['s'] && paddle1Y < gameCanvas.height - paddleHeight) paddle1Y += paddleSpeed;
    if (keys['ArrowUp'] && paddle2Y > 0) paddle2Y -= paddleSpeed;
    if (keys['ArrowDown'] && paddle2Y < gameCanvas.height - paddleHeight) paddle2Y += paddleSpeed;
}

// ----- Movimento da bola -----
function moveBall() {
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    // Colisão com bordas
    if (ballY <= 0 || ballY >= gameCanvas.height - ballSize) {
        ballSpeedY *= -1;
        bounceSound.currentTime = 0;
        bounceSound.play();
        createParticles(ballX, ballY);
    }

    // Colisão com raquetes
    if (ballX <= paddleWidth && ballY > paddle1Y && ballY < paddle1Y + paddleHeight) {
        ballSpeedX *= -1;
        bounceSound.currentTime = 0;
        bounceSound.play();
        highlightPaddle1 = true;
        setTimeout(()=>highlightPaddle1=false,100);
        createParticles(ballX, ballY);
    }
    if (ballX >= gameCanvas.width - paddleWidth - ballSize && ballY > paddle2Y && ballY < paddle2Y + paddleHeight) {
        ballSpeedX *= -1;
        bounceSound.currentTime = 0;
        bounceSound.play();
        highlightPaddle2 = true;
        setTimeout(()=>highlightPaddle2=false,100);
        createParticles(ballX, ballY);
    }

    // Pontos
    if (ballX < 0) {
        score2++;
        scoreSound.currentTime = 0;
        scoreSound.play();
        highlightPaddle2 = true;
        setTimeout(()=>highlightPaddle2=false,1000);
        resetBall();
        checkWin();
    } else if (ballX > gameCanvas.width) {
        score1++;
        scoreSound.currentTime = 0;
        scoreSound.play();
        highlightPaddle1 = true;
        setTimeout(()=>highlightPaddle1=false,1000);
        resetBall();
        checkWin();
    }
}

// ----- Funções auxiliares -----
function resetBall() {
    ballX = gameCanvas.width / 2;
    ballY = gameCanvas.height / 2;

    // Velocidade baseada apenas no placar atual
    let speed = initialBallSpeed + (score1 + score2) * speedIncrement;
    ballSpeedX = Math.random() < 0.5 ? speed : -speed;
    ballSpeedY = Math.random() < 0.5 ? speed : -speed;
}

function checkWin() {
    if (score1 >= winningScore) {
        gameRunning=false;
        winSound.currentTime=0;
        winSound.play();
        showWinMessage('Jogador 1');
    } else if (score2 >= winningScore) {
        gameRunning=false;
        winSound.currentTime=0;
        winSound.play();
        showWinMessage('Jogador 2');
    }
}

function showWinMessage(winner){
    winMessage.style.display='block';
    winMessage.innerHTML=`Vitória do ${winner}! <br> Pressione Enter para reiniciar.`;
}

function resetGame() {
    score1 = 0;
    score2 = 0;
    particles = [];
    winMessage.style.display = 'none';
    gameRunning = true;

    // Garante que a bola comece na velocidade inicial
    let initialBallSpeed = 2; // velocidade inicial da bola
    ballSpeedX = initialBallSpeed;
    ballSpeedY = initialBallSpeed;
    resetBall();
    gameLoop();
}

// ----- Partículas -----
function createParticles(x, y) {
    for(let i=0;i<10;i++){
        particles.push({
            x: x,
            y: y,
            vx: (Math.random()-0.5)*5,
            vy: (Math.random()-0.5)*5,
            alpha: 1
        });
    }
}

function updateParticles() {
    for(let i=particles.length-1;i>=0;i--){
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.05;
        if(p.alpha <= 0) particles.splice(i,1);
    }
}

// ----- Desenho -----
function draw() {
    ctx.clearRect(0,0,gameCanvas.width,gameCanvas.height);

    // Linha central
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(gameCanvas.width / 2, 0);
    ctx.lineTo(gameCanvas.width / 2, gameCanvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Bola (motion trail)
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.arc(ballX - ballSpeedX, ballY - ballSpeedY, ballSize, 0, Math.PI*2);
    ctx.fill();

    // Raquetes
    let paddleGradient1 = ctx.createLinearGradient(0, paddle1Y, paddleWidth, paddle1Y + paddleHeight);
    paddleGradient1.addColorStop(0, highlightPaddle1 ? '#ff0' : '#0ff');
    paddleGradient1.addColorStop(1, highlightPaddle1 ? '#ffa500' : '#00f');
    ctx.fillStyle = paddleGradient1;
    ctx.shadowColor = 'rgba(0,255,255,0.7)';
    ctx.shadowBlur = 10;
    ctx.fillRect(0, paddle1Y, paddleWidth, paddleHeight);

    let paddleGradient2 = ctx.createLinearGradient(gameCanvas.width-paddleWidth, paddle2Y, gameCanvas.width, paddle2Y + paddleHeight);
    paddleGradient2.addColorStop(0, highlightPaddle2 ? '#ff0' : '#f0f');
    paddleGradient2.addColorStop(1, highlightPaddle2 ? '#ffa500' : '#800080');
    ctx.fillStyle = paddleGradient2;
    ctx.shadowColor = 'rgba(255,0,255,0.7)';
    ctx.shadowBlur = 10;
    ctx.fillRect(gameCanvas.width-paddleWidth, paddle2Y, paddleWidth, paddleHeight);

    // Bola
    let ballGradient = ctx.createRadialGradient(ballX+ballSize/2, ballY+ballSize/2, 2, ballX+ballSize/2, ballY+ballSize/2, 10);
    ballGradient.addColorStop(0, '#fff');
    ballGradient.addColorStop(1, '#ff4444');
    ctx.fillStyle = ballGradient;
    ctx.shadowColor = 'rgba(255,255,255,0.9)';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(ballX+ballSize/2, ballY+ballSize/2, ballSize, 0, Math.PI*2);
    ctx.fill();

    // Partículas
    particles.forEach(p => {
        ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI*2);
        ctx.fill();
    });
    updateParticles();

    // Placar
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffeb3b';
    ctx.font='40px "Segoe UI", Arial';
    ctx.textAlign = 'center';
    ctx.fillText(score1, gameCanvas.width/4, 60);
    ctx.fillText(score2, gameCanvas.width*3/4, 60);
}

// ----- Game Loop -----
function gameLoop() {
    if(gameRunning){
        movePaddles();
        moveBall();
        draw();
    }
    requestAnimationFrame(gameLoop);
}
