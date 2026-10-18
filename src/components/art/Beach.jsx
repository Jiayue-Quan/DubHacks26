import { useEffect, useRef } from 'react';
import BlobArt, { DEFAULT_HANDS } from '../blob/BlobArt';
import { blobPath } from '../opening/sceneEngine';
import './Beach.css';

/*
  <Beach mood="birthday" caption="Violet's birthday" line={3} />

  Scene art only (no dialogue). Violet's birthday: the two of them in a little rowboat
  off the beach, late afternoon, a balloon tied to the boat. The colors are a bit muted.
  Everything keeps gently moving: waves, the boat bobbing, clouds, birds, the sun glittering on the water.

  mood (set per scene in the JSON with "mood"):
    "birthday"  line by line: happy -> Violet blushes -> hearts float over Mango -> Mango's smile drops
                at "friends" -> suspicious, angry -> "You're a mistake." (Violet is crushed, the sky dims)
    "push"      Mango gets angry, then shoves Violet out of the boat into the water (second-to-last line);
                she splashes and struggles; the balloon floats away
    "rescue"    Mango pulls Violet back in, soaking wet and shaking -> lies about it -> on the last line
                ("I love you so much") hugs her while everything turns dark and the waves get huge
    "calm"      just the two of them, happy, in the boat

  caption: optional card shown for a moment when the scene starts ("timeSkip" in the JSON)
  line:    how many dialogue lines are showing; the big moments are timed to the lines (numbers start at 0)
*/

const MOODS = ['birthday', 'push', 'rescue', 'calm'];
const FACES = ['is-happy', 'is-laugh', 'is-unsure', 'is-annoyed', 'is-sad', 'is-surprised', 'is-tired'];

const W = 1600, H = 900;
const WL = 640;                                   // waterline
const BOAT = { x: 930, w: 600 };                  // the rowboat (center x)
const VIOLET = { x: 812, ground: 594, w: 206, h: 172 };
const MANGO = { x: 1060, ground: 594, w: 218, h: 182 };
const WATER = { dx: -350, dy: 128 };              // where violet ends up after the push (offset)
const CAM = {
  wide:  { x: 800, y: 470, z: 1.0 },
  boat:  { x: 935, y: 520, z: 1.36 },
  close: { x: 950, y: 525, z: 1.55 },             // "You're a mistake."
  push:  { x: 790, y: 560, z: 1.18 },
  storm: { x: 880, y: 560, z: 1.12 },
};
const CAPTION_TIME = 2.6;
const N_DROPS = 16, N_BUBBLES = 6, N_HEARTS = 5;

