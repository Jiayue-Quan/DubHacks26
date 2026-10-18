
import { blobPath } from '../opening/sceneEngine';
import { DEFAULT_HANDS } from '../blob/BlobArt';

/* ---------------- TIMELINE (seconds) ---------------- */
const T = {
  // act 1
  bump: 5.0, bookLands: 6.1, slowStart: 7.0, touch: 9.6, lookUp: 10.2, slowEnd: 11.6,
  handBack: 12.9, hearts: 13.4, flash: 15.5,
  // act 2 (polaroid i drops in at montage[i])
  montageStart: 16.0, montage: [16.5, 19.7, 22.9, 26.1], montageEnd: 30.0,
  // act 3
  textsStart: 30.0, phoneUp: 30.3, uneasy: 44.6, fadeOut: 46.6, end: 47.8,
};
export const TIMELINE = T;

/* the texts: who sent it, what it says, when it arrives (absolute seconds) */
export const MESSAGES = [
  { from: 'mango',  at: 31.4, text: 'good morning beautiful' },
  { from: 'mango',  at: 33.0, text: "i literally can't stop thinking about you" },
  { from: 'violet', at: 34.5, text: 'haha same' },
  { from: 'mango',  at: 35.6, text: "i've never felt like this with anyone. ever." },
  { from: 'mango',  at: 36.8, text: "you're the only one who really gets me" },
  { from: 'mango',  at: 37.8, text: 'i told my mom about you 🥹' },
  { from: 'mango',  at: 38.8, text: 'we should move in together' },
  { from: 'violet', at: 40.0, text: "isn't it kind of soon? 😅" },
  { from: 'mango',  at: 40.9, text: 'where you know you know <3' },
  { from: 'mango',  at: 41.5, text: "you're my everything" },
  { from: 'mango',  at: 41.9, text: "i don't need anyone else" },
  { from: 'mango',  at: 42.2, text: 'just you' },
  { from: 'mango',  at: 42.45, text: 'only you' },
  { from: 'mango',  at: 42.7, text: '♡♡♡' },
  { from: 'mango',  at: T.uneasy, text: 'who were you texting earlier?' },
];

/* ---------------- act 1 world (a 1600 x 900 frame) ---------------- */
const GROUND = 724;                                       // where blob bottoms touch the path
const SIZE = { violet: { w: 230, h: 192 }, mango: { w: 200, h: 167 } };
const ANCHOR = { x: 800, y: 450 };
const CAM = [
  { t: 0,    x: 800, y: 470, z: 1.0 },
  { t: 5.0,  x: 805, y: 480, z: 1.06 },
  { t: 7.3,  x: 805, y: 500, z: 1.12 },
  { t: 9.8,  x: 802, y: 618, z: 2.05 },   // push in on the hands + book
  { t: 11.6, x: 802, y: 614, z: 2.12 },
  { t: 13.2, x: 805, y: 560, z: 1.55 },
  { t: 99,   x: 805, y: 556, z: 1.6 },
];

/* ---------------- helpers ---------------- */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const prog = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const smooth = k => k * k * (3 - 2 * k);
const easeOut = k => 1 - Math.pow(1 - k, 3);
const bump = (t, at, width) => Math.max(0, 1 - Math.abs(t - at) / width);
const rand = (a, b) => a + Math.random() * (b - a);

function camAt(t) {
  let i = 0;
  while (i < CAM.length - 2 && t >= CAM[i + 1].t) i++;
  const a = CAM[i], b = CAM[i + 1];
  const k = smooth(prog(t, a.t, b.t));
  return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k) };
}

/* =====================================================================
   THE ENGINE
   ===================================================================== */
