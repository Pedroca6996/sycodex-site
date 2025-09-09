const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Menus
const menu = document.getElementById("menu");
const instructionsDiv = document.getElementById("instructions");
const settingsDiv = document.getElementById("settings");

const playBtn = document.getElementById("playBtn");
const instructionsBtn = document.getElementById("instructionsBtn");
const settingsBtn = document.getElementById("settingsBtn");
const backFromInstructions = document.getElementById("backFromInstructions");
const backFromSettings = document.getElementById("backFromSettings");

const initialSpeedInput = document.getElementById("initialSpeed");
const pointsToWinInput = document.getElementById("pointsToWin");

// Jogo
const paddleWidth = 12, paddleHeight = 100, ballSize = 12;
let player1Y, player2Y, player1Score = 0, player2Score = 0;
let ballX, ballY, ballSpeedX = 4, ballSpeedY = 4;
let winningScore = 10;
let paused = true, gameOver = false;
let countdown = 0, frameCount = 0;

// Movimentos
let wPressed = false, sPressed = false, upPressed = false, downPressed = false;
let zPressed = false, xPressed = false, oPressed = false, pPressed = false;

// Especial/Bomba
let specialCharge1 = 0, specialCharge2 = 0;
let specialReady1 = false, specialReady2 = false;
let specialActive1 = false, specialActive2 = false;
let isBomb = false;

// Sons
const bounceSound = new Audio("bounce.wav");
const scoreSound = new Audio("score.wav");
const winSound = new Audio("win.wav");
const bombSound = new Audio("bomb.wav");

// Menu
playBtn.onclick = () => { hideAllMenus(); paused = false; countdown = 3; };
instructionsBtn.onclick = () => { showDiv(instructionsDiv); };
settingsBtn.onclick = () => { showDiv(settingsDiv); };
backFromInstructions.onclick = () => { showDiv(menu); };
backFromSettings.onclick = () => {
    winningScore = parseInt(pointsToWinInput.value);
    const speed = parseFloat(initialSpeedInput.value);
    ballSpeedX = Math.sign(ballSpeedX) * speed;
    ballSpeedY = Math.sign(ballSpeedY) * speed;
    showDiv(menu);
};

function hideAllMenus() { [menu, instructionsDiv, settingsDiv].forEach(d => d.classList.add("hidden")); }
function showDiv(div) { hideAllMenus(); div.classList.remove("hidden"); paused = true; countdown = 0; }

// Controles
document.addEventListener("keydown", e => {
    if (e.key === " ") togglePause();
    if (e.key === "Escape") showDiv(menu);
    if (e.key === "w") wPressed = true;
    if (e.key === "s") sPressed = true;
    if (e.key === "ArrowUp") upPressed = true;
    if (e.key === "ArrowDown") downPressed = true;
    if (e.key === "z") zPressed = true;
    if (e.key === "x") xPressed = true;
    if (e.key === "o") oPressed = true;
    if (e.key === "p") pPressed = true;
});
document.addEventListener("keyup", e => {
    if (e.key === "w") wPressed = false;
    if (e.key === "s") sPressed = false;
    if (e.key === "ArrowUp") upPressed = false;
    if (e.key === "ArrowDown") downPressed = false;
    if (e.key === "z") zPressed = false;
    if (e.key === "x") xPressed = false;
    if (e.key === "o") oPressed = false;
    if (e.key === "p") pPressed = false;
});

// Pausa
function togglePause() {
    if (!paused) paused = true;
    else { paused = false; countdown = 3; }
}

// Start
function startGame() {
    player1Y = canvas.height / 2 - paddleHeight / 2;
    player2Y = canvas.height / 2 - paddleHeight / 2;
    player1Score = 0; player2Score = 0;
    resetBall();
    gameOver = false;
    paused = true;
    countdown = 3;
    requestAnimationFrame(gameLoop);
}

// Movimento Raquetes
function movePaddles() {
    if (wPressed && player1Y > 0) player1Y -= 6;
    if (sPressed && player1Y + paddleHeight < canvas.height) player1Y += 6;
    if (upPressed && player2Y > 0) player2Y -= 6;
    if (downPressed && player2Y + paddleHeight < canvas.height) player2Y += 6;
}

