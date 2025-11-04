const menu = document.getElementById("menu");
const gameCanvas = document.getElementById("gameCanvas");
const ctx = gameCanvas.getContext("2d");

const instructions = document.getElementById("instructions");
const settings = document.getElementById("settings");
const pauseMenu = document.getElementById("pauseMenu");
const sensitivitySlider = document.getElementById("sensitivity");

let sensitivity = 1;
let isPaused = false;
let playing = false;

const map = [
  [1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,1],
  [1,0,0,1,0,0,1,0,0,1],
  [1,0,0,1,0,0,1,0,0,1],
  [1,0,0,0,0,0,0,0,0,1],
  [1,0,1,0,0,0,0,1,0,1],
  [1,0,0,0,0,1,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,1,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1]
];

let player = { x: 2.5, y: 2.5, angle: 0, speed: 0.05 };
let enemies = [{x:7.5, y:7.5, alive:true}];
let keys = {};

function resizeCanvas() {
  gameCanvas.width = window.innerWidth;
  gameCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

// RAYCASTER
function render() {
  if (!playing || isPaused) return;

  const w = gameCanvas.width;
  const h = gameCanvas.height;
  const fov = Math.PI / 3;
  const numRays = w;
  const step = fov / numRays;

  ctx.clearRect(0, 0, w, h);

  for (let i = 0; i < numRays; i++) {
    const rayAngle = player.angle - fov / 2 + i * step;
    let distToWall = 0;
    let hit = false;

    while (!hit && distToWall < 20) {
      distToWall += 0.05;
      const testX = Math.floor(player.x + Math.cos(rayAngle) * distToWall);
      const testY = Math.floor(player.y + Math.sin(rayAngle) * distToWall);
      if (map[testY]?.[testX] > 0) hit = true;
    }

    const lineHeight = h / distToWall;
    const color = 100 + Math.min(155, 255 / distToWall);
    ctx.fillStyle = `rgb(${color},${color},${color})`;
    ctx.fillRect(i, h/2 - lineHeight/2, 1, lineHeight);
  }

  // Enemies
  enemies.forEach(e => {
    if (!e.alive) return;
    const dx = e.x - player.x;
    const dy = e.y - player.y;
    const angleToEnemy = Math.atan2(dy, dx);
    const distToEnemy = dist(player.x, player.y, e.x, e.y);
    const diff = ((angleToEnemy - player.angle + Math.PI * 3) % (2*Math.PI)) - Math.PI;

    if (Math.abs(diff) < fov / 2 && distToEnemy > 0.5) {
      const size = Math.min(200, 300 / distToEnemy);
      const x = w/2 + (diff * (w / fov)) - size/2;
      const y = h/2 - size/2;
      ctx.fillStyle = "red";
      ctx.fillRect(x, y, size, size);
    }

    if (distToEnemy < 0.3) e.alive = false; // enemy reached player
    else {
      const speed = 0.02;
      e.x += Math.cos(angleToEnemy) * speed;
      e.y += Math.sin(angleToEnemy) * speed;
    }
  });

  requestAnimationFrame(render);
}

// Controls
document.addEventListener("keydown", e => {
  keys[e.key] = true;
  if (e.key === "Backspace" && playing) {
    e.preventDefault();
    togglePause();
  }
});
document.addEventListener("keyup", e => keys[e.key] = false);

document.addEventListener("mousemove", e => {
  if (!playing || isPaused) return;
  player.angle += (e.movementX / 200) * sensitivity;
});

function update() {
  if (!playing || isPaused) return;
  let moveX = 0, moveY = 0;
  if (keys["w"]) { moveX += Math.cos(player.angle); moveY += Math.sin(player.angle); }
  if (keys["s"]) { moveX -= Math.cos(player.angle); moveY -= Math.sin(player.angle); }
  if (keys["a"]) { moveX += Math.sin(player.angle); moveY -= Math.cos(player.angle); }
  if (keys["d"]) { moveX -= Math.sin(player.angle); moveY += Math.cos(player.angle); }

  const nextX = player.x + moveX * player.speed;
  const nextY = player.y + moveY * player.speed;
  if (map[Math.floor(player.y)]?.[Math.floor(nextX)] === 0) player.x = nextX;
  if (map[Math.floor(nextY)]?.[Math.floor(player.x)] === 0) player.y = nextY;

  requestAnimationFrame(update);
}

// Shooting
document.addEventListener("click", e => {
  if (!playing || isPaused) return;
  enemies.forEach(enemy => {
    const d = dist(player.x, player.y, enemy.x, enemy.y);
    const angleToEnemy = Math.atan2(enemy.y - player.y, enemy.x - player.x);
    const diff = ((angleToEnemy - player.angle + Math.PI * 3) % (2*Math.PI)) - Math.PI;
    if (Math.abs(diff) < 0.1 && d < 10) enemy.alive = false;
  });
});

function togglePause() {
  isPaused = !isPaused;
  pauseMenu.classList.toggle("hidden", !isPaused);
}

// Menu logic
document.getElementById("playBtn").onclick = () => {
  menu.classList.add("hidden");
  gameCanvas.classList.remove("hidden");
  playing = true;
  document.body.requestPointerLock();
  requestAnimationFrame(render);
  requestAnimationFrame(update);
};

document.querySelectorAll(".backBtn").forEach(btn => {
  btn.onclick = () => {
    instructions.classList.add("hidden");
    settings.classList.add("hidden");
    menu.classList.remove("hidden");
  };
});

document.getElementById("instructionsBtn").onclick = () => {
  menu.classList.add("hidden");
  instructions.classList.remove("hidden");
};
document.getElementById("settingsBtn").onclick = () => {
  menu.classList.add("hidden");
  settings.classList.remove("hidden");
};

document.getElementById("resumeBtn").onclick = () => {
  togglePause();
  document.body.requestPointerLock();
};
document.getElementById("backToMenuBtn").onclick = () => {
  pauseMenu.classList.add("hidden");
  playing = false;
  isPaused = false;
  menu.classList.remove("hidden");
  gameCanvas.classList.add("hidden");
  enemies = [{x:7.5, y:7.5, alive:true}];
};

sensitivitySlider.oninput = e => sensitivity = parseFloat(e.target.value);
