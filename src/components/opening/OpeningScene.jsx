import { useEffect, useRef, useState } from 'react';
import { startOpeningScene, BOOK, BLOBS, blobPath } from './sceneEngine';
import './OpeningScene.css';

/*
  <OpeningScene onComplete={() => ...} />

  1. Shows the open book in the grass. The book IS the menu (Start / Resources / Credits).
  2. Pressing Start plays the opening (about 18 seconds), then calls onComplete.
  A "skip" button appears in the corner once it's playing.

  For testing: speed={2} plays twice as fast; startAt={14} jumps to 14s and plays from there.
*/

const COLORS = { mauve: '#bf95b1', coral: '#f49a80' };

/* ---------------- fixed decorations (same every time) ---------------- */
function seeded(seed) {
  return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
}
const r = seeded(42);
const CLOUDS = [
  { x: -120, y: 360, w: 520 }, { x: 330, y: 250, w: 640 }, { x: 900, y: 330, w: 560 },
  { x: 1360, y: 230, w: 600 }, { x: 120, y: 640, w: 420 }, { x: 640, y: 560, w: 520 },
  { x: 1180, y: 600, w: 460 }, { x: 1650, y: 520, w: 400 }, { x: 380, y: 840, w: 360 },
  { x: 980, y: 860, w: 300 }, { x: -380, y: 520, w: 480 },
].map(c => ({
  ...c,
  // lots of soft overlapping puffs inside a flat-bottomed dome, plus a wispy streak
  puffs: Array.from({ length: 22 }, () => {
    const x = r() * c.w * 0.9;
    const dome = Math.sin((x / c.w) * Math.PI) * c.w * 0.16;
    const s = c.w * (0.16 + r() * 0.14) * (0.55 + (dome / (c.w * 0.16)) * 0.7);
    return { x: x - s * 0.25, y: -r() * dome * 0.9, s };
  }),
}));
const GLINTS = Array.from({ length: 16 }, () => ({ x: 1120 + r() * 140, y: 1006 + r() * 40, w: 10 + r() * 34 }));
const DAPPLES = Array.from({ length: 18 }, (_, i) => ({
  x: 130 + r() * 1360, y: 1500 + r() * 560, s: 220 + r() * 220, light: i % 3 === 0,
}));

/* ---------------- a blob ---------------- */

function shade(hex, k) {   // k > 0 lighter, k < 0 darker
  const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255];
  const t = k > 0 ? 255 : 40;
  return `rgb(${c.map(v => Math.round(v + (t - v) * Math.abs(k))).join(',')})`;
}

