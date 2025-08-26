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

// Variáveis de pontuação e estado do jogo
let player1Score = 0;
let player2Score = 0;
const winningScore = 5; // PONTUAÇÃO NECESSÁRIA PARA VENCER
let gameEnded = false; // Estado do jogo, para saber se a partida acabou

const keys = {
    w: false,
    s: false,
    up: false,
    down: false
};

// Event listeners para teclas
document.addEventListener('keydown', (e) => {
    if (e.key === 'w') keys.w = true;
    if (e.key === 's') keys.s = true;
    if (e.key === 'ArrowUp') keys.up = true;
    if (e.key === 'ArrowDown') keys.down = true;

    // NOVO: Reiniciar o jogo ao apertar Enter quando a partida acabar
    if (gameEnded && e.key === 'Enter') {
        resetGame();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'w') keys.w = false;
    if (e.key === 's') keys.s = false;
    if (e.key === 'ArrowUp') keys.up = false;
    if (e.key === 'ArrowDown') keys.down = false;
});

// Funções de desenho
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

function drawScore() {
    ctx.fillStyle = '#fff';
    ctx.font = '30px Arial';
    ctx.fillText(player1Score, canvas.width / 4, 50);
    ctx.fillText(player2Score, canvas.width * 3 / 4, 50);
}

// NOVO: Função para exibir a mensagem de vitória
function drawVictoryScreen() {
    ctx.fillStyle = '#fff';
    ctx.font = '50px Arial';
    ctx.textAlign = 'center';
    let winner = player1Score >= winningScore ? 'Jogador 1' : 'Jogador 2';
    ctx.fillText(`Vitória do ${winner}!`, canvas.width / 2, canvas.height / 2);
    ctx.font = '20px Arial';
    ctx.fillText('Pressione ENTER para jogar novamente', canvas.width / 2, canvas.height / 2 + 50);
}

// Função de atualização
function update() {
    if (gameEnded) return; // Se o jogo acabou, não atualize nada

    // Movimento das barras
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

    // Movimento da bola
    ball.x += ball.speedX;
    ball.y += ball.speedY;

    // Colisão da bola com as bordas superior e inferior
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.speedY = -ball.speedY;
    }

    // Colisão com as barras
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

    // Lógica de pontuação e checagem de vitória
    if (ball.x < 0) {
        player2Score++;
        resetBall();
        checkVictory(); // NOVO: Checar se o jogador 2 venceu
    } else if (ball.x > canvas.width) {
        player1Score++;
        resetBall();
        checkVictory(); // NOVO: Checar se o jogador 1 venceu
    }
}

function draw() {
    // Limpa a tela
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenha as barras e a bola
    drawRect(player1.x, player1.y, player1.width, player1.height, '#fff');
    drawRect(player2.x, player2.y, player2.width, player2.height, '#fff');
    drawBall(ball.x, ball.y, ball.radius, '#fff');
    
    // Desenha o placar
    drawScore();

    // Se o jogo acabou, desenha a tela de vitória por cima
    if (gameEnded) {
        drawVictoryScreen();
    }
}

// Reinicia a posição da bola
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.speedX = -ball.speedX;
}

// NOVO: Checa se algum jogador atingiu a pontuação de vitória
function checkVictory() {
    if (player1Score >= winningScore || player2Score >= winningScore) {
        gameEnded = true;
    }
}

// NOVO: Reseta o jogo para um novo começo
function resetGame() {
    player1Score = 0;
    player2Score = 0;
    gameEnded = false;
    resetBall();
}

// Loop principal do jogo
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Inicia o jogo
gameLoop();