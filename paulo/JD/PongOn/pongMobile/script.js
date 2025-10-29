/* Pong Futurista — Player vs CPU
   - Responsive canvas (logical resolution)
   - Music in assets/bg-music.mp3 (autoplay after interaction)
   - Touch drag to move paddle in mobile
   - Scoring, pause/start, mute
   - Ball trail + glow
*/

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const PLAYER_SCORE_EL = document.getElementById('playerScore');
const CPU_SCORE_EL = document.getElementById('cpuScore');
const START_BTN = document.getElementById('startBtn');
const PAUSE_BTN = document.getElementById('pauseBtn');
const MUTE_BTN = document.getElementById('muteBtn');

const bgMusic = document.getElementById('bgMusic');
// const hitSfx = document.getElementById('hitSfx'); // opcional

// Logical resolution (keeps behavior consistent across screen sizes)
const GAME_W = 960;
const GAME_H = 540;
canvas.width = GAME_W;
canvas.height = GAME_H;

// Visual scaling to fit viewport while keeping aspect ratio
function resizeCanvas() {
  const scale = Math.min(
    window.innerWidth / GAME_W,
    window.innerHeight / GAME_H
  );

  const width = GAME_W * scale;
  const height = GAME_H * scale;

  canvas.style.width = width + "px";
  canvas.style.height = height + "px";

  // Centraliza na tela
  canvas.style.position = "absolute";
  canvas.style.left = (window.innerWidth - width) / 2 + "px";
  canvas.style.top = (window.innerHeight - height) / 2 + "px";
}


// Game state
let running = false;
let paused = false;
let muted = false;

let playerScore = 0;
let cpuScore = 0;
const POINTS_TO_WIN = 11; // se quiser uma condição de vitória visual (mas o jogo pode continuar)

PLAYER_SCORE_EL.textContent = `Você: ${playerScore}`;
CPU_SCORE_EL.textContent = `The Machine: ${cpuScore}`;

/* Entities */
const paddleWidth = 140;
const paddleHeight = 14;
const paddleY = GAME_H - 40;

let playerPaddle = { x: (GAME_W - paddleWidth)/2, y: paddleY, w: paddleWidth, h: paddleHeight, speed: 12 };
let cpuPaddle = { x: (GAME_W - paddleWidth)/2, y: 26, w: paddleWidth, h: paddleHeight, speed: 6 };

let ball = {
  x: GAME_W/2,
  y: GAME_H/2,
  r: 10,
  vx: 6 * (Math.random() > 0.5 ? 1 : -1),
  vy: 4 * (Math.random() > 0.5 ? 1 : -1),
  speedLimit: 14
};

// trail of previous ball positions for visual effect
let trail = [];
const TRAIL_MAX = 18;

// AI difficulty ramp
let waveCount = 0;

/* AUDIO CONTROL */
function startMusic() {
  if (muted) return;
  bgMusic.volume = 0.45;
  bgMusic.play().catch(()=>{});
}
function toggleMute() {
  muted = !muted;
  if (muted) {
    bgMusic.pause();
    MUTE_BTN.textContent = '🔇';
  } else {
    MUTE_BTN.textContent = '🔊';
    startMusic();
  }
}

/* UI Buttons */
START_BTN.addEventListener('click', () => {
  if (!running) {
    resetMatch();
    running = true;
  }
  paused = false;
  START_BTN.textContent = 'Reiniciar';
  PAUSE_BTN.textContent = 'Pausar';
  startMusic();
});
PAUSE_BTN.addEventListener('click', () => {
  if (!running) return;
  paused = !paused;
  PAUSE_BTN.textContent = paused ? 'Retomar' : 'Pausar';
});
MUTE_BTN.addEventListener('click', toggleMute);

/* Controls: mouse & touch
   - Player moves paddle by pointer x (touchmove/mousemove)
   - Also left/right arrow keys for desktop
*/
let pointerDown = false;
function pointerToCanvas(evt) {
  const rect = canvas.getBoundingClientRect();
  const clientX = (evt.touches ? evt.touches[0].clientX : evt.clientX);
  const x = (clientX - rect.left) * (canvas.width / rect.width);
  return x;
}
canvas.addEventListener('mousedown', e => { pointerDown = true; const x = pointerToCanvas(e); playerPaddle.x = x - playerPaddle.w/2; });
canvas.addEventListener('mousemove', e => { if(pointerDown){ const x = pointerToCanvas(e); playerPaddle.x = x - playerPaddle.w/2; }});
window.addEventListener('mouseup', ()=> pointerDown = false);

canvas.addEventListener('touchstart', e => { const x = pointerToCanvas(e); playerPaddle.x = x - playerPaddle.w/2; pointerDown = true; startMusic(); }, {passive:true});
canvas.addEventListener('touchmove', e => { if(pointerDown){ const x = pointerToCanvas(e); playerPaddle.x = x - playerPaddle.w/2; } }, {passive:true});
canvas.addEventListener('touchend', ()=> pointerDown = false);

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') playerPaddle.x -= playerPaddle.speed;
  if (e.key === 'ArrowRight') playerPaddle.x += playerPaddle.speed;
  if (e.key === 'm') toggleMute();
  if (e.key === ' ' && !running) { START_BTN.click(); }
});

