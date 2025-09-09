// ---------------------------- Configuração de Canvas ----------------------------
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const CW = canvas.width;
const CH = canvas.height;

const PLAYER_WIDTH = 60;
const PLAYER_HEIGHT = 20;
const PLAYER_SPEED = 5;

const BULLET_WIDTH = 4;
const BULLET_HEIGHT = 12;
const BULLET_SPEED = 8;

const ENEMY_COUNT = 10;
const ENEMY_WIDTH = 40;
const ENEMY_HEIGHT = 20;
const ENEMY_SPACING_X = 20;
const ENEMY_START_Y = 80;
const ENEMY_DROP = 20;

// ---------------------------- Sons ----------------------------
const shootSound = new Audio('sounds/shoot.wav');
const explosionSound = new Audio('sounds/explosion.wav');

// ---------------------------- Estado do Jogo ----------------------------
const player = {
  x: CW / 2 - PLAYER_WIDTH / 2,
  y: CH - 60,
  w: PLAYER_WIDTH,
  h: PLAYER_HEIGHT,
  dir: 0,
  doubleShot: false
};

const bullets = [];
const enemies = [];
let enemyDir = 1;
const keys = { ArrowLeft:false, ArrowRight:false, Space:false };
let canShoot = true;

let score = 0;
let lives = 3;
let gameOver = false;
let level = 1;
let enemySpeed = 2;

// ---------------------------- Power-ups ----------------------------
const powerUps = [];

// ---------------------------- Efeitos visuais ----------------------------
const flashes = []; // inimigos atingidos

// ---------------------------- Funções de Utilidade ----------------------------
function createEnemies() {
  enemies.length = 0;
  const totalWidth = ENEMY_COUNT * ENEMY_WIDTH + (ENEMY_COUNT - 1) * ENEMY_SPACING_X;
  const startX = (CW - totalWidth) / 2;

  for (let i = 0; i < ENEMY_COUNT; i++) {
    const x = startX + i * (ENEMY_WIDTH + ENEMY_SPACING_X);
    const isSpecial = Math.random() < 0.2;
    const points = isSpecial ? 30 : 10;
    enemies.push({ x, y: ENEMY_START_Y, w: ENEMY_WIDTH, h: ENEMY_HEIGHT, alive: true, special: isSpecial, points });
  }
}

function spawnPowerUp() {
  const types = ["doubleShot","wideShip"];
  const type = types[Math.floor(Math.random()*types.length)];
  const x = Math.random() * (CW-20);
  powerUps.push({x, y:0, w:20, h:20, type});
}

function shoot() {
  if(!canShoot || gameOver) return;
  canShoot=false;

  shootSound.currentTime=0;
  shootSound.play();

  bullets.push({ x: player.x + player.w/2 - BULLET_WIDTH/2, y: player.y-BULLET_HEIGHT, w: BULLET_WIDTH, h: BULLET_HEIGHT });

  if(player.doubleShot){
    bullets.push({ x: player.x + player.w/2 - BULLET_WIDTH/2 - 10, y: player.y-BULLET_HEIGHT, w: BULLET_WIDTH, h: BULLET_HEIGHT });
    bullets.push({ x: player.x + player.w/2 - BULLET_WIDTH/2 + 10, y: player.y-BULLET_HEIGHT, w: BULLET_WIDTH, h: BULLET_HEIGHT });
  }
}

function rectsOverlap(a,b){
  return !(a.x+a.w < b.x || a.x > b.x+b.w || a.y+a.h < b.y || a.y > b.y+b.h);
}

// ---------------------------- Entrada do Teclado ----------------------------
window.addEventListener("keydown",(e)=>{
  if(gameOver) return;
  if(e.code==="ArrowLeft"){ keys.ArrowLeft=true; player.dir=-1; }
  if(e.code==="ArrowRight"){ keys.ArrowRight=true; player.dir=1; }
  if(e.code==="Space"){ keys.Space=true; shoot(); e.preventDefault(); }
});

window.addEventListener("keyup",(e)=>{
  if(e.code==="ArrowLeft"){ keys.ArrowLeft=false; if(!keys.ArrowRight) player.dir=0; if(keys.ArrowRight) player.dir=1; }
  if(e.code==="ArrowRight"){ keys.ArrowRight=false; if(!keys.ArrowLeft) player.dir=0; if(keys.ArrowLeft) player.dir=-1; }
  if(e.code==="Space"){ keys.Space=false; canShoot=true; }
});

