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
const scoreSound  = new Audio('../sounds/score.mp3');
const winSound    = new Audio('../sounds/win.mp3');

// ----- Configurações padrão -----
let paddleWidth = 10, paddleHeight = 100;
let paddle1Y = gameCanvas.height / 2 - paddleHeight / 2;
let paddle2Y = gameCanvas.height / 2 - paddleHeight / 2;
let paddleSpeed = 5;

let ballX = gameCanvas.width / 2;
let ballY = gameCanvas.height / 2;
let ballSize = 10;
let initialBallSpeed = 2;
let ballSpeedX = initialBallSpeed;
let ballSpeedY = initialBallSpeed;

// Aceleração: perceptível por ponto e opcional nos quiques
const speedMultiplier  = 1.18;  // aumento por PONTO (ajuste se quiser mais/menos)
const bounceMultiplier = 1.05;  // aumento por QUIQUE (quando ativado)
const accelerateOnBounce = false; // mude para true para acelerar em bordas/raquetes também
const maxBallSpeed = 16;        // teto para manter jogabilidade

let score1 = 0;
let score2 = 0;
let winningScore = 5;
let gameRunning = true;

let highlightPaddle1 = false;
let highlightPaddle2 = false;

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
  // Atualiza configurações
  const bs = Number(document.getElementById('ball-speed-input').value);
  const ws = Number(document.getElementById('winning-score-input').value);
  if (!Number.isNaN(bs) && bs > 0) initialBallSpeed = bs;
  if (!Number.isNaN(ws) && ws > 0) winningScore = ws;
  settingsScreen.style.display = 'none';
  menuScreen.style.display = 'block';
});

// ----- Controle do Jogo -----
const keys = {};
document.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (!gameRunning && e.key === 'Enter') resetGame();
});
document.addEventListener('keyup', e => (keys[e.key] = false));

function movePaddles() {
  if (keys['w'] && paddle1Y > 0) paddle1Y -= paddleSpeed;
  if (keys['s'] && paddle1Y < gameCanvas.height - paddleHeight) paddle1Y += paddleSpeed;
  if (keys['ArrowUp'] && paddle2Y > 0) paddle2Y -= paddleSpeed;
  if (keys['ArrowDown'] && paddle2Y < gameCanvas.height - paddleHeight) paddle2Y += paddleSpeed;
}

function moveBall() {
  ballX += ballSpeedX;
  ballY += ballSpeedY;

  // Bordas superior/inferior
  if (ballY <= 0 || ballY >= gameCanvas.height - ballSize) {
    ballSpeedY *= -1;
    bounceSound.currentTime = 0;
    bounceSound.play();
    if (accelerateOnBounce) {
      ballSpeedY *= bounceMultiplier;
      clampSpeed();
    }
  }

  // Colisão com raquete esquerda
  if (
    ballX <= paddleWidth &&
    ballY + ballSize > paddle1Y &&
    ballY < paddle1Y + paddleHeight
  ) {
    ballSpeedX *= -1;
    applyPaddleAngle(1); // ajusta ângulo de saída
    bounceSound.currentTime = 0;
    bounceSound.play();
    if (accelerateOnBounce) {
      ballSpeedX *= bounceMultiplier;
      clampSpeed();
    }
  }

  // Colisão com raquete direita
  if (
    ballX + ballSize >= gameCanvas.width - paddleWidth &&
    ballY + ballSize > paddle2Y &&
    ballY < paddle2Y + paddleHeight
  ) {
    ballSpeedX *= -1;
    applyPaddleAngle(2);
    bounceSound.currentTime = 0;
    bounceSound.play();
    if (accelerateOnBounce) {
      ballSpeedX *= bounceMultiplier;
      clampSpeed();
    }
  }

  // Gol do jogador 2 (bola saiu à esquerda)
  if (ballX + ballSize < 0) {
    score2++;
    highlightPaddle2 = true;
    setTimeout(() => (highlightPaddle2 = false), 1000);
    scoreSound.currentTime = 0;
    scoreSound.play();
    checkWin();
    increaseBallSpeed(); // aumento perceptível por PONTO
    resetBall();         // mantém o módulo da velocidade (não reseta para o inicial)
  }
  // Gol do jogador 1 (bola saiu à direita)
  else if (ballX > gameCanvas.width) {
    score1++;
    highlightPaddle1 = true;
    setTimeout(() => (highlightPaddle1 = false), 1000);
    scoreSound.currentTime = 0;
    scoreSound.play();
    checkWin();
    increaseBallSpeed();
    resetBall();
  }
}

