/* =====================================================================
   OPENING SCENE ENGINE
   Runs the whole opening: a "camera" moves around one big world.

     0. the open book in the grass is the MENU; the camera waits here
        (the title writes itself) until start() is called
     1. Start pressed: the camera leaves the book
     2. the camera tilts up past the grass to a pastel sunset sky + sea
     3. it drifts back down to find the two blobs cuddled in the grass
     4. it pushes in on their faces: a blink, a nuzzle, a giggle

   The world is 1600 x 2350 "world pixels". Everything (book, blobs,
   grass) has a fixed spot in it, and the camera just looks at
   different parts of it. Things further away move slower (parallax).

   React only renders the HTML once (OpeningScene.jsx). This file then
   moves things around every frame, so React never re-renders mid-animation.
   ===================================================================== */

/* ---------------- world layout ---------------- */
export const WORLD = { w: 1600, h: 2350, horizon: 1020, meadowTop: 1034 };
export const BOOK = { x: 170, y: 1560, w: 640, h: 420, rot: -6 };
export const BLOBS = {
  //        top-left corner, size, how much it leans (deg)
  coral: { x: 1080, y: 1676, w: 205, h: 170, lean: 7 },
  mauve: { x: 1210, y: 1614, w: 265, h: 222, lean: -3 },
};
// where the camera points for each shot
const MENU_SPOT = { x: BOOK.x + BOOK.w / 2 + 6, y: BOOK.y + BOOK.h / 2 - 4 };   // whole open book in view
const FACES_SPOT = { x: 1250, y: 1730 };
const ANCHOR = { x: 800, y: 790 };              // the sky shot; parallax is measured from here

/* ---------------- timeline (seconds) ---------------- */
const KEYS = [
  { t: 0,    x: MENU_SPOT.x - 10,  y: MENU_SPOT.y + 8,  z: 1.48 },
  { t: 3.6,  x: MENU_SPOT.x,       y: MENU_SPOT.y,      z: 1.58 },  // slow push-in, then WAIT here (menu)
  { t: 8.8,  x: ANCHOR.x,          y: ANCHOR.y,         z: 1.0, ease: 'sine' }, // tilt up to the sky
  { t: 10.6, x: ANCHOR.x + 40,     y: ANCHOR.y + 6,     z: 1.03 },  // hold on the sky
  { t: 14.8, x: 1170,              y: 1700,             z: 1.6 },   // drift down to the blobs
  { t: 17.4, x: FACES_SPOT.x,      y: FACES_SPOT.y,     z: 2.85 },  // push in on their faces
  { t: 999,  x: FACES_SPOT.x + 6,  y: FACES_SPOT.y - 2, z: 2.95 },
];
const TITLE_WRITE = [1.0, 3.1];       // title writes itself between these times
const MENU_TIME = 3.6;                // the story clock stops here until Start is pressed
const END_TIME = 21.5;                // onComplete fires here

/* ---------------- small helpers ---------------- */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = {
  cubic: k => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
  sine: k => -(Math.cos(Math.PI * k) - 1) / 2,
};
// seeded random so the grass looks the same every time
function seeded(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hsl(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}
const mix = (c1, c2, k) => [lerp(c1[0], c2[0], k), lerp(c1[1], c2[1], k), lerp(c1[2], c2[2], k)];
const rgb = c => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
const HAZE = [228, 196, 206];          // pinkish air in the distance
const bump = (t, at, width) => Math.max(0, 1 - Math.abs(t - at) / width);

function cameraAt(t) {
  let i = 0;
  while (i < KEYS.length - 2 && t >= KEYS[i + 1].t) i++;
  const a = KEYS[i], b = KEYS[i + 1];
  const k = clamp((t - a.t) / (b.t - a.t), 0, 1);
  const e = (ease[b.ease] || ease.cubic)(k);
  return { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), z: lerp(a.z, b.z, e) };
}

/* =====================================================================
   GRASS + FLOWERS (drawn on canvas, in world coordinates)
   ===================================================================== */
