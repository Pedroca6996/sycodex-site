 // ======================================================================
// PONG - Versão 8 (Final)
// Desenvolvido por [Rafaell CB]
// Última atualização: 19 de Agosto de 2025
// ======================================================================

// Obtém o contexto 2D do canvas para desenho
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ----------------------
// Variáveis e Configurações
// ----------------------

// Elementos da UI
const mainMenu = document.getElementById('main-menu');
const settingsMenu = document.getElementById('settings-menu');
const instructionsMenu = document.getElementById('instructions-menu');
const playButton = document.getElementById('play-button');
const settingsButton = document.getElementById('settings-button');
const instructionsButton = document.getElementById('instructions-button');
const backButton = document.getElementById('back-button');
const instructionsBackButton = document.getElementById('instructions-back-button');
const initialSpeedInput = document.getElementById('initial-speed');
const winningScoreInput = document.getElementById('winning-score');

// Configurações globais
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
    speed: 5,
    scoreColor: '#fff'
};
const player2 = {
    x: canvas.width - paddleWidth - 10,
    y: (canvas.height - paddleHeight) / 2,
    width: paddleWidth,
    height: paddleHeight,
    speed: 5,
    scoreColor: '#fff'
};

// Configurações da bola
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 10,
    initialSpeedX: 5,
    initialSpeedY: 5,
    speedX: 5,
    speedY: 5,
    speedIncrease: 0.2,
    maxSpeed: 15
};

// Variáveis de estado do jogo
let player1Score = 0;
let player2Score = 0;
let winningScore = 5;
let gameEnded = false;
let scoreTimer = 0;
let gameState = 'menu'; // Estados: 'menu', 'game', 'settings', 'instructions'

// Carregamento dos sons
// IMPORTANTE: Substitua as URLs abaixo pelos links diretos dos seus arquivos .mp3/.wav
const bounceSound = new Audio('https://github.com/Pedroca6996/pong-audio-rafa/raw/refs/heads/main/pong_hit.wav');
const scoreSound = new Audio('https://github.com/Pedroca6996/pong-audio-rafa/raw/refs/heads/main/pong_goal.wav');
const winSound = new Audio('https://github.com/Pedroca6996/pong-audio-rafa/raw/refs/heads/main/pong_victory.wav');

// Objeto para rastrear o estado das teclas pressionadas
const keys = {
    w: false, s: false, up: false, down: false
};

// ----------------------
// Listeners de Eventos
// ----------------------

