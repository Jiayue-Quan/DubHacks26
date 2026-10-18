import type { Scene } from "../types/scene";
import { Background } from "./Background";
import { ChoiceList } from "./ChoiceList";
import { DialogueList } from "./DialogueList";
import { GlossaryButton } from "./GlossaryButton";
import { SceneBadge } from "./SceneBadge";
import SceneArt from "./art/SceneArt";

export function SceneView({
  scene,
  backgrounds,
  onChoose,
}: {
  scene: Scene;
  backgrounds: string[];
  onChoose: (next: string | null) => void;
}) {
  return (
    <main className="game-shell">
      <section className="art-panel">
        <SceneBadge scene={scene} />
        {scene.art ? <SceneArt name={scene.art} mood={scene.mood} caption={scene.timeSkip} /> : <Background images={backgrounds} />}
      </section>
      <section className="play-panel">
        <DialogueList lines={scene.dialogue} />
        <ChoiceList choices={scene.choices} onChoose={onChoose} />
        <GlossaryButton glossary={scene.glossary} />
      </section>
    </main>
  );
}
