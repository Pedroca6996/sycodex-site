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
    ctx.font = "40px Arial";
    ctx.fillStyle = "lime";
    ctx.fillText(score1, canvas.width / 4, 50);
    ctx.fillText(score2, 3 * canvas.width / 4, 50);
}

function drawWinScreen() {
    ctx.font = "50px Arial";
    ctx.fillStyle = "lime";
    let winner = score1 >= winningScore ? "Jogador 1" : "Jogador 2";
    ctx.fillText("Vitória do " + winner, canvas.width / 2 - 200, canvas.height / 2);
    ctx.font = "25px Arial";
    ctx.fillText("Pressione ENTER para reiniciar", canvas.width / 2 - 180, canvas.height / 2 + 50);
}

function update() {
    if (gameOver || isPaused) return;

    if (keys["w"] && paddle1Y > 0) paddle1Y -= paddleSpeed;
    if (keys["s"] && paddle1Y < canvas.height - paddleHeight) paddle1Y += paddleSpeed;
    if (keys["ArrowUp"] && paddle2Y > 0) paddle2Y -= paddleSpeed;
    if (keys["ArrowDown"] && paddle2Y < canvas.height - paddleHeight) paddle2Y += paddleSpeed;

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

// ----------------- Tela inicial e botões -----------------
const startScreen = document.getElementById("startScreen");
const instructionsScreen = document.getElementById("instructionsScreen");
const settingsScreen = document.getElementById("settingsScreen");

function startGame() {
    score1 = 0;
    score2 = 0;
    gameOver = false;
    isPaused = false;
    resetBall();

    startScreen.style.display = "none";
    instructionsScreen.style.display = "none";
    settingsScreen.style.display = "none";
    canvas.style.display = "block";
    document.getElementById("gameControls").style.display = "block";

    if (!gameLoopId) gameLoop();
}

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
}

document.getElementById("playBtn").addEventListener("click", startGame);
document.getElementById("instructionsBtn").addEventListener("click", () => {
    startScreen.style.display = "none";
    instructionsScreen.style.display = "block";
});
document.getElementById("backFromInstructions").addEventListener("click", () => {
    instructionsScreen.style.display = "none";
    startScreen.style.display = "flex";
});
document.getElementById("settingsBtn").addEventListener("click", () => {
    startScreen.style.display = "none";
    settingsScreen.style.display = "block";
});
document.getElementById("backFromSettings").addEventListener("click", () => {
    settingsScreen.style.display = "none";
    startScreen.style.display = "flex";
});
document.getElementById("saveSettings").addEventListener("click", () => {
    const speedInput = parseFloat(document.getElementById("initialSpeed").value);
    const winInput = parseInt(document.getElementById("winningScoreInput").value);

    if (!isNaN(speedInput) && speedInput > 0) initialSpeed = speedInput;
    if (!isNaN(winInput) && winInput > 0) winningScore = winInput;

    settingsScreen.style.display = "none";
    startScreen.style.display = "flex";
});

document.getElementById("pauseBtn").addEventListener("click", () => {
    if (!gameLoopId) return;
    isPaused = !isPaused;
});

document.getElementById("menuBtn").addEventListener("click", backToMenu);

document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && gameOver) {
        score1 = 0;
        score2 = 0;
        gameOver = false;
        resetBall();
    }
});