function Blob({ name, color, face }) {
  const b = BLOBS[name];
  const id = s => `ocs-${name}-${s}`;
  const { eyes, mouth, blush } = face;
  const BODY = blobPath(b.hands);                 // body + hands as one shape (the engine animates it)
  return (
    <div className="ocs-blob" data-blob={name} style={{ left: b.x, top: b.y, width: b.w, height: b.h }}>
      <div className="ocs-blob__shadow" />
      <div className="ocs-blob__body" data-body>
        <svg viewBox="0 0 240 200" width="100%" height="100%" overflow="visible">
          <defs>
            <radialGradient id={id('base')} gradientUnits="userSpaceOnUse" cx="91" cy="69" r="175">
              <stop offset="0" stopColor={shade(color, 0.32)} />
              <stop offset="0.45" stopColor={color} />
              <stop offset="1" stopColor={shade(color, -0.32)} />
            </radialGradient>
            <linearGradient id={id('ao')} gradientUnits="userSpaceOnUse" x1="0" y1="20" x2="0" y2="194">
              <stop offset="0.6" stopColor="#3a2433" stopOpacity="0" />
              <stop offset="1" stopColor="#3a2433" stopOpacity="0.45" />
            </linearGradient>
            <linearGradient id={id('rim')} gradientUnits="userSpaceOnUse" x1="2" y1="0" x2="262" y2="0">
              <stop offset="0.66" stopColor="#ffd2a0" stopOpacity="0" />
              <stop offset="1" stopColor="#ffd2a0" stopOpacity="0.55" />
            </linearGradient>
            <linearGradient id={id('bounce')} gradientUnits="userSpaceOnUse" x1="0" y1="20" x2="0" y2="194">
              <stop offset="0.78" stopColor="#9fc26a" stopOpacity="0" />
              <stop offset="1" stopColor="#9fc26a" stopOpacity="0.22" />
            </linearGradient>
            {/* soft-edged gradients instead of blur filters (filters are slow to redraw every frame) */}
            <radialGradient id={id('shine')}>
              <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={id('blush')}>
              <stop offset="0" stopColor="#ff7486" stopOpacity="0.5" />
              <stop offset="1" stopColor="#ff7486" stopOpacity="0" />
            </radialGradient>
            <clipPath id={id('mouth')}>
              <path d={`M${mouth[0] - 9} ${mouth[1] - 1} Q${mouth[0]} ${mouth[1] + 15} ${mouth[0] + 9} ${mouth[1] - 1} Z`} />
            </clipPath>
          </defs>

          {/* body: color, soft round shading, shadow underneath, warm sun on the right, grass bounce light */}
          <path data-shape d={BODY} fill={`url(#${id('base')})`} />
          <path data-shape d={BODY} fill={`url(#${id('ao')})`} />
          <path data-shape d={BODY} fill={`url(#${id('rim')})`} />
          <path data-shape d={BODY} fill={`url(#${id('bounce')})`} />
          <ellipse cx="80" cy="56" rx="44" ry="26" fill={`url(#${id('shine')})`} transform="rotate(-22 80 56)" />

          {/* cheeks */}
          {blush.map(([x, y], i) => (
            <ellipse key={i} cx={x} cy={y} rx="17" ry="10" fill={`url(#${id('blush')})`} />
          ))}

          {/* eyes: open (with a look direction) / happy-closed */}
          <g className="ocs-blob__eyes" data-eyes>
            <g className="ocs-eye-open" data-look>
              {eyes.map(([x, y], i) => (
                <g key={i} transform={`translate(${x} ${y})`}>
                  <ellipse rx="7" ry="9.5" fill="#2c2230" />
                  <circle cx="-2.4" cy="-3.6" r="2.6" fill="#fff" />
                  <circle cx="2.2" cy="2.8" r="1.1" fill="#fff" opacity="0.8" />
                </g>
              ))}
            </g>
            <g className="ocs-eye-happy">
              {eyes.map(([x, y], i) => (
                <path key={i} d={`M${x - 8} ${y + 2} Q${x} ${y - 7} ${x + 8} ${y + 2}`}
                  fill="none" stroke="#2c2230" strokeWidth="3.2" strokeLinecap="round" />
              ))}
            </g>
          </g>

          {/* mouth: small smile / open laugh */}
          <path className="ocs-mouth-smile" d={`M${mouth[0] - 7} ${mouth[1]} Q${mouth[0]} ${mouth[1] + 6} ${mouth[0] + 7} ${mouth[1]}`}
            fill="none" stroke="#2c2230" strokeWidth="2.6" strokeLinecap="round" />
          <g className="ocs-mouth-laugh">
            <path d={`M${mouth[0] - 9} ${mouth[1] - 1} Q${mouth[0]} ${mouth[1] + 15} ${mouth[0] + 9} ${mouth[1] - 1} Z`} fill="#3a2232" />
            <ellipse cx={mouth[0]} cy={mouth[1] + 8} rx="5" ry="3" fill="#e57f8c" clipPath={`url(#${id('mouth')})`} />
          </g>
        </svg>
      </div>
    </div>
  );
}