function pose(mood, s, hasCaption, at) {
  switch (mood) {
    case 'birthday': {
      const blush = at(3) > 0;                       // "That's a little dramatic."
      const hearts = at(4);                          // "...hopelessly in love with you... <3"
      const drop = at(8) > 0;                        // "Oh. With your friends?"  (smile goes bye-bye)
      const sus = at(10) > 0;                        // "You have time to spend with them, but not with me?"
      const mistake = at(18) > 0;                    // "You're a mistake."
      const sc = hasCaption ? s - CAPTION_TIME : s;
      let violet = ['is-happy'], vLook = 'at';
      if (at(10) > 0) violet = at(10) < 1.6 ? ['is-surprised'] : ['is-unsure'];
      if (at(13) > 0) violet = ['is-sad'];
      if (at(15) > 0) violet = ['is-annoyed'];
      if (at(16) > 0) violet = ['is-unsure'];
      if (mistake) { violet = ['is-sad']; vLook = 'down'; }
      if (at(5) > 0 && at(7) < 0) vLook = 'around';   // looking around the beach
      let mango = ['is-happy'], mLook = 'at';
      if (drop) mango = [];
      if (sus) mango = ['is-annoyed'];
      if (at(14) > 0 && at(15) < 0) mLook = 'away';     // "…"
      return {
        cam: sc < 2.4 ? 'wide' : mistake ? 'close' : 'boat',
        violet, violetLook: vLook, violetBlush: blush && !drop ? 1.5 : 0.4,
        mango, mangoLook: mLook, mangoBlush: hearts > 0 && !drop ? 1.2 : 0.3,
        hearts: hearts > 0 && hearts < 4 ? hearts : null,
        mx: sus ? -14 : 0, lean: sus ? -3 : 0,
        hop: at(12) > 0 && at(12) < 1.4 ? Math.abs(Math.sin(s * 8)) * 4 : 0,
        mangoHand: at(16) > 0.2 && at(16) < 2.6 ? 40 + Math.sin(s * 6) * 30 : null,
        shrink: mistake ? Math.min(0.09, at(18) * 0.06) : 0,
        gloom: mistake ? 0.5 : sus ? 0.22 : drop ? 0.08 : 0,
      };
    }
    case 'push': {
      const P = at(1) - 1.2;                         // starts during the last angry line, splash right before "Help–"
      const lunge = P > 0 && P < 0.5;
      const after = P > 0.95;
      return {
        cam: 'push',
        violet: P < 0 ? ['is-sad'] : ['is-surprised'], violetLook: P < 0 ? 'at' : 'down', violetBlush: 0.2,
        mango: after ? ['is-unsure'] : ['is-annoyed'], mangoLook: after ? 'down' : 'at',
        hop: P < 0 && at(0) > 0 ? Math.abs(Math.sin(s * 7)) * 4 : 0,
        mx: lunge ? -60 * Math.sin(P / 0.5 * Math.PI) : 0, lean: lunge ? -8 : 0,
        mangoHand: lunge ? 105 : P < 0 && at(0) > 0.3 ? 30 + Math.sin(s * 6) * 30 : null,
        push: P > 0 ? P : null,
        balloonFree: P > 0.3,
        shake: Math.max(0, 1 - Math.abs(P - 1.0) / 0.25),
        gloom: 0.55,
      };
    }
    case 'rescue': {
      const pull = s < 1.9;                          // mango pulls her back in
      const hug = at(8);                             // "Don't say that... I love you so much."
      let mango = ['is-sad'], mLook = 'at';
      if (at(2) > 0) { mango = ['is-unsure']; mLook = 'away'; }   // "It was the waves."
      if (at(3) > 0) { mango = ['is-happy']; mLook = 'at'; }      // "I was joking."
      if (at(5) > 0) mango = ['is-annoyed'];                        // "I got you out, didn't I?"
      if (hug > 0) { mango = ['is-sad']; mLook = 'at'; }
      let violet = ['is-sad', 'is-tired'], vLook = 'down';
      if (at(4) > 0 && at(6) < 0) vLook = 'at';                    // "You pushed me."
      return {
        cam: hug > 1 ? 'storm' : 'boat',
        inWater: s < 0.25, wet: true, shiver: true,
        violet, violetLook: vLook, violetBlush: 0.15,
        mango, mangoLook: pull ? 'down' : mLook,
        mx: pull ? -40 : hug > 0 ? -50 : 0, lean: pull ? -10 : hug > 0 ? 8 : 0,
        mangoHand: pull ? 110 : null,
        drape: hug > 0,
        shrink: at(6) > 0 ? 0.07 : 0.03,
        balloonFree: true,
        gloom: 0.55,
        storm: hug > 0.6 ? Math.min(1, (hug - 0.6) / 3.5) : 0,
      };
    }
    default:
      return { cam: 'boat', violet: ['is-happy'], violetLook: 'at', violetBlush: 1, mango: ['is-happy'], mangoLook: 'at', mangoBlush: 1 };
  }
}

const LOOK = { at: 'translate(4px, -1px)', down: 'translate(1px, 5px)', away: 'translate(-2px, 3px)' };

