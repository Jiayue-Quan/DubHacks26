import { useEffect, useRef } from 'react';
import BlobArt from '../blob/BlobArt';
import { startExposition, MESSAGES } from './expositionEngine';
import './ExpositionScene.css';

const POLAROIDS = [
  { kind: 'cafe',  caption: 'first date <3', rot: -6, x: -14, y: 2 },
  { kind: 'rain',  caption: 'rainy day',  rot: 5,  x: 12,  y: -3 },
  { kind: 'stars', caption: 'stargazing',      rot: -3, x: -6,  y: -6 },
  { kind: 'beach', caption: 'the beach',  rot: 4,  x: 8,   y: 2 },
];

// a small blob that just sits there (for the polaroids). face = classes like 'is-happy'
function MiniBlob({ who, x, y, w, facing = 1, face = '', idSuffix }) {
  return (
    <div className={`exs-mini ${face}`} style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, transform: `scaleX(${facing})` }}>
      <BlobArt who={who} idSuffix={idSuffix} />
    </div>
  );
}

function Photo({ kind, i }) {
  const id = s => `p${i}-${s}`;
  if (kind === 'cafe') return (
    <div className="exs-photo exs-photo--cafe">
      <div className="exs-cafe__window" />
      <MiniBlob who="mango" x={6} y={34} w={38} face="is-happy" idSuffix={id('m')} />
      <MiniBlob who="violet" x={54} y={30} w={42} facing={-1} face="is-happy" idSuffix={id('v')} />
      <svg className="exs-shake" viewBox="0 0 60 110">
        <path d="M24 8 L30 46 M36 8 L30 46" stroke="#f49a80" strokeWidth="3" strokeLinecap="round" />
        <path d="M14 40 h32 l-5 58 h-22 z" fill="#fff5f0" opacity=".9" />
        <path d="M16 52 h28 l-4 46 h-20 z" fill="#f7b7c4" />
        <ellipse cx="30" cy="40" rx="17" ry="5" fill="#fff" />
      </svg>
      <div className="exs-cafe__table" />
    </div>
  );
  if (kind === 'rain') return (
    <div className="exs-photo exs-photo--rain">
      <div className="exs-rain" />
      <svg className="exs-umbrella" viewBox="0 0 200 120">
        <path d="M10 70 Q100 -30 190 70 Q168 58 145 70 Q122 58 100 70 Q78 58 55 70 Q32 58 10 70 Z" fill="#fbe3e8" />
        <path d="M100 70 V112 q0 8 -8 8" stroke="#8a6f7d" strokeWidth="4" fill="none" strokeLinecap="round" />
      </svg>
      <MiniBlob who="mango" x={14} y={40} w={38} face="is-happy" idSuffix={id('m')} />
      <MiniBlob who="violet" x={44} y={36} w={42} facing={-1} face="is-happy" idSuffix={id('v')} />
      <div className="exs-puddle" />
    </div>
  );
  if (kind === 'stars') return (
    <div className="exs-photo exs-photo--stars">
      <div className="exs-stars" />
      <div className="exs-shooting" />
      <div className="exs-hill" />
      <MiniBlob who="mango" x={16} y={44} w={34} face="look-up" idSuffix={id('m')} />
      <MiniBlob who="violet" x={44} y={40} w={38} facing={-1} face="is-happy" idSuffix={id('v')} />
    </div>
  );
  return (
    <div className="exs-photo exs-photo--beach">
      <div className="exs-beach__sun" />
      <svg className="exs-waves" viewBox="0 0 400 80" preserveAspectRatio="none">
        <path className="exs-wave exs-wave--1" d="M0 20 Q25 10 50 20 T100 20 T150 20 T200 20 T250 20 T300 20 T350 20 T400 20 T450 20 V80 H0 Z" />
        <path className="exs-wave exs-wave--2" d="M0 40 Q25 30 50 40 T100 40 T150 40 T200 40 T250 40 T300 40 T350 40 T400 40 T450 40 V80 H0 Z" />
      </svg>
      <div className="exs-sand" />
      <MiniBlob who="mango" x={12} y={40} w={36} face="is-happy" idSuffix={id('m')} />
      <MiniBlob who="violet" x={46} y={36} w={40} facing={-1} face="is-happy is-laugh" idSuffix={id('v')} />
    </div>
  );
}

function SceneBlob({ who, w, h }) {
  return (
    <div className="exs-blob" data-blob={who} style={{ width: w, height: h }}>
      <div className="exs-blob__shadow" />
      <div className="exs-blob__art" data-art>
        <div className="exs-blob__body" data-body>
          <BlobArt who={who} idSuffix={`meet-${who}`} />
        </div>
      </div>
    </div>
  );
}