export function startExposition(root, { speed = 1, startAt = 0, onComplete } = {}) {
  const $ = s => root.querySelector(s);
  const acts = { meet: $('[data-act="meet"]'), montage: $('[data-act="montage"]'), texts: $('[data-act="texts"]') };
  const layers = ['sky', 'far', 'mid', 'world', 'fore'].reduce((o, k) => ({ ...o, [k]: $(`[data-layer="${k}"]`) }), {});
  const fxCanvas = $('[data-canvas="fx"]'), fx = fxCanvas.getContext('2d');
  const grassCanvas = $('[data-canvas="grass"]'), gctx = grassCanvas.getContext('2d');
  const caption = $('[data-caption]'), flash = $('[data-flash]'), fade = $('[data-fade]'), bloom = $('[data-bloom]');
  const book = $('[data-book]');
  const polaroids = [...root.querySelectorAll('[data-polaroid]')];
  const phone = $('[data-phone]'), chat = $('[data-chat]'), chatList = $('[data-chat-list]'), typing = $('[data-typing]');
  const msgEls = [...root.querySelectorAll('[data-msg]')];
  const bedBlob = $('[data-bed-blob]'), phoneGlow = $('[data-phone-glow]');

  const blob = name => {
    const el = $(`[data-blob="${name}"]`);
    return {
      el, body: el.querySelector('[data-body]'), art: el.querySelector('[data-art]'),
      shapes: [...el.querySelectorAll('[data-shape]')], eyes: el.querySelector('[data-eyes]'),
      look: el.querySelector('[data-look]'), blush: el.querySelector('[data-blush]'), ...SIZE[name],
    };
  };
  const violet = blob('violet'), mango = blob('mango');
  const bed = {
    el: bedBlob, shapes: [...bedBlob.querySelectorAll('[data-shape]')], eyes: bedBlob.querySelector('[data-eyes]'),
    look: bedBlob.querySelector('[data-look]'), blush: bedBlob.querySelector('[data-blush]'),
  };

  let vw, vh, dpr, base, raf, finished = false;
  let t = startAt, last = performance.now(), life = 0, slowClock = 0;
  const petals = [], sparkles = [], hearts = [];
  let burstDone = false, sparkDone = false, heartsDone = false;

  /* grass fringe along the path (so blobs sit IN the grass, not on top) */
  const blades = [];
  for (let i = 0; i < 520; i++) {
    const y = GROUND + rand(-8, 30);
    blades.push({
      x: rand(-200, 1800), y, len: rand(14, 38) * (0.8 + (y - GROUND) / 60), w: rand(1.4, 3),
      ang: -Math.PI / 2 + rand(-0.5, 0.5) + 0.12, sp: rand(0.7, 1.3),
      c: `hsl(${rand(78, 100)}, ${rand(38, 55)}%, ${rand(34, 52)}%)`,
    });
  }
  blades.sort((a, b) => a.y - b.y);

  for (let i = 0; i < 70; i++) petals.push(newPetal(true));
  function newPetal(anywhere) {
    return {
      x: rand(-0.1, 1.1), y: anywhere ? rand(-0.1, 1.1) : rand(-0.25, -0.05),
      s: rand(5, 12), rot: rand(0, 6.28), spin: rand(-2, 2), vx: rand(0.01, 0.05), vy: rand(0.035, 0.08),
      ph: rand(0, 6.28), hue: rand(338, 352), light: rand(84, 92),
    };
  }

  function resize() {
    vw = root.clientWidth; vh = root.clientHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    base = Math.max(vw / 1600, vh / 900);
    for (const c of [fxCanvas, grassCanvas]) { c.width = vw * dpr; c.height = vh * dpr; }
  }
  function view(cam, depth) {
    const z = base * (1 + (cam.z - 1) * depth);
    const cx = ANCHOR.x + (cam.x - ANCHOR.x) * depth, cy = ANCHOR.y + (cam.y - ANCHOR.y) * depth;
    return { z, tx: vw / 2 - cx * z, ty: vh / 2 - cy * z };
  }
  const place = (el, v) => { el.style.transform = `translate(${v.tx}px, ${v.ty}px) scale(${v.z})`; };
  const toScreen = (v, x, y) => [v.tx + x * v.z, v.ty + y * v.z];

  function setFace(b, faces) {
    for (const f of ['is-happy', 'is-laugh', 'is-surprised', 'is-unsure']) b.el.classList.toggle(f, faces.includes(f));
  }

  /* place a walking blob: x = center, facing = 1 (right) / -1 (left) */
  function placeBlob(b, x, facing, { hop = 0, squash = 0, lean = 0, breathe = 0 } = {}) {
    b.el.style.transform = `translate(${x - b.w / 2}px, ${GROUND - b.h * 0.95 - hop}px)`;
    b.art.style.transform = `scaleX(${facing})`;
    const sx = 1 + squash + breathe, sy = 1 - squash - breathe;
    b.body.style.transform = `rotate(${lean}deg) scale(${sx}, ${sy})`;   // (inside the flip, so + always leans forward)
  }
  const walk = (dist, size) => Math.abs(Math.sin((dist / size) * Math.PI)) * 16;   // little hops

  // where a blob's front hand is in the world (for holding the book)
  const frontHand = (b, x, facing, lift, hop = 0) =>
    [x + facing * b.w * (0.5 + lift * 0.001), GROUND - b.h * (0.32 + lift * 0.004) - hop];

  /* =================================================================== */
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000) * speed;
    last = now; t += dt; life += dt;
    const slow = t > T.slowStart && t < T.slowEnd ? lerp(1, 0.18, smooth(prog(t, T.slowStart, T.slowStart + 0.8)) * (1 - smooth(prog(t, T.slowEnd - 0.8, T.slowEnd)))) : 1;
    slowClock += dt * slow;

    const act = t < T.montageStart ? 'meet' : t < T.textsStart ? 'montage' : 'texts';
    for (const [k, el] of Object.entries(acts)) el.classList.toggle('is-active', k === act);

    if (act === 'meet') actMeet(dt * slow);
    if (act === 'montage') actMontage();
    if (act === 'texts') actTexts();

    // white flash between act 1 and 2, black fades at the start and end
    flash.style.opacity = Math.max(bump(t, T.flash + 0.5, 0.6) * 1.0, 0) + bump(t, T.textsStart, 0.5) * 0.6;
    fade.style.opacity = Math.max(1 - prog(t, 0, 1.2), smooth(prog(t, T.fadeOut, T.fadeOut + 1)));

    if (!finished && t >= T.end) { finished = true; onComplete?.(); }
    raf = requestAnimationFrame(frame);
  }

  /* ---------------- ACT 1: the meet-cute ---------------- */
  function actMeet(sdt) {
    const cam = camAt(t);
    cam.x += Math.sin(life * 0.4) * 3 / cam.z;
    cam.y += Math.sin(life * 0.31 + 1) * 2 / cam.z;
    // heartbeat when their hands touch
    const beat = bump(t, T.touch + 0.35, 0.18) + bump(t, T.touch + 0.85, 0.18) * 0.8;
    cam.z *= 1 + beat * 0.025;

    place(layers.sky, view(cam, 0.25));
    place(layers.far, view(cam, 0.55));
    place(layers.mid, view(cam, 0.8));
    const vW = view(cam, 1);
    place(layers.world, vW);
    place(layers.fore, view(cam, 1.35));

    caption.style.opacity = bump(t, 2.0, 1.6) * 1.2;
    bloom.style.opacity = 0.15 + smooth(prog(t, T.slowStart, T.touch)) * 0.55 * (1 - smooth(prog(t, T.slowEnd, T.slowEnd + 1.5)));

    /* --- where everyone is --- */
    const walkK = prog(t, 0.4, T.bump);
    let vx = lerp(1820, 905, walkK), mx = lerp(-260, 700, walkK);
    let vHop = walkK < 1 ? walk(1820 - vx, 70) : 0, mHop = walkK < 1 ? walk(mx + 260, 62) : 0;
    const recoil = easeOut(prog(t, T.bump, T.bump + 0.5));
    if (t > T.bump) { vx = 905 + recoil * 58; mx = 700 - recoil * 52; }
    // step back in toward each other while reaching for the book
    const reach = smooth(prog(t, 7.3, T.touch));
    vx -= reach * 14; mx += reach * 12;
    const squash = t > T.bump ? Math.sin(prog(t, T.bump, T.bump + 0.6) * Math.PI * 3) * Math.exp(-(t - T.bump) * 5) * 0.12 : 0;
    const lean = reach * 5 * (1 - smooth(prog(t, T.slowEnd, T.handBack)));    // bend down to the book
    const breatheV = Math.sin(life * 2) * 0.012, breatheM = Math.sin(life * 2 + 1.8) * 0.012;

    placeBlob(violet, vx, -1, { hop: vHop, squash, lean, breathe: breatheV });
    placeBlob(mango, mx, 1, { hop: mHop, squash: squash * 0.9, lean, breathe: breatheM });

    /* --- faces --- */
    const surprised = t > T.bump && t < T.bump + 1.6;
    const happyEnd = t > T.handBack + 0.3;
    setFace(violet, surprised ? ['is-surprised'] : happyEnd ? ['is-happy'] : []);
    setFace(mango, surprised ? ['is-surprised'] : t > T.hearts ? ['is-happy', 'is-laugh'] : happyEnd ? ['is-happy'] : []);
    // where they look: violet down at her book, mango up at the petals; then at the book; then at each other
    const lookDown = t > T.bump + 1.0 && t < T.lookUp;
    violet.look.style.transform = t < T.bump ? 'translate(2px, 4px)' : lookDown ? 'translate(1px, 5px)' : 'translate(4px, -1px)';
    mango.look.style.transform = t < T.bump ? 'translate(1px, -5px)' : lookDown ? 'translate(1px, 5px)' : 'translate(4px, -1px)';
    const blush = 1 + smooth(prog(t, T.lookUp, T.lookUp + 0.8)) * 0.9;
    violet.blush.style.opacity = blush; mango.blush.style.opacity = blush;
    // blinks
    const blinkV = bump(t, 3.2, 0.08) + bump(t, T.lookUp + 0.9, 0.12);
    const blinkM = bump(t, 2.4, 0.08) + bump(t, T.lookUp + 1.1, 0.12);
    violet.eyes.style.transform = `scaleY(${1 - 0.9 * blinkV})`;
    mango.eyes.style.transform = `scaleY(${1 - 0.9 * blinkM})`;

    /* --- hands --- */
    const idle = i => Math.sin(life * 1.4 + i * 2) * 4;
    const holdUp = 1 - prog(t, T.bump, T.bump + 0.15);                 // violet holds the book up to read
    const reachDown = reach * (1 - smooth(prog(t, T.slowEnd, T.slowEnd + 0.8)));
    const offer = smooth(prog(t, T.slowEnd, T.handBack)) * (1 - smooth(prog(t, T.handBack, T.handBack + 0.6)));
    const hug = smooth(prog(t, T.handBack, T.handBack + 0.6));
    const vLift = [idle(0) + hug * 30, idle(1) + holdUp * 48 + reachDown * 20 + offer * 10 + hug * 55];
    const mLift = [idle(2) + (surprised ? 25 : 0), idle(3) + reachDown * 20 + offer * 38 + (t > T.hearts ? Math.abs(Math.sin(life * 9)) * 18 * Math.exp(-(t - T.hearts) * 0.8) : 0)];
    // while reaching for the book the front hand stretches out low and long, so their hands meet on it
    const reachHands = DEFAULT_HANDS.map((h, i) => i === 1
      ? { ...h, y: h.y - reachDown * 10, len: h.len + reachDown * 30 + offer * 6, w: h.w - reachDown * 3 }
      : h);
    violet.shapes.forEach(el => el.setAttribute('d', blobPath(reachHands, vLift)));
    mango.shapes.forEach(el => el.setAttribute('d', blobPath(reachHands, mLift)));

    /* --- the book --- */
    let bx, by, brot;
    const vHand = [vx - violet.w * 0.42, GROUND - violet.h * 0.62 - vHop];
    if (t < T.bump) { [bx, by] = vHand; brot = -8; }
    else if (t < T.bookLands) {                                         // flying!
      const k = prog(t, T.bump, T.bookLands);
      bx = lerp(vHand[0], 806, k); by = lerp(vHand[1], GROUND - 24, k) - Math.sin(k * Math.PI) * 170;
      brot = -8 + k * 534;
    } else if (t < T.slowEnd) {                                         // lying on the path
      const b2 = Math.sin(prog(t, T.bookLands, T.bookLands + 0.3) * Math.PI) * 12;
      bx = 806; by = GROUND - 24 - b2; brot = 166;
    } else if (t < T.handBack) {                                        // mango picks it up and offers it
      const k = smooth(prog(t, T.slowEnd, T.handBack));
      bx = lerp(806, mx + 118, k); by = lerp(GROUND - 24, GROUND - 62, k); brot = lerp(166, 4, k);   // resting on mango's hand
    } else {                                                            // violet hugs it
      const k = smooth(prog(t, T.handBack, T.handBack + 0.6));
      bx = lerp(mx + 118, vx - violet.w * 0.32, k); by = lerp(GROUND - 62, GROUND - violet.h * 0.42, k); brot = lerp(4, -6, k);
    }
    book.style.transform = `translate(${bx - 30}px, ${by - 22}px) rotate(${brot}deg)`;
    // the book is in front while held/flying, and UNDER their hands while it's on the path or being handed over
    book.style.zIndex = t < T.bookLands || t > T.handBack + 0.3 ? 3 : 1;

    /* --- grass fringe (world space) --- */
    gctx.setTransform(1, 0, 0, 1, 0, 0);
    gctx.clearRect(0, 0, grassCanvas.width, grassCanvas.height);
    gctx.setTransform(dpr * vW.z, 0, 0, dpr * vW.z, dpr * vW.tx, dpr * vW.ty);
    const breeze = Math.sin(life * 0.5) * 0.06;
    for (const b of blades) {
      const a = b.ang + Math.sin(life * b.sp + b.x * 0.01) * 0.05 + breeze;
      const tx = b.x + Math.cos(a) * b.len, ty = b.y + Math.sin(a) * b.len;
      gctx.beginPath();
      gctx.moveTo(b.x - b.w, b.y);
      gctx.quadraticCurveTo(b.x + Math.cos(a) * b.len * 0.5 - b.w * 0.4, b.y + Math.sin(a) * b.len * 0.5, tx, ty);
      gctx.quadraticCurveTo(b.x + Math.cos(a) * b.len * 0.5 + b.w * 0.4, b.y + Math.sin(a) * b.len * 0.5, b.x + b.w, b.y);
      gctx.fillStyle = b.c; gctx.fill();
    }

    /* --- petals, sparkles, hearts (screen space) --- */
    fx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fx.clearRect(0, 0, vw, vh);
    if (!burstDone && t > T.bump) {
      burstDone = true;
      const [sx, sy] = toScreen(vW, 805, GROUND - 120);
      for (let i = 0; i < 26; i++) petals.push({ ...newPetal(true), x: sx / vw, y: sy / vh, vx: rand(-0.25, 0.25), vy: rand(-0.3, -0.05), burst: true });
    }
    for (const p of petals) {
      p.vy += p.burst ? sdt * 0.35 : 0;
      if (p.burst) { p.vx *= 0.98; p.vy = Math.min(p.vy, 0.09); }
      p.x += (p.vx + Math.sin(slowClock * 1.3 + p.ph) * 0.02) * sdt;
      p.y += p.vy * sdt;
      p.rot += p.spin * sdt;
      if (p.y > 1.15 || p.x > 1.2 || p.x < -0.2) Object.assign(p, newPetal(false), { burst: false });
      drawPetal(p.x * vw, p.y * vh, p.s * base * 1.4, p.rot, p.hue, p.light);
    }
    if (!sparkDone && t > T.touch) {
      sparkDone = true;
      const [sx, sy] = toScreen(vW, 806, GROUND - 22);
      for (let i = 0; i < 18; i++) {
        const a = rand(0, 6.28), d = rand(30, 140) * base;
        sparkles.push({ x: sx + Math.cos(a) * d, y: sy + Math.sin(a) * d * 0.7 - 40 * base, s: rand(5, 13) * base, born: t + rand(0, 0.6) });
      }
    }
    for (const s of sparkles) {
      const age = t - s.born;
      if (age < 0 || age > 1.6) continue;
      const k = Math.sin((age / 1.6) * Math.PI);
      drawSparkle(s.x, s.y - age * 18 * base, s.s * k, k);
    }
    if (!heartsDone && t > T.hearts) {
      heartsDone = true;
      const [sx, sy] = toScreen(vW, (vx + mx) / 2, GROUND - 190);
      for (let i = 0; i < 9; i++) hearts.push({ x: sx + rand(-90, 90) * base, y: sy + rand(-20, 30) * base, s: rand(8, 15) * base, born: t + i * 0.18, ph: rand(0, 6) });
    }
    for (const h of hearts) {
      const age = t - h.born;
      if (age < 0 || age > 2.2) continue;
      const k = Math.min(1, age * 3) * (1 - prog(age, 1.4, 2.2));
      drawHeart(h.x + Math.sin(age * 3 + h.ph) * 10 * base, h.y - age * 60 * base, h.s, k);
    }
  }

  function drawPetal(x, y, s, rot, hue, light) {
    fx.save(); fx.translate(x, y); fx.rotate(rot);
    fx.beginPath();
    fx.moveTo(0, -s);
    fx.bezierCurveTo(s * 0.9, -s * 0.7, s * 0.7, s * 0.6, 0, s);
    fx.bezierCurveTo(-s * 0.7, s * 0.6, -s * 0.9, -s * 0.7, 0, -s);
    fx.fillStyle = `hsla(${hue}, 80%, ${light}%, 0.9)`;
    fx.fill();
    fx.restore();
  }
  function drawSparkle(x, y, s, a) {
    fx.save(); fx.translate(x, y); fx.globalAlpha = a;
    fx.beginPath();
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2;
      fx.lineTo(Math.cos(ang) * s, Math.sin(ang) * s);
      fx.lineTo(Math.cos(ang + Math.PI / 4) * s * 0.28, Math.sin(ang + Math.PI / 4) * s * 0.28);
    }
    fx.closePath();
    fx.fillStyle = '#fff8e6'; fx.shadowColor = '#ffe2b0'; fx.shadowBlur = 12;
    fx.fill();
    fx.restore();
  }
  function drawHeart(x, y, s, a) {
    fx.save(); fx.translate(x, y); fx.globalAlpha = a;
    fx.beginPath();
    fx.moveTo(0, s * 0.35);
    fx.bezierCurveTo(-s * 1.1, -s * 0.4, -s * 0.45, -s * 1.15, 0, -s * 0.45);
    fx.bezierCurveTo(s * 0.45, -s * 1.15, s * 1.1, -s * 0.4, 0, s * 0.35);
    fx.fillStyle = '#ff8fa3'; fx.fill();
    fx.restore();
  }

  /* ---------------- ACT 2: montage ---------------- */
  function actMontage() {
    polaroids.forEach((p, i) => {
      const at = T.montage[i];
      p.classList.toggle('is-in', t >= at);
      p.classList.toggle('is-under', i < T.montage.length - 1 && t >= T.montage[i + 1]);
    });
    acts.montage.classList.toggle('is-leaving', t > T.montageEnd - 0.7);
  }

  /* ---------------- ACT 3: the texts ---------------- */
  let shownCount = -1;
  function actTexts() {
    phone.classList.toggle('is-up', t >= T.phoneUp);
    // which messages have arrived
    let shown = 0;
    msgEls.forEach((el, i) => {
      const on = t >= MESSAGES[i].at;
      el.classList.toggle('is-in', on);
      if (on) shown = i + 1;
    });
    // "typing..." before each of mango's messages (not during the rapid burst)
    const next = MESSAGES[shown];
    const typingOn = next && next.from === 'mango' && next.at - t < 0.9 && next.at - t > 0 && (next.at - (MESSAGES[shown - 1]?.at ?? 0)) > 0.6;
    typing.classList.toggle('is-on', !!typingOn);
    // scroll the chat so the newest message is visible
    if (shown !== shownCount) {
      shownCount = shown;
      requestAnimationFrame(() => {
        const overflow = chatList.scrollHeight - chat.clientHeight;
        chatList.style.transform = `translateY(${-Math.max(0, overflow)}px)`;
      });
    }
    // buzz on each of mango's messages
    const buzz = MESSAGES.reduce((m, msg) => (msg.from === 'mango' ? Math.max(m, bump(t, msg.at + 0.08, 0.12)) : m), 0);
    phone.style.setProperty('--buzz', `${Math.sin(life * 90) * buzz * 3}px`);
    phoneGlow.style.opacity = 0.55 + buzz * 0.4;
    bedBlob.style.setProperty('--buzz-glow', buzz);   // her little phone lights up too

    // violet's face in bed: giddy -> unsure about moving in -> flustered by the flood -> uneasy
    const uneasy = t >= T.uneasy + 0.4;
    acts.texts.classList.toggle('is-uneasy', t >= T.uneasy);   // the room cools and dims a little
    const unsure = t >= 40 && t < 40.9;
    const flood = t >= 41.5 && t < T.uneasy;
    bed.el.classList.toggle('is-happy', !uneasy && !unsure && !flood);
    bed.el.classList.toggle('is-laugh', t > 33.2 && t < 34.6);
    bed.el.classList.toggle('is-surprised', flood);
    bed.el.classList.toggle('is-unsure', uneasy || unsure);
    bed.blush.style.opacity = uneasy ? 0.25 : flood ? 1.7 : 1.2;
    bed.look.style.transform = 'translate(4px, -3px)';
    bed.eyes.style.transform = `scaleY(${1 - 0.9 * (bump(t, 37.2, 0.1) + bump(t, T.uneasy + 1.4, 0.12))})`;
    const lift = uneasy ? 0 : Math.sin(life * 1.6) * 4 + (t > 33.2 && t < 34.6 ? Math.abs(Math.sin(life * 10)) * 14 : 0);
    bed.shapes.forEach(el => el.setAttribute('d', blobPath(DEFAULT_HANDS, [lift, 60 + lift])));
  }

  /* film grain */
  const grain = $('[data-grain]');
  const n = document.createElement('canvas'); n.width = n.height = 128;
  const nc = n.getContext('2d'), img = nc.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  nc.putImageData(img, 0, 0);
  grain.style.backgroundImage = `url(${n.toDataURL()})`;
  const grainTick = setInterval(() => { grain.style.backgroundPosition = `${(Math.random() * 128) | 0}px ${(Math.random() * 128) | 0}px`; }, 80);

  function skip() {
    t = Math.max(t, T.end);
    if (!finished) { finished = true; onComplete?.(); }
  }

  resize();
  window.addEventListener('resize', resize);
  raf = requestAnimationFrame(frame);
  return {
    skip,
    destroy() { cancelAnimationFrame(raf); clearInterval(grainTick); window.removeEventListener('resize', resize); },
  };
}