/* Keep paddle inside bounds */
function clampPaddles() {
  playerPaddle.x = Math.max(6, Math.min(GAME_W - playerPaddle.w - 6, playerPaddle.x));
  cpuPaddle.x = Math.max(6, Math.min(GAME_W - cpuPaddle.w - 6, cpuPaddle.x));
}

/* Reset ball to center and give random direction */
function resetBall(servingToPlayer=true) {
  ball.x = GAME_W/2;
  ball.y = GAME_H/2;
  const angle = (Math.random() * 0.8 + 0.2) * (Math.random() > 0.5 ? 1 : -1);
  const speed = 6 + Math.min(waveCount*0.4, 6);
  ball.vx = speed * Math.cos(angle) * (servingToPlayer ? 1 : -1);
  ball.vy = speed * Math.sin(angle) * (Math.random()>0.5 ? 1 : -1);
  trail = [];
}

/* Scoring */
function scorePoint(toPlayer) {
  if (toPlayer) playerScore++; else cpuScore++;
  PLAYER_SCORE_EL.textContent = `Você: ${playerScore}`;
  CPU_SCORE_EL.textContent = `The Machine: ${cpuScore}`;

  // increase difficulty gradually
  waveCount++;
  cpuPaddle.speed = 5 + Math.min(3 + Math.floor(waveCount/2), 10);

  // reset ball towards who conceded the point
  resetBall(!toPlayer);
}

/* Simple CPU AI: track ball with smoothing */
function updateCPU(dt) {
  // If ball is moving towards CPU, be more aggressive
  const targetX = ball.x - cpuPaddle.w/2;
  const bias = (ball.vy < 0) ? 1.0 : 0.45; // if ball going up (to CPU) follow closely
  const desired = targetX;
  const dx = desired - cpuPaddle.x;
  cpuPaddle.x += dx * 0.05 * cpuPaddle.speed * bias * (1 + Math.min(waveCount*0.02, 1.2));
  // small predictive lead
  if (ball.vy < 0) {
    cpuPaddle.x += ball.vx * 0.03 * (1 + waveCount*0.03);
  }
}

/* Ball physics and collisions */
function updateBall() {
  ball.x += ball.vx;
  ball.y += ball.vy;

  // walls
  if (ball.x - ball.r <= 6) { ball.x = 6 + ball.r; ball.vx *= -1; }
  if (ball.x + ball.r >= GAME_W - 6) { ball.x = GAME_W - 6 - ball.r; ball.vx *= -1; }

  // paddle collision (player)
  if (ball.y + ball.r >= playerPaddle.y - 2) {
    if (ball.x >= playerPaddle.x && ball.x <= playerPaddle.x + playerPaddle.w) {
      // compute bounce depending on hit position (more angle near edges)
      const relative = (ball.x - (playerPaddle.x + playerPaddle.w/2)) / (playerPaddle.w/2);
      const bounceAngle = relative * 0.9; // -1..1 scaled
      const speed = Math.min(Math.hypot(ball.vx, ball.vy) * 1.03, ball.speedLimit);
      ball.vx = speed * bounceAngle;
      ball.vy = -Math.abs(speed * (0.6 + Math.abs(relative)*0.6));
      // hitSfx && hitSfx.play();
      addTrailBurst(ball.x, ball.y, 6);
    }
  }

  // paddle collision (cpu)
  if (ball.y - ball.r <= cpuPaddle.y + cpuPaddle.h + 2) {
    if (ball.x >= cpuPaddle.x && ball.x <= cpuPaddle.x + cpuPaddle.w) {
      const relative = (ball.x - (cpuPaddle.x + cpuPaddle.w/2)) / (cpuPaddle.w/2);
      const bounceAngle = relative * 0.9;
      const speed = Math.min(Math.hypot(ball.vx, ball.vy) * 1.03, ball.speedLimit);
      ball.vx = speed * bounceAngle;
      ball.vy = Math.abs(speed * (0.6 + Math.abs(relative)*0.6));
      // hitSfx && hitSfx.play();
      addTrailBurst(ball.x, ball.y, 6);
    }
  }

  // scoring: ball out of top or bottom
  if (ball.y - ball.r > GAME_H) { // passed bottom -> CPU scores
    scorePoint(false);
  } else if (ball.y + ball.r < 0) { // passed top -> Player scores
    scorePoint(true);
  }

  // store trail
  trail.unshift({x: ball.x, y: ball.y, r: ball.r});
  if (trail.length > TRAIL_MAX) trail.pop();
}

/* Visual trail bursts (particles) */
const particles = [];
function addTrailBurst(x,y,count=8){
  for(let i=0;i<count;i++){
    particles.push({
      x, y,
      vx: (Math.random()-0.5)*3,
      vy: (Math.random()-0.5)*3,
      life: 30 + Math.random()*20,
      size: 1 + Math.random()*3
    });
  }
}
function updateParticles() {
  for(let i = particles.length-1; i>=0; i--){
    const p = particles[i];
    p.x += p.vx; p.y += p.vy;
    p.vy *= 0.98; p.vx *= 0.98;
    p.life--;
    if (p.life <= 0) particles.splice(i,1);
  }
}