function makeBlade(rand, x, y, len, width, near) {
  // near = 0 far away ... 1 right in front of us
  const hue = rand() < 0.18 ? lerp(58, 70, rand()) : lerp(72, 98, rand());
  const sat = lerp(38, 62, rand());
  const lean = -Math.PI / 2 + (rand() - 0.5) * 1.3 + 0.18;          // mostly up, leaning a bit right
  const facing = Math.cos(lean) * 0.75 + Math.sin(lean) * -0.4;     // sun is low on the right
  const lightness = lerp(40, 33, near) + (rand() - 0.5) * 12 + facing * 8;
  const haze = Math.pow(1 - near, 2) * 0.55;
  const root = mix(hsl(hue, sat, lightness * 0.45), HAZE, haze);
  const body = mix(hsl(hue, sat, lightness), HAZE, haze);
  const tip  = mix(hsl(hue - 16, sat + 8, Math.min(82, lightness + 22)), HAZE, haze); // warm sunlit tip
  return {
    x, y, len, w: width, ang: lean,
    bend: (rand() - 0.5) * (rand() < 0.2 ? 1.6 : 0.8),
    amp: lerp(0.025, 0.07, rand()) * (0.5 + near),
    sp: lerp(0.7, 1.3, rand()),
    cols: [root, body, tip], shine: near > 0.45,
  };
}

function makeFlower(rand, x, y, r, near) {
  const lilac = rand() < 0.3;
  const petal = mix(lilac ? [214, 186, 232] : [255, 250, 240], HAZE, Math.pow(1 - near, 2) * 0.5);
  return {
    flower: true, x, y, r, petals: lilac ? 5 : 8, ph: rand() * 6.28,
    petal: rgb(petal), shade: rgb(mix(petal, [170, 140, 170], 0.35)),
    center: lilac ? '#f6e3a1' : '#f2bf45',
  };
}

// give each blade a gradient (dark root -> color -> warm tip)
function paintBlade(ctx, b) {
  if (b.len < 14) { b.fill = rgb(b.cols[1]); return; }   // tiny far blades: plain color is enough
  const g = ctx.createLinearGradient(b.x, b.y, b.x + Math.cos(b.ang) * b.len, b.y + Math.sin(b.ang) * b.len);
  g.addColorStop(0, rgb(b.cols[0]));
  g.addColorStop(0.38, rgb(b.cols[1]));
  g.addColorStop(1, rgb(b.cols[2]));
  b.fill = g;
}

function drawBlade(ctx, b, time, breeze) {
  const sway = Math.sin(time * b.sp + b.x * 0.005 + b.y * 0.003) * b.amp + breeze * b.amp * 0.9;
  const a = b.ang + sway;
  const tx = b.x + Math.cos(a) * b.len, ty = b.y + Math.sin(a) * b.len;
  const ca = b.ang + sway * 0.4 + b.bend * 0.5;
  const cx = b.x + Math.cos(ca) * b.len * 0.55, cy = b.y + Math.sin(ca) * b.len * 0.55;
  const px = Math.cos(b.ang + Math.PI / 2) * b.w, py = Math.sin(b.ang + Math.PI / 2) * b.w;
  ctx.beginPath();
  ctx.moveTo(b.x - px, b.y - py);
  ctx.quadraticCurveTo(cx - px * 0.5, cy - py * 0.5, tx, ty);
  ctx.quadraticCurveTo(cx + px * 0.5, cy + py * 0.5, b.x + px, b.y + py);
  ctx.closePath();
  ctx.fillStyle = b.fill;
  ctx.fill();
  if (b.shine) {                                   // thin light line down the fold of the blade
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.quadraticCurveTo(cx, cy, tx, ty);
    ctx.strokeStyle = 'rgba(255, 244, 205, .18)';
    ctx.lineWidth = b.w * 0.3;
    ctx.stroke();
  }
}

function drawFlower(ctx, f, time, breeze) {
  const sx = Math.sin(time * 0.9 + f.ph) * f.r * 0.12 + breeze * f.r * 0.15;
  const x = f.x + sx, y = f.y - f.r * 0.4;
  for (let k = 0; k < f.petals; k++) {
    const a = (k / f.petals) * Math.PI * 2 + f.ph;
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(a) * f.r * 0.62, y + Math.sin(a) * f.r * 0.45, f.r * 0.5, f.r * 0.24, a, 0, Math.PI * 2);
    ctx.fillStyle = Math.sin(a) > 0.3 ? f.shade : f.petal;   // lower petals a bit shaded
    ctx.fill();
  }
  ctx.beginPath();
  ctx.ellipse(x, y, f.r * 0.27, f.r * 0.22, 0, 0, Math.PI * 2);
  ctx.fillStyle = f.center;
  ctx.fill();
}

