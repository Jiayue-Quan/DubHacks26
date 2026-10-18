import { useEffect, useRef } from "react";
import type { Choice, DialogueLine } from "../types/scene";
import { speakerById } from "../data/game";
import "./SpeechLayer.css";

/*
  Speech bubbles that float above whoever is talking, on top of the scene art.
  - Shows the newest line, plus the line before it (faded) when it was the other person: a back-and-forth.
  - Finds each character in the art by its blob (data-blob="violet" / "mango"), every frame,
    so the bubble follows them when they move. If they're not on screen, the bubble sits at the bottom.
  - When the lines are done, the choices show up under the last bubble, by Violet (the player).
  A line with "thought": true is drawn as a thought bubble (inner monologue).
*/

// which blob in the art belongs to which speaker
const BLOBS: Record<string, string[]> = {
  purple: ['[data-blob="violet"]', '[data-blob="refl"]'],
  orange: ['[data-blob="mango"]'],
};
const PLAYER = "purple";

type Group = { key: string; speaker: string; lines: { line: DialogueLine; old: boolean; i: number }[]; choices: boolean };

export function SpeechLayer({
  lines,
  shown,
  done,
  choices,
  onChoose,
}: {
  lines: DialogueLine[];
  shown: number;
  done: boolean;
  choices: Choice[];
  onChoose: (next: string | null) => void;
}) {
  const layer = useRef<HTMLDivElement>(null);

  // the last line, and the one before it if someone else said it
  const visible: { line: DialogueLine; old: boolean; i: number }[] = [];
  const cur = lines[shown - 1];
  const prev = lines[shown - 2];
  // a single "Continue" isn't something Violet says, so it goes at the bottom of the screen instead
  const isContinue = choices.length === 1 && choices[0].text.trim().toLowerCase() === "continue";
  const showChoices = done && choices.length > 0 && !isContinue;
  // (when the choices are up, drop the faded line if it's violet's, so the choices have room)
  if (cur && prev && prev.speaker !== cur.speaker && !(showChoices && prev.speaker === PLAYER))
    visible.push({ line: prev, old: true, i: shown - 2 });
  if (cur) visible.push({ line: cur, old: false, i: shown - 1 });

  // group them by speaker (each group floats over its character)
  const groups: Group[] = [];
  for (const v of visible) {
    let g = groups.find((x) => x.speaker === v.line.speaker);
    if (!g) groups.push((g = { key: v.line.speaker, speaker: v.line.speaker, lines: [], choices: false }));
    g.lines.push(v);
  }
  if (showChoices) {
    let g = groups.find((x) => x.speaker === PLAYER);
    if (!g) groups.push((g = { key: PLAYER, speaker: PLAYER, lines: [], choices: true }));
    g.choices = true;
  }

  // every frame: put each group above its character's head
  useEffect(() => {
    let raf = 0;
    const pos = new WeakMap<HTMLElement, { left: number; top: number }>();
    const place = () => {
      const el = layer.current;
      const panel = el?.parentElement;
      if (el && panel) {
        const box = panel.getBoundingClientRect();
        const placed: { g: HTMLElement; left: number; top: number; w: number; h: number; cx: number; floating: boolean }[] = [];
        el.querySelectorAll<HTMLElement>("[data-group]").forEach((g) => {
          const speaker = g.dataset.group!;
          let target: Element | null = null;
          for (const sel of BLOBS[speaker] ?? []) {
            const t = panel.querySelector(sel);
            if (!t) continue;
            const r = t.getBoundingClientRect();
            const cx = r.left + r.width / 2 - box.left;
            if (cx > 0 && cx < box.width && r.top - box.top < box.height && r.bottom > box.top) { target = t; break; }
          }
          const w = g.offsetWidth, h = g.offsetHeight;
          if (target) {
            const r = target.getBoundingClientRect();
            const cx = r.left + r.width / 2 - box.left;
            const head = r.top - box.top + r.height * 0.12;
            placed.push({ g, w, h, cx, left: cx - w / 2, top: Math.max(56, head - h - 14), floating: false });
          } else {
            // nobody to point at: bottom middle of the screen
            placed.push({ g, w, h, cx: box.width / 2, left: (box.width - w) / 2, top: box.height - h - 24, floating: true });
          }
        });
        // two bubbles side by side: push them apart so they don't overlap
        const side = placed.filter((p) => !p.floating).sort((a, b) => a.cx - b.cx);
        if (side.length === 2) {
          const [a, b] = side;
          const overlap = a.left + a.w + 12 - b.left;
          const vert = a.top < b.top + b.h && b.top < a.top + a.h;
          if (overlap > 0 && vert) { a.left -= overlap / 2; b.left += overlap / 2; }
        }
        for (const p of placed) {
          p.left = Math.max(12, Math.min(box.width - p.w - 12, p.left));
          // hold still unless the character really moved (so the bubbles don't jitter and are easy to click)
          const was = pos.get(p.g);
          if (was && Math.abs(was.left - p.left) < 6 && Math.abs(was.top - p.top) < 6) { p.left = was.left; p.top = was.top; }
          else if (was) { p.left = was.left + (p.left - was.left) * 0.25; p.top = was.top + (p.top - was.top) * 0.25; }
          pos.set(p.g, { left: p.left, top: p.top });
          p.g.style.transform = `translate(${Math.round(p.left)}px, ${Math.round(p.top)}px)`;
          p.g.style.setProperty("--tail", `${Math.max(24, Math.min(p.w - 24, p.cx - p.left))}px`);
          p.g.classList.toggle("is-floating", p.floating);
          p.g.style.opacity = "1";
        }
      }
      raf = requestAnimationFrame(place);
    };
    raf = requestAnimationFrame(place);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className={`speech-layer${groups.length > 1 ? " has-two" : ""}`} ref={layer}>
      {done && isContinue && (
        <button type="button" className="speech-continue" onClick={(e) => { e.stopPropagation(); onChoose(choices[0].next); }}>
          {choices[0].text} <span aria-hidden>›</span>
        </button>
      )}
      {groups.map((g) => {
        const sp = speakerById[g.speaker];
        return (
          <div key={g.key} className="speech-group" data-group={g.speaker} style={{ ["--who" as string]: sp?.color ?? "#ccc" }}>
            {g.lines.map(({ line, old, i }) => (
              <div key={i} className={`speech-bubble${old ? " is-old" : ""}${line.thought ? " is-thought" : ""}`}>
                <span className="speech-name">{sp?.name ?? g.speaker}</span>
                {line.time && <span className="speech-time">{line.time}</span>}
                <p>{line.text}</p>
              </div>
            ))}
            {g.choices && (
              <div className="speech-choices">
                {choices.map((c) => (
                  <button key={c.text} type="button" className="speech-choice"
                    onClick={(e) => { e.stopPropagation(); onChoose(c.next); }}>
                    {c.text}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
