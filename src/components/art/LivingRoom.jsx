import { useEffect, useRef } from 'react';
import BlobArt, { DEFAULT_HANDS } from '../blob/BlobArt';
import { blobPath } from '../opening/sceneEngine';
import './LivingRoom.css';

/*
  <LivingRoom mood="mocking" caption="a few weeks later" line={3} />

  Scene art only (no dialogue). Their apartment, evening, rain on the window.
  Everything keeps gently moving: breathing, blinking, rain, the clock, steam from a mug.
  When the next scene has a different mood, the blobs smoothly move into it.

  mood (set per scene in the JSON with "mood"):
   scene 1 (both on the couch)
    "mocking"   plays once: Violet is excited -> Mango laughs and shakes their head -> Violet frowns
    "hurt"      Violet is hurt and looks away; Mango stares, annoyed
    "guilt"     Mango puts on a sad, wounded face; Violet looks at them, worried (DARVO)
    "apology"   Violet looks down, small; Mango looks pleased
    "cuddle"    Mango scoots over and wraps a nub around Violet
   scene 2
    "blowup"    plays once: Violet comes home exhausted (backpack, dark circles) to a messy room
                -> Mango knocks the photo off the wall -> waves angrily at the mess -> slumps, sulking
    "concern"   messy room; Mango acts sweet and caring; Violet, tired, is unsure
    "shifts"    messy room; Violet offers to work more; Mango pauses, then looks away, cold
    "car"       couch; Violet asks hopefully; Mango looks away, unsure
    "brochures" plays once: camera looks down at the "transportation plan" on the table
                -> Mango pats Violet on the head -> laughs at their own joke; Violet stares at the helmet
    "late"      night; Violet gets home late -> Mango is angry -> storms off to bed; Violet alone
   other
    "tense"     Mango scrolls their phone and rolls their eyes; Violet is unsure
    "calm"      both relaxed and happy

  caption: optional time-skip card shown for a moment when the scene starts
           (set it in the JSON with "timeSkip": "a few weeks later").
  line:    how many dialogue lines are showing so far. The big moments are timed to the lines
           (e.g. Mango slams the wall when "Cleaning up after me?" appears). Line numbers start at 0.
*/

const MOODS = ['mocking', 'hurt', 'guilt', 'apology', 'cuddle', 'blowup', 'concern', 'shifts', 'car', 'brochures', 'late', 'tense', 'calm'];
const FACES = ['is-happy', 'is-laugh', 'is-unsure', 'is-annoyed', 'is-sad', 'is-surprised', 'is-tired'];

const W = 1600, H = 900;                    // the room is drawn in a 1600 x 900 frame
const VIOLET = { x: 1035, ground: 618, w: 214, h: 178 };   // where violet sits on the couch
const MANGO = { x: 1318, ground: 618, w: 226, h: 188 };
const STAND = { dx: -340, dy: 150 };        // violet standing by the door instead (offset from the couch spot)
const CAM = {
  couch: { x: 1170, y: 540, z: 1.32 },
  room:  { x: 1040, y: 590, z: 1.12 },       // when violet is standing, show more of the room
  table: { x: 1172, y: 738, z: 2.7 },        // close-up on the coffee table
};
const CAPTION_TIME = 2.6;                    // how long the time-skip card stays up