// Bola
function moveBall() {
    // Carregar especial de forma gradual
    if (!specialActive1 && ballX <= paddleWidth + 5 && ballY + ballSize >= player1Y && ballY <= player1Y + paddleHeight) specialCharge1 = Math.min(specialCharge1 + 0.5, 5);
    if (!specialActive2 && ballX + ballSize >= canvas.width - paddleWidth - 5 && ballY + ballSize >= player2Y && ballY <= player2Y + paddleHeight) specialCharge2 = Math.min(specialCharge2 + 0.5, 5);

    specialReady1 = specialCharge1 >= 5;
    specialReady2 = specialCharge2 >= 5;

    // Ativar especiais
    if (zPressed && specialReady1) { specialActive1 = true; specialReady1 = false; specialCharge1 = 0; isBomb = true; zPressed = false; }
    if (oPressed && specialReady2) { specialActive2 = true; specialReady2 = false; specialCharge2 = 0; isBomb = true; oPressed = false; }

    // Movimento teleguiado
    if (specialActive1) {
        const targetY = player2Y + paddleHeight / 2;
        const dx = 17; // velocidade horizontal
        const dy = targetY - (ballY + ballSize / 2);
        const angle = Math.atan2(dy, dx);
        ballX += Math.cos(angle) * 17;
        ballY += Math.sin(angle) * 17;
    } else if (specialActive2) {
        const targetY = player1Y + paddleHeight / 2;
        const dx = -17; // Player 2 vai para Player 1
        const dy = targetY - (ballY + ballSize / 2);
        const angle = Math.atan2(dy, dx);
        ballX += Math.cos(angle) * 17;
        ballY += Math.sin(angle) * 17;
    } else {
        ballX += ballSpeedX;
        ballY += ballSpeedY;
    }

    // Colisão bordas
    if (ballY <= 0 || ballY + ballSize >= canvas.height) ballSpeedY *= -1;

    // Colisão raquetes e Perry
    // Player 1
    if (ballX <= paddleWidth && ballY + ballSize >= player1Y && ballY <= player1Y + paddleHeight) {
        if (specialActive2) {
            if (xPressed) { specialActive2 = false; isBomb = false; ballSpeedX = Math.abs(ballSpeedX); xPressed = false; } 
            else { player2Score++; resetBall(); bombSound.play(); specialActive2 = false; isBomb = false; }
        } else { ballSpeedX = Math.abs(ballSpeedX); bounceSound.play(); }
    }

    // Player 2
    if (ballX + ballSize >= canvas.width - paddleWidth && ballY + ballSize >= player2Y && ballY <= player2Y + paddleHeight) {
        if (specialActive1) {
            if (pPressed) { specialActive1 = false; isBomb = false; ballSpeedX = -Math.abs(ballSpeedX); pPressed = false; } 
            else { player1Score++; resetBall(); bombSound.play(); specialActive1 = false; isBomb = false; }
        } else { ballSpeedX = -Math.abs(ballSpeedX); bounceSound.play(); }
    }

    // Gol normal
    if (ballX < 0) { player2Score++; resetBall(); scoreSound.play(); }
    if (ballX > canvas.width) { player1Score++; resetBall(); scoreSound.play(); }

    // Game Over
    if (player1Score >= winningScore || player2Score >= winningScore) gameOver = true;
}

// Reset bola
function resetBall() {
    ballX = canvas.width / 2; ballY = canvas.height / 2;
    const speed = parseFloat(initialSpeedInput.value);
    ballSpeedX = Math.sign(Math.random() - 0.5) * speed;
    ballSpeedY = Math.sign(Math.random() - 0.5) * speed;
    specialActive1 = false;
    specialActive2 = false;
    isBomb = false;
}

// Draw
function draw() {
    ctx.fillStyle = "black"; ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Linha do meio
    ctx.strokeStyle = "white"; ctx.setLineDash([10, 15]);
    ctx.beginPath(); ctx.moveTo(canvas.width / 2, 0); ctx.lineTo(canvas.width / 2, canvas.height); ctx.stroke(); ctx.setLineDash([]);

    // Raquetes
    ctx.fillStyle = "#00ffea"; ctx.fillRect(0, player1Y, paddleWidth, paddleHeight);
    ctx.fillStyle = "#ff0066"; ctx.fillRect(canvas.width - paddleWidth, player2Y, paddleWidth, paddleHeight);

    // Bola
    if (specialActive1 || specialActive2) {
        const pulse = Math.sin(Date.now() / 100) * 100;
        ctx.fillStyle = `rgb(255, ${Math.max(0, 50 + pulse)},0)`;
    } else ctx.fillStyle = isBomb ? "orange" : "white";
    ctx.fillRect(ballX, ballY, ballSize, ballSize);

    // Placar
    ctx.fillStyle = "white"; ctx.font = "30px Arial";
    ctx.fillText(player1Score, canvas.width / 4, 50);
    ctx.fillText(player2Score, canvas.width * 3 / 4, 50);

    // Medidores especiais
    ctx.fillStyle = "white";
    ctx.fillRect(10, canvas.height - 20, specialCharge1 * 20, 10);
    ctx.strokeRect(10, canvas.height - 20, 100, 10);
    ctx.fillRect(canvas.width - 110, canvas.height - 20, specialCharge2 * 20, 10);
    ctx.strokeRect(canvas.width - 110, canvas.height - 20, 100, 10);

    if (specialReady1) ctx.fillText("RAIO P1 PRONTO!", 50, canvas.height - 40);
    if (specialReady2) ctx.fillText("RAIO P2 PRONTO!", canvas.width - 200, canvas.height - 40);

    // Pausa
    if (paused && !gameOver) {
        ctx.fillStyle = "white"; ctx.font = "50px Arial";
        if (countdown > 0) {
            ctx.fillText(countdown, canvas.width / 2 - 15, canvas.height / 2);
            if (frameCount % 60 === 0) countdown--;
            if (countdown <= 0) paused = false;
        } else if (Math.floor(frameCount / 30) % 2 === 0) {
            ctx.fillText("JOGO PAUSADO", canvas.width / 2 - 150, canvas.height / 2);
        }
    }

    // Game over
    if (gameOver) {
        ctx.fillStyle = "lime";
        ctx.font = "50px Arial";
        ctx.fillText((player1Score > player2Score ? "Jogador 1" : "Jogador 2") + " VENCEU!", canvas.width / 2 - 200, canvas.height / 2);
    }
}

// Loop
function gameLoop() {
    frameCount++;
    if (!paused && !gameOver) {
        movePaddles();
        moveBall();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

startGame();
