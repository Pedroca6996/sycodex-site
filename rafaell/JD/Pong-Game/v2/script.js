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

// --- NOVAS VARIÁVEIS PARA PONTUAÇÃO (ADICIONADO) ---
let player1Score = 0;
let player2Score = 0;
const winningScore = 5; // A partida vai até 5 pontos, por exemplo

const keys = {
    w: false,
    s: false,
    up: false,
    down: false
};

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

function drawRect(x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
}

function drawBall(x, y, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
}

// --- NOVA FUNÇÃO PARA DESENHAR O PLACAR (ADICIONADO) ---
function drawScore() {
    ctx.fillStyle = '#fff';
    ctx.font = '30px Arial';
    ctx.fillText(player1Score, canvas.width / 4, 50);
    ctx.fillText(player2Score, canvas.width * 3 / 4, 50);
}

function update() {
    // Movimento das barras... (código inalterado)
    if (keys.w && player1.y > 0) {
        player1.y -= player1.speed;
    }
    if (keys.s && player1.y < canvas.height - player1.height) {
        player1.y += player1.speed;
    }
    if (keys.up && player2.y > 0) {
        player2.y -= player2.speed;
    }
    if (keys.down && player2.y < canvas.height - player2.height) {
        player2.y += player2.speed;
    }

    // Movimento da bola... (código inalterado)
    ball.x += ball.speedX;
    ball.y += ball.speedY;

    // Colisão da bola com as bordas superior e inferior... (código inalterado)
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.speedY = -ball.speedY;
    }

    // Colisão com as barras... (código inalterado)
    if (ball.x - ball.radius < player1.x + player1.width &&
        ball.y + ball.radius > player1.y &&
        ball.y - ball.radius < player1.y + player1.height) {
        ball.speedX = -ball.speedX;
    }

    if (ball.x + ball.radius > player2.x &&
        ball.y + ball.radius > player2.y &&
        ball.y - ball.radius < player2.y + player2.height) {
        ball.speedX = -ball.speedX;
    }

    // --- LÓGICA PARA ATRIBUIR PONTOS (ADICIONADO) ---
    if (ball.x < 0) {
        player2Score++;
        resetBall();
    } else if (ball.x > canvas.width) {
        player1Score++;
        resetBall();
    }
}

function draw() {
    // Limpa a tela
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenha as barras e a bola
    drawRect(player1.x, player1.y, player1.width, player1.height, '#fff');
    drawRect(player2.x, player2.y, player2.width, player2.height, '#fff');
    drawBall(ball.x, ball.y, ball.radius, '#fff');
    
    // --- DESENHA O PLACAR (ADICIONADO) ---
    drawScore();
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
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