function buildGrass(ctxBack, ctxFront, ctxNear) {
  const rand = seeded(7);
  const top = WORLD.meadowTop, depth = WORLD.h - top;

  /* the meadow (behind the book and blobs) */
  const back = [];
  for (let i = 0; i < 9500; i++) {
    const k = Math.pow(rand(), 1.15);                          // more samples in the distance
    const y = top + k * depth, near = k;
    const len = 6 + 74 * Math.pow(near, 0.7) * lerp(0.7, 1.25, rand());   // far blades shorter (perspective)
    back.push(makeBlade(rand, lerp(-60, WORLD.w + 60, rand()), y, len, 0.6 + 3.4 * Math.pow(near, 0.8), near));
  }
  // thicker grass around the book and blobs, since we see it up close
  for (let i = 0; i < 2600; i++) {
    const x = lerp(BOOK.x - 120, BLOBS.mauve.x + BLOBS.mauve.w + 160, rand());
    const y = lerp(BOOK.y - 60, BOOK.y + BOOK.h + 110, rand());
    const near = (y - top) / depth;
    back.push(makeBlade(rand, x, y, lerp(30, 66, rand()), lerp(1.5, 3.4, rand()), near));
  }
  for (let i = 0; i < 950; i++) {
    const k = Math.pow(rand(), 1.1), near = k;
    back.push(makeFlower(rand, lerp(-40, WORLD.w + 40, rand()), top + 8 + k * (depth - 8), 1.6 + 9 * Math.pow(near, 0.8), near));
  }
  back.sort((a, b) => a.y - b.y);                              // far first, near last

  /* tufts in FRONT of the book + blobs, so they sit IN the grass */
  const front = [];
  const c = { x: BOOK.x + BOOK.w / 2, y: BOOK.y + BOOK.h / 2 }, r = (BOOK.rot * Math.PI) / 180;
  const rot = (px, py) => ({
    x: c.x + (px - c.x) * Math.cos(r) - (py - c.y) * Math.sin(r),
    y: c.y + (px - c.x) * Math.sin(r) + (py - c.y) * Math.cos(r),
  });
  for (let i = 0; i < 230; i++) {                              // along the book's bottom + side edges
    const side = rand();
    let p;
    if (side < 0.7) p = rot(lerp(BOOK.x - 10, BOOK.x + BOOK.w + 10, rand()), BOOK.y + BOOK.h + lerp(-6, 26, rand()));
    else if (side < 0.85) p = rot(BOOK.x + lerp(-20, 8, rand()), lerp(BOOK.y + 60, BOOK.y + BOOK.h, rand()));
    else p = rot(BOOK.x + BOOK.w + lerp(-8, 20, rand()), lerp(BOOK.y + 60, BOOK.y + BOOK.h, rand()));
    front.push(makeBlade(rand, p.x, p.y, lerp(22, 56, rand()), lerp(1.4, 3, rand()), 0.72));
  }
  for (const b of Object.values(BLOBS)) {                      // around the bottom of each blob
    for (let i = 0; i < 150; i++) {
      const x = lerp(b.x - 14, b.x + b.w + 14, rand());
      const edge = Math.abs((x - (b.x + b.w / 2)) / (b.w / 2));   // 0 middle .. 1 edge
      const y = b.y + b.h - 6 + lerp(-4, 26, rand()) - edge * edge * 18;
      front.push(makeBlade(rand, x, y, lerp(18, 50, rand()), lerp(1.4, 2.8, rand()), 0.72));
    }
  }
  for (let i = 0; i < 7; i++) {                                 // a few daisies right in front of the blobs
    front.push(makeFlower(rand, lerp(BLOBS.coral.x - 20, BLOBS.mauve.x + BLOBS.mauve.w + 20, rand()),
      BLOBS.mauve.y + BLOBS.mauve.h + lerp(10, 40, rand()), lerp(9, 13, rand()), 0.75));
  }
  front.sort((a, b) => a.y - b.y);

  /* a ridge of tall grass we look over in the sky shot (sits closer to the camera) */
  const ridge = [];
  for (let i = 0; i < 1700; i++) {
    const y = 1185 + 250 * (1 - Math.sqrt(rand()));            // thins out toward the bottom edge
    const grow = 1 + (y - 1185) / 250 * 0.4;
    const b = makeBlade(rand, lerp(-150, WORLD.w + 150, rand()), y, lerp(110, 240, rand()) * grow, lerp(3, 5.5, rand()) * grow, 0.6);
    b.cols[0] = mix(b.cols[0], b.cols[1], 0.6);               // softer roots so there's no dark line
    ridge.push(b);
  }
  for (let i = 0; i < 40; i++) ridge.push(makeFlower(rand, lerp(-100, WORLD.w + 100, rand()), lerp(1090, 1260, rand()), lerp(8, 14, rand()), 0.7));
  ridge.sort((a, b) => a.y - b.y);

  /* out-of-focus grass + flowers very close to the camera (blurred with CSS) */
  const near = [];
  for (let i = 0; i < 70; i++) {
    const x = lerp(-200, WORLD.w + 200, rand());
    if (x > 40 && x < 980) continue;                              // keep the book (menu) clear
    const short = x > 1080 && x < 1760 ? 0.5 : 1;                 // keep the faces clear
    const b = makeBlade(rand, x, lerp(2170, 2300, rand()), lerp(80, 175, rand()) * short, lerp(6, 12, rand()), 0.85);
    b.amp *= 0.6;
    near.push(b);
  }
  for (const x of [-120, 30, 1010, 1840]) near.push(makeFlower(rand, x + lerp(-30, 30, rand()), lerp(2170, 2200, rand()), lerp(16, 24, rand()), 1));
  near.sort((a, b) => a.y - b.y);

  back.forEach(b => !b.flower && paintBlade(ctxBack, b));
  front.forEach(b => !b.flower && paintBlade(ctxFront, b));
  ridge.forEach(b => !b.flower && paintBlade(ctxFront, b));
  near.forEach(b => !b.flower && paintBlade(ctxNear, b));
  return { back, front, ridge, near };
}

