const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Menu e Configurações
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

// Variáveis do jogo
const paddleWidth = 12, paddleHeight = 100, ballSize = 12;
let player1Y, player2Y;
let player1Score, player2Score;
let ballX, ballY;
let ballSpeedX, ballSpeedY;
let winningScore;
let gameOver;
let wPressed=false, sPressed=false, upPressed=false, downPressed=false;
let highlightP1=false, highlightP2=false, highlightTimer=0;

// Sons
const bounceSound = new Audio("bounce.wav");
const scoreSound = new Audio("score.wav");
const winSound = new Audio("win.wav");

// Menu funcional
playBtn.onclick = ()=>{startGameMenu();};
instructionsBtn.onclick = ()=>{showDiv(instructionsDiv);};
settingsBtn.onclick = ()=>{showDiv(settingsDiv);};
backFromInstructions.onclick = ()=>{showDiv(menu);};
backFromSettings.onclick = ()=>{
  winningScore=parseInt(pointsToWinInput.value);
  ballSpeedX=parseFloat(initialSpeedInput.value);
  ballSpeedY=parseFloat(initialSpeedInput.value);
  showDiv(menu);
};

function showDiv(div){
  [menu,instructionsDiv,settingsDiv,canvas].forEach(d=>d.classList.add("hidden"));
  div.classList.remove("hidden");
}

// Controles do jogo
document.addEventListener("keydown",e=>{
  if(e.key==="w") wPressed=true;
  if(e.key==="s") sPressed=true;
  if(e.key==="ArrowUp") upPressed=true;
  if(e.key==="ArrowDown") downPressed=true;
  if(gameOver && e.key==="Enter") startGameMenu();
});
document.addEventListener("keyup",e=>{
  if(e.key==="w") wPressed=false;
  if(e.key==="s") sPressed=false;
  if(e.key==="ArrowUp") upPressed=false;
  if(e.key==="ArrowDown") downPressed=false;
});

function startGameMenu(){
  menu.classList.add("hidden");
  canvas.classList.remove("hidden");
  startGame();
}

// Inicia o jogo
function startGame(){
  player1Y=canvas.height/2-paddleHeight/2;
  player2Y=canvas.height/2-paddleHeight/2;
  player1Score=0;
  player2Score=0;
  ballX=canvas.width/2;
  ballY=canvas.height/2;
  winningScore=parseInt(pointsToWinInput.value);
  ballSpeedX=parseFloat(initialSpeedInput.value);
  ballSpeedY=parseFloat(initialSpeedInput.value);
  gameOver=false;
  highlightP1=false;
  highlightP2=false;
  gameLoop();
}

// Movimento das raquetes
function movePaddles(){
  if(wPressed && player1Y>0) player1Y-=6;
  if(sPressed && player1Y+paddleHeight<canvas.height) player1Y+=6;
  if(upPressed && player2Y>0) player2Y-=6;
  if(downPressed && player2Y+paddleHeight<canvas.height) player2Y+=6;
}

// Movimento da bola e colisões
function moveBall(){
  ballX+=ballSpeedX;
  ballY+=ballSpeedY;

  if(ballY<=0 || ballY+ballSize>=canvas.height){
    ballSpeedY=-ballSpeedY;
    bounceSound.play();
    accelerateBall();
  }

  if(ballX<=paddleWidth && ballY+ballSize>=player1Y && ballY<=player1Y+paddleHeight){
    ballSpeedX=-ballSpeedX;
    bounceSound.play();
    accelerateBall();
  }

  if(ballX+ballSize>=canvas.width-paddleWidth && ballY+ballSize>=player2Y && ballY<=player2Y+paddleHeight){
    ballSpeedX=-ballSpeedX;
    bounceSound.play();
    accelerateBall();
  }

  if(ballX<0){
    player2Score++;
    scoreSound.play();
    highlightP2=true; highlightTimer=60;
    checkWin();
    resetBall();
  }

  if(ballX+ballSize>canvas.width){
    player1Score++;
    scoreSound.play();
    highlightP1=true; highlightTimer=60;
    checkWin();
    resetBall();
  }
}

// Acelera bola a cada colisão
function accelerateBall(){
  ballSpeedX*=1.05;
  ballSpeedY*=1.05;
}

// Reinicia bola
function resetBall(){
  ballX=canvas.width/2;
  ballY=canvas.height/2;
  ballSpeedX=Math.sign(ballSpeedX)*parseFloat(initialSpeedInput.value);
  ballSpeedY=Math.sign(ballSpeedY)*parseFloat(initialSpeedInput.value);
}

// Checa vitória
function checkWin(){
  if(player1Score>=winningScore || player2Score>=winningScore){
    gameOver=true;
    winSound.play();
  }
}

// Desenha tudo
function draw(){
  // Fundo gradiente
  const grad=ctx.createLinearGradient(0,0,0,canvas.height);
  grad.addColorStop(0,"#0f2027");
  grad.addColorStop(0.5,"#203a43");
  grad.addColorStop(1,"#2c5364");
  ctx.fillStyle=grad;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // Linha central
  ctx.strokeStyle="white";
  ctx.setLineDash([10,10]);
  ctx.beginPath();
  ctx.moveTo(canvas.width/2,0);
  ctx.lineTo(canvas.width/2,canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);

  // Placar estilizado
  ctx.fillStyle="white";
  ctx.font="36px Arial";
  ctx.fillText(player1Score, canvas.width/4,50);
  ctx.fillText(player2Score, 3*canvas.width/4,50);

  // Raquetes com destaque
  ctx.fillStyle=highlightP1?"yellow":"#00ffea";
  ctx.fillRect(0,player1Y,paddleWidth,paddleHeight);
  ctx.fillStyle=highlightP2?"yellow":"#ff0066";
  ctx.fillRect(canvas.width-paddleWidth,player2Y,paddleWidth,paddleHeight);

  // Bola com efeito
  ctx.fillStyle="#ffffff";
  ctx.shadowColor="white";
  ctx.shadowBlur=10;
  ctx.fillRect(ballX,ballY,ballSize,ballSize);
  ctx.shadowBlur=0;

  // Mensagem de vitória
  if(gameOver){
    ctx.fillStyle="red";
    ctx.font="40px Arial";
    const winner=player1Score>=winningScore?"Jogador 1":"Jogador 2";
    ctx.fillText(`Vitória do ${winner}!`,canvas.width/2-150,canvas.height/2);
    ctx.font="20px Arial";
    ctx.fillText("Pressione Enter para reiniciar",canvas.width/2-140,canvas.height/2+40);
  }

  if(highlightTimer>0){
    highlightTimer--;
    if(highlightTimer===0){highlightP1=false; highlightP2=false;}
  }
}

// Loop do jogo
function gameLoop(){
  if(!gameOver) moveBall();
  movePaddles();
  draw();
  requestAnimationFrame(gameLoop);
}
