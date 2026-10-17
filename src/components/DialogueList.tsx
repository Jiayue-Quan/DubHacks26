import { speakerById } from "../data/game";
import type { DialogueLine } from "../types/scene";
import { SpeakerFace } from "./SpeakerFace";

export function DialogueList({ lines }: { lines: DialogueLine[] }) {
  return (
    <div className="dialogue-list">
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
