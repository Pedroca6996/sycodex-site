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
const colors = {
    player: '#00ff7f', // Verde neon para os detalhes do cristal
    // Adicione outras cores aqui se precisar no futuro
};
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
    initialSpeedX: 1.5,
    initialSpeedY: 1.5,
    speedX: 1.5,
    speedY: 1.5,
    speedIncrease: 0.3, 
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

//Circulo no centro giratório
const BASE_CIRCLE_ROTATION_SPEED = 0.002; // A velocidade bem lenta do início
const CIRCLE_ROTATION_INCREASE = 0.001;  // O quanto acelera a cada hit
const MAX_CIRCLE_ROTATION_SPEED = 0.02;   // O limite máximo de velocidade
let circleRotationSpeed = BASE_CIRCLE_ROTATION_SPEED; // A velocidade atual

// Carregamento dos sons (NOVOS CAMINHOS LOCAIS)
const bounceSound = new Audio('../sounds/hit.mp3');
const scoreSound = new Audio('../sounds/score.mp3');
const winSound = new Audio('../sounds/win.mp3');

// Rastreamento das teclas
const keys = { w: false, s: false, up: false, down: false };

// Partículas para o fundo
let particles = [];
const particleCount = 100;
let shieldImpacts = [];

// ----------------------
// Inicialização
// ----------------------
function setupGame() {
    // Helper para criar a forma do cristal (agora dentro do setup)
    const createCrystalShape = (x, width, height) => {
        const points = [];
        const segments = 10;
        for (let i = 0; i <= segments; i++) {
            const y = (i / segments) * height;
            const offsetX = (Math.random() - 0.5) * (width * 0.4);
            points.push({ x: x + offsetX, y: y });
        }
        return points;
    };

    // Adiciona as formas de cristal aos objetos dos jogadores
    player1.shapePoints = createCrystalShape(player1.x + player1.width, player1.width, player1.height);
    player2.shapePoints = createCrystalShape(player2.x, player2.width, player2.height);

    // Também podemos mover a inicialização das partículas para cá
    initParticles();
}

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

function drawPaddle(paddle) {
    // 1. Desenha o Escudo de Energia
    ctx.fillStyle = `rgba(0, 255, 127, 0.1)`; // Aura verde sutil
    ctx.shadowColor = colors.player || '#00ff7f'; // Usa a cor do tema ou um padrão
    ctx.shadowBlur = 20;
    ctx.beginPath();
    // Um elipse um pouco maior que a raquete para ser o escudo
    ctx.ellipse(paddle.x + paddle.width / 2, paddle.y + paddle.height / 2, paddle.width + 10, paddle.height / 2 + 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 2. Desenha o Cristal "Pedrejado"
    ctx.fillStyle = paddle.scoreColor;
    ctx.shadowColor = colors.player || '#00ff7f';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(paddle.shapePoints[0].x, paddle.y); // Ponto inicial
    // Desenha as bordas irregulares
    for (let i = 1; i < paddle.shapePoints.length; i++) {
        ctx.lineTo(paddle.shapePoints[i].x, paddle.y + paddle.shapePoints[i].y);
    }
    // Fecha o polígono
    ctx.lineTo(paddle.x + paddle.width/2, paddle.y + paddle.height);
    ctx.lineTo(paddle.x + paddle.width/2, paddle.y);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
}

function createShieldImpact(x, y, color) {
    shieldImpacts.push({
        x: x,
        y: y,
        radius: 10,
        maxRadius: 50,
        opacity: 1,
        color: color
    });
}

function drawShieldImpacts() {
    for (let i = shieldImpacts.length - 1; i >= 0; i--) {
        const impact = shieldImpacts[i];
        
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${impact.color}, ${impact.opacity})`;
        ctx.lineWidth = 3;
        ctx.arc(impact.x, impact.y, impact.radius, 0, Math.PI * 2);
        ctx.stroke();

        impact.radius += 2;
        impact.opacity -= 0.04;

        if (impact.opacity <= 0) {
            shieldImpacts.splice(i, 1);
        }
    }
}

function drawBall(ball) {
    // Gradiente para o efeito de energia verde/laranja (sem a pulsação que causava lag)
    const gradient = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, ball.radius);
    gradient.addColorStop(0, '#FFFFFF');
    gradient.addColorStop(0.5, '#FFA500');
    gradient.addColorStop(1, 'rgba(0, 255, 127, 0.6)');

    ctx.fillStyle = gradient;
    ctx.shadowColor = '#FFA500';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2, true);
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
    
    // Colisão com bordas superior/inferior
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.speedY = -ball.speedY;
        
        // ADICIONE ESTA LINHA para o efeito de escudo nas bordas
        createShieldImpact(ball.x, ball.y, "0, 255, 255"); 
        
        increaseBallSpeed();
        bounceSound.currentTime = 0;
        bounceSound.play();
    }

    let paddle = (ball.x < canvas.width / 2) ? player1 : player2;
    if (collides(ball, paddle)) {
        ball.speedX = -ball.speedX;
        
        let collidePoint = (ball.y - (paddle.y + paddle.height / 2));
        collidePoint = collidePoint / (paddle.height / 2);
        let angleRad = (Math.PI / 4) * collidePoint;
        let direction = (ball.x < canvas.width / 2) ? 1 : -1;
        
        let currentSpeed = Math.hypot(ball.speedX, ball.speedY);
        ball.speedX = direction * currentSpeed * Math.cos(angleRad);
        ball.speedY = currentSpeed * Math.sin(angleRad);

        // ATENÇÃO: Verifique se essa função já existe no seu código.
        // Se não, adicione-a junto com as outras funções auxiliares.
        if (typeof createShieldImpact !== 'undefined') {
            createShieldImpact(ball.x, ball.y, "255, 255, 255");
        }

        increaseBallSpeed();
        bounceSound.currentTime = 0;
        bounceSound.play();
    }
    
    // O resto da função continua igual...
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
    
    // ATUALIZADO: Chamando a nova função para desenhar as naves de cristal
    drawPaddle(player1);
    drawPaddle(player2);
    
    drawBall(ball);
    drawShieldImpacts();
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
    circleRotationSpeed = Math.min(MAX_CIRCLE_ROTATION_SPEED, circleRotationSpeed + CIRCLE_ROTATION_INCREASE);
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
    circleRotationSpeed = BASE_CIRCLE_ROTATION_SPEED; // Reseta a velocidade do círculo
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
    centerCircleRotation += circleRotationSpeed;
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
setupGame(); // <-- SUBSTITUA initParticles() e initializePlayer() POR ISTO
gameLoop();

// Início do jogo
hideAllScreens();
mainMenu.style.display = 'block';
canvas.style.display = 'none';
initParticles();
gameLoop();