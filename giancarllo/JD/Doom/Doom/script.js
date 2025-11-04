const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const menu = document.getElementById("menu");
const config = document.getElementById("config");
const playBtn = document.getElementById("playBtn");
const configBtn = document.getElementById("configBtn");
const backBtn = document.getElementById("backBtn");

// 🔫 Map e jogador
const map = [
  [1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,1],
  [1,0,0,1,0,0,0,1,0,1],
  [1,0,0,1,0,0,0,1,0,1],
  [1,0,0,0,0,1,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1],
];

let posX = 3.5, posY = 3.5, dir = 0;
const fov = Math.PI / 3;
const speed = 0.05, rotSpeed = 0.04;

// 👾 Inimigo
let enemy = { x: 6, y: 2, active: true };

// Controles
const keys = {};
window.addEventListener("keydown", e => keys[e.key] = true);
window.addEventListener("keyup", e => keys[e.key] = false);

// ⚙ Menu
playBtn.onclick = () => {
  menu.classList.add("hidden");
  canvas.classList.remove("hidden");
  gameLoop();
};

configBtn.onclick = () => {
  menu.classList.add("hidden");
  config.classList.remove("hidden");
};

backBtn.onclick = () => {
  config.classList.add("hidden");
  menu.classList.remove("hidden");
};

// 🎯 Disparo
window.addEventListener("keydown", e => {
  if (e.code === "Space") {
    // Aqui você pode futuramente colocar o som ou efeito visual do tiro
    console.log("Pew! (tiro disparado)");
  }
});

function castRays() {
  const numRays = canvas.width;
  const angleStep = fov / numRays;

  for (let i = 0; i < numRays; i++) {
    const rayAngle = dir - fov / 2 + i * angleStep;
    let distance = 0;
    let hit = false;

    let eyeX = Math.cos(rayAngle);
    let eyeY = Math.sin(rayAngle);

    while (!hit && distance < 20) {
      distance += 0.01;
      const testX = Math.floor(posX + eyeX * distance);
      const testY = Math.floor(posY + eyeY * distance);

      if (testX < 0 || testX >= map[0].length || testY < 0 || testY >= map.length) {
        hit = true;
        distance = 20;
      } else if (map[testY][testX] > 0) {
        hit = true;
      }
    }

    const wallHeight = (1 / distance) * 800;
    const shade = Math.max(0, 255 - distance * 30);
    ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
    ctx.fillRect(i, (canvas.height / 2) - wallHeight / 2, 1, wallHeight);
  }
}

function moveEnemy() {
  if (!enemy.active) return;

  const dx = posX - enemy.x;
  const dy = posY - enemy.y;
  const dist = Math.sqrt(dx*dx + dy*dy);

  if (dist > 0.5) {
    enemy.x += dx / dist * 0.015;
    enemy.y += dy / dist * 0.015;
  }
}

function update() {
  if (keys["ArrowLeft"]) dir -= rotSpeed;
  if (keys["ArrowRight"]) dir += rotSpeed;
  if (keys["w"]) {
    posX += Math.cos(dir) * speed;
    posY += Math.sin(dir) * speed;
  }
  if (keys["s"]) {
    posX -= Math.cos(dir) * speed;
    posY -= Math.sin(dir) * speed;
  }
  if (keys["a"]) {
    posX += Math.cos(dir - Math.PI/2) * speed;
    posY += Math.sin(dir - Math.PI/2) * speed;
  }
  if (keys["d"]) {
    posX += Math.cos(dir + Math.PI/2) * speed;
    posY += Math.sin(dir + Math.PI/2) * speed;
  }

  moveEnemy();
}

function gameLoop() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  update();
  castRays();
  requestAnimationFrame(gameLoop);
}
