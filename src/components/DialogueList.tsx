import { useEffect, useRef } from "react";
import { speakerById } from "../data/game";
import type { DialogueLine } from "../types/scene";
import { SpeakerFace } from "./SpeakerFace";

export function DialogueList({ lines, onClick }: { lines: DialogueLine[]; onClick?: () => void }) {
  const list = useRef<HTMLDivElement>(null);

  // keep the newest line on screen
  useEffect(() => {
    list.current?.lastElementChild?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [lines.length]);

  return (
    <div className={`dialogue-list${onClick ? " is-skippable" : ""}`} ref={list} onClick={onClick}>
      {lines.map((line, index) => {
        const speaker = speakerById[line.speaker];
        return (
          <div className="dialogue-row" key={`${line.speaker}-${index}`}>
            <SpeakerFace speaker={speaker} />
            <p className="dialogue-bubble">{line.text}</p>
          </div>
        );
      })}
    </div>
  );
}
