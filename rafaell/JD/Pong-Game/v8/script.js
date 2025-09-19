// ======================================================================
// PONG - Versão 9 (Melhorias de Design e Gameplay)
// ======================================================================

// Obtém os contextos dos canvases
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const bgCanvas = document.getElementById('backgroundCanvas');
const bgCtx = bgCanvas.getContext('2d');

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

// Configurações globais dos canvases
canvas.width = 800;
canvas.height = 600;
bgCanvas.width = window.innerWidth;
bgCanvas.height = window.innerHeight;

// Configurações das barras
const paddleWidth = 10;
const paddleHeight = 100;
const player1 = { x: 10, y: (canvas.height - paddleHeight) / 2, width: paddleWidth, height: paddleHeight, speed: 6, scoreColor: '#fff' };
const player2 = { x: canvas.width - paddleWidth - 10, y: (canvas.height - paddleHeight) / 2, width: paddleWidth, height: paddleHeight, speed: 6, scoreColor: '#fff' };

// Configurações da bola (VELOCIDADE INICIAL REDUZIDA)
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 10,
    initialSpeedX: 3, // Começa mais devagar
    initialSpeedY: 3,
    speedX: 3,
    speedY: 3,
    speedIncrease: 0.3, // Aumento um pouco maior para sentir a progressão
    maxSpeed: 15
};

// Variáveis de estado do jogo
let player1Score = 0;
let player2Score = 0;
let winningScore = 5;
let gameEnded = false;
let scoreTimer = 0;
let gameState = 'menu';
let centerCircleRotation = 0;

// Carregamento dos sons (NOVOS CAMINHOS LOCAIS)
const bounceSound = new Audio('../sounds/hit.mp3');
const scoreSound = new Audio('../sounds/score.mp3');
const winSound = new Audio('../sounds/win.mp3');

// Rastreamento das teclas
const keys = { w: false, s: false, up: false, down: false };

// Partículas para o fundo
let particles = [];
const particleCount = 100;

// ----------------------
// Inicialização
// ----------------------

function initParticles() {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * bgCanvas.width,
            y: Math.random() * bgCanvas.height,
            size: Math.random() * 2 + 1,
            speed: Math.random() * 0.5 + 0.1,
            opacity: Math.random() * 0.5 + 0.2
        });
    }
}

// ----------------------
// Listeners de Eventos
// ----------------------

document.addEventListener('keydown', (e) => {
    if (e.key === 'w') keys.w = true;
    if (e.key === 's') keys.s = true;
    if (e.key === 'ArrowUp') keys.up = true;
    if (e.key === 'ArrowDown') keys.down = true;
    if (gameEnded && e.key === 'Enter') resetGame();
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'w') keys.w = false;
    if (e.key === 's') keys.s = false;
    if (e.key === 'ArrowUp') keys.up = false;
    if (e.key === 'ArrowDown') keys.down = false;
});

playButton.addEventListener('click', () => {
    hideAllScreens();
    gameState = 'game';
    canvas.style.display = 'block';
    resetGame();
});

settingsButton.addEventListener('click', () => {
    hideAllScreens();
    settingsMenu.style.display = 'block';
    initialSpeedInput.value = ball.initialSpeedX;
    winningScoreInput.value = winningScore;
});

instructionsButton.addEventListener('click', () => {
    hideAllScreens();
    instructionsMenu.style.display = 'block';
});

