const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Jogadores
let paddleHeight = 100;
let paddleWidth = 15;
let player1Y = canvas.height / 2 - paddleHeight / 2;
let player2Y = canvas.height / 2 - paddleHeight / 2;
let paddleSpeed = 7;

// Bola
let ballSize = 15;
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballSpeedX = 4;
let ballSpeedY = 4;

// Placar
let player1Score = 0;
let player2Score = 0;
let winningScore = 5;

// Controle
let upPressed = false, downPressed = false;
let wPressed = false, sPressed = false;
let paused = false;

// Sons (ajuste os caminhos conforme sua estrutura)
const hitSound = new Audio("../../../../sounds/hit.wav");
const scoreSound = new Audio("../../../../sounds/score.wav");
const wallSound = new Audio("../../../../sounds/wall.wav");

// Responsividade
function resizeCanvas() {
    const aspectRatio = 1000 / 700;
    let newWidth = window.innerWidth;
    let newHeight = window.innerWidth / aspectRatio;

    if (newHeight > window.innerHeight) {
        newHeight = window.innerHeight;
        newWidth = newHeight * aspectRatio;
    }

    canvas.width = newWidth;
    canvas.height = newHeight;
}
window.addEventListener("resize", resizeCanvas);

// Desenho
function drawPaddle(x, y) {
    ctx.fillStyle = "white";
    ctx.fillRect(x, y, paddleWidth, paddleHeight);
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballSize, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.closePath();
}

function drawScore() {
    ctx.font = "30px Arial";
    ctx.fillText(player1Score, canvas.width / 4, 50);
    ctx.fillText(player2Score, 3 * canvas.width / 4, 50);
}

// Movimento
function movePaddles() {
    if (wPressed && player1Y > 0) player1Y -= paddleSpeed;
    if (sPressed && player1Y < canvas.height - paddleHeight) player1Y += paddleSpeed;
    if (upPressed && player2Y > 0) player2Y -= paddleSpeed;
    if (downPressed && player2Y < canvas.height - paddleHeight) player2Y += paddleSpeed;
}

function moveBall() {
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    // Colisão topo/fundo
    if (ballY - ballSize < 0 || ballY + ballSize > canvas.height) {
        ballSpeedY *= -1;
        wallSound.play();
    }

    // Colisão com jogadores
    if (
        ballX - ballSize < paddleWidth &&
        ballY > player1Y &&
        ballY < player1Y + paddleHeight
    ) {
        ballSpeedX *= -1;
        hitSound.play();
    }

    if (
        ballX + ballSize > canvas.width - paddleWidth &&
        ballY > player2Y &&
        ballY < player2Y + paddleHeight
    ) {
        ballSpeedX *= -1;
        hitSound.play();
    }

    // Pontuação
    if (ballX < 0) {
        player2Score++;
        scoreSound.play();
        resetBall();
    } else if (ballX > canvas.width) {
        player1Score++;
        scoreSound.play();
        resetBall();
    }
}

function resetBall() {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedX *= -1;
    ballSpeedY = 4 * (Math.random() > 0.5 ? 1 : -1);
}

// Loop principal
function gameLoop() {
    if (!paused) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawPaddle(0, player1Y);
        drawPaddle(canvas.width - paddleWidth, player2Y);
        drawBall();
        drawScore();
        movePaddles();
        moveBall();
    }
    requestAnimationFrame(gameLoop);
}

// Controles teclado
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp") upPressed = true;
    if (e.key === "ArrowDown") downPressed = true;
    if (e.key === "w" || e.key === "W") wPressed = true;
    if (e.key === "s" || e.key === "S") sPressed = true;
});
document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowUp") upPressed = false;
    if (e.key === "ArrowDown") downPressed = false;
    if (e.key === "w" || e.key === "W") wPressed = false;
    if (e.key === "s" || e.key === "S") sPressed = false;
});

// Controles touch
function bindTouchButton(id, callbackDown, callbackUp) {
    const btn = document.getElementById(id);
    btn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        callbackDown();
    });
    btn.addEventListener("touchend", (e) => {
        e.preventDefault();
        callbackUp();
    });
}

bindTouchButton("p1Up", () => (wPressed = true), () => (wPressed = false));
bindTouchButton("p1Down", () => (sPressed = true), () => (sPressed = false));
bindTouchButton("p2Up", () => (upPressed = true), () => (upPressed = false));
bindTouchButton("p2Down", () => (downPressed = true), () => (downPressed = false));

// Detecta touch device
function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// Inicialização
window.onload = () => {
    resizeCanvas();
    if (isTouchDevice()) {
        document.getElementById("touchControls").style.display = "flex";
    } else {
        document.getElementById("touchControls").style.display = "none";
    }
    gameLoop();
};
