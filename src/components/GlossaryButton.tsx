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
export function GlossaryButton({ glossary }: { glossary?: Glossary }) {
  const [open, setOpen] = useState(false);

  // pop up by itself (once per scene) after a short pause
  useEffect(() => {
    setOpen(false);
    if (!glossary?.autoOpen) return;
    const timer = setTimeout(() => setOpen(true), (glossary.delay ?? 2.5) * 1000);
    return () => clearTimeout(timer);
  }, [glossary]);

  // Esc closes it
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!glossary) return null;

  return (
    <>
      <button className="glossary-button" type="button" onClick={() => setOpen(true)}>
        <span aria-hidden>📖</span>
        {glossary.label}
      </button>
      {open && (
        <div className="lesson-backdrop" onClick={() => setOpen(false)}>
          <div
            className="lesson-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lesson-title"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="lesson-tag">pause &amp; notice</span>
            <h2 id="lesson-title" className="lesson-title">{glossary.label}</h2>
            <p className="lesson-body">{glossary.body}</p>

            {glossary.steps && (
              <>
                <p className="lesson-subhead">in this scene</p>
                <ol className="lesson-steps">
                  {glossary.steps.map((step) => (
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

            {glossary.note && <p className="lesson-note">{glossary.note}</p>}

            <button className="lesson-close" type="button" onClick={() => setOpen(false)} autoFocus>
              I see it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
