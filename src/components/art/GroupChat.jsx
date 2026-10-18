import { useEffect, useRef, useState } from 'react';
import LivingRoom from './LivingRoom';
import { speakerById } from '../../data/game';
import './GroupChat.css';

/*
  <GroupChat mood="chat" line={3} lines={scene.dialogue} />

  Scene 5: Violet alone on the couch at night (the living room art behind), and her phone up close,
  showing the family group chat. Messages show up in the phone as the dialogue lines come in:
  the family's messages get a "..." typing bubble first, and Violet's are typed out in the text box
  before they send. The chat stays on the phone when the next scene (05a / 05b) continues it.

  mood:
    "chat"          normal
    "chat_shaking"  after the last line, her hands start shaking (phone + Violet tremble)

  Extra things a dialogue line can have (in the scene JSON), only used by the phone:
    "time": "3 months ago"     a little date label above the message
    "history": true            an old message she's scrolling past (no typing animation)
    "deleted": "My blobfriend–"  she types this first, deletes it, then sends the real text
    "note": "Seen"             small grey text under the message
    "aloud": true              said out loud, not a text (not shown in the phone)
*/

const ME = 'purple';
const TYPE_SPEED = 24, DRAFT_SPEED = 16, DELETE_SPEED = 30;   // letters per second

// what's in the text box `e` seconds after she starts typing line `l`
function draft(l, e) {
  if (e < 0) return '';
  if (l.deleted) {
    const d = l.deleted;
    const t1 = d.length / DRAFT_SPEED;
    if (e < t1) return d.slice(0, Math.floor(e * DRAFT_SPEED));
    e -= t1;
    if (e < 0.6) return d;                      // stares at it...
    e -= 0.6;
    const t2 = d.length / DELETE_SPEED;
    if (e < t2) return d.slice(0, d.length - Math.floor(e * DELETE_SPEED));
    e -= t2;
    if (e < 0.35) return '';
    e -= 0.35;
  }
  return l.text.slice(0, Math.floor(e * TYPE_SPEED));
}

export default function GroupChat({ mood = 'chat', caption, line = 0, lines = [] }) {
  // keep messages from the previous scene(s) on the phone
  const [archive, setArchive] = useState([]);
  const prev = useRef({ lines: null, line: 0 });
  const changedAt = useRef(performance.now());
  const seen = useRef({ lines, line });
  if (seen.current.lines !== lines || seen.current.line !== line) {     // a new line (or scene) just came in
    seen.current = { lines, line };
    changedAt.current = performance.now();
  }
  useEffect(() => {
    if (prev.current.lines && prev.current.lines !== lines) {
      const old = prev.current.lines.slice(0, prev.current.line);
      setArchive(a => [...a, ...old]);
    }
    prev.current = { lines, line };
  }, [lines, line]);

  // re-draw ~30 times a second for the typing animation
  const [, setTick] = useState(0);
  useEffect(() => {
    let raf, last = 0;
    const loop = now => { if (now - last > 33) { last = now; setTick(x => x + 1); } raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const e = (performance.now() - changedAt.current) / 1000;
  const messages = [...archive, ...lines.slice(0, line)].filter(m => !m.aloud);
  const next = lines[line];
  const upcoming = next && !next.aloud && !next.history ? next : null;
  const typing = upcoming && upcoming.speaker === ME ? draft(upcoming, e - 0.35) : '';
  const dots = upcoming && upcoming.speaker !== ME && e > 0.45 ? upcoming.speaker : null;
  const shaking = mood === 'chat_shaking' && line >= lines.length && e > 1.0;

  const members = Object.values(speakerById).filter(s => s.id !== 'orange');
  const name = id => speakerById[id]?.name ?? id;
  const color = id => speakerById[id]?.color ?? '#ccc';

  return (
    <div className="gc">
      <LivingRoom mood="alone" caption={caption} line={line} shaking={shaking} />

      <div className={`gc-phone${shaking ? ' is-shaking' : ''}`}>
        <div className="gc-screen">
          <header className="gc-head">
            <span className="gc-back">‹</span>
            <span className="gc-avatars">
              {members.map(m => <i key={m.id} style={{ background: m.color }} />)}
            </span>
            <span className="gc-title"><b>fam 🏠</b><small>{members.length} members</small></span>
          </header>

          <div className="gc-messages">
            {messages.map((m, i) => {
              const me = m.speaker === ME;
              const first = i === 0 || messages[i - 1].speaker !== m.speaker || m.time;
              return (
                <div key={i} className="gc-group">
                  {m.time && <div className="gc-time">{m.time}</div>}
                  <div className={`gc-row${me ? ' is-me' : ''}`}>
                    {!me && <i className="gc-face" style={{ background: first ? color(m.speaker) : 'transparent' }} />}
                    <div className="gc-col">
                      {!me && first && <span className="gc-name">{name(m.speaker)}</span>}
                      <p className="gc-bubble">{m.text}</p>
                      {m.note && <span className="gc-note">{m.note}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            {dots && (
              <div className="gc-row gc-dots">
                <i className="gc-face" style={{ background: color(dots) }} />
                <p className="gc-bubble"><span /><span /><span /></p>
              </div>
            )}
          </div>

          <footer className="gc-compose">
            <span className={`gc-input${typing ? ' has-text' : ''}`}>
              {typing || 'Message'}{typing && <i className="gc-caret" />}
            </span>
            <span className={`gc-send${typing ? ' is-on' : ''}`}>↑</span>
          </footer>
        </div>
      </div>
    </div>
  );
}