/* Render */
function drawNet() {
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = 'rgba(200,255,255,0.06)';
  const step = 20;
  for(let y=0; y< GAME_H; y+=step){
    ctx.fillRect(GAME_W/2 - 2, y+6, 4, 12);
  }
  ctx.restore();
}

function drawRoundedRect(x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
  ctx.fill();
}

function render() {
  // background
  ctx.clearRect(0,0,GAME_W,GAME_H);

  // subtle gradient background
  const g = ctx.createLinearGradient(0,0,0,GAME_H);
  g.addColorStop(0, 'rgba(6,16,40,0.9)');
  g.addColorStop(1, 'rgba(2,2,8,0.95)');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,GAME_W,GAME_H);

  // glow vignette
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  const vg = ctx.createRadialGradient(GAME_W/2, GAME_H/2, GAME_H*0.1, GAME_W/2, GAME_H/2, GAME_H*0.9);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = vg;
  ctx.fillRect(0,0,GAME_W,GAME_H);
  ctx.restore();

  // futuristic net
  drawNet();

  // paddles with neon edges
  // CPU paddle
  ctx.save();
  ctx.shadowColor = 'rgba(123,89,255,0.9)';
  ctx.shadowBlur = 18;
  ctx.fillStyle = 'rgba(110,90,255,0.18)';
  drawRoundedRect(cpuPaddle.x, cpuPaddle.y, cpuPaddle.w, cpuPaddle.h, 8);
  ctx.strokeStyle = 'rgba(120,200,255,0.9)';
  ctx.lineWidth = 2;
  ctx.strokeRect(cpuPaddle.x, cpuPaddle.y, cpuPaddle.w, cpuPaddle.h);
  ctx.restore();

  // player paddle
  ctx.save();
  ctx.shadowColor = 'rgba(0,247,255,0.9)';
  ctx.shadowBlur = 18;
  ctx.fillStyle = 'rgba(0,190,200,0.12)';
  drawRoundedRect(playerPaddle.x, playerPaddle.y, playerPaddle.w, playerPaddle.h, 8);
  ctx.strokeStyle = 'rgba(0,247,255,0.95)';
  ctx.lineWidth = 2;
  ctx.strokeRect(playerPaddle.x, playerPaddle.y, playerPaddle.w, playerPaddle.h);
  ctx.restore();

  // ball trail (fading)
  for(let i=trail.length-1;i>=0;i--){
    const t = trail[i];
    const alpha = (i / trail.length) * 0.6;
    ctx.beginPath();
    ctx.fillStyle = `rgba(0,200,255,${alpha})`;
    ctx.arc(t.x, t.y, t.r + i*0.25, 0, Math.PI*2);
    ctx.fill();
  }

  // ball with glow
  ctx.save();
  ctx.beginPath();
  const grad = ctx.createRadialGradient(ball.x, ball.y, 2, ball.x, ball.y, ball.r*3.5);
  grad.addColorStop(0, 'rgba(0,255,255,0.95)');
  grad.addColorStop(0.3, 'rgba(120,200,255,0.6)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.shadowBlur = 30;
  ctx.shadowColor = 'rgba(0,200,255,0.6)';
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();

  // particles
  for(const p of particles){
    ctx.beginPath();
    const alpha = Math.max(0, Math.min(1, p.life / 40));
    ctx.fillStyle = `rgba(120,200,255,${alpha})`;
    ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
    ctx.fill();
  }
}

/* Main loop */
let lastTime = 0;
function loop(ts) {
  if (!running) {
    render();
    requestAnimationFrame(loop);
    return;
  }
  if (paused) {
    render();
    requestAnimationFrame(loop);
    return;
  }

  const dt = (ts - lastTime) / 16.666; // ~60fps normalization
  lastTime = ts;

  // Update CPU
  updateCPU(dt);

  // clamp
  clampPaddles();

  // update ball
  updateBall();

  // update particles
  updateParticles();

  // render everything
  render();

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/* Reset match */
function resetMatch() {
  playerScore = 0;
  cpuScore = 0;
  PLAYER_SCORE_EL.textContent = `Você: ${playerScore}`;
  CPU_SCORE_EL.textContent = `The Machine: ${cpuScore}`;
  playerPaddle.x = (GAME_W - playerPaddle.w)/2;
  cpuPaddle.x = (GAME_W - cpuPaddle.w)/2;
  waveCount = 0;
  cpuPaddle.speed = 6;
  resetBall(true);
  running = true;
  paused = false;
}

/* Start paused (await user) */
running = false;
paused = true;

/* Ensure music starts after user interaction (mobile policy) */
window.addEventListener('click', startMusic, {once:true});
window.addEventListener('touchstart', startMusic, {once:true});

// expose resetBall for testing
window.resetBall = resetBall;
