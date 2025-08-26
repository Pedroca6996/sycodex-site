const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let winMessage = document.getElementById('win-message');
if (!winMessage) {
    winMessage = document.createElement('div');
    winMessage.id = 'win-message';
    document.body.appendChild(winMessage);
}

const bounceSound = new Audio('../sounds/bounce.mp3');
const scoreSound  = new Audio('../sounds/score.mp3');
const winSound    = new Audio('../sounds/win.mp3');

const paddleWidth = 10, paddleHeight = 100;
let paddle1Y = canvas.height / 2 - paddleHeight / 2;
let paddle2Y = canvas.height / 2 - paddleHeight / 2;
const paddleSpeed = 5;

let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballSize = 10;
const initialBallSpeed = 4;
let ballSpeedX = initialBallSpeed;
let ballSpeedY = initialBallSpeed;

// em vez de apenas somar, agora multiplicamos a cada ponto
const speedMultiplier = 1.15; 

let score1 = 0;
let score2 = 0;
const winningScore = 5;
let gameRunning = true;

let highlightPaddle1 = false;
let highlightPaddle2 = false;

const accelerateOnBounce = false; // 👈 true se quiser aceleração em quiques

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

    // bordas
    if (ballY <= 0 || ballY >= canvas.height - ballSize) {
        ballSpeedY *= -1;
        bounceSound.currentTime = 0;
        bounceSound.play();
        if (accelerateOnBounce) {
            ballSpeedY *= 1.05;
        }
    }

    // raquete esquerda
    if (ballX <= paddleWidth && ballY > paddle1Y && ballY < paddle1Y + paddleHeight) {
        ballSpeedX *= -1;
        bounceSound.currentTime = 0;
        bounceSound.play();
        if (accelerateOnBounce) {
            ballSpeedX *= 1.05;
        }
    }
    // raquete direita
    if (ballX >= canvas.width - paddleWidth - ballSize && ballY > paddle2Y && ballY < paddle2Y + paddleHeight) {
        ballSpeedX *= -1;
        bounceSound.currentTime = 0;
        bounceSound.play();
        if (accelerateOnBounce) {
            ballSpeedX *= 1.05;
        }
    }

    // gol jogador 2
    if (ballX < 0) {
        score2++;
        highlightPaddle2 = true;
        setTimeout(() => highlightPaddle2 = false, 1000);
        scoreSound.currentTime = 0;
        scoreSound.play();
        checkWin();
        increaseBallSpeed(); // 👈 aumenta ANTES do reset
        resetBall();
    }
    // gol jogador 1
    else if (ballX > canvas.width) {
        score1++;
        highlightPaddle1 = true;
        setTimeout(() => highlightPaddle1 = false, 1000);
        scoreSound.currentTime = 0;
        scoreSound.play();
        checkWin();
        increaseBallSpeed(); // 👈 aumenta ANTES do reset
        resetBall();
    }
}

function resetBall() {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    // inverte direção X e randomiza Y
    ballSpeedX = -ballSpeedX;
    ballSpeedY = (Math.random() > 0.5 ? 1 : -1) * Math.abs(ballSpeedY);
}

function increaseBallSpeed() {
    ballSpeedX *= speedMultiplier;
    ballSpeedY *= speedMultiplier;
}

function checkWin() {
    if (score1 >= winningScore) {
        gameRunning = false;
        winSound.currentTime = 0;
        winSound.play();
        showWinMessage('Jogador 1');
    } else if (score2 >= winningScore) {
        gameRunning = false;
        winSound.currentTime = 0;
        winSound.play();
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
    // velocidade volta ao inicial 👇
    ballSpeedX = initialBallSpeed;
    ballSpeedY = initialBallSpeed;
    resetBall();
    winMessage.style.display = 'none';
    gameRunning = true;
    gameLoop();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = highlightPaddle1 ? 'yellow' : '#fff';
    ctx.fillRect(0, paddle1Y, paddleWidth, paddleHeight);

    ctx.fillStyle = highlightPaddle2 ? 'yellow' : '#fff';
    ctx.fillRect(canvas.width - paddleWidth, paddle2Y, paddleWidth, paddleHeight);

    ctx.fillStyle = '#fff';
    ctx.fillRect(ballX, ballY, ballSize, ballSize);

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
