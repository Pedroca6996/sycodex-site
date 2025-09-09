const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Configurações iniciais
const paddleWidth = 10, paddleHeight = 100, ballSize = 10;
let player1Y = canvas.height / 2 - paddleHeight / 2;
let player2Y = canvas.height / 2 - paddleHeight / 2;
let player1Score = 0, player2Score = 0;
const winningScore = 10;
let gameOver = false;

// Bola
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballSpeedX = 4;
let ballSpeedY = 4;

// Controles
let wPressed = false, sPressed = false, upPressed = false, downPressed = false;

// Destaque
let highlightP1 = false, highlightP2 = false;
let highlightTimer = 0;

// Sons
const bounceSound = new Audio("bounce.wav");
const scoreSound = new Audio("score.wav");
const winSound = new Audio("win.wav");

// Movimentação das raquetes
document.addEventListener("keydown", (e) => {
  if (e.key === "w") wPressed = true;
  if (e.key === "s") sPressed = true;
  if (e.key === "ArrowUp") upPressed = true;
  if (e.key === "ArrowDown") downPressed = true;
  if (gameOver && e.key === "Enter") restartGame();
});
document.addEventListener("keyup", (e) => {
  if (e.key === "w") wPressed = false;
  if (e.key === "s") sPressed = false;
  if (e.key === "ArrowUp") upPressed = false;
  if (e.key === "ArrowDown") downPressed = false;
});

function movePaddles() {
  if (wPressed && player1Y > 0) player1Y -= 6;
  if (sPressed && player1Y + paddleHeight < canvas.height) player1Y += 6;
  if (upPressed && player2Y > 0) player2Y -= 6;
  if (downPressed && player2Y + paddleHeight < canvas.height) player2Y += 6;
}

function moveBall() {
  ballX += ballSpeedX;
  ballY += ballSpeedY;

  // Quicar no topo e na base
  if (ballY <= 0 || ballY + ballSize >= canvas.height) {
    ballSpeedY = -ballSpeedY;
    bounceSound.play();
    accelerateBall();
  }

  // Colisão com jogador 1
  if (ballX <= paddleWidth && ballY + ballSize >= player1Y && ballY <= player1Y + paddleHeight) {
    ballSpeedX = -ballSpeedX;
    bounceSound.play();
    accelerateBall();
  }

  // Colisão com jogador 2
  if (ballX + ballSize >= canvas.width - paddleWidth &&
      ballY + ballSize >= player2Y &&
      ballY <= player2Y + paddleHeight) {
    ballSpeedX = -ballSpeedX;
    bounceSound.play();
    accelerateBall();
  }

  // Pontuação
  if (ballX < 0) {
    player2Score++;
    scoreSound.play();
    highlightP2 = true;
    highlightTimer = 60;
    checkWin();
    resetBall();
  }

  if (ballX + ballSize > canvas.width) {
    player1Score++;
    scoreSound.play();
    highlightP1 = true;
    highlightTimer = 60;
    checkWin();
    resetBall();
  }
}

function accelerateBall() {
  ballSpeedX *= 1.05;
  ballSpeedY *= 1.05;
}

function resetBall() {
  ballX = canvas.width / 2;
  ballY = canvas.height / 2;
  ballSpeedX = (Math.random() > 0.5 ? 4 : -4);
  ballSpeedY = (Math.random() > 0.5 ? 4 : -4);
}

function checkWin() {
  if (player1Score >= winningScore || player2Score >= winningScore) {
    gameOver = true;
    winSound.play();
  }
}

function restartGame() {
  player1Score = 0;
  player2Score = 0;
  ballSpeedX = 4;
  ballSpeedY = 4;
  gameOver = false;
  highlightP1 = false;
  highlightP2 = false;
  resetBall();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Fundo
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Linha central
  ctx.strokeStyle = "white";
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);

  // Placar
  ctx.fillStyle = "white";
  ctx.font = "30px Arial";
  ctx.fillText(player1Score, canvas.width / 4, 50);
  ctx.fillText(player2Score, 3 * canvas.width / 4, 50);

  // Raquetes
  ctx.fillStyle = highlightP1 ? "yellow" : "white";
  ctx.fillRect(0, player1Y, paddleWidth, paddleHeight);
  ctx.fillStyle = highlightP2 ? "yellow" : "white";
  ctx.fillRect(canvas.width - paddleWidth, player2Y, paddleWidth, paddleHeight);

  // Bola
  ctx.fillStyle = "white";
  ctx.fillRect(ballX, ballY, ballSize, ballSize);

  // Mensagem de vitória
  if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "40px Arial";
    const winner = player1Score >= winningScore ? "Jogador 1" : "Jogador 2";
    ctx.fillText(`Vitória do ${winner}!`, canvas.width / 2 - 150, canvas.height / 2);
    ctx.font = "20px Arial";
    ctx.fillText("Pressione Enter para reiniciar", canvas.width / 2 - 140, canvas.height / 2 + 40);
  }

  if (highlightTimer > 0) {
    highlightTimer--;
    if (highlightTimer === 0) {
      highlightP1 = false;
      highlightP2 = false;
    }
  }
}

function gameLoop() {
  if (!gameOver) moveBall();
  movePaddles();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
