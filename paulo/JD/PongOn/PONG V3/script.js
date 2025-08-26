const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Elemento para a mensagem de vitória
let winMessage = document.getElementById('win-message');
if (!winMessage) {
    winMessage = document.createElement('div');
    winMessage.id = 'win-message';
    document.body.appendChild(winMessage);
}

const paddleWidth = 10, paddleHeight = 100;
let paddle1Y = canvas.height / 2 - paddleHeight / 2;
let paddle2Y = canvas.height / 2 - paddleHeight / 2;
const paddleSpeed = 5;

let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballSize = 10;
let ballSpeedX = 4;
let ballSpeedY = 4;

let score1 = 0;
let score2 = 0;
const winningScore = 5;
let gameRunning = true;

const keys = {};
document.addEventListener('keydown', e => {
    keys[e.key] = true;
    if (!gameRunning && e.key === 'Enter') {
        resetGame();
    }
});
document.addEventListener('keyup', e => keys[e.key] = false);

function movePaddles() {
    if (keys['w'] && paddle1Y > 0) paddle1Y -= paddleSpeed;
    if (keys['s'] && paddle1Y < canvas.height - paddleHeight) paddle1Y += paddleSpeed;
    if (keys['ArrowUp'] && paddle2Y > 0) paddle2Y -= paddleSpeed;
    if (keys['ArrowDown'] && paddle2Y < canvas.height - paddleHeight) paddle2Y += paddleSpeed;
}

function moveBall() {
    ballX += ballSpeedX;
    ballY += ballSpeedY;

    if (ballY <= 0 || ballY >= canvas.height - ballSize) ballSpeedY *= -1;

    if (ballX <= paddleWidth && ballY > paddle1Y && ballY < paddle1Y + paddleHeight) {
        ballSpeedX *= -1;
    }
    if (ballX >= canvas.width - paddleWidth - ballSize && ballY > paddle2Y && ballY < paddle2Y + paddleHeight) {
        ballSpeedX *= -1;
    }

    if (ballX < 0) {
        score2++;
        checkWin();
        resetBall();
    } else if (ballX > canvas.width) {
        score1++;
        checkWin();
        resetBall();
    }
}

function resetBall() {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedX = -ballSpeedX;
    ballSpeedY = 4;
}

function checkWin() {
    if (score1 >= winningScore) {
        gameRunning = false;
        showWinMessage('Jogador 1');
    } else if (score2 >= winningScore) {
        gameRunning = false;
        showWinMessage('Jogador 2');
    }
}

function showWinMessage(winner) {
    winMessage.style.display = 'block';
    winMessage.innerHTML = `Vitória do ${winner}! <br> Pressione Enter para reiniciar.`;
}

function resetGame() {
    score1 = 0;
    score2 = 0;
    resetBall();
    winMessage.style.display = 'none';
    gameRunning = true;
    gameLoop();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, paddle1Y, paddleWidth, paddleHeight);
    ctx.fillRect(canvas.width - paddleWidth, paddle2Y, paddleWidth, paddleHeight);
    ctx.fillRect(ballX, ballY, ballSize, ballSize);

    // Desenhar a pontuação
    ctx.font = '30px Arial';
    ctx.fillText(score1, canvas.width / 4, 50);
    ctx.fillText(score2, canvas.width * 3 / 4, 50);
}

function gameLoop() {
    if (gameRunning) {
        movePaddles();
        moveBall();
        draw();
    }
    requestAnimationFrame(gameLoop);
}

gameLoop();