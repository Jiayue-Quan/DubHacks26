import { useState } from "react";
import type { Glossary } from "../types/scene";

export function GlossaryButton({ glossary }: { glossary?: Glossary }) {
  const [open, setOpen] = useState(false);

  if (!glossary) return null;

  return (
    <>
      <button className="glossary-button" type="button" onClick={() => setOpen(true)}>
        <span aria-hidden>📖</span>
        {glossary.label}
      </button>
      {open && (
        <div className="glossary-backdrop" onClick={() => setOpen(false)}>
          <div
            className="glossary-modal"
            role="dialog"
            aria-labelledby="glossary-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="glossary-title">{glossary.label}</h2>
            <p>{glossary.body}</p>
            <button className="choice-button" type="button" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
