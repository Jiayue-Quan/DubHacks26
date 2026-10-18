import { useEffect, useRef } from 'react';
import BlobArt, { DEFAULT_HANDS } from '../blob/BlobArt';
import { blobPath } from '../opening/sceneEngine';
import './Mirror.css';

/*
  <Mirror mood="mirror" line={3} />

  Scene 6: Violet in front of the bathroom mirror (we see her from behind). Her reflection is
  faded and washed out, and fades more as she talks to herself. Then a montage of warm memories
  plays, one per line, and it cuts back to the mirror, which cracks on the last line.

  The montage is timed to the dialogue lines (numbers start at 0):
    0-2  the mirror ("You know I love you" / "I always will" / "But do I love myself") - fading more each line
    3    memory 1: field - two little blobs bump into each other, Violet tumbles, Mango laughs and reaches out
    4    memory 2: Mango kisses Violet on the cheek
    5    memory 3: Mango brushes a fall leaf off Violet's head
    6    memory 4: apology flowers
    7    back to the mirror: she cries and the mirror cracks ("...break my heart like this")
*/

const W = 1600, H = 900;
const FACES = ['is-happy', 'is-laugh', 'is-unsure', 'is-annoyed', 'is-sad', 'is-surprised', 'is-tired'];
const LOOK = { at: 'translate(4px, -1px)', down: 'translate(1px, 5px)', away: 'translate(-2px, 3px)', up: 'translate(3px, -5px)' };
const CAPTION_TIME = 2.6;

// one memory = what both little blobs do, u = seconds since it started
const MEMORIES = [
  null,
  // 1: field - bump, tumble, laugh, hand out
  u => {
    const meet = Math.min(1, u / 1.0);
    const bumped = u > 1.0;
    const fall = bumped ? Math.min(1, (u - 1.0) / 0.35) : 0;
    const laugh = u > 1.3 && u < 2.7;
    const reach = u > 2.3 ? Math.min(1, (u - 2.3) / 0.5) : 0;
    return {
      v: { x: 500 + 230 * meet - 120 * fall, y: 0, rot: -26 * fall + (bumped ? 0 : Math.sin(u * 12) * 3),
           hop: bumped ? 0 : Math.abs(Math.sin(u * 11)) * 16, faces: !bumped ? ['is-happy'] : u < 2.4 ? ['is-surprised'] : ['is-happy'],
           look: bumped ? 'up' : 'at', blush: u > 2.6 ? 1.3 : 0.5, lifts: [6, 8 + reach * 50] },
      m: { x: 1110 - 230 * meet, y: 0, rot: 0, hop: bumped ? (laugh ? Math.abs(Math.sin(u * 9)) * 6 : 0) : Math.abs(Math.sin(u * 11 + 1)) * 16,
           faces: laugh ? ['is-happy', 'is-laugh'] : ['is-happy'], look: 'at', blush: 0.8,
           headshake: laugh ? Math.sin(u * 15) * 4 : 0, reach, lifts: [0, -10 * reach + 20] },
      squash: Math.max(0, 1 - Math.abs(u - 1.0) / 0.15),
    };
  },
  // 2: a kiss on the cheek
  u => {
    const lean = Math.max(0, Math.min(1, (u - 0.5) / 0.5)) * (u < 2.4 ? 1 : Math.max(0, 1 - (u - 2.4) / 0.6));
    const kissed = u > 1.0;
    return {
      v: { x: 700, y: 0, rot: kissed ? -3 : 0, faces: kissed ? ['is-happy'] : ['is-unsure'], look: kissed ? 'down' : 'at', blush: kissed ? 1.8 : 0.6, lifts: [6, 8] },
      m: { x: 960 - 80 * lean, y: 0, rot: 12 * lean, faces: ['is-happy'], look: 'at', blush: 1.1, lifts: [0, 0] },
      heart: kissed && u < 3.2 ? (u - 1.0) : null,
    };
  },
  // 3: brushing a fall leaf off her head
  u => {
    const reach = u > 0.6 ? Math.min(1, (u - 0.6) / 0.5) * (u < 2.2 ? 1 : Math.max(0, 1 - (u - 2.2) / 0.5)) : 0;
    return {
      v: { x: 700, y: 0, rot: 0, faces: u > 1.5 ? ['is-happy'] : [], look: u > 1.5 ? 'at' : 'up', blush: u > 1.5 ? 1.5 : 0.5, lifts: [6, 8] },
      m: { x: 980 - 50 * reach, y: 0, rot: 6 * reach, faces: ['is-happy'], look: 'at', blush: 0.9, reach, lifts: [0, 95 * reach] },
      leafOff: u > 1.35 ? u - 1.35 : null,
    };
  },
  // 4: apology flowers
  u => {
    const offer = Math.min(1, u / 0.7);
    return {
      v: { x: 670, y: 0, rot: 0, faces: u < 1.4 ? ['is-sad'] : ['is-unsure'], look: u < 1.4 ? 'down' : 'at', blush: u > 1.8 ? 1.2 : 0.3, lifts: [6, 8] },
      m: { x: 990 - 30 * offer, y: 0, rot: 5 * offer, faces: ['is-sad'], look: 'at', blush: 0.7, reach: offer * 0.6, lifts: [0, 40 * offer] },
      flowers: offer,
    };
  },
];