/* ---------------- the scene ---------------- */
export default function OpeningScene({ onComplete, speed = 1, startAt = 0, title = 'it comes in waves' }) {
  const root = useRef(null);
  const scene = useRef(null);
  const [started, setStarted] = useState(startAt > 3.6);
  const [panel, setPanel] = useState('menu');      // which page the right side shows: 'menu' | 'resources' | 'credits'
  const done = useRef(onComplete);
  done.current = onComplete;

  useEffect(() => {
    scene.current = startOpeningScene(root.current, { speed, startAt, onComplete: () => done.current?.() });
    return () => scene.current.destroy();
  }, [speed, startAt]);

  // last word goes on its own line: "it comes in / waves"
  const words = title.split(' ');
  const firstHalf = words.slice(0, -1).join(' ');
  const secondHalf = words.at(-1);

  return (
    <div className="ocs" ref={root}>
      {/* SKY (far away) */}
      <div className="ocs-layer" data-layer="sky">
        <div className="ocs-sky" />
        <div className="ocs-sun-glow" />
        <div className="ocs-sun" />
      </div>
      <div className="ocs-layer" data-layer="clouds">
        {CLOUDS.map((c, i) => (
          <div key={i} className="ocs-cloud" data-cloud style={{ left: c.x, top: c.y }}>
            {c.puffs.map((p, j) => (
              <span key={j} style={{ left: p.x, top: p.y - p.s / 2, width: p.s, height: p.s }} />
            ))}
            <span className="ocs-cloud__streak" style={{ left: -c.w * 0.2, width: c.w * 1.4, height: c.w * 0.1 }} />
          </div>
        ))}
      </div>
      <div className="ocs-layer" data-layer="sea">
        <div className="ocs-sea" />
        {GLINTS.map((g, i) => (
          <span key={i} className="ocs-glint" data-glint style={{ left: g.x, top: g.y, width: g.w }} />
        ))}
      </div>

      {/* MEADOW (canvas) */}
      <canvas className="ocs-canvas" data-canvas="back" />

      {/* BOOK + BLOBS */}
      <div className="ocs-layer" data-layer="world">
        <div className="ocs-book-shadow" style={{ left: BOOK.x, top: BOOK.y, width: BOOK.w, height: BOOK.h, rotate: `${BOOK.rot}deg` }} />
        <div className="ocs-book" style={{ left: BOOK.x, top: BOOK.y, width: BOOK.w, height: BOOK.h, rotate: `${BOOK.rot}deg` }}>
          <div className="ocs-book__cover" />
          {/* left page: title + content note */}
          <div className="ocs-book__page ocs-book__page--l">
            <div className="ocs-book__title" data-title>{firstHalf}<br />{secondHalf}</div>
            <svg className="ocs-book__squiggle" data-squiggle viewBox="0 0 100 14" preserveAspectRatio="none" aria-hidden="true">
              <path d="M3 8 C 14 2, 22 2, 30 8 S 46 14, 56 8 S 74 2, 84 8 S 94 11, 97 7" fill="none" stroke="#3d3340" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            <p className="ocs-book__cw">Content Warning: This project will touch upon sensitive topics such as emotional manipulation, physical abuse, etc.</p>
          </div>

          {/* right page: the menu (fades away once Start is pressed) */}
          <div className="ocs-book__page ocs-book__page--r">
            <div className={`ocs-menu ${started ? 'is-hidden' : ''}`} inert={started}>
              {panel === 'menu' && (
                <nav className="ocs-menu__panel" aria-label="Main menu">
                  <button className="ocs-menu__btn" onClick={() => { setStarted(true); scene.current?.start(); }}>
                    <svg className="ocs-menu__tri" viewBox="0 0 10 10" aria-hidden="true">
                      <path d="M2 1.2 L8.6 5 L2 8.8 Z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                    </svg>
                    Start
                  </button>
                  <button className="ocs-menu__btn" onClick={() => setPanel('resources')}>Resources</button>
                  <button className="ocs-menu__btn" onClick={() => setPanel('credits')}>Credits</button>
                </nav>
              )}
              {panel === 'resources' && (
                <section className="ocs-menu__panel">
                  <h3>Resources</h3>
                  <p></p>
                  <button className="ocs-menu__btn ocs-menu__btn--small" onClick={() => setPanel('menu')}>&larr; back</button>
                </section>
              )}
              {panel === 'credits' && (
                <section className="ocs-menu__panel">
                  <h3>Credits</h3>
                  <p>Jiayue Quan</p>
                  <p>Diya Jindal</p>
                  <p>Micah Rodriguez</p>
                  <p>Andy Nguyen</p>
                  <button className="ocs-menu__btn ocs-menu__btn--small" onClick={() => setPanel('menu')}>&larr; back</button>
                </section>
              )}
            </div>
          </div>
        </div>

        <Blob name="mauve" color={COLORS.mauve}
          face={{ eyes: [[86, 104], [128, 104]], mouth: [107, 123], blush: [[66, 121], [148, 121]] }} />
        <Blob name="coral" color={COLORS.coral}
          face={{ eyes: [[124, 100], [162, 97]], mouth: [145, 118], blush: [[106, 116], [178, 112]] }} />

        {DAPPLES.map((d, i) => (
          <span key={i} className={`ocs-dapple ${d.light ? 'is-light' : ''}`} data-dapple
            style={{ left: d.x, top: d.y, width: d.s, height: d.s * 0.7 }} />
        ))}
      </div>

      {/* grass in front of the book/blobs, then blurry grass right by the camera */}
      <canvas className="ocs-canvas" data-canvas="front" />
      <canvas className="ocs-canvas ocs-canvas--near" data-canvas="near" />

      {/* light, color, vignette, grain */}
      <div className="ocs-sunlight" />
      <div className="ocs-vignette" />
      <div className="ocs-grain" data-grain />
      <div className="ocs-fade" data-fade />

      {started && <button className="ocs-skip" onClick={() => scene.current?.skip()}>skip</button>}
    </div>
  );
}