// what each blob does in each mood.
// s = seconds since the mood started. at(i) = seconds since dialogue line i appeared (negative = not yet)
function pose(mood, s, hasCaption, at) {
  switch (mood) {
    case 'mocking': {                       // line 1: "You? Really?"
      const l = at(1);
      const laughing = l > 0.1 && l < 2.5;
      return {
        violet: l < 1.8 ? ['is-happy'] : l < 2.6 ? [] : ['is-sad'],
        violetLook: l < 2.6 ? 'at' : 'down', violetBlush: l < 1.8 ? 1 : 0.3,
        mango: laughing ? ['is-happy', 'is-laugh'] : [], mangoLook: 'at',
        headshake: laughing ? Math.sin(s * 15) * 4 : 0, hop: laughing ? Math.abs(Math.sin(s * 9)) * 5 : 0,
      };
    }
    case 'hurt':    return { violet: ['is-sad'], violetLook: 'away', mango: ['is-annoyed'], mangoLook: 'at' };
    case 'guilt':   return { violet: ['is-unsure'], violetLook: 'at', mango: ['is-sad'], mangoLook: 'down' };
    case 'apology': return { violet: ['is-sad'], violetLook: 'down', mango: ['is-happy'], mangoLook: 'at', shrink: 0.05 };
    case 'cuddle':  return { violet: [], violetLook: 'down', violetBlush: 0.6, mango: ['is-happy'], mangoLook: 'at', mangoBlush: 1, cuddle: true };

    case 'blowup': {
      const b = at(1) - 0.2;                // line 1 "Cleaning up after me?" -> slams the wall
      const g = at(4) - 0.3;                // line 4 "...scrubbing dishes and picking up trash" -> waves at the mess
      const sigh = at(6) - 0.2;             // line 6 "I'm just stressed..." -> deflated sigh
      const slam = b > 0 && b < 0.7;
      const angry = b > 0 && sigh < 0;
      const gesture = g > 0 && g < 2.6;
      return {
        stand: true, enter: true, backpack: true, mess: true, cam: 'room', photoGone: b > 0.35,
        violet: b < 0.3 ? ['is-tired', 'is-unsure'] : b < 1.4 ? ['is-tired', 'is-surprised'] : sigh < 0 ? ['is-tired', 'is-sad'] : ['is-tired', 'is-unsure'],
        violetLook: s < 1.8 ? 'down' : 'at',
        mango: b < 0 ? ['is-unsure'] : angry ? ['is-annoyed'] : ['is-sad'],
        mangoLook: sigh > 0 ? 'down' : 'at',
        hop: slam ? Math.sin(b / 0.7 * Math.PI) * 55 : angry ? Math.abs(Math.sin(s * 7)) * 3 : 0,
        mangoHand: slam ? 115 : gesture ? 40 + Math.sin(s * 5) * 45 : null,
        headshake: gesture ? Math.sin(s * 9) * 3 : 0,
        slump: sigh > 0 ? Math.min(1, sigh * 2) : 0,
        shake: Math.max(0, 1 - Math.abs(b - 0.4) / 0.25),
      };
    }
    case 'concern': return { stand: true, backpack: true, mess: true, cam: 'room', fallen: true,
      violet: ['is-tired', 'is-unsure'], violetLook: 'at', mango: ['is-happy'], mangoLook: 'at', mangoBlush: 0.8 };
    case 'shifts':  return { stand: true, backpack: true, mess: true, cam: 'room', fallen: true,
      violet: ['is-tired'], violetLook: 'at',
      mango: at(1) < 0 ? ['is-surprised'] : ['is-unsure'], mangoLook: at(1) < 0 ? 'at' : 'away' };   // line 1: "Well... if that's what you want"
    case 'car':     return { fallen: true, cam: 'couch',            // line 1: "A car? But, that's a lot of money."
      violet: [], violetLook: 'at', violetBlush: 0.7, mango: at(1) < 0 ? [] : ['is-unsure'], mangoLook: at(1) < 0 ? 'at' : 'away' };
    case 'brochures': {
      const k = at(4) - 0.2;                // line 4 "...a little less... blob-y!" -> pat on the head, then laughs
      const pat = k > 0 && k < 1.7;
      const laughing = k > 1.7 && k < 3.3;
      return {
        fallen: true, brochures: true, cam: at(1) < 0.6 ? 'table' : 'couch',   // look at the table until Mango explains (line 1)
        violet: k < 1.7 ? ['is-unsure'] : ['is-sad'], violetLook: 'down',
        mango: laughing ? ['is-happy', 'is-laugh'] : ['is-happy'], mangoLook: 'at', mangoBlush: 0.8,
        scoot: pat ? -70 : 0, pat, patSquash: pat ? Math.max(0, Math.sin(k * 9)) * 0.05 : 0,
        headshake: laughing ? Math.sin(s * 15) * 4 : 0, hop: laughing ? Math.abs(Math.sin(s * 9)) * 4 : 0,
      };
    }
    case 'late': {
      const a = at(6);                      // line 6 "I don't care about the money!" -> angry
      const bed = at(11) - 1.2;             // line 11 "...I'm going to bed." -> leaves
      const leaving = bed > 0;
      return {
        night: true, stand: true, enter: true, enterAt: hasCaption ? CAPTION_TIME : 0, backpack: true, mess: true, fallen: true, cam: 'room',
        violet: leaving ? ['is-tired', 'is-sad'] : at(2) < 0 ? ['is-tired', 'is-unsure'] : ['is-tired', 'is-sad'],
        violetLook: leaving ? 'down' : 'at',
        mango: ['is-annoyed'], mangoLook: 'at',
        hop: a > 0 && a < 3.5 ? Math.abs(Math.sin(s * 6)) * 6 : 0,
        mangoHand: a > 0.5 && a < 3 ? 30 + Math.sin(s * 6) * 30 : null,
        leave: leaving ? Math.min(1, bed / 1.6) : 0,
      };
    }
    case 'calm':    return { violet: ['is-happy'], violetLook: 'at', violetBlush: 1, mango: ['is-happy'], mangoLook: 'at', mangoBlush: 1 };
    default:        return { violet: ['is-unsure'], violetLook: 'glance', mango: ['is-annoyed'], mangoLook: 'phone', phone: true };
  }
}

