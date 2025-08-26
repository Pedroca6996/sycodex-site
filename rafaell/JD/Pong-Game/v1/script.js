 // Obtém o contexto 2D do canvas para desenho
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Define as dimensões do canvas
canvas.width = 800;
canvas.height = 600;

// Configurações das barras (players)
const paddleWidth = 10;
const paddleHeight = 100;
const player1 = {
    x: 10,
    y: (canvas.height - paddleHeight) / 2,
    width: paddleWidth,
    height: paddleHeight,
    speed: 5
};
const player2 = {
    x: canvas.width - paddleWidth - 10,
    y: (canvas.height - paddleHeight) / 2,
    width: paddleWidth,
    height: paddleHeight,
    speed: 5
};

// Configurações da bola
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 10,
    speedX: 5,
    speedY: 5
};

// Objeto para rastrear o estado das teclas pressionadas
const keys = {
    w: false,
    s: false,
    up: false,
    down: false
};

// Event listeners para rastrear quando as teclas são pressionadas ou soltas
document.addEventListener('keydown', (e) => {
    if (e.key === 'w') keys.w = true;
    if (e.key === 's') keys.s = true;
    if (e.key === 'ArrowUp') keys.up = true;
    if (e.key === 'ArrowDown') keys.down = true;
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'w') keys.w = false;
    if (e.key === 's') keys.s = false;
    if (e.key === 'ArrowUp') keys.up = false;
    if (e.key === 'ArrowDown') keys.down = false;
});

// Função para desenhar um retângulo (usado para as barras)
function drawRect(x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
}

// Função para desenhar a bola
function drawBall(x, y, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
}

// Função para atualizar a posição dos elementos e verificar colisões
function update() {
    // Movimento do Jogador 1 (W e S)
    if (keys.w && player1.y > 0) {
        player1.y -= player1.speed;
    }
    if (keys.s && player1.y < canvas.height - player1.height) {
        player1.y += player1.speed;
    }

    // Movimento do Jogador 2 (setas)
    if (keys.up && player2.y > 0) {
        player2.y -= player2.speed;
    }
    if (keys.down && player2.y < canvas.height - player2.height) {
        player2.y += player2.speed;
    }

    // Movimento da bola
    ball.x += ball.speedX;
    ball.y += ball.speedY;

    // Colisão da bola com as bordas superior e inferior
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.speedY = -ball.speedY;
    }

    // --- LÓGICA DE COLISÃO COM AS BARRAS (ADICIONADO) ---

    // Colisão com a barra do Jogador 1
    if (ball.x - ball.radius < player1.x + player1.width &&
        ball.y + ball.radius > player1.y &&
        ball.y - ball.radius < player1.y + player1.height) {
        ball.speedX = -ball.speedX; // Inverte a direção horizontal da bola
    }

    // Colisão com a barra do Jogador 2
    if (ball.x + ball.radius > player2.x &&
        ball.y + ball.radius > player2.y &&
        ball.y - ball.radius < player2.y + player2.height) {
        ball.speedX = -ball.speedX; // Inverte a direção horizontal da bola
    }

    // Reinicia a bola se ela sair pela esquerda ou direita
    if (ball.x < 0 || ball.x > canvas.width) {
        resetBall();
    }
}

// Função para desenhar todos os elementos na tela
function draw() {
    // Limpa a tela
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenha as barras e a bola
    drawRect(player1.x, player1.y, player1.width, player1.height, '#fff');
    drawRect(player2.x, player2.y, player2.width, player2.height, '#fff');
    drawBall(ball.x, ball.y, ball.radius, '#fff');
}

// Função para reiniciar a posição da bola
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    // Inverte a direção horizontal da bola para o próximo turno
    ball.speedX = -ball.speedX;
}

// Loop principal do jogo
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Inicia o jogo
gameLoop();