export default function ExpositionScene({ onComplete, speed = 1, startAt = 0 }) {
  const root = useRef(null);
  const scene = useRef(null);
  const done = useRef(onComplete);
  done.current = onComplete;

  useEffect(() => {
    scene.current = startExposition(root.current, { speed, startAt, onComplete: () => done.current?.() });
    return () => scene.current.destroy();
  }, [speed, startAt]);

  return (
    <div className="exs" ref={root}>
      {/* ================= ACT 1: the meet-cute ================= */}
      <section className="exs-act exs-meet" data-act="meet">
        <div className="exs-layer" data-layer="sky">
          <div className="exs-sky" />
          <div className="exs-sun" />
        </div>
        <div className="exs-layer" data-layer="far">
          <div className="exs-hills exs-hills--back" />
          <div className="exs-hills exs-hills--front" />
          {[180, 420, 1180, 1460].map((x, i) => <div key={i} className="exs-far-tree" style={{ left: x, top: 470 + (i % 2) * 18 }} />)}
        </div>
        <div className="exs-layer" data-layer="mid">
          <div className="exs-meadow" />
          <BlossomTree x={60} flip={false} />
          <BlossomTree x={1290} flip />
          <div className="exs-lamp" style={{ left: 1130 }} />
        </div>
        <div className="exs-layer" data-layer="world">
          <div className="exs-path" />
          <SceneBlob who="mango" w={200} h={167} />
          <SceneBlob who="violet" w={230} h={192} />
          <div className="exs-book" data-book>
            <div className="exs-book__pages" />
            <div className="exs-book__cover"><span>it comes in waves</span></div>
          </div>
        </div>
        <canvas className="exs-canvas" data-canvas="grass" />
        <div className="exs-layer" data-layer="fore">
          <div className="exs-fore-branch exs-fore-branch--l" />
          <div className="exs-fore-branch exs-fore-branch--r" />
        </div>
        <canvas className="exs-canvas" data-canvas="fx" />
        <div className="exs-bloom" data-bloom />
        <div className="exs-caption" data-caption>how it started</div>
      </section>

      {/* ================= ACT 2: montage ================= */}
      <section className="exs-act exs-montage" data-act="montage">
        <div className="exs-paper" />
        {POLAROIDS.map((p, i) => (
          <figure key={i} className="exs-polaroid" data-polaroid
            style={{ '--rot': `${p.rot}deg`, '--x': `${p.x}vh`, '--y': `${p.y}vh` }}>
            <div className="exs-tape" />
            <div className="exs-photo-frame"><Photo kind={p.kind} i={i} /></div>
            <figcaption>{p.caption}</figcaption>
          </figure>
        ))}
      </section>

      {/* ================= ACT 3: the texts ================= */}
      <section className="exs-act exs-texts" data-act="texts">
                <div className="exs-room">
          <div className="exs-window"><div className="exs-moon" /></div>
          <div className="exs-fairy" />
          {/* the polaroids from the montage, taped on her wall */}
          <div className="exs-wall-pics">
            <span className="exs-wall-pic exs-wall-pic--cafe" />
            <span className="exs-wall-pic exs-wall-pic--rain" />
            <span className="exs-wall-pic exs-wall-pic--beach" />
          </div>
          {/* nightstand with a lamp and her book */}
          <div className="exs-nightstand">
            <div className="exs-lamp-shade" />
            <div className="exs-lamp-glow" />
            <div className="exs-stand-book" />
          </div>
          <div className="exs-headboard" />
          <div className="exs-pillow exs-pillow--back" />
          <div className="exs-pillow" />
        </div>
        <div className="exs-phone-glow" data-phone-glow />
        <div className="exs-bed-blob is-happy" data-bed-blob>
          <BlobArt who="violet" idSuffix="bed" />
          {/* the phone she's holding (the big phone on the right is a close-up of this one) */}
          <div className="exs-mini-phone" data-mini-phone><span /></div>
        </div>
        <div className="exs-blanket" />
        <div className="exs-phone" data-phone>
          <div className="exs-phone__screen">
            <header className="exs-phone__head">
              <span className="exs-phone__avatar" />
              <span>
                <b>Mango 🥭</b>
                <small>online</small>
              </span>
            </header>
            <div className="exs-chat" data-chat>
              <div className="exs-chat__list" data-chat-list>
                <div className="exs-chat__day">today</div>
                {MESSAGES.map((m, i) => (
                  <div key={i} className={`exs-msg exs-msg--${m.from}`} data-msg>{m.text}</div>
                ))}
              </div>
            </div>
            <div className="exs-typing" data-typing><span /><span /><span /></div>
            <footer className="exs-phone__input">message…</footer>
          </div>
        </div>
      </section>

      {/* ================= overlays ================= */}
      <div className="exs-vignette" />
      <div className="exs-grain" data-grain />
      <div className="exs-flash" data-flash />
      <div className="exs-fade" data-fade />
      <button className="exs-skip" onClick={() => scene.current?.skip()}>skip</button>
    </div>
  );
}

function BlossomTree({ x, flip }) {
  // trunk + a cloud of pink blossom puffs
  const puffs = [
    [-30, 250, 170], [50, 190, 210], [160, 215, 200], [240, 290, 160], [-10, 330, 160], [110, 300, 200],
    [220, 380, 140], [-70, 320, 130], [80, 400, 130], [150, 150, 150],
  ];
  return (
    <div className="exs-tree" style={{ left: x, transform: flip ? 'scaleX(-1)' : undefined }}>
      <svg className="exs-tree__trunk" viewBox="0 0 200 520">
        <path d="M92 520 C 96 420 84 330 100 250 C 112 190 150 150 170 110 M100 250 C 80 200 40 170 20 140 M104 330 C 130 300 160 290 190 280"
          stroke="#6d4f52" strokeWidth="22" fill="none" strokeLinecap="round" />
      </svg>
      {puffs.map(([px, py, s], i) => (
        <span key={i} className="exs-tree__puff" style={{ left: px, top: py, width: s, height: s }} />
      ))}
    </div>
  );
}
