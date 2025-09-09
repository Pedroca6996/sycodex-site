// Seleciona o canvas e contexto
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Configurações do jogo
const paddleWidth = 10, paddleHeight = 100;
const ballSize = 10;

// Posição inicial das barras
let player1Y = (canvas.height - paddleHeight) / 2;
let player2Y = (canvas.height - paddleHeight) / 2;

// Bola (posição e velocidade)
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballSpeedX = 4;
let ballSpeedY = 4;

// Placar
let score1 = 0;
let score2 = 0;

// Controle das teclas
let keys = {};

// Eventos de teclado
document.addEventListener("keydown", (e) => keys[e.key] = true);
document.addEventListener("keyup", (e) => keys[e.key] = false);

// Função principal de atualização
function update() {
  // Movimento do jogador 1 (W e S)
  if (keys["w"] && player1Y > 0) player1Y -= 6;
  if (keys["s"] && player1Y < canvas.height - paddleHeight) player1Y += 6;

  // Movimento do jogador 2 (setas ↑ e ↓)
  if (keys["ArrowUp"] && player2Y > 0) player2Y -= 6;
  if (keys["ArrowDown"] && player2Y < canvas.height - paddleHeight) player2Y += 6;

  // Movimento da bola
  ballX += ballSpeedX;
  ballY += ballSpeedY;

  // Quicar nas bordas superior e inferior
  if (ballY <= 0 || ballY >= canvas.height - ballSize) {
    ballSpeedY *= -1;
  }

  // --- Colisão com a barrinha do jogador 1 ---
  if (
    ballX <= 20 + paddleWidth &&
    ballY + ballSize >= player1Y &&
    ballY <= player1Y + paddleHeight
  ) {
    ballSpeedX *= -1;
    ballX = 20 + paddleWidth;
  }

  // --- Colisão com a barrinha do jogador 2 ---
  if (
    ballX + ballSize >= canvas.width - 20 - paddleWidth &&
    ballY + ballSize >= player2Y &&
    ballY <= player2Y + paddleHeight
  ) {
    ballSpeedX *= -1;
    ballX = canvas.width - 20 - paddleWidth - ballSize;
  }

  // Se a bola sair pela esquerda → ponto jogador 2
  if (ballX < 0) {
    score2++;
    resetBall();
  }

  // Se a bola sair pela direita → ponto jogador 1
  if (ballX > canvas.width) {
    score1++;
    resetBall();
  }
}

// Função para reiniciar a bola no centro
function resetBall() {
  ballX = canvas.width / 2;
  ballY = canvas.height / 2;
  ballSpeedX = 4 * (Math.random() > 0.5 ? 1 : -1);
  ballSpeedY = 4 * (Math.random() > 0.5 ? 1 : -1);
}

// Função para desenhar os elementos na tela
function draw() {
  // Fundo
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Barras
  ctx.fillStyle = "white";
  ctx.fillRect(20, player1Y, paddleWidth, paddleHeight); // jogador 1
  ctx.fillRect(canvas.width - 20 - paddleWidth, player2Y, paddleWidth, paddleHeight); // jogador 2

  // Bola
  ctx.fillRect(ballX, ballY, ballSize, ballSize);

  // Placar no topo
  ctx.fillStyle = "white";
  ctx.font = "30px Arial";
  ctx.textAlign = "center";
  ctx.fillText(score1 + " - " + score2, canvas.width / 2, 40);
}

// Loop do jogo (atualiza + desenha)
function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// Inicia o jogo
gameLoop();
