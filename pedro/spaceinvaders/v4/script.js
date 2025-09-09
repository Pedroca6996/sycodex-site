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

// ---------------------------- Estado do Jogo ----------------------------
const player = {
  x: CW / 2 - PLAYER_WIDTH / 2,
  y: CH - 60,
  w: PLAYER_WIDTH,
  h: PLAYER_HEIGHT,
  dir: 0
};

const bullets = [];
const enemies = [];
let enemyDir = 1;
const keys = { ArrowLeft:false, ArrowRight:false, Space:false };
let canShoot = true;

let score = 0;
let lives = 3;
let gameOver = false;

// **Nova variável de nível**
let level = 1;
// Velocidade inicial dos inimigos
let enemySpeed = 2;

// ---------------------------- Funções de Utilidade ----------------------------
function createEnemies() {
  enemies.length = 0; // Limpa inimigos anteriores
  const totalWidth = ENEMY_COUNT * ENEMY_WIDTH + (ENEMY_COUNT - 1) * ENEMY_SPACING_X;
  let startX = (CW - totalWidth) / 2;

  for (let i = 0; i < ENEMY_COUNT; i++) {
    const x = startX + i * (ENEMY_WIDTH + ENEMY_SPACING_X);
    enemies.push({ x: x, y: ENEMY_START_Y, w: ENEMY_WIDTH, h: ENEMY_HEIGHT, alive: true });
  }
}

function shoot() {
  if (!canShoot || gameOver) return;
  canShoot = false;

  const bulletX = player.x + player.w / 2 - BULLET_WIDTH / 2;
  const bulletY = player.y - BULLET_HEIGHT;

  bullets.push({ x: bulletX, y: bulletY, w: BULLET_WIDTH, h: BULLET_HEIGHT });
}

function rectsOverlap(a, b) {
  return !(
    a.x + a.w < b.x ||
    a.x > b.x + b.w ||
    a.y + a.h < b.y ||
    a.y > b.y + b.h
  );
}

// ---------------------------- Entrada do Teclado ----------------------------
window.addEventListener("keydown", (e) => {
  if (gameOver) return;
  if (e.code === "ArrowLeft") { keys.ArrowLeft = true; player.dir = -1; }
  if (e.code === "ArrowRight") { keys.ArrowRight = true; player.dir = 1; }
  if (e.code === "Space") { keys.Space = true; shoot(); e.preventDefault(); }
});

window.addEventListener("keyup", (e) => {
  if (e.code === "ArrowLeft") { keys.ArrowLeft=false; if(!keys.ArrowRight) player.dir=0; if(keys.ArrowRight) player.dir=1; }
  if (e.code === "ArrowRight") { keys.ArrowRight=false; if(!keys.ArrowLeft) player.dir=0; if(keys.ArrowLeft) player.dir=-1; }
  if (e.code === "Space") { keys.Space=false; canShoot=true; }
});

// ---------------------------- Atualização do Jogo ----------------------------
function update() {
  if(gameOver) return;

  // Move nave
  player.x += player.dir * PLAYER_SPEED;
  if (player.x < 0) player.x = 0;
  if (player.x + player.w > CW) player.x = CW - player.w;

  // Atualiza projéteis
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].y -= BULLET_SPEED;
    if (bullets[i].y + bullets[i].h < 0) bullets.splice(i, 1);
  }

  // Movimenta inimigos
  let minX = Infinity, maxX = -Infinity, anyAlive=false;
  for (const en of enemies) {
    if (!en.alive) continue;
    anyAlive = true;
    if (en.x < minX) minX = en.x;
    if (en.x + en.w > maxX) maxX = en.x + en.w;
  }

  if(anyAlive){
    if(minX <= 0 || maxX >= CW){
      enemyDir *= -1;
      for(const en of enemies){ if(!en.alive) continue; en.y += ENEMY_DROP; }
    }
    for(const en of enemies){ if(!en.alive) continue; en.x += enemyDir * enemySpeed; }
  }

  // ---------------- Colisões refinadas ----------------
  for(let i = bullets.length - 1; i >= 0; i--){
    const bullet = bullets[i];
    for(const en of enemies){
      if(!en.alive) continue;
      if(rectsOverlap(bullet,en)){
        en.alive = false;
        bullets.splice(i,1);
        score += 10;
        break;
      }
    }
  }

  // ---------------- Checa colisão inimigo com nave ou chão ----------------
  for(const en of enemies){
    if(!en.alive) continue;
    if(en.y + en.h >= CH || rectsOverlap(en, player)){
      en.alive = false;
      lives -= 1;
    }
  }

  if(lives <= 0) gameOver = true;

  // ---------------- Checa se todos inimigos morreram → novo nível ----------------
  const allDead = enemies.every(e => !e.alive);
  if(allDead && !gameOver){
    level += 1;              // incrementa nível
    enemySpeed += 0.5;       // aumenta velocidade inimigos
    createEnemies();          // recria inimigos
  }
}

// ---------------------------- Desenho no Canvas ----------------------------
function draw(){
  // Limpa tela
  ctx.fillStyle = "#0b0f1a";
  ctx.fillRect(0,0,CW,CH);

  // Desenha nave
  if(!gameOver){
    ctx.fillStyle = "#22d3ee";
    ctx.fillRect(player.x,player.y,player.w,player.h);
    ctx.fillRect(player.x + player.w/2 -3, player.y-8,6,8);
  }

  // Desenha projéteis
  ctx.fillStyle = "#fbbf24";
  for(const b of bullets){ ctx.fillRect(b.x,b.y,b.w,b.h); }

  // Desenha inimigos
  ctx.fillStyle = "#f43f5e";
  for(const en of enemies){
    if(!en.alive) continue;
    ctx.fillRect(en.x,en.y,en.w,en.h);
    ctx.fillStyle = "#0b0f1a";
    ctx.fillRect(en.x+8,en.y+6,6,6);
    ctx.fillRect(en.x+en.w-14,en.y+6,6,6);
    ctx.fillStyle = "#f43f5e";
  }

  // ---------------- Desenha pontuação ----------------
  ctx.fillStyle = "#ffffff";
  ctx.font = "20px Arial";
  ctx.textAlign = "left";
  ctx.fillText(`Score: ${score}`, 10, 30);

  // ---------------- Desenha vidas ----------------
  ctx.fillText(`Lives: ${lives}`, CW - 100, 30);

  // ---------------- Desenha nível ----------------
  ctx.fillText(`Level: ${level}`, CW/2 - 30, 30);

  // ---------------- Desenha Game Over ----------------
  if(gameOver){
    ctx.fillStyle = "#f43f5e";
    ctx.font = "50px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", CW/2, CH/2);
  }
}

// ---------------------------- Loop Principal ----------------------------
function loop(){ update(); draw(); requestAnimationFrame(loop); }

// ---------------------------- Inicialização ----------------------------
createEnemies();
loop();
