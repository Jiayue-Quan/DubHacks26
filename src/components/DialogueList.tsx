import { speakerById } from "../data/game";
import type { DialogueLine } from "../types/scene";
import { SpeakerFace } from "./SpeakerFace";

export function DialogueList({ lines, onClick }: { lines: DialogueLine[]; onClick?: () => void }) {
  return (
    <div className={`dialogue-list${onClick ? " is-skippable" : ""}`} onClick={onClick}>
      {lines.map((line, index) => {
        const speaker = speakerById[line.speaker];
        return (
          <div className="dialogue-row" key={`${line.speaker}-${index}`}>
            <SpeakerFace speaker={speaker} />
            <p className="dialogue-bubble">
              {line.time && <span className="dialogue-time">{line.time}</span>}
              {line.text}
            </p>
          </div>
        );
      })}
    </div>
  );
}
