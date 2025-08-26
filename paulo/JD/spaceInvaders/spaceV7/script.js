// Canvas
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = 480;
canvas.height = 640;

// Sons
const shootSound = new Audio("../sounds/shoot.mp3");
const explosionSound = new Audio("../sounds/explosion.mp3");
const powerupSound = new Audio("../sounds/powerup.mp3");

// Jogador
const player = {
  x: canvas.width/2 - 20,
  y: canvas.height - 50,
  width: 40,
  height: 20,
  speed: 5,
  bullets: [],
  shootCooldown: 400,
  lastShot: 0,
};

// Inimigos
let enemies = [];
let enemyRows = 4;
let enemyCols = 7;
let enemySpeed = 1;
let enemyDirection = 1;

// Power-ups
let powerups = [];
let activePowerUps = { rapidFire:false, tripleShot:false };
let powerUpTimers = {};

// Estado do jogo
let score = 0;
let level = 1;
let lives = 3;
let gameOver = false;
let explosions = [];

// Ranking
function saveScore(newScore){
  let scores = JSON.parse(localStorage.getItem("highscores")) || [];
  scores.push(newScore);
  // Remove duplicatas
  scores = [...new Set(scores)];
  scores.sort((a,b)=>b-a);
  scores = scores.slice(0,5); // top 5
  localStorage.setItem("highscores", JSON.stringify(scores));
}
function getScores(){ return JSON.parse(localStorage.getItem("highscores")) || []; }

// Criar inimigos
function createEnemies(){
  enemies = [];
  for(let row=0; row<enemyRows; row++){
    for(let col=0; col<enemyCols; col++){
      enemies.push({
        x: 60 + col*50,
        y: 40 + row*40,
        width:30,
        height:20,
        alive:true,
        special: Math.random()<0.15
      });
    }
  }
}
createEnemies();

// Controles
const keys = {};
document.addEventListener("keydown", e => keys[e.code]=true);
document.addEventListener("keyup", e => keys[e.code]=false);

// Atirar
function shoot(){
  const now = Date.now();
  if(now - player.lastShot >= player.shootCooldown){
    if(activePowerUps.tripleShot){
      player.bullets.push(
        {x: player.x + 5, y: player.y, width:4, height:10, speed:5},
        {x: player.x + player.width -9, y: player.y, width:4, height:10, speed:5}
      );
    } else {
      player.bullets.push({x: player.x + player.width/2 -2, y:player.y, width:4, height:10, speed:5});
    }
    shootSound.currentTime=0; shootSound.play();
    player.lastShot = now;
  }
}

// Helpers
function aabbOverlap(ax, ay, aw, ah, bx, by, bw, bh){
  return ax < bx+bw && ax+aw > bx && ay < by+bh && ay+ah > by;
}

// Power-ups
function activatePowerUp(type){
  powerupSound.currentTime=0; powerupSound.play();
  if(type==="blue"){
    activePowerUps.rapidFire=true;
    player.shootCooldown=150;
    resetPowerUpTimer("rapidFire",8000,()=>{activePowerUps.rapidFire=false; player.shootCooldown=400;});
  } else if(type==="red"){
    activePowerUps.tripleShot=true;
    resetPowerUpTimer("tripleShot",8000,()=>{activePowerUps.tripleShot=false;});
  }
}
function resetPowerUpTimer(name,duration,callback){
  clearTimeout(powerUpTimers[name]);
  powerUpTimers[name]=setTimeout(callback,duration);
}