// Captura de teclas para o movimento das barras
document.addEventListener('keydown', (e) => {
    if (e.key === 'w') keys.w = true;
    if (e.key === 's') keys.s = true;
    if (e.key === 'ArrowUp') keys.up = true;
    if (e.key === 'ArrowDown') keys.down = true;

    // Reinicia o jogo após o fim da partida
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

// Botões do menu
playButton.addEventListener('click', () => {
    hideAllScreens();
    gameState = 'game';
    canvas.style.display = 'block';
    resetGame();
});

settingsButton.addEventListener('click', () => {
    hideAllScreens();
    settingsMenu.style.display = 'block';
    // Sincroniza os valores dos inputs com as variáveis do jogo
    initialSpeedInput.value = ball.initialSpeedX;
    winningScoreInput.value = winningScore;
});

instructionsButton.addEventListener('click', () => {
    hideAllScreens();
    instructionsMenu.style.display = 'block';
});

// Botões de voltar
backButton.addEventListener('click', () => {
    // Aplica as configurações antes de voltar
    ball.initialSpeedX = Number(initialSpeedInput.value);
    ball.initialSpeedY = Number(initialSpeedInput.value);
    ball.speedX = ball.initialSpeedX;
    ball.speedY = ball.initialSpeedY;
    winningScore = Number(winningScoreInput.value);

    hideAllScreens();
    mainMenu.style.display = 'block';
});

instructionsBackButton.addEventListener('click', () => {
    hideAllScreens();
    mainMenu.style.display = 'block';
});

// ----------------------
// Funções de Desenho
// ----------------------

function drawRect(x, y, width, height, color) {
    ctx.fillStyle = color;
    // Efeito de brilho para as barras
    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowBlur = 15;
    ctx.fillRect(x, y, width, height);
    // Limpa a sombra para não afetar outros elementos
    ctx.shadowBlur = 0;
}

function drawBall(x, y, radius, color) {
    ctx.fillStyle = color;
    // Efeito de brilho para a bola
    ctx.shadowColor = 'rgba(0, 255, 255, 0.8)';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
    // Limpa a sombra
    ctx.shadowBlur = 0;
}

function drawScore() {
    ctx.fillStyle = '#00ffff'; // Cor ciano para o placar
    ctx.font = 'bold 40px Consolas, monospace';
    // Efeito de brilho para o texto
    ctx.shadowColor = 'rgba(0, 255, 255, 0.8)';
    ctx.shadowBlur = 10;
    ctx.fillText(player1Score, canvas.width / 4, 60);
    ctx.fillText(player2Score, canvas.width * 3 / 4, 60);
    // Limpa a sombra
    ctx.shadowBlur = 0;
}

function drawVictoryScreen() {
    ctx.fillStyle = '#fff';
    ctx.font = '50px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowBlur = 10;
    let winner = player1Score >= winningScore ? 'JOGADOR 1' : 'JOGADOR 2';
    ctx.fillText(`VITÓRIA DO ${winner}!`, canvas.width / 2, canvas.height / 2);
    ctx.font = '20px Consolas, monospace';
    ctx.fillText('PRESSIONE ENTER PARA JOGAR NOVAMENTE', canvas.width / 2, canvas.height / 2 + 50);
    ctx.shadowBlur = 0;
}

// ----------------------
// Funções de Lógica do Jogo
// ----------------------

function update() {
    // Para a atualização se o jogo tiver acabado
    if (gameEnded) return;

    // Movimento das barras baseado nas teclas pressionadas
    if (keys.w && player1.y > 0) player1.y -= player1.speed;
    if (keys.s && player1.y < canvas.height - player1.height) player1.y += player1.speed;
    if (keys.up && player2.y > 0) player2.y -= player2.speed;
    if (keys.down && player2.y < canvas.height - player2.height) player2.y += player2.speed;

    // Movimento da bola
    ball.x += ball.speedX;
    ball.y += ball.speedY;

    // Colisão da bola com as bordas superior e inferior
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.speedY = -ball.speedY;
        increaseBallSpeed();
        bounceSound.currentTime = 0;
        bounceSound.play();
    }

    // Colisão com as barras
    if (ball.x - ball.radius < player1.x + player1.width &&
        ball.y + ball.radius > player1.y &&
        ball.y - ball.radius < player1.y + player1.height) {
        ball.speedX = -ball.speedX;
        increaseBallSpeed();
        bounceSound.currentTime = 0;
        bounceSound.play();
    }
    if (ball.x + ball.radius > player2.x &&
        ball.y + ball.radius > player2.y &&
        ball.y - ball.radius < player2.y + player2.height) {
        ball.speedX = -ball.speedX;
        increaseBallSpeed();
        bounceSound.currentTime = 0;
        bounceSound.play();
    }

    // Lógica de pontuação e destaque da barra
    if (ball.x < 0) {
        player2Score++;
        player2.scoreColor = '#00ffff';
        scoreSound.currentTime = 0;
        scoreSound.play();
        resetBall();
        checkVictory();
        scoreTimer = 100;
    } else if (ball.x > canvas.width) {
        player1Score++;
        player1.scoreColor = '#00ffff';
        scoreSound.currentTime = 0;
        scoreSound.play();
        resetBall();
        checkVictory();
        scoreTimer = 100;
    }

    // Decrementa o timer de destaque
    if (scoreTimer > 0) {
        scoreTimer--;
        if (scoreTimer === 0) {
            player1.scoreColor = '#fff';
            player2.scoreColor = '#fff';
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawRect(player1.x, player1.y, player1.width, player1.height, player1.scoreColor);
    drawRect(player2.x, player2.y, player2.width, player2.height, player2.scoreColor);
    drawBall(ball.x, ball.y, ball.radius, '#fff');
    drawScore();

    if (gameEnded) {
        drawVictoryScreen();
    }
}

// ----------------------
// Funções Auxiliares
// ----------------------

function hideAllScreens() {
    mainMenu.style.display = 'none';
    settingsMenu.style.display = 'none';
    instructionsMenu.style.display = 'none';
    canvas.style.display = 'none';
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.speedX = (Math.random() > 0.5 ? 1 : -1) * ball.initialSpeedX;
    ball.speedY = (Math.random() > 0.5 ? 1 : -1) * ball.initialSpeedY;
}

function increaseBallSpeed() {
    if (Math.abs(ball.speedX) < ball.maxSpeed) {
        ball.speedX += (ball.speedX > 0) ? ball.speedIncrease : -ball.speedIncrease;
        ball.speedY += (ball.speedY > 0) ? ball.speedIncrease : -ball.speedIncrease;
    }
}

function checkVictory() {
    if (player1Score >= winningScore) {
        gameEnded = true;
        winSound.currentTime = 0;
        winSound.play();
    } else if (player2Score >= winningScore) {
        gameEnded = true;
        winSound.currentTime = 0;
        winSound.play();
    }
}

function resetGame() {
    player1Score = 0;
    player2Score = 0;
    gameEnded = false;
    player1.scoreColor = '#fff';
    player2.scoreColor = '#fff';
    resetBall();
}

// ----------------------
// Início do Jogo
// ----------------------

// Loop principal que roda o jogo ou a tela de menu
function gameLoop() {
    if (gameState === 'game') {
        update();
        draw();
    }
    requestAnimationFrame(gameLoop);
}

// Inicia o jogo no estado de menu e esconde o canvas
hideAllScreens();
mainMenu.style.display = 'block';
canvas.style.display = 'none';
gameLoop();