// Mantém/ajusta velocidade ao bater na raquete: mais alto/baixo = mais inclinado
function applyPaddleAngle(paddle) {
  const paddleY = paddle === 1 ? paddle1Y : paddle2Y;
  const paddleCenter = paddleY + paddleHeight / 2;
  const ballCenter = ballY + ballSize / 2;
  const offset = (ballCenter - paddleCenter) / (paddleHeight / 2); // -1..1
  // Pequeno ajuste no Y para dar "spin" sem quebrar a jogabilidade
  ballSpeedY += offset * 1.5;
  clampSpeed();
}

function clampSpeed() {
  const ax = Math.min(Math.abs(ballSpeedX), maxBallSpeed);
  const ay = Math.min(Math.abs(ballSpeedY), maxBallSpeed);
  ballSpeedX = Math.sign(ballSpeedX || 1) * ax;
  ballSpeedY = Math.sign(ballSpeedY || 1) * ay;
}



function increaseBallSpeed() {
  // Aumenta de forma multiplicativa (perceptível)
  const sx = Math.sign(ballSpeedX || 1);
  const sy = Math.sign(ballSpeedY || 1);
  ballSpeedX = sx * Math.abs(ballSpeedX) * speedMultiplier;
  ballSpeedY = sy * Math.abs(ballSpeedY) * speedMultiplier;
  clampSpeed();
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

function resetBall(isNewGame = false) {
    ballX = gameCanvas.width / 2;
    ballY = gameCanvas.height / 2;

    if (isNewGame) {
        // Reinício de partida: velocidade volta ao valor inicial
        ballSpeedX = initialBallSpeed * (Math.random() > 0.5 ? 1 : -1);
        ballSpeedY = initialBallSpeed * (Math.random() > 0.5 ? 1 : -1);
    } else {
        // Apenas após gol: mantém aceleração
        ballSpeedX = -ballSpeedX;
        ballSpeedY = initialBallSpeed * (Math.random() > 0.5 ? 1 : -1);
    }
}

function resetGame() {
    score1 = 0;
    score2 = 0;
    winMessage.style.display = 'none';
    gameRunning = true;

    // Reinício de partida: bola volta com velocidade inicial
    resetBall(true);

    gameLoop();
}


function draw() {
  ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

  // Raquetes (com destaque)
  ctx.fillStyle = highlightPaddle1 ? 'yellow' : '#fff';
  ctx.fillRect(0, paddle1Y, paddleWidth, paddleHeight);

  ctx.fillStyle = highlightPaddle2 ? 'yellow' : '#fff';
  ctx.fillRect(gameCanvas.width - paddleWidth, paddle2Y, paddleWidth, paddleHeight);

  // Bola
  ctx.fillStyle = '#fff';
  ctx.fillRect(ballX, ballY, ballSize, ballSize);

  // Placar
  ctx.font = '30px Arial';
  ctx.fillText(score1, gameCanvas.width / 4, 50);
  ctx.fillText(score2, (gameCanvas.width * 3) / 4, 50);
}

function gameLoop() {
  if (gameRunning) {
    movePaddles();
    moveBall();
    draw();
  }
  requestAnimationFrame(gameLoop);
}
