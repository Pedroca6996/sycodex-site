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
  dir: 0,
  doubleShot: false, // power-up de tiro duplo
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
const powerUps = []; // lista de power-ups ativos

// ---------------------------- Funções de Utilidade ----------------------------
function createEnemies() {
  enemies.length = 0;
  const totalWidth = ENEMY_COUNT * ENEMY_WIDTH + (ENEMY_COUNT - 1) * ENEMY_SPACING_X;
  let startX = (CW - totalWidth) / 2;

  for (let i = 0; i < ENEMY_COUNT; i++) {
    const x = startX + i * (ENEMY_WIDTH + ENEMY_SPACING_X);
    // 20% de chance de ser inimigo especial
    const isSpecial = Math.random() < 0.2;
    const points = isSpecial ? 30 : 10;
    enemies.push({ x, y: ENEMY_START_Y, w: ENEMY_WIDTH, h: ENEMY_HEIGHT, alive: true, special: isSpecial, points });
  }
}

// Função para criar power-up aleatório
function spawnPowerUp() {
  const types = ["doubleShot", "wideShip"];
  const type = types[Math.floor(Math.random() * types.length)];
  const x = Math.random() * (CW - 20);
  powerUps.push({ x, y: 0, w: 20, h: 20, type });
}

function shoot() {
  if (!canShoot || gameOver) return;
  canShoot = false;

  // tiro simples
  bullets.push({ x: player.x + player.w / 2 - BULLET_WIDTH / 2, y: player.y - BULLET_HEIGHT, w: BULLET_WIDTH, h: BULLET_HEIGHT });

  // tiro duplo se power-up ativo
  if(player.doubleShot){
    bullets.push({ x: player.x + player.w / 2 - BULLET_WIDTH / 2 - 10, y: player.y - BULLET_HEIGHT, w: BULLET_WIDTH, h: BULLET_HEIGHT });
    bullets.push({ x: player.x + player.w / 2 - BULLET_WIDTH / 2 + 10, y: player.y - BULLET_HEIGHT, w: BULLET_WIDTH, h: BULLET_HEIGHT });
  }
}

function rectsOverlap(a, b) {
  return !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h);
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

  // ---------------- Colisões com projéteis ----------------
  for(let i = bullets.length - 1; i >= 0; i--){
    const bullet = bullets[i];
    for(const en of enemies){
      if(!en.alive) continue;
      if(rectsOverlap(bullet,en)){
        en.alive = false;
        bullets.splice(i,1);
        score += en.points; // pontos especiais para inimigos especiais
        // chance de spawnar power-up
        if(Math.random() < 0.1) spawnPowerUp();
        break;
      }
    }
  }

  // ---------------- Checa colisão inimigos com nave ou chão ----------------
  for(const en of enemies){
    if(!en.alive) continue;
    if(en.y + en.h >= CH || rectsOverlap(en, player)){
      en.alive = false;
      lives -= 1;
    }
  }

  // ---------------- Atualiza power-ups ----------------
  for(let i = powerUps.length -1; i >=0; i--){
    const p = powerUps[i];
    p.y += 2; // velocidade do power-up
    if(p.y > CH) powerUps.splice(i,1); // remove se passar do chão
    else if(rectsOverlap(p, player)){ // coleta power-up
      if(p.type === "doubleShot") player.doubleShot = true;
      if(p.type === "wideShip") player.w = PLAYER_WIDTH * 1.5;
      powerUps.splice(i,1);
    }
  }

  // ---------------- Checa fim de jogo ----------------
  if(lives <= 0) gameOver = true;

  // ---------------- Checa se todos inimigos morreram → novo nível ----------------
  const allDead = enemies.every(e => !e.alive);
  if(allDead && !gameOver){
    level += 1;
    enemySpeed += 0.5;
    player.doubleShot = false;
    player.w = PLAYER_WIDTH; // reseta tamanho da nave
    createEnemies();
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
  for(const en of enemies){
    if(!en.alive) continue;
    ctx.fillStyle = en.special ? "#ff0" : "#f43f5e"; // inimigos especiais amarelos
    ctx.fillRect(en.x,en.y,en.w,en.h);
    ctx.fillStyle = "#0b0f1a";
    ctx.fillRect(en.x+8,en.y+6,6,6);
    ctx.fillRect(en.x+en.w-14,en.y+6,6,6);
  }

  // Desenha power-ups
  for(const p of powerUps){
    ctx.fillStyle = p.type === "doubleShot" ? "#0f0" : "#00f"; // verde ou azul
    ctx.fillRect(p.x,p.y,p.w,p.h);
  }

  // ---------------- Desenha HUD ----------------
  ctx.fillStyle = "#ffffff";
  ctx.font = "20px Arial";
  ctx.textAlign = "left";
  ctx.fillText(`Score: ${score}`, 10, 30);
  ctx.fillText(`Lives: ${lives}`, CW - 100, 30);
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
