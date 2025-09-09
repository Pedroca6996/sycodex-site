// ---------------------------- Configuração de Canvas ----------------------------

// Obtém a referência do canvas pelo id "game"
const canvas = document.getElementById("game");
// Pega o contexto 2D para desenhar formas no canvas
const ctx = canvas.getContext("2d");

// ---------------------------- Constantes do Jogo ----------------------------

// Largura do canvas (800) para facilitar leitura
const CW = canvas.width;
// Altura do canvas (600) para facilitar leitura
const CH = canvas.height;

// Dimensões da nave do jogador (retângulo simples)
const PLAYER_WIDTH = 60;
const PLAYER_HEIGHT = 20;
// Velocidade de movimento da nave em pixels por frame
const PLAYER_SPEED = 5;

// Dimensões e velocidade dos projéteis (tiros)
const BULLET_WIDTH = 4;
const BULLET_HEIGHT = 12;
const BULLET_SPEED = 8;

// Configuração dos inimigos (uma fileira)
// Quantidade de inimigos na linha
const ENEMY_COUNT = 10;
// Dimensões dos inimigos
const ENEMY_WIDTH = 40;
const ENEMY_HEIGHT = 20;
// Espaçamento horizontal entre inimigos
const ENEMY_SPACING_X = 20;
// Posição Y inicial da linha de inimigos
const ENEMY_START_Y = 80;
// Velocidade de movimento horizontal dos inimigos (pixels por frame)
let enemySpeed = 2;
// Descida dos inimigos ao baterem na borda
const ENEMY_DROP = 20;

// ---------------------------- Estado do Jogo ----------------------------

// Objeto que representa a nave do jogador
const player = {
  // Posição X inicial (centraliza pela metade do canvas menos metade da nave)
  x: CW / 2 - PLAYER_WIDTH / 2,
  // Posição Y próxima à parte inferior do canvas
  y: CH - 60,
  // Largura da nave
  w: PLAYER_WIDTH,
  // Altura da nave
  h: PLAYER_HEIGHT,
  // Direção horizontal (−1 esquerda, 0 parado, +1 direita)
  dir: 0
};

// Array que guarda os projéteis ativos
const bullets = [];

// Array que guarda os inimigos ativos
const enemies = [];

// Direção de movimento dos inimigos (+1 direita, −1 esquerda)
let enemyDir = 1;

// Controle de teclado: guarda quais teclas estão pressionadas
const keys = {
  ArrowLeft: false,   // seta para esquerda
  ArrowRight: false,  // seta para direita
  Space: false        // espaço (tiro)
};

// Bloqueio simples para não atirar várias balas no mesmo keydown
let canShoot = true;

// ---------------------------- Funções de Utilidade ----------------------------

// Função para criar a fileira de inimigos
function createEnemies() {
  // Calcula a largura total ocupada por todos inimigos + espaçamentos
  const totalWidth = ENEMY_COUNT * ENEMY_WIDTH + (ENEMY_COUNT - 1) * ENEMY_SPACING_X;
  // Calcula o X inicial da fileira para centralizar
  let startX = (CW - totalWidth) / 2;

  // Loop para criar cada inimigo
  for (let i = 0; i < ENEMY_COUNT; i++) {
    // Posição X do inimigo considerando largura e espaçamento
    const x = startX + i * (ENEMY_WIDTH + ENEMY_SPACING_X);
    // Adiciona inimigo ao array com propriedades básicas
    enemies.push({
      x: x,
      y: ENEMY_START_Y,
      w: ENEMY_WIDTH,
      h: ENEMY_HEIGHT,
      alive: true // flag para identificar se o inimigo ainda está na tela
    });
  }
}

// Função para disparar um projétil a partir da nave
function shoot() {
  // Verifica se pode atirar (evita múltiplos tiros no mesmo keydown)
  if (!canShoot) return;
  // Marca que não pode atirar até soltar a tecla espaço
  canShoot = false;

  // Calcula a posição X do projétil no centro da nave
  const bulletX = player.x + player.w / 2 - BULLET_WIDTH / 2;
  // Posição Y do projétil (acima da nave)
  const bulletY = player.y - BULLET_HEIGHT;

  // Adiciona um novo projétil ao array
  bullets.push({
    x: bulletX,
    y: bulletY,
    w: BULLET_WIDTH,
    h: BULLET_HEIGHT
  });
}

// Função para detectar colisão retângulo vs retângulo
function rectsOverlap(a, b) {
  // Retorna true se os retângulos se sobrepõem
  return !(
    a.x + a.w < b.x || // a está totalmente à esquerda de b
    a.x > b.x + b.w || // a está totalmente à direita de b
    a.y + a.h < b.y || // a está totalmente acima de b
    a.y > b.y + b.h    // a está totalmente abaixo de b
  );
}

// ---------------------------- Entrada do Teclado ----------------------------

// Listener para pressionar tecla
window.addEventListener("keydown", (e) => {
  // Se for seta esquerda, marca como pressionada e define dir = −1
  if (e.code === "ArrowLeft") {
    keys.ArrowLeft = true;
    player.dir = -1;
  }
  // Se for seta direita, marca como pressionada e define dir = +1
  if (e.code === "ArrowRight") {
    keys.ArrowRight = true;
    player.dir = 1;
  }
  // Se for espaço, tenta atirar
  if (e.code === "Space") {
    keys.Space = true;
    shoot();
    // Evita a página rolar ao apertar espaço
    e.preventDefault();
  }
});

