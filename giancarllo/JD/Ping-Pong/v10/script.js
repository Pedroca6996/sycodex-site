// 🔸 CÓDIGO ORIGINAL PRESERVADO
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// 🔸 ADIÇÃO: ajuste automático da tela para diferentes tamanhos de dispositivos
function resizeCanvas() {
    canvas.width = window.innerWidth * 0.95;
    canvas.height = window.innerHeight * 0.75;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas(); // chama uma vez ao iniciar

// 🔸 Sons e variáveis originais mantidos
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

// 🔸 Controles de teclado originais
document.addEventListener("keydown", (e) => keys[e.key] = true);
document.addEventListener("keyup", (e) => keys[e.key] = false);

// 🔹 ADIÇÃO: Controles por toque (para celular)
const touchControls = document.getElementById("touchControls");
const leftUp = document.getElementById("leftUp");
const leftDown = document.getElementById("leftDown");
const rightUp = document.getElementById("rightUp");
const rightDown = document.getElementById("rightDown");

// Cada toque simula tecla pressionada
function setupTouchControls() {
    const simulateKey = (key, state) => { keys[key] = state; };
    leftUp.addEventListener("touchstart", () => simulateKey("w", true));
    leftUp.addEventListener("touchend", () => simulateKey("w", false));
    leftDown.addEventListener("touchstart", () => simulateKey("s", true));
    leftDown.addEventListener("touchend", () => simulateKey("s", false));
    rightUp.addEventListener("touchstart", () => simulateKey("ArrowUp", true));
    rightUp.addEventListener("touchend", () => simulateKey("ArrowUp", false));
    rightDown.addEventListener("touchstart", () => simulateKey("ArrowDown", true));
    rightDown.addEventListener("touchend", () => simulateKey("ArrowDown", false));
}
setupTouchControls(); // ativa controles por toque

// 🔹 Fim das adições — o restante é o mesmo código original
function resetBall() {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedX = Math.random() > 0.5 ? initialSpeed : -initialSpeed;
    ballSpeedY = Math.random() > 0.5 ? initialSpeed - 1 : -(initialSpeed - 1);
}

function drawPaddle(x, y, highlight) {
    ctx.fillStyle = highlight ? "yellow" : "cyan";
    ctx.shadowColor = "white";
    ctx.shadowBlur = 15;
    ctx.fillRect(x, y, paddleWidth, paddleHeight);
    ctx.shadowBlur = 0;
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = "magenta";
    ctx.shadowColor = "white";
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawScore() {
    ctx.font = `${canvas.width / 25}px Arial`; // 🔸 ajusta tamanho da fonte conforme tela
    ctx.fillStyle = "lime";
    ctx.fillText(score1, canvas.width / 4, 50);
    ctx.fillText(score2, 3 * canvas.width / 4, 50);
}

function drawWinScreen() {
    ctx.font = `${canvas.width / 20}px Arial`;
    ctx.fillStyle = "lime";
    let winner = score1 >= winningScore ? "Jogador 1" : "Jogador 2";
    ctx.fillText("Vitória do " + winner, canvas.width / 3.5, canvas.height / 2);
    ctx.font = `${canvas.width / 30}px Arial`;
    ctx.fillText("Toque na tela para reiniciar", canvas.width / 3.5, canvas.height / 2 + 50);
}

function update() {
    if (gameOver || isPaused) return;

    // Movimentos originais, agora também funcionam com toque
    if (keys["w"] && paddle1Y > 0) paddle1Y -= paddleSpeed;
    if (keys["s"] && paddle1Y < canvas.height - paddleHeight) paddle1Y += paddleSpeed;
    if (keys["ArrowUp"] && paddle2Y > 0) paddle2Y -= paddleSpeed;
    if (keys["ArrowDown"] && paddle2Y < canvas.height - paddleHeight) paddle2Y += paddleSpeed;

    ballX += ballSpeedX;
    ballY += ballSpeedY;

    if (ballY - ballSize / 2 < 0 || ballY + ballSize / 2 > canvas.height) {
        ballSpeedY = -ballSpeedY;
        bounceSound.play();
    }

    if (ballX - ballSize / 2 < paddleWidth && ballY > paddle1Y && ballY < paddle1Y + paddleHeight) {
        ballSpeedX = -ballSpeedX;
        bounceSound.play();
    }
    if (ballX + ballSize / 2 > canvas.width - paddleWidth && ballY > paddle2Y && ballY < paddle2Y + paddleHeight) {
        ballSpeedX = -ballSpeedX;
        bounceSound.play();
    }

    if (ballX < 0) {
        score2++; scoreSound.play(); resetBall();
    }
    if (ballX > canvas.width) {
        score1++; scoreSound.play(); resetBall();
    }

    if (score1 >= winningScore || score2 >= winningScore) {
        gameOver = true;
        winSound.play();
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (gameOver) drawWinScreen();
    else {
        drawPaddle(0, paddle1Y, highlightPaddle === "left");
        drawPaddle(canvas.width - paddleWidth, paddle2Y, highlightPaddle === "right");
        drawBall();
        drawScore();
    }
}

function gameLoop() {
    update();
    draw();
    gameLoopId = requestAnimationFrame(gameLoop);
}

// Telas originais
const startScreen = document.getElementById("startScreen");
const instructionsScreen = document.getElementById("instructionsScreen");
const settingsScreen = document.getElementById("settingsScreen");

function startGame() {
    score1 = 0; score2 = 0; gameOver = false; isPaused = false;
    resetBall();
    startScreen.style.display = "none";
    instructionsScreen.style.display = "none";
    settingsScreen.style.display = "none";
    canvas.style.display = "block";
    document.getElementById("gameControls").style.display = "block";
    document.getElementById("touchControls").style.display = "flex"; // 🔸 mostra botões de toque
    if (!gameLoopId) gameLoop();
}

function backToMenu() {
    if (gameLoopId) { cancelAnimationFrame(gameLoopId); gameLoopId = null; }
    startScreen.style.display = "flex";
    canvas.style.display = "none";
    document.getElementById("gameControls").style.display = "none";
    document.getElementById("touchControls").style.display = "none"; // 🔸 oculta botões
}

// Controles originais de menu e pausa mantidos
document.getElementById("playBtn").addEventListener("click", startGame);
document.getElementById("menuBtn").addEventListener("click", backToMenu);