export default function Beach({ mood = 'birthday', caption, line }) {
  const root = useRef(null);
  const moodRef = useRef(mood);
  moodRef.current = MOODS.includes(mood) ? mood : 'birthday';
  const captionRef = useRef(caption);
  captionRef.current = caption;
  const lineRef = useRef(line);
  lineRef.current = line;

  useEffect(() => {
    const el = root.current;
    const $ = s => el.querySelector(s);
    const $$ = s => [...el.querySelectorAll(s)];
    const world = $('[data-world]'), ride = $('[data-ride]');
    const parts = name => {
      const b = $(`[data-blob="${name}"]`);
      return { el: b, body: b.querySelector('[data-body]'), shapes: [...b.querySelectorAll('[data-shape]')],
               eyes: b.querySelector('[data-eyes]'), look: b.querySelector('[data-look]'), blush: b.querySelector('[data-blush]') };
    };
    const violet = parts('violet'), mango = parts('mango');
    const waveBack = $('[data-wave-back]'), waveFront = $('[data-wave-front]'), foam = $('[data-foam]');
    const gloom = $('[data-gloom]'), storm = $('[data-storm]'), timeskip = $('[data-timeskip]');
    const balloon = $('[data-balloon]'), string = $('[data-string]');
    const drops = $$('[data-drop]'), bubbles = $$('[data-bubble]'), hearts = $$('[data-heart]'), ripples = $$('[data-ripple]');

    let raf, t = 0, last = performance.now(), moodNow = null, moodStart = 0, lineAt = [];
    let splashAt = null, releaseAt = null;
    const cur = { camX: CAM.wide.x, camY: CAM.wide.y, camZ: CAM.wide.z, vdx: 0, vdy: 0, vrot: 0,
                  mx: 0, lean: 0, drape: 0, gloom: 0, storm: 0 };
    const ease = (k, target, dt, speed = 3) => { cur[k] += (target - cur[k]) * (1 - Math.exp(-dt * speed)); };
    const bump = (x, a, w) => Math.max(0, 1 - Math.abs(x - a) / w);
    const loop = (x, p) => x % p;

    // the sea surface: two sine waves, taller and faster when it storms
    const surface = (x, base, amp, speed) =>
      base + Math.sin(x * 0.011 - t * 1.3 * speed) * amp + Math.sin(x * 0.027 + t * 2.0 * speed) * amp * 0.45;
    const waveLine = (base, amp, speed) => {
      let d = '';
      for (let x = 0; x <= W; x += 20) d += `${x ? ' L' : 'M'}${x} ${surface(x, base, amp, speed).toFixed(1)}`;
      return d;
    };
    const wavePath = (base, amp, speed) => `${waveLine(base, amp, speed)} L${W} ${H} L0 ${H} Z`;

    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
      const first = moodNow === null;
      if (moodRef.current !== moodNow) { moodNow = moodRef.current; moodStart = t; }
      const s = t - moodStart;
      const n = lineRef.current;
      if (n != null && n < lineAt.length) lineAt = [];
      while (n != null && lineAt.length < n) lineAt.push(t);
      const sc = captionRef.current ? s - CAPTION_TIME : s;
      const at = i => n == null ? sc - i * 2.5 : i < lineAt.length ? t - lineAt[i] : -1e9;
      const p = pose(moodNow, s, !!captionRef.current, at);

      /* time-skip card */
      const cap = captionRef.current;
      timeskip.style.opacity = cap ? 1 - Math.max(0, Math.min(1, (s - (CAPTION_TIME - 0.6)) / 0.6)) : 0;

      /* mood of the light: a little dimmer when things turn, dark and stormy at the end */
      ease('gloom', p.gloom || 0, dt, 1.2);
      ease('storm', p.storm || 0, dt, 2);
      gloom.style.opacity = cur.gloom;
      storm.style.opacity = cur.storm;
      world.style.filter = `saturate(${0.82 - cur.gloom * 0.12 - cur.storm * 0.35}) brightness(${1 - cur.storm * 0.18})`;

      /* camera (cover-fit the 1600x900 world, eased between shots) */
      const cam = CAM[p.cam || 'boat'];
      const camSpeed = first ? 100 : 1.6;
      ease('camX', cam.x, dt, camSpeed); ease('camY', cam.y, dt, camSpeed); ease('camZ', cam.z, dt, camSpeed);
      const pw = el.clientWidth, ph = el.clientHeight;
      const z = Math.max(pw / W, ph / H) * (cur.camZ + Math.sin(t * 0.13) * 0.012);
      const fx = cur.camX + Math.sin(t * 0.07) * 12, fy = cur.camY + Math.sin(t * 0.9) * cur.storm * 10;
      const shake = (p.shake || 0) * 9;
      const tx = Math.min(0, Math.max(pw - W * z, pw / 2 - fx * z)) + Math.sin(t * 90) * shake;
      const ty = Math.min(0, Math.max(ph - H * z, ph / 2 - fy * z)) + Math.cos(t * 80) * shake;
      world.style.transform = `translate(${tx}px, ${ty}px) scale(${z})`;

      /* waves */
      const amp = 7 + cur.storm * 30, speed = 1 + cur.storm * 1.6;
      waveBack.setAttribute('d', wavePath(WL - 22, amp * 0.7, speed * 0.8));
      waveFront.setAttribute('d', wavePath(WL + 14 - cur.storm * 26, amp, speed));
      foam.setAttribute('d', waveLine(WL + 14 - cur.storm * 26, amp, speed));

      /* the boat bobs on the water (and rocks hard after the push) */
      const P = p.push;
      const rock = P != null && P > 0.3 ? Math.sin((P - 0.3) * 8) * 7 * Math.exp(-(P - 0.3) * 1.1) : 0;
      const bob = Math.sin(t * 1.3) * (5 + cur.storm * 16);
      const tilt = Math.sin(t * 1.05) * (1.4 + cur.storm * 5) + rock;
      ride.style.transform = `translateY(${bob}px) rotate(${tilt}deg)`;

      /* faces */
      for (const [b, faces] of [[violet, p.violet], [mango, p.mango]]) {
        for (const f of FACES) b.el.classList.toggle(f, faces.includes(f));
      }
      violet.el.classList.toggle('is-wet', !!p.wet);

      /* violet: in the boat / flying out / in the water */
      if (P != null && P > 0.25 && P < 0.95) {
        const u = (P - 0.25) / 0.7;
        cur.vdx = WATER.dx * (1 - (1 - u) * (1 - u));
        cur.vdy = -110 * Math.sin(Math.PI * Math.min(1, u * 1.1)) + WATER.dy * u * u;
        cur.vrot = -55 * u;
      } else if ((P != null && P >= 0.95) || p.inWater) {
        if (P != null && splashAt == null) splashAt = t;
        const struggle = Math.sin(t * 5.2) * 14 + Math.sin(t * 8.3) * 5;
        ease('vdx', WATER.dx + Math.sin(t * 3.1) * 10, dt, 6); ease('vdy', WATER.dy + struggle, dt, 8); ease('vrot', Math.sin(t * 4) * 10, dt, 6);
      } else {
        ease('vdy', 0, dt, first ? 100 : 3.2); ease('vdx', 0, dt, first ? 100 : 1.9); ease('vrot', 0, dt, 3);
      }
      if (moodNow === 'birthday') splashAt = null;
      const shiver = p.shiver && Math.abs(cur.vdx) < 30 ? Math.sin(t * 40) * 1.6 : 0;
      violet.el.style.translate = `${cur.vdx + shiver}px ${cur.vdy}px`;
      violet.el.style.rotate = `${cur.vrot}deg`;
      violet.look.style.transform = p.violetLook === 'around'
        ? (loop(t, 3) < 1.5 ? 'translate(-3px, -2px)' : 'translate(5px, -2px)')
        : LOOK[p.violetLook];
      violet.eyes.style.transform = `scaleY(${1 - 0.9 * bump(loop(t, 3.7), 1.2, 0.09)})`;
      violet.blush.style.opacity = p.violetBlush ?? 0.35;
      const vBreathe = Math.sin(t * 1.9) * 0.012, shrink = p.shrink || 0;
      violet.body.style.transform = `scale(${1 + vBreathe - shrink * 0.4}, ${1 - vBreathe - shrink})`;
      const fidget = Math.sin(t * 2.3) * 5;
      const flail = (P != null && P >= 0.95) || p.inWater ? Math.sin(t * 9) * 40 : 0;   // waving her nubs in the water
      violet.shapes.forEach(x => x.setAttribute('d', blobPath(DEFAULT_HANDS, [6 + fidget + flail, 8 - fidget + flail + (flail ? 40 : 0)])));

      /* mango */
      ease('mx', p.mx || 0, dt, P != null && P < 0.6 ? 12 : 2.4);
      ease('lean', p.lean || 0, dt, 3);
      ease('drape', p.drape ? 1 : 0, dt, 2.2);
      const hugScoot = cur.drape * -36;
      mango.el.style.translate = `${cur.mx + hugScoot}px ${-(p.hop || 0)}px`;
      mango.look.style.transform = LOOK[p.mangoLook];
      mango.eyes.style.transform = `scaleY(${1 - 0.9 * bump(loop(t, 4.3), 2.1, 0.09)})`;
      mango.blush.style.opacity = p.mangoBlush ?? 0.25;
      const mBreathe = Math.sin(t * 1.6 + 1) * 0.01;
      mango.body.style.transform = `rotate(${cur.lean}deg) scale(${1 + mBreathe}, ${1 - mBreathe})`;
      const wave = p.mangoHand != null ? 1 : 0;
      const front = DEFAULT_HANDS.map((h, i) => i === 1
        ? { ...h, len: h.len + cur.drape * 26 + wave * 26, y: h.y - cur.drape * 34 - wave * 30 } : h);
      const frontLift = p.mangoHand ?? cur.drape * 40;
      mango.shapes.forEach(x => x.setAttribute('d', blobPath(front, [0, frontLift])));

      /* hearts over mango's head */
      hearts.forEach((h, i) => {
        if (p.hearts == null) { h.style.opacity = 0; return; }
        const k = p.hearts - i * 0.35;
        const life = Math.max(0, Math.min(1, k / 2.4));
        h.style.opacity = k > 0 ? Math.sin(Math.PI * life) : 0;
        h.style.transform = `translate(${(i % 2 ? 1 : -1) * (14 + i * 9) + Math.sin(t * 3 + i) * 8}px, ${-life * 130}px) scale(${0.6 + life * 0.6})`;
      });

      /* splash + ripples where she lands, bubbles while she's under */
      const ss = splashAt == null ? -1 : t - splashAt;
      drops.forEach((d, i) => {
        if (ss < 0 || ss > 1.4) { d.style.opacity = 0; return; }
        const a = (i / N_DROPS) * Math.PI - Math.PI + 0.15 + (i % 3) * 0.08;
        const v = 260 + (i % 4) * 70;
        const x = Math.cos(a) * v * ss * 0.9, y = Math.sin(a) * v * ss + 600 * ss * ss;
        d.style.opacity = Math.max(0, 1 - ss / 1.4);
        d.style.transform = `translate(${x}px, ${y}px)`;
      });
      ripples.forEach((r, i) => {
        const k = ss < 0 ? -1 : ((ss + i * 0.9) % 2.7) / 2.7;
        const on = ss >= 0 && (moodNow === 'push');
        r.style.opacity = on ? (1 - k) * 0.8 : 0;
        r.style.transform = `translate(-50%, -50%) scale(${0.3 + k * 1.6})`;
      });
      const under = ss >= 0 && moodNow === 'push';
      bubbles.forEach((b, i) => {
        if (!under) { b.style.opacity = 0; return; }
        const k = ((t * 0.9 + i / N_BUBBLES) % 1);
        b.style.opacity = Math.sin(Math.PI * k);
        b.style.transform = `translate(${Math.sin(t * 4 + i * 2) * 10 + (i - 3) * 16}px, ${-k * 70}px) scale(${0.6 + (i % 3) * 0.3})`;
      });

      /* the birthday balloon: bobs on its string, floats away after the push */
      if (p.balloonFree && releaseAt == null) releaseAt = first ? t - 100 : t;
      if (!p.balloonFree) releaseAt = null;
      const fly = releaseAt == null ? 0 : t - releaseAt;
      const bx = Math.sin(t * 1.1) * 10 + fly * 55 + Math.sin(fly * 2) * 14, by = Math.sin(t * 1.7) * 6 - fly * 95 - fly * fly * 6;
      balloon.style.transform = `translate(${bx}px, ${by}px) rotate(${Math.sin(t * 1.1) * 5 + Math.min(fly, 2) * 6}deg)`;
      balloon.style.opacity = fly > 9 ? 0 : 1;
      // string: from the balloon knot down to the bow (or trailing under it once free)
      const kx = 660 + bx, ky = 360 + by;
      const ex = releaseAt == null ? 664 : kx - 10 + Math.sin(t * 3) * 12, ey = releaseAt == null ? 548 : ky + 150;
      string.setAttribute('d', `M${kx} ${ky} Q${(kx + ex) / 2 + Math.sin(t * 2) * 16} ${(ky + ey) / 2} ${ex} ${ey}`);

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const place = (p, flip) => ({
    left: p.x - p.w / 2, top: p.ground - p.h * 0.95, width: p.w, height: p.h, '--flip': flip ? -1 : 1,
  });

  return (
    <div className="bc" ref={root} aria-hidden>
      <div className="bc-world" data-world>
        {/* sky, sun, clouds, birds */}
        <div className="bc-sky" />
        <div className="bc-sun" />
        <div className="bc-cloud bc-cloud--1" /><div className="bc-cloud bc-cloud--2" /><div className="bc-cloud bc-cloud--3" />
        <div className="bc-birds"><i /><i /><i /></div>

        {/* sea */}
        <div className="bc-sea" />
        <div className="bc-glitter" />
        <svg className="bc-svg" viewBox={`0 0 ${W} ${H}`}>
          <path className="bc-wave-back" data-wave-back />
        </svg>

        {/* the boat + both of them ride together */}
        <div className="bc-ride" data-ride>
          <svg className="bc-svg" viewBox={`0 0 ${W} ${H}`}>
            <path className="bc-string" data-string />
          </svg>
          <div className="bc-balloon" data-balloon><i /></div>
          <svg className="bc-boat bc-boat--back" viewBox="0 0 600 180" style={{ left: BOAT.x - BOAT.w / 2, top: WL - 116 }}>
            <path d="M14 46 Q300 4 586 46 L572 74 Q300 52 28 74 Z" fill="#6e5140" />
            <path d="M14 46 Q300 4 586 46" fill="none" stroke="#9c7457" strokeWidth="8" strokeLinecap="round" />
            <rect x="270" y="40" width="60" height="18" rx="4" fill="#8a6a50" />
          </svg>
          <div className="bc-blob" data-blob="violet" style={place(VIOLET, false)}>
            <div className="bc-blob__art">
              <div className="bc-blob__body" data-body><BlobArt who="violet" idSuffix="bc-violet" /></div>
            </div>
            <div className="bc-drips"><i /><i /><i /><i /></div>
            <div className="bc-bubbles">
              {Array.from({ length: N_BUBBLES }, (_, i) => <i key={i} data-bubble />)}
            </div>
          </div>
          <div className="bc-gift"><i /></div>
          <div className="bc-blob" data-blob="mango" style={place(MANGO, true)}>
            <div className="bc-blob__art">
              <div className="bc-blob__body" data-body><BlobArt who="mango" idSuffix="bc-mango" /></div>
            </div>
            <div className="bc-hearts">
              {Array.from({ length: N_HEARTS }, (_, i) => (
                <svg key={i} data-heart viewBox="0 0 32 30"><path d="M16 29 C5 20 0 14 0 8 A8 8 0 0 1 16 5 A8 8 0 0 1 32 8 C32 14 27 20 16 29 Z" /></svg>
              ))}
            </div>
          </div>
          <svg className="bc-boat bc-boat--front" viewBox="0 0 600 180" overflow="visible" style={{ left: BOAT.x - BOAT.w / 2, top: WL - 116 }}>
            {/* oar resting over the side */}
            <path d="M470 60 L640 168" stroke="#8b6648" strokeWidth="9" strokeLinecap="round" />
            <ellipse cx="648" cy="174" rx="26" ry="10" fill="#8b6648" transform="rotate(32 648 174)" />
            {/* hull */}
            <path d="M28 74 Q300 52 572 74 L600 70 Q560 170 300 176 Q60 170 0 70 Z" fill="#e3dccf" />
            <path d="M8 92 Q300 74 592 92 L586 108 Q300 92 14 108 Z" fill="#7f97a3" />
            <path d="M40 140 Q300 150 560 140" fill="none" stroke="#c9c0b2" strokeWidth="3" />
            <path d="M28 74 Q300 52 572 74" fill="none" stroke="#a07858" strokeWidth="10" strokeLinecap="round" />
            <path d="M0 70 Q300 46 600 70" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="3" />
          </svg>
        </div>

        {/* splash + ripples where she falls in */}
        <div className="bc-splash" style={{ left: VIOLET.x + WATER.dx, top: WL + 4 }}>
          {Array.from({ length: N_DROPS }, (_, i) => <i key={i} data-drop />)}
        </div>
        <div className="bc-ripple" data-ripple style={{ left: VIOLET.x + WATER.dx, top: WL + 18 }} />
        <div className="bc-ripple" data-ripple style={{ left: VIOLET.x + WATER.dx, top: WL + 18 }} />
        <div className="bc-ripple" data-ripple style={{ left: VIOLET.x + WATER.dx, top: WL + 18 }} />

        {/* near water in front of the boat */}
        <svg className="bc-svg" viewBox={`0 0 ${W} ${H}`}>
          <defs>
            <linearGradient id="bc-front" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#6f9cab" stopOpacity=".94" />
              <stop offset=".35" stopColor="#4f7d90" />
              <stop offset="1" stopColor="#36586b" />
            </linearGradient>
          </defs>
          <path className="bc-wave-front" data-wave-front fill="url(#bc-front)" />
          <path className="bc-foam" data-foam />
        </svg>

        {/* the beach on the left (where she wants to bring her friends) */}
        <svg className="bc-svg" viewBox={`0 0 ${W} ${H}`}>
          <path d="M0 438 Q260 436 430 446 Q330 520 240 600 Q150 690 0 760 Z" fill="#dcc7a6" />
          <path d="M430 446 Q330 520 240 600 Q150 690 0 760" fill="none" stroke="#f4efe6" strokeWidth="7" strokeOpacity=".75" strokeLinecap="round" />
          <path d="M0 470 Q200 466 360 474" fill="none" stroke="#cdb593" strokeWidth="3" opacity=".6" />
        </svg>
        <div className="bc-umbrella"><i /></div>
        <div className="bc-towel" />
      </div>

      {/* light */}
      <div className="bc-warm" />
      <div className="bc-gloom" data-gloom />
      <div className="bc-storm" data-storm />
      <div className="bc-vignette" />

      <div className="bc-timeskip" data-timeskip><span>{caption}</span></div>
    </div>
  );
}