export default function Mirror({ caption, line }) {
  const root = useRef(null);
  const captionRef = useRef(caption);
  captionRef.current = caption;
  const lineRef = useRef(line);
  lineRef.current = line;

  useEffect(() => {
    const el = root.current;
    const $ = s => el.querySelector(s);
    const $$ = s => [...el.querySelectorAll(s)];
    const world = $('[data-world]'), timeskip = $('[data-timeskip]');
    const blob = node => ({ el: node, body: node.querySelector('[data-body]'), shapes: [...node.querySelectorAll('[data-shape]')],
      eyes: node.querySelector('[data-eyes]'), look: node.querySelector('[data-look]'), blush: node.querySelector('[data-blush]') });
    const back = blob($('[data-blob="back"]')), refl = blob($('[data-blob="refl"]'));
    const mems = $$('[data-mem]').map(m => ({ el: m, v: blob(m.querySelector('[data-role="v"]')), m: blob(m.querySelector('[data-role="m"]')),
      heart: m.querySelector('[data-heart]'), leaf: m.querySelector('[data-leaf]'), flowers: m.querySelector('[data-flowers]') }));
    const crack = $('[data-crack]'), tears = $('[data-tears]'), glass = $('[data-glass]');

    let raf, t = 0, last = performance.now(), lineAt = [];
    const bump = (x, a, w) => Math.max(0, 1 - Math.abs(x - a) / w);

    const draw = (b, p, flip) => {
      for (const f of FACES) b.el.classList.toggle(f, (p.faces || []).includes(f));
      b.el.style.translate = `${p.x}px ${-(p.hop || 0)}px`;
      b.el.style.rotate = `${p.rot || 0}deg`;
      b.look.style.transform = LOOK[p.look || 'at'];
      b.blush.style.opacity = p.blush ?? 0.4;
      b.body.style.transform = `rotate(${p.headshake || 0}deg) scale(${1 + (p.squash || 0) * 0.12}, ${1 - (p.squash || 0) * 0.14})`;
      const hands = DEFAULT_HANDS.map((h, i) => i === 1 && p.reach ? { ...h, len: h.len + p.reach * 46 } : h);
      b.shapes.forEach(x => x.setAttribute('d', blobPath(hands, p.lifts || [0, 0])));
      b.el.style.setProperty('--flip', flip ? -1 : 1);
    };

    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
      const n = lineRef.current ?? 0;
      if (n < lineAt.length) lineAt = [];
      while (lineAt.length < n) lineAt.push(t);
      const at = i => i < lineAt.length ? t - lineAt[i] : -1e9;
      const latest = n - 1;

      timeskip.style.opacity = captionRef.current ? 1 - Math.max(0, Math.min(1, (t - (CAPTION_TIME - 0.6)) / 0.6)) : 0;

      /* cover-fit the world, slow drift in */
      const pw = el.clientWidth, ph = el.clientHeight;
      const z = Math.max(pw / W, ph / H) * (1.04 + Math.min(t, 60) * 0.0012);
      const tx = Math.min(0, Math.max(pw - W * z, pw / 2 - 800 * z)), ty = Math.min(0, Math.max(ph - H * z, ph / 2 - 440 * z));
      world.style.transform = `translate(${tx}px, ${ty}px) scale(${z})`;

      /* which memory is showing */
      const mem = latest >= 3 && latest <= 6 ? latest - 2 : 0;
      el.classList.toggle('in-memory', mem > 0);
      mems.forEach((m, i) => {
        const on = i + 1 === mem;
        m.el.classList.toggle('is-on', on);
        if (!on) return;
        const u = at(mem + 2);
        const p = MEMORIES[mem](u);
        draw(m.v, { ...p.v, squash: p.squash }, false);
        draw(m.m, { ...p.m, squash: p.squash }, true);
        m.el.style.setProperty('--zoom', 1 + u * 0.012);
        if (m.heart) { const h = p.heart; m.heart.style.opacity = h == null ? 0 : Math.sin(Math.PI * Math.min(1, h / 2.2)); m.heart.style.translate = `0 ${h == null ? 0 : -h * 40}px`; }
        if (m.leaf) {
          const f = p.leafOff;
          m.leaf.style.translate = f == null ? '0 0' : `${f * 160}px ${f * 120 + f * f * 160}px`;
          m.leaf.style.rotate = f == null ? `${Math.sin(t * 2) * 6}deg` : `${f * 400}deg`;
          m.leaf.style.opacity = f != null && f > 1.6 ? 0 : 1;
        }
        if (m.flowers) m.flowers.style.setProperty('--offer', p.flowers);
      });

      /* the mirror: her reflection fades a little more with each line, then cracks */
      const fade = Math.min(1, Math.max(0, latest + 1) / 3);         // 0 -> 1 over the first three lines
      const cracked = at(7) > 0.6;
      refl.el.style.opacity = 0.85 - fade * 0.4;
      refl.el.style.filter = `saturate(${0.75 - fade * 0.55}) blur(${fade * 0.8}px)`;
      for (const f of FACES) refl.el.classList.toggle(f, ['is-sad', 'is-tired'].includes(f));
      refl.look.style.transform = LOOK[latest >= 2 ? 'down' : 'at'];
      refl.eyes.style.transform = `scaleY(${1 - 0.9 * bump(t % 4.1, 2.3, 0.1)})`;
      refl.blush.style.opacity = 0.1;
      refl.body.style.transform = `scale(${1 + Math.sin(t * 1.7) * 0.01}, ${1 - Math.sin(t * 1.7) * 0.01 - (cracked ? 0.05 : 0)})`;
      refl.shapes.forEach(x => x.setAttribute('d', blobPath(DEFAULT_HANDS, [4, 6])));
      tears.classList.toggle('is-on', at(7) > 0.2);
      crack.classList.toggle('is-on', cracked);
      glass.classList.toggle('is-cracked', cracked);

      // violet from behind: breathing, a little slumped; trembles when it cracks
      const shake = cracked ? Math.sin(t * 30) * 1.2 : 0;
      back.el.style.translate = `${shake}px 0`;
      back.body.style.transform = `scale(${1 + Math.sin(t * 1.7) * 0.012}, ${1 - Math.sin(t * 1.7) * 0.012 - fade * 0.03})`;
      back.shapes.forEach(x => x.setAttribute('d', blobPath(DEFAULT_HANDS, [4, 6])));

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const tiny = (x, flip) => ({ left: x - 140, top: 660 - 232 * 0.95, width: 280, height: 232, '--flip': flip ? -1 : 1 });
  const memBlobs = k => (
    <>
      <div className="mi-blob" data-role="v" style={tiny(0, false)}>
        <div className="mi-blob__art"><div className="mi-blob__body" data-body><BlobArt who="violet" idSuffix={`mi-v${k}`} /></div></div>
        {k === 3 && <div className="mi-leaf" data-leaf />}
      </div>
      <div className="mi-blob" data-role="m" style={tiny(0, true)}>
        <div className="mi-blob__art"><div className="mi-blob__body" data-body><BlobArt who="mango" idSuffix={`mi-m${k}`} /></div></div>
        {k === 4 && <div className="mi-flowers" data-flowers><i /><i /><i /><i /><i /><b /></div>}
      </div>
    </>
  );

  return (
    <div className="mi" ref={root} aria-hidden>
      <div className="mi-world" data-world>
        {/* bathroom */}
        <div className="mi-wall" />
        <div className="mi-light" />
        <div className="mi-mirror">
          <div className="mi-glass" data-glass>
            <div className="mi-glass__room" />
            <div className="mi-blob mi-refl" data-blob="refl">
              <div className="mi-blob__art"><div className="mi-blob__body" data-body><BlobArt who="violet" idSuffix="mi-refl" /></div></div>
              <div className="mi-tears" data-tears><i /><i /></div>
            </div>
            <div className="mi-glass__sheen" />
            <svg className="mi-crack" data-crack viewBox="0 0 480 540">
              <path d="M262 236 L214 150 L226 92 L190 20" />
              <path d="M262 236 L330 190 L402 204 L470 150" />
              <path d="M262 236 L300 320 L282 408 L320 530" />
              <path d="M262 236 L176 280 L110 262 L18 318" />
              <path d="M262 236 L236 330 L170 420" />
              <path d="M214 150 L160 150" /><path d="M330 190 L350 120" /><path d="M300 320 L370 360" />
            </svg>
          </div>
        </div>
        <div className="mi-counter"><i className="mi-cup" /><i className="mi-plant" /><i className="mi-tap" /></div>
        <div className="mi-blob mi-back" data-blob="back">
          <div className="mi-blob__art"><div className="mi-blob__body" data-body><BlobArt who="violet" idSuffix="mi-back" /></div></div>
        </div>

        {/* memories */}
        <div className="mi-mem mi-mem--field" data-mem="1">
          <div className="mi-mem__scene"><div className="mi-sky" /><div className="mi-hill" /><div className="mi-flowersbg" />{memBlobs(1)}</div>
        </div>
        <div className="mi-mem mi-mem--sunset" data-mem="2">
          <div className="mi-mem__scene"><div className="mi-sky" /><div className="mi-sun" /><div className="mi-hill" />{memBlobs(2)}<div className="mi-heart" data-heart>♥</div></div>
        </div>
        <div className="mi-mem mi-mem--fall" data-mem="3">
          <div className="mi-mem__scene"><div className="mi-sky" /><div className="mi-tree"><i /></div><div className="mi-hill" /><div className="mi-falling"><i /><i /><i /><i /><i /><i /></div>{memBlobs(3)}</div>
        </div>
        <div className="mi-mem mi-mem--home" data-mem="4">
          <div className="mi-mem__scene"><div className="mi-homewall" /><div className="mi-homewin" /><div className="mi-homefloor" />{memBlobs(4)}</div>
        </div>
      </div>

      <div className="mi-memory-frame" />
      <div className="mi-vignette" />
      <div className="mi-timeskip" data-timeskip><span>{caption}</span></div>
    </div>
  );
}
