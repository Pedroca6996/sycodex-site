const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Configurações iniciais
let paddleHeight = 100, paddleWidth = 10;
let player1Y = canvas.height / 2 - paddleHeight / 2;
let player2Y = canvas.height / 2 - paddleHeight / 2;
let paddleSpeed = 8;

let ballSize = 10;
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballSpeedX = 5, ballSpeedY = 5;
let initialBallSpeed = 5;

let player1Score = 0, player2Score = 0;
let winningScore = 10;
let gameOver = false;

// Teclas pressionadas
let keys = {};

document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (gameOver && e.key === "Enter") {
    restartGame();
  }
});
document.addEventListener("keyup", (e) => keys[e.key] = false);

function drawPaddle(x, y) {
  ctx.fillStyle = "white";
  ctx.fillRect(x, y, paddleWidth, paddleHeight);
}

function drawBall(x, y) {
  ctx.fillStyle = "white";
  ctx.fillRect(x, y, ballSize, ballSize);
}

function drawScores() {
  ctx.fillStyle = "white";
  ctx.font = "24px Arial";
  ctx.fillText(player1Score, canvas.width / 4, 50);
  ctx.fillText(player2Score, 3 * canvas.width / 4, 50);
}

function drawCenterLine() {
  ctx.strokeStyle = "white";
  ctx.beginPath();
  ctx.setLineDash([10, 15]); // linha tracejada
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]); // reseta para normal
}

function movePaddles() {
  if (keys["w"] && player1Y > 0) player1Y -= paddleSpeed;
  if (keys["s"] && player1Y < canvas.height - paddleHeight) player1Y += paddleSpeed;
  if (keys["ArrowUp"] && player2Y > 0) player2Y -= paddleSpeed;
  if (keys["ArrowDown"] && player2Y < canvas.height - paddleHeight) player2Y += paddleSpeed;
}

function moveBall() {
  ballX += ballSpeedX;
  ballY += ballSpeedY;

  // Quicar em cima e baixo
  if (ballY <= 0 || ballY + ballSize >= canvas.height) {
    ballSpeedY = -ballSpeedY;
    accelerateBall(); // acelera a cada quique na parede
  }

  // Colisão com jogador 1
  if (
    ballX <= paddleWidth &&
    ballY + ballSize >= player1Y &&
    ballY <= player1Y + paddleHeight
  ) {
    ballSpeedX = -ballSpeedX;
    accelerateBall(); // acelera a cada quique na raquete
  }

  // Colisão com jogador 2
  if (
    ballX + ballSize >= canvas.width - paddleWidth &&
    ballY + ballSize >= player2Y &&
    ballY <= player2Y + paddleHeight
  ) {
    ballSpeedX = -ballSpeedX;
    accelerateBall(); // acelera a cada quique na raquete
  }

  // Pontuação
  if (ballX < 0) {
    player2Score++;
    accelerateBall(); // acelera após ponto
    checkWin();
    resetBall();
  }
  if (ballX + ballSize > canvas.width) {
    player1Score++;
    accelerateBall();
    checkWin();
    resetBall();
  }
}

function accelerateBall() {
  // Acelera 5% em cada evento (quique ou ponto)
  ballSpeedX *= 1.05;
  ballSpeedY *= 1.05;
}

  // Quicar em cima e baixo
  if (ballY <= 0 || ballY + ballSize >= canvas.height) {
    ballSpeedY = -ballSpeedY;
  }

  // Colisão com jogador 1
  if (
    ballX <= paddleWidth &&
    ballY + ballSize >= player1Y &&
    ballY <= player1Y + paddleHeight
  ) {
    ballSpeedX = -ballSpeedX;
  }

  // Colisão com jogador 2
  if (
    ballX + ballSize >= canvas.width - paddleWidth &&
    ballY + ballSize >= player2Y &&
    ballY <= player2Y + paddleHeight
  ) {
    ballSpeedX = -ballSpeedX;
  }

  // Pontuação
  if (ballX < 0) {
    player2Score++;
    increaseBallSpeed(); // acelera após ponto
    checkWin();
    resetBall();
  }
  if (ballX + ballSize > canvas.width) {
    player1Score++;
    increaseBallSpeed();
    checkWin();
    resetBall();
  }

function increaseBallSpeed() {
  ballSpeedX *= 1.1; // acelera 10% a cada ponto
  ballSpeedY *= 1.1;
}

function resetBall() {
  ballX = canvas.width / 2;
  ballY = canvas.height / 2;
  // Direção aleatória
  ballSpeedX = initialBallSpeed * (Math.random() > 0.5 ? 1 : -1);
  ballSpeedY = initialBallSpeed * (Math.random() > 0.5 ? 1 : -1);
}

function checkWin() {
  if (player1Score >= winningScore || player2Score >= winningScore) {
    gameOver = true;
  }
}

function restartGame() {
  player1Score = 0;
  player2Score = 0;
  ballSpeedX = initialBallSpeed;
  ballSpeedY = initialBallSpeed;
  gameOver = false;
  resetBall();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawCenterLine();
  drawPaddle(0, player1Y);
  drawPaddle(canvas.width - paddleWidth, player2Y);
  drawBall(ballX, ballY);
  drawScores();

  if (gameOver) {
    ctx.fillStyle = "yellow";
    ctx.font = "40px Arial";
    let winner = player1Score >= winningScore ? "Jogador 1" : "Jogador 2";
    ctx.fillText("Vitória do " + winner, canvas.width / 2 - 150, canvas.height / 2);
    ctx.font = "20px Arial";
    ctx.fillText("Pressione Enter para reiniciar", canvas.width / 2 - 140, canvas.height / 2 + 40);
    return;
  }

  movePaddles();
  moveBall();
}

setInterval(draw, 1000 / 60);
