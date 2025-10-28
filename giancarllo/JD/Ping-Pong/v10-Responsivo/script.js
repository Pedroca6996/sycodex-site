// === Mantém o código original ===
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const bounceSound = new Audio("sounds/bounce.mp3");
const scoreSound  = new Audio("sounds/score.mp3");
const winSound    = new Audio("sounds/win.mp3");

const paddleHeight = 100, paddleWidth = 15;
let paddle1Y = canvas.height / 2 - paddleHeight / 2;
let paddle2Y = canvas.height / 2 - paddleHeight / 2;
let paddleSpeed = 8;

let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballSize = 15;

let ballSpeedX = 3;
let ballSpeedY = 2;
let initialSpeed = 3;
const speedIncrement = 0.3;
const maxSpeed = 12;

let score1 = 0, score2 = 0;
let winningScore = 5;
let gameOver = false;
let highlightPaddle = null;
let highlightTimer = 0;

let keys = {};
let isPaused = false;
let gameLoopId = null;

document.addEventListener("keydown", (e) => keys[e.key] = true);
document.addEventListener("keyup", (e) => keys[e.key] = false);

// === 🔹 Novo: Função para redimensionar o canvas conforme a tela ===
function resizeCanvas() {
    const aspect = 1000 / 700; // proporção original
    let w = window.innerWidth;
    let h = window.innerHeight;

    // Mantém proporção
    if (w / h > aspect) {
        w = h * aspect;
    } else {
        h = w / aspect;
    }

    canvas.width = w;
    canvas.height = h;
}
window.addEventListener("resize", resizeCanvas);

// === 🔹 NOVOS CONTROLES DE TOQUE ===
const p1UpBtn = document.getElementById("p1Up");
const p1DownBtn = document.getElementById("p1Down");
const p2UpBtn = document.getElementById("p2Up");
const p2DownBtn = document.getElementById("p2Down");

let touchState = { p1Up: false, p1Down: false, p2Up: false, p2Down: false };

// Ativa/desativa controles de toque
[p1UpBtn, p1DownBtn, p2UpBtn, p2DownBtn].forEach(btn => {
    if (!btn) return;
    btn.addEventListener("touchstart", e => {
        e.preventDefault();
        touchState[btn.id] = true;
    });
    btn.addEventListener("touchend", e => {
        e.preventDefault();
        touchState[btn.id] = false;
    });
});

// === 🔹 Ajustes no update() para incluir toques ===
function update() {
    if (gameOver || isPaused) return;

    // Jogador 1 (teclado ou toque)
    if ((keys["w"] || touchState.p1Up) && paddle1Y > 0) paddle1Y -= paddleSpeed;
    if ((keys["s"] || touchState.p1Down) && paddle1Y < canvas.height - paddleHeight) paddle1Y += paddleSpeed;

    // Jogador 2 (teclado ou toque)
    if ((keys["ArrowUp"] || touchState.p2Up) && paddle2Y > 0) paddle2Y -= paddleSpeed;
    if ((keys["ArrowDown"] || touchState.p2Down) && paddle2Y < canvas.height - paddleHeight) paddle2Y += paddleSpeed;

    // resto do código original...
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    if (ballY - ballSize / 2 < 0 || ballY + ballSize / 2 > canvas.height) {
        ballSpeedY = -ballSpeedY;
        if (Math.abs(ballSpeedY) < maxSpeed) {
            ballSpeedY += ballSpeedY > 0 ? speedIncrement : -speedIncrement;
        }
        bounceSound.play();
    }

    if (ballX - ballSize / 2 < paddleWidth && ballY > paddle1Y && ballY < paddle1Y + paddleHeight) {
        ballSpeedX = -ballSpeedX;
        if (Math.abs(ballSpeedX) < maxSpeed) ballSpeedX += ballSpeedX > 0 ? speedIncrement : -speedIncrement;
        bounceSound.play();
    }
    if (ballX + ballSize / 2 > canvas.width - paddleWidth && ballY > paddle2Y && ballY < paddle2Y + paddleHeight) {
        ballSpeedX = -ballSpeedX;
        if (Math.abs(ballSpeedX) < maxSpeed) ballSpeedX += ballSpeedX > 0 ? speedIncrement : -speedIncrement;
        bounceSound.play();
    }

    if (ballX < 0) {
        score2++;
        scoreSound.play();
        highlightPaddle = "right";
        highlightTimer = 60;
        resetBall();
    }
    if (ballX > canvas.width) {
        score1++;
        scoreSound.play();
        highlightPaddle = "left";
        highlightTimer = 60;
        resetBall();
    }

    if (score1 >= winningScore || score2 >= winningScore) {
        gameOver = true;
        winSound.play();
    }

    if (highlightTimer > 0) highlightTimer--;
    else highlightPaddle = null;
}

// === 🔹 Mostrar controles de toque quando o jogo começar ===
function startGame() {
    score1 = 0;
    score2 = 0;
    gameOver = false;
    isPaused = false;
    resetBall();
    resizeCanvas(); // ajusta o tamanho do canvas ao iniciar

    startScreen.style.display = "none";
    instructionsScreen.style.display = "none";
    settingsScreen.style.display = "none";
    canvas.style.display = "block";
    document.getElementById("gameControls").style.display = "block";
    document.getElementById("touchControls").style.display = "flex"; // 🔹 exibe botões de toque

    if (!gameLoopId) gameLoop();
}

// === 🔹 Esconde os botões ao voltar ao menu ===
function backToMenu() {
    isPaused = false;
    gameOver = false;
    score1 = 0;
    score2 = 0;
    highlightPaddle = null;
    highlightTimer = 0;

    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }

    startScreen.style.display = "flex";
    canvas.style.display = "none";
    document.getElementById("gameControls").style.display = "none";
    document.getElementById("touchControls").style.display = "none"; // 🔹 esconde botões de toque
}

// mantém o resto igual...