// Update
function update(){
  if(gameOver) return;

  if(keys["ArrowLeft"] && player.x>0) player.x-=player.speed;
  if(keys["ArrowRight"] && player.x<canvas.width-player.width) player.x+=player.speed;
  if(keys["Space"]) shoot();

  // Balas
  for(let i=player.bullets.length-1;i>=0;i--){
    const b=player.bullets[i];
    b.y-=b.speed;
    if(b.y<0) player.bullets.splice(i,1);
  }

  // Inimigos
  let edge=false;
  enemies.forEach(enemy=>{
    if(!enemy.alive) return;
    enemy.x += enemySpeed*enemyDirection;
    if(enemy.x+enemy.width>canvas.width || enemy.x<0) edge=true;
  });
  if(edge){
    enemyDirection*=-1;
    enemies.forEach(enemy=>{
      enemy.y+=20;
      if(enemy.y+enemy.height>canvas.height-60){
        lives--;
        if(lives<=0){ gameOver=true; saveScore(score);}
      }
    });
  }

  // Colisão balas x inimigos
  for(let bi=player.bullets.length-1; bi>=0; bi--){
    const b=player.bullets[bi];
    for(let ei=0; ei<enemies.length; ei++){
      const enemy=enemies[ei];
      if(!enemy.alive) continue;
      if(aabbOverlap(b.x,b.y,b.width,b.height,enemy.x,enemy.y,enemy.width,enemy.height)){
        enemy.alive=false; player.bullets.splice(bi,1);
        score+=enemy.special?200:100;
        explosionSound.currentTime=0; explosionSound.play();
        explosions.push({x:enemy.x, y:enemy.y, frame:0});

        // 20% chance de power-up
        if(Math.random()<0.2){
          const types=["blue","red"];
          const type=types[Math.floor(Math.random()*types.length)];
          powerups.push({x:enemy.x+enemy.width/2, y:enemy.y+enemy.height/2, size:14, speed:2.2, type});
        }
        break;
      }
    }
  }

  // Explosões
  for(let i=explosions.length-1;i>=0;i--){
    explosions[i].frame++;
    if(explosions[i].frame>5) explosions.splice(i,1);
  }

  // Power-ups
  for(let i=powerups.length-1;i>=0;i--){
    const p=powerups[i];
    p.y+=p.speed;
    if(aabbOverlap(p.x-p.size,p.y-p.size,p.size*2,p.size*2,player.x,player.y,player.width,player.height)){
      activatePowerUp(p.type);
      powerups.splice(i,1);
      continue;
    }
    if(p.y-p.size>canvas.height) powerups.splice(i,1);
  }

  // Fim do nível
  if(enemies.every(e=>!e.alive)){
    level++;
    enemySpeed+=0.5;
    createEnemies();
  }
}

// Draw
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // Player
  ctx.fillStyle="lime";
  ctx.fillRect(player.x,player.y,player.width,player.height);

  // Balas
  ctx.fillStyle="red";
  player.bullets.forEach(b=>ctx.fillRect(b.x,b.y,b.width,b.height));

  // Inimigos
  enemies.forEach(enemy=>{
    if(enemy.alive){
      ctx.fillStyle=enemy.special?"gold":"white";
      ctx.fillRect(enemy.x,enemy.y,enemy.width,enemy.height);
    }
  });

  // Explosões
  explosions.forEach(exp=>{
    ctx.fillStyle="orange";
    ctx.beginPath();
    ctx.arc(exp.x+15,exp.y+10,15-exp.frame*2,0,Math.PI*2);
    ctx.fill();
  });

  // Power-ups
  powerups.forEach(p=>{
    ctx.beginPath();
    ctx.fillStyle = p.type==="blue"?"cyan":"red";
    ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
    ctx.fill();
  });

  // HUD
  ctx.fillStyle="white"; 
  ctx.font="16px Arial";
  ctx.fillText(`Score: ${score}`,10,20);
  ctx.fillText(`Lives: ${lives}`,10,40);
  ctx.fillText(`Level: ${level}`,10,60);

  // Indicadores power-ups ativos
  let hudY = 80;
  if(activePowerUps.rapidFire){
    ctx.fillStyle="cyan";
    ctx.fillText("Power-Up: Rapid Fire",10,hudY);
    hudY+=20;
  }
  if(activePowerUps.tripleShot){
    ctx.fillStyle="red";
    ctx.fillText("Power-Up: Triple Shot",10,hudY);
    hudY+=20;
  }

  // Ranking (sempre branco)
  const scores=getScores();
  ctx.fillStyle="white"; 
  ctx.font="14px Arial";
  ctx.fillText("High Scores:", canvas.width-120,20);
  scores.forEach((s,i)=>ctx.fillText(`${i+1}. ${s}`,canvas.width-120,40+i*20));

  // Game Over
  if(gameOver){
    ctx.fillStyle="red"; 
    ctx.font="32px Arial";
    ctx.fillText("GAME OVER",canvas.width/2-100,canvas.height/2);
  }
}

// Loop principal
function loop(){ update(); draw(); requestAnimationFrame(loop); }
loop();
