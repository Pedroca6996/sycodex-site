const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = 480;
canvas.height = 640;

// Sons com pré-carregamento
const shootSound = new Audio("../sounds/shoot.mp3");
const explosionSound = new Audio("../sounds/explosion.mp3");
const powerupSound = new Audio("../sounds/powerup.mp3");

shootSound.load();
explosionSound.load();


// Garantir interação do usuário antes de tocar sons
let firstInteraction = false;
document.addEventListener("keydown", () => {
  if (!firstInteraction) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    firstInteraction = true;
  }
});

// Player
const player = { x:canvas.width/2-20, y:canvas.height-40, width:40, height:32, speed:4, bullets:[], shootCooldown:400, lastShot:0 };

// Player sprite (pixel art)
const playerSprite = [
  [0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0],
  [0,1,1,1,1,0,0,1,1,1,1,0,0,0,0,0],
  [1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
  [1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,1,1,1,1,0,0,1,1,1,1,0,0,0,0,0],
  [0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0]
];

// Inimigos
let enemies=[], enemyRows=4, enemyCols=6, enemySpeed=0.4, enemyDirection=1, enemyStepFrame=0;
const enemySprite1 = [
  [0,0,1,1,1,0,0,1,1,1,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,0],
  [1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,1,1,1,1,1,1,1,1,0,1]
];
const enemySprite2 = [
  [0,0,1,1,1,0,0,1,1,1,0,0],
  [1,1,0,1,1,1,1,1,1,0,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,1,1,1,1,1,1,1,1,0,1]
];

// Balas inimigos
let enemyBullets = [];

// Power-ups
let powerups = [];
let activePowerUps = { rapidFire:false, tripleShot:false };
let powerUpTimers = {};

// Estado
let score=0, level=1, lives=3, gameOver=false, explosions=[];

// Ranking
function saveScore(newScore){
  let scores = JSON.parse(localStorage.getItem("highscores"))||[];
  scores.push(newScore);
  scores=[...new Set(scores)];
  scores.sort((a,b)=>b-a);
  scores=scores.slice(0,5);
  localStorage.setItem("highscores", JSON.stringify(scores));
}
function getScores(){ return JSON.parse(localStorage.getItem("highscores"))||[]; }

// Criar inimigos
function createEnemies(){
  enemies=[];
  for(let r=0;r<enemyRows;r++){
    for(let c=0;c<enemyCols;c++){
      enemies.push({ x:60+c*60, y:40+r*50, width:40, height:32, alive:true, special:Math.random()<0.15 });
    }
  }
}
createEnemies();

// Controles
const keys={};
document.addEventListener("keydown", e=>keys[e.code]=true);
document.addEventListener("keyup", e=>keys[e.code]=false);

// Atirar jogador
function shoot(){
  const now=Date.now();
  if(now-player.lastShot>=player.shootCooldown){
    if(activePowerUps.tripleShot){
      player.bullets.push(
        {x:player.x+4, y:player.y, w:6, h:12, speed:6},
        {x:player.x+player.width-10, y:player.y, w:6, h:12, speed:6}
      );
    } else player.bullets.push({x:player.x+player.width/2-3, y:player.y, w:6, h:12, speed:6});
    shootSound.currentTime=0; shootSound.play();
    player.lastShot=now;
  }
}

// Power-ups
function activatePowerUp(type){
  powerupSound.currentTime=0; powerupSound.play();
  if(type==="blue"){ activePowerUps.rapidFire=true; player.shootCooldown=150;
    resetPowerUpTimer("rapidFire",8000,()=>{activePowerUps.rapidFire=false; player.shootCooldown=400;});
  } else if(type==="red"){ activePowerUps.tripleShot=true;
    resetPowerUpTimer("tripleShot",8000,()=>{activePowerUps.tripleShot=false;});
  }
}
function resetPowerUpTimer(name,duration,callback){
  clearTimeout(powerUpTimers[name]);
  powerUpTimers[name]=setTimeout(callback,duration);
}

// Colisão
function aabbOverlap(ax,ay,aw,ah,bx,by,bw,bh){ return ax<bx+bw && ax+aw>bx && ay<by+bh && ay+ah>by; }

// Tiros inimigos
function enemyShoot(){
  const shooters=enemies.filter(e=>e.alive);
  if(shooters.length===0) return;
  const shooter=shooters[Math.floor(Math.random()*shooters.length)];
  enemyBullets.push({x:shooter.x+shooter.width/2-3, y:shooter.y+shooter.height, w:6, h:12, speed:3.5});
}

// Update
let lastEnemyShot = Date.now();
let enemyShootInterval=1800;
function update(){
  if(gameOver) return;

  if(keys["ArrowLeft"] && player.x>0) player.x-=player.speed;
  if(keys["ArrowRight"] && player.x<canvas.width-player.width) player.x+=player.speed;
  if(keys["Space"]) shoot();

  // Balas jogador
  for(let i=player.bullets.length-1;i>=0;i--){
    const b=player.bullets[i]; b.y-=b.speed; if(b.y<0) player.bullets.splice(i,1);
  }

  // Balas inimigos
  if(Date.now()-lastEnemyShot>=enemyShootInterval){ enemyShoot(); lastEnemyShot=Date.now(); }
  for(let i=enemyBullets.length-1;i>=0;i--){
    const b=enemyBullets[i];
    b.y+=b.speed;
    if(aabbOverlap(b.x,b.y,b.w,b.h,player.x,player.y,player.width,player.height)){
      enemyBullets.splice(i,1); lives--; if(lives<=0){gameOver=true; saveScore(score);}
    } else if(b.y>canvas.height) enemyBullets.splice(i,1);
  }

  // Inimigos
  let edge=false;
  enemies.forEach(e=>{ if(!e.alive) return; e.x+=enemySpeed*enemyDirection; if(e.x+e.width>canvas.width || e.x<0) edge=true; });
  if(edge){ enemyDirection*=-1; enemies.forEach(e=>{ e.y+=10; }); }

  // Colisão balas x inimigos e power-ups
  for(let bi=player.bullets.length-1;bi>=0;bi--){
    const b=player.bullets[bi];
    for(let ei=0;ei<enemies.length;ei++){
      const enemy=enemies[ei];
      if(!enemy.alive) continue;
      if(aabbOverlap(b.x,b.y,b.w,b.h,enemy.x,enemy.y,enemy.width,enemy.height)){
        enemy.alive=false; player.bullets.splice(bi,1);
        score+=enemy.special?200:100;
        explosionSound.currentTime=0; explosionSound.play(); // Som de explosão
        explosions.push({x:enemy.x+enemy.width/2,y:enemy.y+enemy.height/2,frame:0});
        if(Math.random()<0.2){
          const types=["blue","red"];
          const type=types[Math.floor(Math.random()*types.length)];
          powerups.push({x:enemy.x+enemy.width/2,y:enemy.y+enemy.height/2,size:16,speed:3,type});
        }
        break;
      }
    }
  }

  // Explosões
  for(let i=explosions.length-1;i>=0;i--){ explosions[i].frame++; if(explosions[i].frame>5) explosions.splice(i,1); }

  // Power-ups
  for(let i=powerups.length-1;i>=0;i--){
    const p=powerups[i]; p.y+=p.speed;
    if(aabbOverlap(p.x-p.size,p.y-p.size,p.size*2,p.size*2,player.x,player.y,player.width,player.height)){
      activatePowerUp(p.type); powerups.splice(i,1); continue;
    }
    if(p.y-p.size>canvas.height) powerups.splice(i,1);
  }

  if(enemies.every(e=>!e.alive)){ level++; enemySpeed+=0.1; createEnemies(); }
  enemyStepFrame=(enemyStepFrame+1)%2;
}

// Draw
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  if(gameOver){ ctx.fillStyle="red"; ctx.font="48px monospace"; ctx.textAlign="center"; ctx.fillText("GAME OVER",canvas.width/2,canvas.height/2); return; }

  // Player
  ctx.fillStyle="lime";
  for(let y=0;y<playerSprite.length;y++){
    for(let x=0;x<playerSprite[y].length;x++){
      if(playerSprite[y][x]) ctx.fillRect(player.x+x*3,player.y+y*3,3,3);
    }
  }

  // Balas jogador
  ctx.fillStyle="red"; player.bullets.forEach(b=>ctx.fillRect(b.x,b.y,b.w,b.h));

  // Balas inimigos
  ctx.fillStyle="yellow"; enemyBullets.forEach(b=>ctx.fillRect(b.x,b.y,b.w,b.h));

  // Inimigos
  enemies.forEach(e=>{
    if(!e.alive) return;
    const sprite = enemyStepFrame? enemySprite1:enemySprite2;
    ctx.fillStyle=e.special?"gold":"white";
    for(let y=0;y<sprite.length;y++){
      for(let x=0;x<sprite[y].length;x++){
        if(sprite[y][x]) ctx.fillRect(e.x+x*3,e.y+y*3,3,3);
      }
    }
  });

  // Explosões
  explosions.forEach(exp=>{ ctx.fillStyle="orange"; ctx.beginPath(); ctx.arc(exp.x,exp.y,15-exp.frame*2,0,Math.PI*2); ctx.fill(); });

  // Power-ups
  powerups.forEach(p=>{ ctx.fillStyle=p.type==="blue"?"cyan":"magenta"; ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size); });

  // HUD
  ctx.fillStyle="white"; ctx.font="16px monospace"; ctx.textAlign="left";
  ctx.fillText(`Score: ${score}`,10,20); ctx.fillText(`Lives: ${lives}`,10,40); ctx.fillText(`Level: ${level}`,10,60);
  let hudY=80;
  if(activePowerUps.rapidFire){ ctx.fillStyle="cyan"; ctx.fillText("Rapid Fire",10,hudY); hudY+=20; }
  if(activePowerUps.tripleShot){ ctx.fillStyle="magenta"; ctx.fillText("Double Shot",10,hudY); }

  // Ranking
  const scores=getScores();
  ctx.fillStyle="white"; ctx.font="14px monospace"; ctx.textAlign="right";
  ctx.fillText("High Scores:",canvas.width-10,20);
  scores.forEach((s,i)=>ctx.fillText(`${i+1}. ${s}`,canvas.width-10,40+i*20));
}

// Loop
function loop(){ update(); draw(); requestAnimationFrame(loop); }
loop();