const LOOK = { at: 'translate(4px, -1px)', down: 'translate(1px, 5px)', away: 'translate(-2px, 3px)', phone: 'translate(3px, 5px)' };

export default function LivingRoom({ mood = 'mocking', caption, line }) {
  const root = useRef(null);
  const moodRef = useRef(mood);
  moodRef.current = MOODS.includes(mood) ? mood : 'mocking';
  const captionRef = useRef(caption);
  captionRef.current = caption;
  const lineRef = useRef(line);
  lineRef.current = line;

  useEffect(() => {
    const el = root.current;
    const $ = s => el.querySelector(s);
    const world = $('[data-world]');
    const parts = name => {
      const b = $(`[data-blob="${name}"]`);
      return { el: b, body: b.querySelector('[data-body]'), shapes: [...b.querySelectorAll('[data-shape]')],
               eyes: b.querySelector('[data-eyes]'), look: b.querySelector('[data-look]'), blush: b.querySelector('[data-blush]') };
    };
    const violet = parts('violet'), mango = parts('mango');
    const phone = $('[data-phone]'), photo = $('[data-photo]'), timeskip = $('[data-timeskip]');
    const sets = { mess: $('[data-mess]'), brochures: $('[data-brochures]'), night: $('[data-night]'), backpack: $('[data-backpack]') };
    const hands = { h: $('[data-hour]'), m: $('[data-min]'), s: $('[data-sec]') };
    let raf, t = 0, last = performance.now(), moodNow = null, moodStart = 0;
    let lineAt = [];                        // when each dialogue line appeared (in t)
    // these ease toward each mood's targets
    const cur = { mx: 0, my: 0, lean: 0, vlean: 0, drape: 0, vdx: 0, vdy: 0, camX: CAM.couch.x, camY: CAM.couch.y, camZ: CAM.couch.z, slump: 0 };
    const bump = (x, at, w) => Math.max(0, 1 - Math.abs(x - at) / w);
    const loop = (x, period) => x % period;
    const ease = (key, target, dt, speed = 3) => { cur[key] += (target - cur[key]) * (1 - Math.exp(-dt * speed)); };

    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
      const first = moodNow === null;
      if (moodRef.current !== moodNow) { moodNow = moodRef.current; moodStart = t; }
      const s = t - moodStart;
      const n = lineRef.current;
      if (n != null && n < lineAt.length) lineAt = [];                     // a new scene started
      while (n != null && lineAt.length < n) lineAt.push(t);
      const sc = captionRef.current ? s - CAPTION_TIME : s;
      // seconds since line i showed up (if no line info is given, pretend one line every 2.5s)
      const at = i => n == null ? sc - i * 2.5 : i < lineAt.length ? t - lineAt[i] : -1e9;
      const p = pose(moodNow, s, !!captionRef.current, at);

      /* time-skip card */
      const cap = captionRef.current;
      timeskip.style.opacity = cap ? 1 - Math.max(0, Math.min(1, (s - (CAPTION_TIME - 0.6)) / 0.6)) : 0;

      /* camera: fit the 1600x900 room into the panel (like background-size: cover), eased between shots */
      const cam = CAM[p.cam || 'couch'];
      const camSpeed = first || (cap && s < CAPTION_TIME) ? 100 : 2;          // jump cuts behind the time-skip card
      ease('camX', cam.x, dt, camSpeed); ease('camY', cam.y, dt, camSpeed); ease('camZ', cam.z, dt, camSpeed);
      const pw = el.clientWidth, ph = el.clientHeight;
      const z = Math.max(pw / W, ph / H) * (cur.camZ + Math.sin(t * 0.12) * 0.015);
      const fx = cur.camX + Math.sin(t * 0.07) * 14, fy = cur.camY;
      const shake = (p.shake || 0) * 10;
      const tx = Math.min(0, Math.max(pw - W * z, pw / 2 - fx * z)) + Math.sin(t * 90) * shake;
      const ty = Math.min(0, Math.max(ph - H * z, ph / 2 - fy * z)) + Math.cos(t * 80) * shake;
      world.style.transform = `translate(${tx}px, ${ty}px) scale(${z})`;

      /* props + lighting */
      sets.mess.classList.toggle('is-on', !!p.mess);
      sets.brochures.classList.toggle('is-on', !!p.brochures);
      sets.night.classList.toggle('is-on', !!p.night);
      sets.backpack.classList.toggle('is-on', !!p.backpack);
      el.classList.toggle('is-night', !!p.night);
      const gone = p.fallen || p.photoGone;
      photo.classList.toggle('is-gone', !!gone);

      /* faces */
      for (const [b, faces] of [[violet, p.violet], [mango, p.mango]]) {
        for (const f of FACES) b.el.classList.toggle(f, faces.includes(f));
      }
      phone.classList.toggle('is-out', !!p.phone);

      /* violet: on the couch or standing; walks in from the door when the scene starts */
      const jump = first || (cap && s < CAPTION_TIME);                         // place instantly (no sliding) behind the card
      if (p.enter && s - (p.enterAt || 0) < 0.05) { cur.vdx = STAND.dx - 700; cur.vdy = STAND.dy; }   // start off-screen by the door
      const vspeed = jump && !p.enter ? 100 : 3;
      ease('vdx', p.stand ? STAND.dx : 0, dt, vspeed); ease('vdy', p.stand ? STAND.dy : 0, dt, vspeed);
      const walking = Math.abs((p.stand ? STAND.dx : 0) - cur.vdx) > 8;
      const vHop = walking ? Math.abs(Math.sin(t * 9)) * 12 : 0;
      violet.el.style.translate = `${cur.vdx}px ${cur.vdy - vHop}px`;
      const vc = loop(t, 5.5);
      const vLook = p.violetLook === 'glance' ? (vc < 3 ? 'at' : 'down') : p.violetLook;
      violet.look.style.transform = LOOK[vLook];
      violet.eyes.style.transform = `scaleY(${1 - 0.9 * bump(loop(t, 3.7), 1.2, 0.09)})`;
      violet.blush.style.opacity = p.violetBlush ?? 0.35;
      const shrink = (p.shrink || 0) + (p.patSquash || 0);
      const vBreathe = Math.sin(t * 1.9) * 0.012;
      ease('vlean', p.cuddle ? 4 : 0, dt, 2.2);
      violet.body.style.transform = `rotate(${cur.vlean + Math.sin(t * 0.8) * 1}deg) scale(${1 + vBreathe - shrink * 0.4}, ${1 - vBreathe - shrink})`;
      const fidget = Math.sin(t * 2.3) * 5;
      violet.shapes.forEach(x => x.setAttribute('d', blobPath(DEFAULT_HANDS, [6 + fidget, (p.backpack ? 20 : 8) - fidget])));

      /* mango */
      ease('mx', p.cuddle ? -78 : p.leave ? 0 : (p.scoot || 0), dt, 2.2);
      ease('lean', p.cuddle ? 8 : 0, dt, 2.2);
      ease('drape', p.cuddle ? 1 : 0, dt, 2.2);
      ease('slump', p.slump || 0, dt, 4);
      const leaveX = (p.leave || 0) * 760;
      const leaveHop = p.leave > 0 && p.leave < 1 ? Math.abs(Math.sin(t * 10)) * 14 : 0;
      mango.el.style.translate = `${cur.mx + leaveX}px ${-(p.hop || 0) - leaveHop}px`;
      const mc = loop(t, 6.4);
      const roll = p.phone && mc > 4.6 && mc < 5.4;                   // the eye-roll (tense mood)
      mango.look.style.transform = roll ? 'translate(-2px, -7px)' : LOOK[p.mangoLook];
      mango.eyes.style.transform = `scaleY(${1 - 0.9 * bump(loop(t, 4.3), 2.1, 0.09)})`;
      mango.blush.style.opacity = p.mangoBlush ?? 0.25;
      const mBreathe = Math.sin(t * 1.6 + 1) * 0.01;
      const sigh = (p.phone ? bump(mc, 5.0, 0.5) * 0.03 : 0) + cur.slump * 0.06;
      // when leaving, mango turns around (faces right, toward the bedroom)
      mango.el.style.setProperty('--flip', p.leave > 0 ? 1 : -1);
      mango.body.style.transform = `rotate(${cur.lean + (p.headshake || 0)}deg) scale(${1 + mBreathe + sigh}, ${1 - mBreathe - sigh})`;
      const scroll = p.phone ? Math.abs(Math.sin(t * 5)) * 5 * (mc < 4.4 ? 1 : 0) : 0;
      // front hand: phone (tense) / drapes around violet (cuddle) / up on violet's head (pat) / waving (angry)
      const patUp = p.pat ? 1 : 0;
      const wave = p.mangoHand != null ? 1 : 0;                       // angry slam / dramatic gesture: a bigger arm
      const front = DEFAULT_HANDS.map((h, i) => i === 1
        ? { ...h, len: h.len + cur.drape * 26 + patUp * 30 + wave * 26, y: h.y - cur.drape * 34 - patUp * 50 - wave * 30 }
        : h);
      const patLift = p.pat ? 70 + Math.sin(t * 18) * 14 : 0;
      const frontLift = p.mangoHand ?? (p.phone ? 68 + scroll : p.pat ? patLift : cur.drape * 40);
      mango.shapes.forEach(x => x.setAttribute('d', blobPath(front, [cur.slump * -10, frontLift - cur.slump * 20])));
      phone.style.setProperty('--flicker', 0.75 + Math.sin(t * 7) * 0.08 + scroll * 0.03);

      /* the clock tells the real time */
      const d = new Date();
      hands.s.style.transform = `rotate(${d.getSeconds() * 6}deg)`;
      hands.m.style.transform = `rotate(${d.getMinutes() * 6 + d.getSeconds() * 0.1}deg)`;
      hands.h.style.transform = `rotate(${(d.getHours() % 12) * 30 + d.getMinutes() * 0.5}deg)`;

      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const place = (p, flip) => ({
    left: p.x - p.w / 2, top: p.ground - p.h * 0.95, width: p.w, height: p.h,
    '--flip': flip ? -1 : 1,
  });

  return (
    <div className="lr" ref={root} aria-hidden>
      <div className="lr-world" data-world>
        {/* wall + window */}
        <div className="lr-wall" />
        <div className="lr-window">
          <div className="lr-window__sky" />
          <div className="lr-window__city" />
          <div className="lr-window__rain" />
          <div className="lr-window__bars" />
        </div>
        <div className="lr-curtain lr-curtain--l" />
        <div className="lr-curtain lr-curtain--r" />

        {/* the "first date" polaroid above the couch (gets knocked off in scene 2; a pale mark stays) */}
        <div className="lr-photo-mark" />
        <div className="lr-photo" data-photo><span /></div>

        {/* clock */}
        <div className="lr-clock">
          <i className="lr-clock__hand lr-clock__hand--h" data-hour />
          <i className="lr-clock__hand lr-clock__hand--m" data-min />
          <i className="lr-clock__hand lr-clock__hand--s" data-sec />
        </div>

        <div className="lr-floor" />
        <div className="lr-rug" />

        {/* floor lamp */}
        <div className="lr-lamp"><div className="lr-lamp__shade" /></div>

        {/* side table + mug */}
        <div className="lr-table">
          <div className="lr-mug"><i /><i /><i /></div>
        </div>

        {/* the couch, with both of them on it */}
        <div className="lr-couch-back" />
        <div className="lr-couch-seat" />
        <div className="lr-blob" data-blob="violet" style={place(VIOLET, false)}>
          <div className="lr-backpack" data-backpack />
          <div className="lr-blob__shadow" />
          <div className="lr-blob__art">
            <div className="lr-blob__body" data-body><BlobArt who="violet" idSuffix="lr-violet" /></div>
          </div>
        </div>
        <div className="lr-blob" data-blob="mango" style={place(MANGO, true)}>
          <div className="lr-blob__shadow" />
          <div className="lr-blob__art">
            <div className="lr-blob__body" data-body><BlobArt who="mango" idSuffix="lr-mango" /></div>
          </div>
          <div className="lr-phone" data-phone><span /></div>
        </div>
        <div className="lr-couch-arm lr-couch-arm--l" />
        <div className="lr-couch-arm lr-couch-arm--r" />

        {/* coffee table */}
        <div className="lr-coffee" />

        {/* the mess (scene 2) */}
        <div className="lr-mess" data-mess>
          <div className="lr-pizza"><i /></div>
          <div className="lr-can lr-can--1" /><div className="lr-can lr-can--2" /><div className="lr-can lr-can--3" />
          <div className="lr-paper lr-paper--1" /><div className="lr-paper lr-paper--2" /><div className="lr-paper lr-paper--3" />
          <div className="lr-clothes" />
          <div className="lr-sock lr-sock--1" /><div className="lr-sock lr-sock--2" />
          <div className="lr-dishes"><i /><i /><i /></div>
        </div>

        {/* mango's "transportation plan" (scene 2, option A) */}
        <div className="lr-brochures" data-brochures>
          <div className="lr-guide"><b>The Most Efficient Walking Routes</b><span /></div>
          <div className="lr-pamphlet"><b>Power Walking Techniques for Beginners</b></div>
          <div className="lr-bikebook"><b>How to Ride a Bike</b></div>
          <div className="lr-helmet"><i /></div>
        </div>
      </div>

      {/* light: cold from the window, warm from the lamp; night darkens the room */}
      <div className="lr-light" />
      <div className="lr-night" data-night />
      <div className="lr-vignette" />

      {/* time-skip card */}
      <div className="lr-timeskip" data-timeskip><span>{caption}</span></div>
    </div>
  );
}