// Listener para soltar tecla
window.addEventListener("keyup", (e) => {
  // Se soltou seta esquerda, marca como false
  if (e.code === "ArrowLeft") {
    keys.ArrowLeft = false;
    // Se a direita não está pressionada, para a nave (dir = 0)
    if (!keys.ArrowRight) player.dir = 0;
    // Se a direita está pressionada, muda dir para +1
    if (keys.ArrowRight) player.dir = 1;
  }
  // Se soltou seta direita, marca como false
  if (e.code === "ArrowRight") {
    keys.ArrowRight = false;
    // Se a esquerda não está pressionada, para a nave
    if (!keys.ArrowLeft) player.dir = 0;
    // Se a esquerda está pressionada, muda dir para −1
    if (keys.ArrowLeft) player.dir = -1;
  }
  // Se soltou espaço, libera novo disparo
  if (e.code === "Space") {
    keys.Space = false;
    canShoot = true;
  }
});

// ---------------------------- Atualização do Jogo ----------------------------

// Função que atualiza posições e lógicas a cada frame
function update() {
  // Move a nave conforme a direção atual
  player.x += player.dir * PLAYER_SPEED;

  // Garante que a nave não saia para fora do canvas (limites esquerdo/direito)
  if (player.x < 0) player.x = 0;
  if (player.x + player.w > CW) player.x = CW - player.w;

  // Atualiza posição dos projéteis (subindo)
  for (let i = bullets.length - 1; i >= 0; i--) {
    // Move o projétil para cima
    bullets[i].y -= BULLET_SPEED;
    // Remove projétil se sair pela parte superior
    if (bullets[i].y + bullets[i].h < 0) {
      bullets.splice(i, 1);
    }
  }

  // Calcula limites atuais dos inimigos vivos para saber se tocaram a borda
  let minX = Infinity;   // menor X entre inimigos vivos
  let maxX = -Infinity;  // maior X entre inimigos vivos
  let anyAlive = false;  // flag para saber se ainda há inimigos

  // Atualiza os limites com base nos inimigos vivos
  for (const en of enemies) {
    if (!en.alive) continue;                 // ignora inimigos já destruídos
    anyAlive = true;                          // marca que existe pelo menos um vivo
    if (en.x < minX) minX = en.x;             // atualiza menor X
    if (en.x + en.w > maxX) maxX = en.x + en.w;// atualiza maior X
  }

  // Se há inimigos vivos, movimenta-os lateralmente
  if (anyAlive) {
    // Se algum encostar na borda esquerda ou direita, inverte direção e desce
    if (minX <= 0 || maxX >= CW) {
      enemyDir *= -1;                         // inverte direção (−1 ↔ +1)
      for (const en of enemies) {
        if (!en.alive) continue;              // só desce os vivos
        en.y += ENEMY_DROP;                   // desce um pouco
      }
    }
    // Move horizontalmente todos os vivos conforme velocidade e direção
    for (const en of enemies) {
      if (!en.alive) continue;                // ignora mortos
      en.x += enemyDir * enemySpeed;          // aplica deslocamento no eixo X
    }
  }

  // Checa colisões entre projéteis e inimigos
  for (let i = bullets.length - 1; i >= 0; i--) {
    // Para cada projétil, testamos contra todos inimigos
    let hit = false;                           // flag: projétil atingiu alguém
    for (const en of enemies) {
      if (!en.alive) continue;                 // ignora inimigos já destruídos
      // Se houver sobreposição retangular, ocorreu colisão
      if (rectsOverlap(bullets[i], en)) {
        en.alive = false;                      // marca inimigo como destruído
        hit = true;                            // projétil será removido
        break;                                 // sai do loop de inimigos para este projétil
      }
    }
    // Remove projétil que acertou um inimigo
    if (hit) bullets.splice(i, 1);
  }
}

// ---------------------------- Desenho no Canvas ----------------------------

// Função que desenha todos os elementos a cada frame
function draw() {
  // Limpa a tela preenchendo todo o canvas com uma cor de fundo
  ctx.fillStyle = "#0b0f1a";                   // cor de fundo escura
  ctx.fillRect(0, 0, CW, CH);                  // retângulo cobrindo o canvas

  // Desenha a nave do jogador como um retângulo
  ctx.fillStyle = "#22d3ee";                   // cor ciano para a nave
  ctx.fillRect(player.x, player.y, player.w, player.h); // retângulo da nave

  // Desenha um pequeno “canhão” na nave (detalhe visual)
  ctx.fillRect(player.x + player.w / 2 - 3, player.y - 8, 6, 8);

  // Desenha os projéteis como pequenos retângulos
  ctx.fillStyle = "#fbbf24";                   // cor amarela para projéteis
  for (const b of bullets) {
    ctx.fillRect(b.x, b.y, b.w, b.h);          // desenha cada projétil
  }

  // Desenha os inimigos vivos como retângulos
  ctx.fillStyle = "#f43f5e";                   // cor rosa/vermelha para inimigos
  for (const en of enemies) {
    if (!en.alive) continue;                   // não desenha inimigo destruído
    ctx.fillRect(en.x, en.y, en.w, en.h);      // retângulo do inimigo
    // Detalhe visual: “olhos” simples
    ctx.fillStyle = "#0b0f1a";                 // usa a cor do fundo para olhos
    ctx.fillRect(en.x + 8, en.y + 6, 6, 6);    // olho esquerdo
    ctx.fillRect(en.x + en.w - 14, en.y + 6, 6, 6); // olho direito
    ctx.fillStyle = "#f43f5e";                 // retorna à cor do inimigo
  }
}

// ---------------------------- Loop Principal ----------------------------

// Função de loop: atualiza lógica e redesenha continuamente
function loop() {
  update();                            // atualiza posições/colisões/lógica
  draw();                              // desenha todos elementos no canvas
  requestAnimationFrame(loop);         // agenda o próximo frame
}

// ---------------------------- Inicialização ----------------------------

// Cria a fileira inicial de inimigos
createEnemies();
// Inicia o loop do jogo
loop();
