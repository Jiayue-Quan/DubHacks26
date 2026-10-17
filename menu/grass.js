/* =========================================================
   1. GRASS, in 4 depth layers (back to front):
      deep  = far-down blades, blurred + darker (canvas #grassDeep)
      mid   = main grass, with soft shadows      (canvas #grassBack)
      front = blades poking over the book        (canvas #grassFront)
      near  = huge out-of-focus blades + bokeh at the screen edges (#grassNear)
   This file draws the grass. book.js talks to it through window.grass.
   ========================================================= */
(() => {
const deep  = document.getElementById('grassDeep');
const back  = document.getElementById('grassBack');
const front = document.getElementById('grassFront');
const near  = document.getElementById('grassNear');
const dctx  = deep.getContext('2d');
const bctx  = back.getContext('2d');
const fctx  = front.getContext('2d');
const nctx  = near.getContext('2d');
const book  = document.getElementById('book');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

let gustStart = -1e9;   // when the last gust of wind started
let W, H, deepBlades = [], midBlades = [], frontBlades = [], nearBlades = [], flowers = [], motes = [];
const rand = (a, b) => a + Math.random() * (b - a);

// layer 0 = deepest (dark, short) ... layer 4 = top (bright, long)
const LIGHT = [13, 21, 30, 40, 50];          // base brightness per layer
const SUN = { x: 0.6, y: -0.8 };             // sunlight comes from the top-right

function makeBlade(x, y, len, angSpread, layer) {
  const k = 0.6 + layer * 0.12;              // higher layers are bigger
  const b = {
    x, y, layer,
    len: len * k * rand(0.7, 1.25),
    w: rand(1.2, 3.4) * k,                   // thin, like real blades
    ang: -Math.PI / 2 + rand(-angSpread, angSpread) + 0.25,  // mostly leaning one way
    bend: rand(-0.5, 0.5) * (Math.random() < 0.2 ? 2 : 1),   // some blades flop over
    amp: rand(0.03, 0.08) * (0.6 + layer * 0.15),             // higher layers sway more
    sp: rand(0.7, 1.3),
  };
  b.col = bladeColor(b);
  return b;
}

// real grass isn't one green: mix blue-greens, yellow-greens and some dry straw
function bladeColor(b) {
  const straw = Math.random() < (b.layer < 2 ? 0.12 : 0.03);
  const h = straw ? rand(42, 55) : (Math.random() < 0.2 ? rand(68, 80) : rand(82, 104));
  const s = straw ? rand(30, 45) : rand(38, 62);
  const facing = Math.cos(b.ang) * SUN.x + Math.sin(b.ang) * SUN.y;   // blades pointing at the sun look brighter
  const l = LIGHT[b.layer] + rand(-4, 4) + facing * 7 + (straw ? 8 : 0);
  return { h, s, l };
}

// each blade gets a gradient: dark at the root (in shadow) -> its color -> lighter tip
function paint(ctx, b) {
  const { h, s, l } = b.col;
  const g = ctx.createLinearGradient(b.x, b.y, b.x + Math.cos(b.ang) * b.len, b.y + Math.sin(b.ang) * b.len);
  g.addColorStop(0,    `hsl(${h}, ${s}%, ${l * 0.45}%)`);
  g.addColorStop(0.35, `hsl(${h}, ${s}%, ${l}%)`);
  g.addColorStop(1,    `hsl(${h + 5}, ${s - 6}%, ${Math.min(78, l * 1.2)}%)`);
  b.c = g;
}

function build() {
  deepBlades = []; midBlades = [];
  const count = Math.min(5500, Math.floor((W * H) / 220));
  for (let i = 0; i < count; i++) {
    const layer = Math.floor(rand(0, 5));
    const b = makeBlade(rand(-20, W + 20), rand(0, H + 80), rand(60, 170), 1.1, layer);
    (layer < 2 ? deepBlades : midBlades).push(b);
  }
  deepBlades.sort((a, b) => a.layer - b.layer);
  midBlades.sort((a, b) => a.layer - b.layer);

  // little yellow flowers
  flowers = [];
  for (let i = 0; i < Math.floor((W * H) / 30000); i++) {
    flowers.push({ x: rand(0, W), y: rand(0, H), r: rand(2, 4), n: Math.floor(rand(3, 6)), ph: rand(0, 6) });
  }

  // pollen, drawn as soft out-of-focus dots on the near layer
  motes = [];
  for (let i = 0; i < 30; i++) motes.push({ x: rand(0, W), y: rand(0, H), r: rand(2, 7), vy: rand(0.1, 0.4), ph: rand(0, 6) });

  // foreground blades poking over the bottom/sides of the closed book
  frontBlades = [];
  const r = book.getBoundingClientRect();
  for (let i = 0; i < 240; i++) {
    const side = Math.random();
    let x, y;
    if (side < 0.6) { x = rand(r.left - 20, r.right + 20); y = rand(r.bottom - 15, r.bottom + 40); }
    else if (side < 0.8) { x = rand(r.left - 30, r.left + 15); y = rand(r.top + 40, r.bottom); }
    else { x = rand(r.right - 15, r.right + 30); y = rand(r.top + 40, r.bottom); }
    frontBlades.push(makeBlade(x, y, rand(45, 120), 0.8, Math.floor(rand(3, 5))));
  }

  // giant blurry blades right in front of the "camera", around the screen edges
  nearBlades = [];
  for (let i = 0; i < 46; i++) {
    const b = makeBlade(0, 0, 1, 0.5, 4);
    const side = Math.random();
    if (side < 0.5)       { b.x = rand(-50, W + 50); b.y = H + rand(10, 80); b.ang = -Math.PI / 2 + rand(-0.6, 0.6); }
    else if (side < 0.75) { b.x = rand(-60, -10);    b.y = rand(H * 0.2, H + 40); b.ang = rand(-0.9, -0.1); }
    else                  { b.x = W + rand(10, 60);  b.y = rand(H * 0.2, H + 40); b.ang = Math.PI + rand(0.1, 0.9); }
    b.len = side < 0.5 ? rand(H * 0.1, H * 0.24) : rand(H * 0.15, H * 0.35);   // bottom ones shorter so they don't cover the book
    b.w = rand(7, 16);
    b.amp = rand(0.03, 0.06);
    b.col = { h: rand(80, 100), s: rand(35, 50), l: rand(16, 34) };
    nearBlades.push(b);
  }

  deepBlades.forEach(b => paint(dctx, b));
  midBlades.forEach(b => paint(bctx, b));
  frontBlades.forEach(b => paint(fctx, b));
  nearBlades.forEach(b => paint(nctx, b));
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight;
  for (const [c, ctx] of [[deep, dctx], [back, bctx], [front, fctx], [near, nctx]]) {
    c.width = W * dpr; c.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  build();
}

// ox/oy/color are used for drawing a blade's shadow
function drawBlade(ctx, b, t, ox = 0, oy = 0, color = b.c) {
  const gust = Math.sin(t * 0.00035) * 0.04            // slow wind that moves everything together
             + gustBoost(t) * Math.sign(b.x - W / 2);   // + a burst that pushes grass away from the middle
  const sway = reduceMotion ? 0 : Math.sin(t * 0.0011 * b.sp + b.x * 0.008 + b.y * 0.004) * b.amp + gust * b.amp * 12;
  const x = b.x + ox, y = b.y + oy;
  const a  = b.ang + sway;
  const tx = x + Math.cos(a) * b.len, ty = y + Math.sin(a) * b.len;
  const ca = b.ang + sway * 0.4 + b.bend;
  const cx = x + Math.cos(ca) * b.len * 0.55, cy = y + Math.sin(ca) * b.len * 0.55;
  const px = Math.cos(b.ang + Math.PI / 2) * b.w, py = Math.sin(b.ang + Math.PI / 2) * b.w;
  ctx.beginPath();
  ctx.moveTo(x - px, y - py);
  ctx.quadraticCurveTo(cx - px * 0.5, cy - py * 0.5, tx, ty);
  ctx.quadraticCurveTo(cx + px * 0.5, cy + py * 0.5, x + px, y + py);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  // thin shiny line down the middle of the top blades (the fold of a real grass blade)
  if (b.layer >= 3 && ox === 0) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(cx, cy, tx, ty);
    ctx.strokeStyle = 'rgba(240, 255, 200, .16)';
    ctx.lineWidth = Math.max(0.6, b.w * 0.25);
    ctx.stroke();
  }
}

function frame(t) {
  // DEEP layer: dark soil-green ground + the lowest blades (CSS blurs this canvas)
  const g = dctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#2f4d17'); g.addColorStop(0.6, '#233d10'); g.addColorStop(1, '#18300a');
  dctx.fillStyle = g; dctx.fillRect(0, 0, W, H);
  for (const b of deepBlades) drawBlade(dctx, b, t);

  // shadows of the top blades, drawn on the blurred layer so they come out soft
  for (const b of midBlades) if (b.layer >= 3) drawBlade(dctx, b, t, 5, 8, 'rgba(8, 18, 2, .35)');

  // MID layer: main grass, flowers tucked in between the layers
  bctx.clearRect(0, 0, W, H);
  let flowersDrawn = false;
  for (const b of midBlades) {
    if (!flowersDrawn && b.layer >= 3) { drawFlowers(t); flowersDrawn = true; }
    drawBlade(bctx, b, t);
  }

  // FRONT layer: blades over the book
  fctx.clearRect(0, 0, W, H);
  for (const b of frontBlades) drawBlade(fctx, b, t);

  // NEAR layer: giant blurry blades + floating pollen
  nctx.clearRect(0, 0, W, H);
  for (const b of nearBlades) drawBlade(nctx, b, t);
  for (const m of motes) {
    if (!reduceMotion) { m.y -= m.vy; m.x += Math.sin(t * 0.0008 + m.ph) * 0.3 + (m.vx || 0); }
    if (m.burst) { m.vy = Math.max(0.25, m.vy * 0.992); m.vx *= 0.99; }
    if (m.y < -10) { if (m.burst) { m.dead = true; continue; } m.y = H + 10; m.x = rand(0, W); }
    nctx.fillStyle = 'rgba(255, 244, 190, .45)';
    nctx.beginPath(); nctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); nctx.fill();
  }

  motes = motes.filter(m => !m.dead);

  requestAnimationFrame(frame);
}

// a gust that rises fast and dies down over ~3 seconds
function gustBoost(t) {
  const dt = (t - gustStart) / 1000;
  if (dt < 0 || dt > 3.5) return 0;
  return Math.sin(dt * 4.5) * Math.exp(-dt * 1.4) * 0.3;
}

function drawFlowers(t) {
  for (const f of flowers) {
    const s = reduceMotion ? 0 : Math.sin(t * 0.0012 + f.ph) * 1.5;
    bctx.fillStyle = '#f2d64b';
    for (let k = 0; k < f.n; k++) {
      const ang = (k / f.n) * Math.PI * 2;
      bctx.beginPath();
      bctx.arc(f.x + s + Math.cos(ang) * f.r * 1.4, f.y + Math.sin(ang) * f.r * 1.4, f.r, 0, Math.PI * 2);
      bctx.fill();
    }
    bctx.fillStyle = '#c99a1e';
    bctx.beginPath(); bctx.arc(f.x + s, f.y, f.r * 0.7, 0, Math.PI * 2); bctx.fill();
  }
}

/* ---- what book.js can call ---- */
window.grass = {
  gust() { gustStart = performance.now(); },
  hideFront() { front.classList.add('gone'); },
  burst(cx, cy) {              // a puff of pollen from where the book opens
    if (reduceMotion) return;
    for (let i = 0; i < 34; i++) {
      motes.push({ x: cx + rand(-W * 0.18, W * 0.18), y: cy + rand(-H * 0.15, H * 0.2), r: rand(2, 6),
                   vy: rand(0.6, 1.8), vx: rand(-0.7, 0.7), ph: rand(0, 6), burst: true });
    }
  },
};

addEventListener('resize', resize);
resize();
requestAnimationFrame(frame);
})();