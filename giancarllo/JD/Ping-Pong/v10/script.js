// === PONG MOBILE - 1 JOGADOR (IA AUTOMÁTICA) ===

// Canvas e contexto
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Ajusta o canvas à tela
function resizeCanvas() {
    canvas.width = window.innerWidth * 0.95;
    canvas.height = window.innerHeight * 0.7;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Sons
const bounceSound = new Audio("sounds/bounce.mp3");
const scoreSound  = new Audio("sounds/score.mp3");
const winSound    = new Audio("sounds/win.mp3");

// Variáveis principais
const paddleHeight = 100, paddleWidth = 15;
let paddle1Y = canvas.height / 2 - paddleHeight / 2;
let paddle2Y = canvas.height / 2 - paddleHeight / 2;
let paddleSpeed = 8;
let aiSpeed = 6; // velocidade da IA

let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballSize = 15;
let ballSpeedX = 3;
let ballSpeedY = 2;
let initialSpeed = 3;
let winningScore = 5;

let score1 = 0, score2 = 0;
let gameOver = false;
let isPaused = false;
let gameLoopId = null;
let keys = {};

// Controles por teclado
document.addEventListener("keydown", (e) => keys[e.key] = true);
document.addEventListener("keyup", (e) => keys[e.key] = false);

// Controles por toque
const leftUp = document.getElementById("leftUp");
const leftDown = document.getElementById("leftDown");
function setupTouchControls() {
    const simulateKey = (key, state) => { keys[key] = state; };
    leftUp.addEventListener("touchstart", () => simulateKey("w", true));
    leftUp.addEventListener("touchend", () => simulateKey("w", false));
    leftDown.addEventListener("touchstart", () => simulateKey("s", true));
    leftDown.addEventListener("touchend", () => simulateKey("s", false));
}
setupTouchControls();

// Funções principais
function resetBall() {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedX = Math.random() > 0.5 ? initialSpeed : -initialSpeed;
    ballSpeedY = Math.random() > 0.5 ? initialSpeed - 1 : -(initialSpeed - 1);
}

function drawPaddle(x, y, color = "cyan") {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, paddleWidth, paddleHeight);
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = "magenta";
    ctx.fill();
}

function drawScore() {
    ctx.font = `${canvas.width / 20}px Arial`;
    ctx.fillStyle = "lime";
    ctx.fillText(score1, canvas.width / 4, 50);
    ctx.fillText(score2, 3 * canvas.width / 4, 50);
}

function drawWinScreen() {
    ctx.font = `${canvas.width / 15}px Arial`;
    ctx.fillStyle = "lime";
    let winner = score1 >= winningScore ? "Você venceu!" : "Computador venceu!";
    ctx.fillText(winner, canvas.width / 4, canvas.height / 2);
    ctx.font = `${canvas.width / 25}px Arial`;
    ctx.fillText("Toque na tela para reiniciar", canvas.width / 5, canvas.height / 2 + 60);
}

// Atualiza lógica
function update() {
    if (gameOver || isPaused) return;

    // Jogador 1
    if (keys["w"] && paddle1Y > 0) paddle1Y -= paddleSpeed;
    if (keys["s"] && paddle1Y < canvas.height - paddleHeight) paddle1Y += paddleSpeed;

    // IA automática
    if (ballY < paddle2Y + paddleHeight / 2) paddle2Y -= aiSpeed;
    else if (ballY > paddle2Y + paddleHeight / 2) paddle2Y += aiSpeed;

    if (paddle2Y < 0) paddle2Y = 0;
    if (paddle2Y > canvas.height - paddleHeight) paddle2Y = canvas.height - paddleHeight;

    // Movimento da bola
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    // Colisões
    if (ballY - ballSize / 2 < 0 || ballY + ballSize / 2 > canvas.height) {
        ballSpeedY = -ballSpeedY;
        bounceSound.play();
    }

    if (ballX - ballSize / 2 < paddleWidth &&
        ballY > paddle1Y && ballY < paddle1Y + paddleHeight) {
        ballSpeedX = -ballSpeedX;
        bounceSound.play();
    }

    if (ballX + ballSize / 2 > canvas.width - paddleWidth &&
        ballY > paddle2Y && ballY < paddle2Y + paddleHeight) {
        ballSpeedX = -ballSpeedX;
        bounceSound.play();
    }

    if (ballX < 0) { score2++; scoreSound.play(); resetBall(); }
    if (ballX > canvas.width) { score1++; scoreSound.play(); resetBall(); }

    if (score1 >= winningScore || score2 >= winningScore) {
        gameOver = true;
        winSound.play();
    }
}

// Desenho
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (gameOver) drawWinScreen();
    else {
        drawPaddle(0, paddle1Y);
        drawPaddle(canvas.width - paddleWidth, paddle2Y);
        drawBall();
        drawScore();
    }
}

function gameLoop() {
    update();
    draw();
    gameLoopId = requestAnimationFrame(gameLoop);
}

// Menus
const startScreen = document.getElementById("startScreen");
const instructionsScreen = document.getElementById("instructionsScreen");
const settingsScreen = document.getElementById("settingsScreen");

function startGame() {
    score1 = score2 = 0;
    gameOver = false;
    isPaused = false;
    resetBall();
    startScreen.style.display = "none";
    instructionsScreen.style.display = "none";
    settingsScreen.style.display = "none";
    canvas.style.display = "block";
    document.getElementById("gameControls").style.display = "block";
    document.getElementById("touchControls").style.display = "flex";
    if (!gameLoopId) gameLoop();
}

function backToMenu() {
    if (gameLoopId) { cancelAnimationFrame(gameLoopId); gameLoopId = null; }
    startScreen.style.display = "flex";
    canvas.style.display = "none";
    document.getElementById("gameControls").style.display = "none";
    document.getElementById("touchControls").style.display = "none";
}

document.getElementById("playBtn").addEventListener("click", startGame);
document.getElementById("menuBtn").addEventListener("click", backToMenu);

// Pause corrigido
const pauseBtn = document.getElementById("pauseBtn");
pauseBtn.addEventListener("click", () => {
    if (!canvas || canvas.style.display === "none") return;
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? "Continuar" : "Pause";
    if (!isPaused && !gameLoopId) gameLoop();
});