function drawItems(ctx, items, view, time, breeze) {
  for (const it of items) {
    const reach = it.flower ? it.r * 2 : it.len + 4;
    if (it.x + reach < view.x0 || it.x - reach > view.x1 || it.y - reach > view.y1 || it.y + reach < view.y0) continue;
    if (it.flower) drawFlower(ctx, it, time, breeze);
    else drawBlade(ctx, it, time, breeze);
  }
}

/* =====================================================================
   THE ENGINE
   ===================================================================== */
export function startOpeningScene(root, { speed = 1, startAt = 0, onComplete } = {}) {
  const $ = sel => root.querySelector(sel);
  const layers = {
    sky: $('[data-layer="sky"]'), clouds: $('[data-layer="clouds"]'),
    sea: $('[data-layer="sea"]'), world: $('[data-layer="world"]'),
  };
  const canvases = { back: $('[data-canvas="back"]'), front: $('[data-canvas="front"]'), near: $('[data-canvas="near"]') };
  const ctx = { back: canvases.back.getContext('2d'), front: canvases.front.getContext('2d'), near: canvases.near.getContext('2d') };
  const title = $('[data-title]'), squiggle = $('[data-squiggle]');
  const fade = $('[data-fade]'), grain = $('[data-grain]');
  const cloudEls = [...root.querySelectorAll('[data-cloud]')];
  const dapples = [...root.querySelectorAll('[data-dapple]')];
  const glints = [...root.querySelectorAll('[data-glint]')];
  const blobs = Object.fromEntries(['coral', 'mauve'].map(name => {
    const el = $(`[data-blob="${name}"]`);
    return [name, { el, body: el.querySelector('[data-body]'), eyes: el.querySelector('[data-eyes]'),
                    look: el.querySelector('[data-look]'), lean: BLOBS[name].lean }];
  }));

  const grass = buildGrass(ctx.back, ctx.front, ctx.near);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let vw, vh, dpr, base, raf, finished = false;
  let t = startAt, life = startAt > 0 ? 3 : 0, playing = startAt > MENU_TIME, last = performance.now();   // jumping ahead skips the fade-in

  function resize() {
    vw = root.clientWidth; vh = root.clientHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    base = Math.max(vw / 1600, vh / 900);                       // fit the 1600x900 "frame" to any screen
    for (const c of Object.values(canvases)) { c.width = vw * dpr; c.height = vh * dpr; }
  }

  // where a layer sits on screen; depth < 1 = far away (moves less), > 1 = close (moves more)
  function view(cam, depth) {
    const z = base * (1 + (cam.z - 1) * depth);
    const cx = ANCHOR.x + (cam.x - ANCHOR.x) * depth;
    const cy = ANCHOR.y + (cam.y - ANCHOR.y) * depth;
    const tx = vw / 2 - cx * z, ty = vh / 2 - cy * z;
    return { z, tx, ty, x0: -tx / z, x1: (vw - tx) / z, y0: -ty / z, y1: (vh - ty) / z };
  }
  const place = (el, v) => { el.style.transform = `translate(${v.tx}px, ${v.ty}px) scale(${v.z})`; };
  const aim = (c, v) => c.setTransform(dpr * v.z, 0, 0, dpr * v.z, dpr * v.tx, dpr * v.ty);

  function setFace(name, cls, on) { blobs[name].el.classList.toggle(cls, on); }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000) * speed;
    last = now;
    life += dt;
    if (playing || t < MENU_TIME) t = playing ? t + dt : Math.min(MENU_TIME, t + dt);

    /* camera, plus a tiny bit of hand-held wobble */
    const cam = cameraAt(t);
    cam.x += (Math.sin(life * 0.37) * 3 + Math.sin(life * 0.83 + 1) * 1.4) / cam.z;
    cam.y += (Math.sin(life * 0.29 + 2) * 2.4 + Math.sin(life * 0.71) * 1.2) / cam.z;

    const breeze = Math.sin(life * 0.42) * 0.6 + Math.sin(life * 0.17 + 1) * 0.4;

    /* DOM layers */
    place(layers.sky, view(cam, 0.85));
    place(layers.clouds, view(cam, 0.78));
    place(layers.sea, view(cam, 0.9));
    const vWorld = view(cam, 1);
    place(layers.world, vWorld);

    /* canvases */
    const W = canvases.back.width, H = canvases.back.height;
    ctx.back.setTransform(1, 0, 0, 1, 0, 0); ctx.back.clearRect(0, 0, W, H);
    aim(ctx.back, vWorld);
    const g = ctx.back.createLinearGradient(0, WORLD.meadowTop, 0, WORLD.h);   // the ground under the grass
    g.addColorStop(0, '#b3ba82'); g.addColorStop(0.15, '#7f9442'); g.addColorStop(0.5, '#4f6a22'); g.addColorStop(1, '#344a16');
    ctx.back.fillStyle = g;
    ctx.back.fillRect(-400, WORLD.meadowTop - 2, WORLD.w + 800, WORLD.h - WORLD.meadowTop + 400);
    drawItems(ctx.back, grass.back, vWorld, life, breeze);

    ctx.front.setTransform(1, 0, 0, 1, 0, 0); ctx.front.clearRect(0, 0, W, H);
    const vRidge = view(cam, 1.12);
    aim(ctx.front, vRidge); drawItems(ctx.front, grass.ridge, vRidge, life, breeze);
    aim(ctx.front, vWorld); drawItems(ctx.front, grass.front, vWorld, life, breeze);

    ctx.near.setTransform(1, 0, 0, 1, 0, 0); ctx.near.clearRect(0, 0, W, H);
    const vNear = view(cam, 1.35);
    aim(ctx.near, vNear); drawItems(ctx.near, grass.near, vNear, life, breeze);

    /* clouds drift, sun glitters on the sea, leaf shadows sway */
    cloudEls.forEach((el, i) => { el.style.translate = `${(life * (4 + i * 1.3)) % 400}px 0`; });
    glints.forEach((el, i) => { el.style.opacity = 0.25 + 0.75 * Math.max(0, Math.sin(life * (2.2 + i * 0.37) + i * 1.7)); });
    dapples.forEach((el, i) => {
      el.style.translate = `${Math.sin(life * 0.5 + i) * 10 + breeze * 6}px ${Math.cos(life * 0.43 + i * 2) * 7}px`;
    });

    /* title writes itself */
    const w = clamp((t - TITLE_WRITE[0]) / (TITLE_WRITE[1] - TITLE_WRITE[0]), 0, 1);
    title.style.clipPath = `inset(-30% ${lerp(100, -5, ease.sine(w))}% -30% -5%)`;
    squiggle.style.clipPath = `inset(-50% ${lerp(100, -5, clamp((t - TITLE_WRITE[1]) / 0.6, 0, 1))}% -50% -5%)`;

    /* the blobs */
    // story beats: coral looks up at mauve -> blinks -> nuzzles -> they giggle -> mauve looks down at coral
    const laughing = t > 17.9 && t < 19.4;
    setFace('mauve', 'is-happy', t < 19.4);
    setFace('mauve', 'is-laugh', laughing);
    setFace('coral', 'is-happy', laughing || t > 19.4);
    setFace('coral', 'is-laugh', laughing);

    const laughT = t - 17.9;
    const hop = laughing ? Math.abs(Math.sin(laughT * Math.PI * 5)) * Math.exp(-laughT * 1.7) * 7 : 0;
    const nuzzle = Math.pow(bump(t, 16.7, 0.75), 2) * 5;          // coral leans in a bit more

    for (const [name, b] of Object.entries(blobs)) {
      const phase = name === 'coral' ? 0 : 1.8;
      const breathe = Math.sin(life * 2 + phase) * 0.014;
      const squash = hop * 0.006;
      const lean = b.lean + (name === 'coral' ? nuzzle : -nuzzle * 0.3) + Math.sin(life * 0.9 + phase) * 0.6;
      b.body.style.transform =
        `translateY(${-hop * (name === 'coral' ? 1 : 0.7)}px) rotate(${lean}deg) scale(${1 + breathe + squash}, ${1 - breathe - squash})`;
    }

    // blinks (eyes squeeze shut for a moment)
    const blinkCoral = Math.max(bump(t, 15.6, 0.1), bump(t, 16.1, 0.1));
    const blinkMauve = bump(t, 20.4, 0.1);
    blobs.coral.eyes.style.transform = `scaleY(${1 - 0.9 * blinkCoral})`;
    blobs.mauve.eyes.style.transform = `scaleY(${1 - 0.9 * blinkMauve})`;
    // where they look (in their own drawing units)
    blobs.coral.look.style.transform = `translate(${lerp(1, 3, clamp(t - 14, 0, 1))}px, ${lerp(0, -2.5, clamp(t - 14, 0, 1))}px)`;
    blobs.mauve.look.style.transform = 'translate(-3px, 2px)';

    /* fade in from black, film grain jitter */
    fade.style.opacity = 1 - ease.sine(clamp(life / 2.2, 0, 1));
    grain.style.backgroundPosition = `${(Math.random() * 128) | 0}px ${(Math.random() * 128) | 0}px`;

    if (!finished && t >= END_TIME) { finished = true; onComplete?.(); }
    raf = requestAnimationFrame(frame);
  }

  function start() {                       // the menu's Start button calls this
    if (reduceMotion) return skip();
    playing = true;
  }

  function skip() {
    playing = true;
    t = Math.max(t, END_TIME);
    if (!finished) { finished = true; onComplete?.(); }
  }

  // film grain texture (random noise tile)
  const n = document.createElement('canvas'); n.width = n.height = 128;
  const nc = n.getContext('2d'), img = nc.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  nc.putImageData(img, 0, 0);
  grain.style.backgroundImage = `url(${n.toDataURL()})`;

  resize();
  window.addEventListener('resize', resize);
  raf = requestAnimationFrame(frame);

  return {
    start,
    skip,
    destroy() { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); },
  };
}
