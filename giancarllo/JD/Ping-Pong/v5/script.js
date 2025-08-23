const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Sons
const bounceSound = new Audio("sounds/bounce.mp3");
const scoreSound  = new Audio("sounds/score.mp3");
const winSound    = new Audio("sounds/win.mp3");

// Jogadores
const paddleHeight = 100, paddleWidth = 15;
let paddle1Y = canvas.height / 2 - paddleHeight / 2;
let paddle2Y = canvas.height / 2 - paddleHeight / 2;
const paddleSpeed = 8;

// Bola
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballSize = 15;

// Velocidade da bola
let ballSpeedX = 3;
let ballSpeedY = 2;
const speedIncrement = 0.3;
const maxSpeed = 12;

// Placar
let score1 = 0, score2 = 0;
const winningScore = 5;
let gameOver = false;
let highlightPaddle = null;
let highlightTimer = 0;

// Controles
let keys = {};
document.addEventListener("keydown", (e) => keys[e.key] = true);
document.addEventListener("keyup", (e) => keys[e.key] = false);

function resetBall() {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    // Velocidade inicial ao reiniciar
    ballSpeedX = Math.random() > 0.5 ? 3 : -3;
    ballSpeedY = Math.random() > 0.5 ? 2 : -2;
}

function drawPaddle(x, y, highlight) {
    ctx.fillStyle = highlight ? "yellow" : "white";
    ctx.fillRect(x, y, paddleWidth, paddleHeight);
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
}

function drawScore() {
    ctx.font = "30px Arial";
    ctx.fillStyle = "white";
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
    if (gameOver) return;

    // Movimento dos jogadores
    if (keys["w"] && paddle1Y > 0) paddle1Y -= paddleSpeed;
    if (keys["s"] && paddle1Y < canvas.height - paddleHeight) paddle1Y += paddleSpeed;
    if (keys["ArrowUp"] && paddle2Y > 0) paddle2Y -= paddleSpeed;
    if (keys["ArrowDown"] && paddle2Y < canvas.height - paddleHeight) paddle2Y += paddleSpeed;

    // Movimento da bola
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    // Colisão topo/baixo
    if (ballY - ballSize / 2 < 0 || ballY + ballSize / 2 > canvas.height) {
        ballSpeedY = -ballSpeedY;
        // Aumenta velocidade gradualmente
        if (Math.abs(ballSpeedY) < maxSpeed) {
            ballSpeedY += ballSpeedY > 0 ? speedIncrement : -speedIncrement;
        }
        bounceSound.play();
    }

    // Colisão paddles
    if (ballX - ballSize / 2 < paddleWidth && ballY > paddle1Y && ballY < paddle1Y + paddleHeight) {
        ballSpeedX = -ballSpeedX;
        if (Math.abs(ballSpeedX) < maxSpeed) {
            ballSpeedX += ballSpeedX > 0 ? speedIncrement : -speedIncrement;
        }
        bounceSound.play();
    }
    if (ballX + ballSize / 2 > canvas.width - paddleWidth && ballY > paddle2Y && ballY < paddle2Y + paddleHeight) {
        ballSpeedX = -ballSpeedX;
        if (Math.abs(ballSpeedX) < maxSpeed) {
            ballSpeedX += ballSpeedX > 0 ? speedIncrement : -speedIncrement;
        }
        bounceSound.play();
    }

    // Ponto jogador 2
    if (ballX < 0) {
        score2++;
        scoreSound.play();
        highlightPaddle = "right";
        highlightTimer = 60;
        resetBall();
    }

    // Ponto jogador 1
    if (ballX > canvas.width) {
        score1++;
        scoreSound.play();
        highlightPaddle = "left";
        highlightTimer = 60;
        resetBall();
    }

    // Vitória
    if (score1 >= winningScore || score2 >= winningScore) {
        gameOver = true;
        winSound.play();
    }

    // Timer de destaque
    if (highlightTimer > 0) highlightTimer--;
    else highlightPaddle = null;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (gameOver) {
        drawWinScreen();
    } else {
        drawPaddle(0, paddle1Y, highlightPaddle === "left");
        drawPaddle(canvas.width - paddleWidth, paddle2Y, highlightPaddle === "right");
        drawBall();
        drawScore();
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Reiniciar
document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && gameOver) {
        score1 = 0;
        score2 = 0;
        gameOver = false;
        resetBall();
    }
});

gameLoop();
