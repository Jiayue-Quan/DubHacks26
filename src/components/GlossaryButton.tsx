import { useEffect, useState } from "react";
import type { Glossary } from "../types/scene";
import "./GlossaryPopup.css";

/*
  The educational popup ("What is DARVO?").
  - Always shows a 📖 button so the player can open it again.
  - If the scene's glossary has "autoOpen": true, it pops up by itself a moment after the
    scene appears (so the player sees what just happened first).
  - If it has "steps", each one shows a part of the tactic next to the line that was said.
*/
export function GlossaryButton({ glossary, ready = true }: { glossary?: Glossary | Glossary[]; ready?: boolean }) {
  const list = !glossary ? [] : Array.isArray(glossary) ? glossary : [glossary];
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const open = openIndex !== null;
  const current = openIndex !== null ? list[openIndex] : undefined;
  const hasNext = openIndex !== null && openIndex + 1 < list.length;
  // closing one popup opens the next one in the list (if there is one)
  const close = () => setOpenIndex((i) => (i !== null && i + 1 < list.length ? i + 1 : null));

  // pop up by itself (once per scene) a moment after the last line of dialogue shows up
  useEffect(() => {
    setOpenIndex(null);
    if (!ready || !list[0]?.autoOpen) return;
    const timer = setTimeout(() => setOpenIndex(0), (list[0].delay ?? 2) * 1000);
    return () => clearTimeout(timer);
  }, [glossary, ready]);

  // Esc closes it
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (list.length === 0 || !ready) return null;

  return (
    <>
      {list.map((g, i) => (
        <button key={g.label} className="glossary-button" type="button" onClick={() => setOpenIndex(i)}>
          <span aria-hidden>📖</span>
          {g.label}
        </button>
      ))}
      {current && (
        <div className="lesson-backdrop" onClick={() => setOpenIndex(null)}>
          <div
            key={openIndex}
            className="lesson-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lesson-title"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="lesson-tag">pause &amp; notice</span>
            <h2 id="lesson-title" className="lesson-title">{current.label}</h2>
            <p className="lesson-body">{current.body}</p>

            {current.steps && (
              <>
                <p className="lesson-subhead">in this scene</p>
                <ol className="lesson-steps">
                  {current.steps.map((step) => (
                    <li key={step.word} className="lesson-step">
                      <span className="lesson-letter" aria-hidden>{step.letter}</span>
                      <span className="lesson-step-text">
                        <b>{step.word}</b>
                        <q>{step.quote}</q>
                      </span>
                    </li>
                  ))}
                </ol>
              </>
            )}

            {current.note && <p className="lesson-note">{current.note}</p>}

            <button className="lesson-close" type="button" onClick={close} autoFocus>
              {hasNext ? "Next" : "I see it"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
