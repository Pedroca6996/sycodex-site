 // Obtém o contexto 2D do canvas para desenho
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- Elementos da UI ---
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

// Variáveis de pontuação e estado do jogo
let player1Score = 0;
let player2Score = 0;
let winningScore = 5;
let gameEnded = false;
let scoreTimer = 0;
let gameState = 'menu'; // NOVO: Controla a tela atual

// --- Carregar os arquivos de som (substitua pelas suas URLs) ---
const bounceSound = new Audio('https://github.com/Pedroca6996/pong-audio-rafa/raw/refs/heads/main/pong_hit.wav');
const scoreSound = new Audio('https://github.com/Pedroca6996/pong-audio-rafa/raw/refs/heads/main/pong_goal.wav');
const winSound = new Audio('https://github.com/Pedroca6996/pong-audio-rafa/raw/refs/heads/main/pong_victory.wav');

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

// --- NOVO: Event listeners para os botões do menu ---
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

// --- Funções de desenho e atualização ---
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

function drawVictoryScreen() {
    ctx.fillStyle = '#fff';
    ctx.font = '50px Arial';
    ctx.textAlign = 'center';
    let winner = player1Score >= winningScore ? 'Jogador 1' : 'Jogador 2';
    ctx.fillText(`Vitória do ${winner}!`, canvas.width / 2, canvas.height / 2);
    ctx.font = '20px Arial';
    ctx.fillText('Pressione ENTER para jogar novamente', canvas.width / 2, canvas.height / 2 + 50);
}

function update() {
    if (gameEnded) return;

    if (keys.w && player1.y > 0) player1.y -= player1.speed;
    if (keys.s && player1.y < canvas.height - player1.height) player1.y += player1.speed;
    if (keys.up && player2.y > 0) player2.y -= player2.speed;
    if (keys.down && player2.y < canvas.height - player2.height) player2.y += player2.speed;

    ball.x += ball.speedX;
    ball.y += ball.speedY;

    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.speedY = -ball.speedY;
        increaseBallSpeed();
        bounceSound.currentTime = 0;
        bounceSound.play();
    }

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

    if (ball.x < 0) {
        player2Score++;
        player2.scoreColor = 'lightgreen';
        scoreSound.currentTime = 0;
        scoreSound.play();
        resetBall();
        checkVictory();
        scoreTimer = 100;
    } else if (ball.x > canvas.width) {
        player1Score++;
        player1.scoreColor = 'lightgreen';
        scoreSound.currentTime = 0;
        scoreSound.play();
        resetBall();
        checkVictory();
        scoreTimer = 100;
    }

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

// --- Funções de controle do jogo ---
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

// Loop principal do jogo
function gameLoop() {
    if (gameState === 'game') {
        update();
        draw();
    }
    requestAnimationFrame(gameLoop);
}

// --- Inicia o jogo no estado de menu e esconde o canvas ---
hideAllScreens();
mainMenu.style.display = 'block';
canvas.style.display = 'none';
gameLoop();