// ---------------------------- Atualização do Jogo ----------------------------
function update(){
  if(gameOver) return;

  // Move nave
  player.x += player.dir * PLAYER_SPEED;
  if(player.x<0) player.x=0;
  if(player.x+player.w>CW) player.x=CW-player.w;

  // Atualiza projéteis
  for(let i=bullets.length-1;i>=0;i--){
    bullets[i].y -= BULLET_SPEED;
    if(bullets[i].y+bullets[i].h<0) bullets.splice(i,1);
  }

  // Movimenta inimigos
  let minX=Infinity,maxX=-Infinity,anyAlive=false;
  for(const en of enemies){
    if(!en.alive) continue;
    anyAlive=true;
    if(en.x<minX) minX=en.x;
    if(en.x+en.w>maxX) maxX=en.x+en.w;
  }
  if(anyAlive){
    if(minX<=0 || maxX>=CW){
      enemyDir*=-1;
      for(const en of enemies) if(en.alive) en.y+=ENEMY_DROP;
    }
    for(const en of enemies) if(en.alive) en.x+=enemyDir*enemySpeed;
  }

  // Colisões com projéteis
  for(let i=bullets.length-1;i>=0;i--){
    const bullet=bullets[i];
    for(const en of enemies){
      if(!en.alive) continue;
      if(rectsOverlap(bullet,en)){
        en.alive=false;
        bullets.splice(i,1);
        score+=en.points;
        explosionSound.currentTime=0;
        explosionSound.play();
        flashes.push({x:en.x,y:en.y,timer:5});
        if(Math.random()<0.1) spawnPowerUp();
        break;
      }
    }
  }

  // Colisão inimigos com nave ou chão
  for(const en of enemies){
    if(!en.alive) continue;
    if(en.y+en.h>=CH || rectsOverlap(en,player)){
      en.alive=false;
      lives--;
    }
  }

  // Atualiza power-ups
  for(let i=powerUps.length-1;i>=0;i--){
    const p=powerUps[i];
    p.y+=2;
    if(p.y>CH) powerUps.splice(i,1);
    else if(rectsOverlap(p,player)){
      if(p.type==="doubleShot") player.doubleShot=true;
      if(p.type==="wideShip") player.w=PLAYER_WIDTH*1.5;
      powerUps.splice(i,1);
    }
  }

  // Atualiza efeitos visuais
  for(let i=flashes.length-1;i>=0;i--){
    flashes[i].timer--;
    if(flashes[i].timer<=0) flashes.splice(i,1);
  }

  if(lives<=0) gameOver=true;

  const allDead=enemies.every(e=>!e.alive);
  if(allDead && !gameOver){
    level++;
    enemySpeed+=0.5;
    player.doubleShot=false;
    player.w=PLAYER_WIDTH;
    createEnemies();
  }
}

// ---------------------------- Desenho no Canvas ----------------------------
function draw(){
  ctx.fillStyle="#0b0f1a";
  ctx.fillRect(0,0,CW,CH);

  // Desenha nave
  if(!gameOver){
    ctx.fillStyle="#22d3ee";
    ctx.fillRect(player.x,player.y,player.w,player.h);
    ctx.fillRect(player.x+player.w/2-3,player.y-8,6,8);
  }

  // Desenha projéteis
  ctx.fillStyle="#fbbf24";
  for(const b of bullets) ctx.fillRect(b.x,b.y,b.w,b.h);

  // Desenha inimigos
  for(const en of enemies){
    if(!en.alive) continue;
    const flash=flashes.find(f=>f.x===en.x && f.y===en.y);
    ctx.fillStyle=flash ? "#fff" : (en.special?"#ff0":"#f43f5e");
    ctx.fillRect(en.x,en.y,en.w,en.h);
    ctx.fillStyle="#0b0f1a";
    ctx.fillRect(en.x+8,en.y+6,6,6);
    ctx.fillRect(en.x+en.w-14,en.y+6,6,6);
  }

  // Desenha power-ups
  for(const p of powerUps){
    ctx.fillStyle=p.type==="doubleShot"?"#0f0":"#00f";
    ctx.fillRect(p.x,p.y,p.w,p.h);
  }

  // HUD
  ctx.fillStyle="#ffffff";
  ctx.font="20px Arial";
  ctx.textAlign="left";
  ctx.fillText(`Score: ${score}`,10,30);
  ctx.fillText(`Lives: ${lives}`,CW-100,30);
  ctx.fillText(`Level: ${level}`,CW/2-30,30);

  // Game Over
  if(gameOver){
    ctx.fillStyle="#f43f5e";
    ctx.font="50px Arial";
    ctx.textAlign="center";
    ctx.fillText("GAME OVER",CW/2,CH/2);
  }
}

// ---------------------------- Loop Principal ----------------------------
function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}

// ---------------------------- Inicialização ----------------------------
createEnemies();
loop();
