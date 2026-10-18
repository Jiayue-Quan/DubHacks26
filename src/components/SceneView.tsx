import { useEffect, useState } from "react";
import type { Scene } from "../types/scene";
import { Background } from "./Background";
import { ChoiceList } from "./ChoiceList";
import { DialogueList } from "./DialogueList";
import { GlossaryButton } from "./GlossaryButton";
import { SceneBadge } from "./SceneBadge";
import SceneArt from "./art/SceneArt";

const TIME_SKIP_WAIT = 2.9;   // seconds to wait for the "a few weeks later" card before the first line

// how long to wait before the next line, so there's time to read the one before it
function readingTime(text: string) {
  return Math.min(4.5, 0.9 + text.length * 0.03);
}

export function SceneView({
  scene,
  backgrounds,
  onChoose,
}: {
  scene: Scene;
  backgrounds: string[];
  onChoose: (next: string | null) => void;
}) {
  // how many dialogue lines are showing (remembered per scene, so a new scene starts at 0)
  const [progress, setProgress] = useState({ id: scene.id, shown: 0 });
  const shown = progress.id === scene.id ? progress.shown : 0;
  const done = shown >= scene.dialogue.length;
  const showNext = () =>
    setProgress((p) => ({ id: scene.id, shown: (p.id === scene.id ? p.shown : 0) + 1 }));

  // lines come in one at a time
  useEffect(() => {
    if (done) return;
    const wait = shown === 0
      ? (scene.timeSkip ? TIME_SKIP_WAIT : scene.wait ?? 0.4)
      : readingTime(scene.dialogue[shown - 1].text);
    const timer = setTimeout(showNext, wait * 1000);
    return () => clearTimeout(timer);
  }, [scene.id, shown, done]);

  return (
    <main className="game-shell">
      <section className="art-panel">
        <SceneBadge scene={scene} />
        {scene.art ? <SceneArt name={scene.art} mood={scene.mood} caption={scene.timeSkip} line={shown} /> : <Background images={backgrounds} />}
      </section>
      <section className="play-panel">
        {/* click the dialogue to skip ahead to the next line */}
        <DialogueList lines={scene.dialogue.slice(0, shown)} onClick={done ? undefined : showNext} />
        {done && <ChoiceList choices={scene.choices} onChoose={onChoose} />}
        <GlossaryButton glossary={scene.glossary} ready={done} />
      </section>
    </main>
  );
}