backButton.addEventListener('click', () => {
    ball.initialSpeedX = Number(initialSpeedInput.value);
    ball.initialSpeedY = Number(initialSpeedInput.value);
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
function drawTable() {
    // Define a cor e o brilho para os elementos da mesa
    ctx.strokeStyle = '#00ffff';
    ctx.shadowColor = 'rgba(0, 255, 255, 0.8)';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 4;
    
    // --- Linha Central Pontilhada (continua a mesma) ---
    ctx.beginPath();
    ctx.setLineDash([15, 20]);
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    
    // --- Círculo Central GIRATÓRIO ---
    ctx.save(); // Salva o estado atual do canvas (posição, rotação, etc.)
    
    // Move o "ponto de origem" do canvas para o centro do círculo
    ctx.translate(canvas.width / 2, canvas.height / 2); 
    // Aplica a rotação
    ctx.rotate(centerCircleRotation); 
    // Move a origem de volta para o canto superior esquerdo
    ctx.translate(-canvas.width / 2, -canvas.height / 2); 
    
    // Desenha o círculo (ele será desenhado já rotacionado)
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 60, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore(); // Restaura o estado original do canvas para não afetar outros desenhos

    // Limpa as configurações
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
}

function drawRect(x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowBlur = 15;
    ctx.fillRect(x, y, width, height);
    ctx.shadowBlur = 0;
}

function drawBall(x, y, radius, color) {
    ctx.fillStyle = color;
    ctx.shadowColor = 'rgba(0, 255, 255, 0.8)';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawScore() {
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 40px Consolas, monospace';
    ctx.shadowColor = 'rgba(0, 255, 255, 0.8)';
    ctx.shadowBlur = 10;
    ctx.fillText(player1Score, canvas.width / 4, 60);
    ctx.fillText(player2Score, canvas.width * 3 / 4, 60);
    ctx.shadowBlur = 0;
}

function drawVictoryScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; // Fundo semi-transparente
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '50px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowBlur = 10;
    let winner = player1Score >= winningScore ? 'JOGADOR 1' : 'JOGADOR 2';
    ctx.fillText(`VITÓRIA DO ${winner}!`, canvas.width / 2, canvas.height / 2);
    ctx.font = '20px Consolas, monospace';
    ctx.fillText('PRESSIONE ENTER PARA JOGAR NOVAMENTE', canvas.width / 2, canvas.height / 2 + 50);
    ctx.textAlign = 'start'; // Reseta o alinhamento
    ctx.shadowBlur = 0;
}

function drawParticles() {
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    particles.forEach(p => {
        p.y += p.speed;
        if (p.y > bgCanvas.height) {
            p.y = 0;
            p.x = Math.random() * bgCanvas.width;
        }
        bgCtx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        bgCtx.fillRect(p.x, p.y, p.size, p.size);
    });
}

// ----------------------
// Lógica do Jogo
// ----------------------

function update() {
    if (gameEnded) return;

    if (keys.w && player1.y > 0) player1.y -= player1.speed;
    if (keys.s && player1.y < canvas.height - player1.height) player1.y += player1.speed;
    if (keys.up && player2.y > 0) player2.y -= player2.speed;
    if (keys.down && player2.y < canvas.height - player2.height) player2.y += player2.speed;

    ball.x += ball.speedX;
    ball.y += ball.speedY;

    // Colisão com bordas superior/inferior (AGORA TAMBÉM AUMENTA A VELOCIDADE)
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.speedY = -ball.speedY;
        increaseBallSpeed();
        bounceSound.currentTime = 0;
        bounceSound.play();
    }

    let paddle = (ball.x < canvas.width / 2) ? player1 : player2;
    if (collides(ball, paddle)) {
        ball.speedX = -ball.speedX;
        
        // Efeito de ângulo baseado na posição da colisão
        let collidePoint = (ball.y - (paddle.y + paddle.height / 2));
        collidePoint = collidePoint / (paddle.height / 2);
        let angleRad = (Math.PI / 4) * collidePoint;
        let direction = (ball.x < canvas.width / 2) ? 1 : -1;
        
        let currentSpeed = Math.sqrt(ball.speedX**2 + ball.speedY**2);
        ball.speedX = direction * currentSpeed * Math.cos(angleRad);
        ball.speedY = currentSpeed * Math.sin(angleRad);

        increaseBallSpeed();
        bounceSound.currentTime = 0;
        bounceSound.play();
    }
    
    // Pontuação
    if (ball.x - ball.radius < 0) {
        player2Score++;
        scoreEffects(player2);
    } else if (ball.x + ball.radius > canvas.width) {
        player1Score++;
        scoreEffects(player1);
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
    drawTable();
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
        ball.speedX *= 1.05; // Aumento percentual para uma aceleração mais suave
        ball.speedY *= 1.05;
    }
}

function checkVictory() {
    if (player1Score >= winningScore || player2Score >= winningScore) {
        gameEnded = true;
        winSound.currentTime = 0;
        winSound.play();
    }
}

function resetGame() {
    player1Score = 0;
    player2Score = 0;
    gameEnded = false;
    player1.y = (canvas.height - paddleHeight) / 2;
    player2.y = (canvas.height - paddleHeight) / 2;
    player1.scoreColor = '#fff';
    player2.scoreColor = '#fff';
    resetBall();
}

function collides(b, p) {
    return b.x - b.radius < p.x + p.width &&
           b.x + b.radius > p.x &&
           b.y - b.radius < p.y + p.height &&
           b.y + b.radius > p.y;
}

function scoreEffects(player) {
    player.scoreColor = '#00ffff';
    scoreSound.currentTime = 0;
    scoreSound.play();
    resetBall();
    checkVictory();
    scoreTimer = 60; // Destaque dura 1 segundo (60 frames)
}

// ----------------------
// Loop Principal
// ----------------------

function gameLoop() {
    drawParticles(); // Sempre desenha as partículas no fundo
    centerCircleRotation += 0.02; // Rotação suave do círculo central

    if (gameState === 'game') {
        update();
        draw();
    }
    
    requestAnimationFrame(gameLoop);
}

// Início do jogo
hideAllScreens();
mainMenu.style.display = 'block';
canvas.style.display = 'none';
initParticles();
gameLoop();