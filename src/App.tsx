import { useState } from "react";
import OpeningScene from "./components/opening/OpeningScene";
import ExpositionScene from "./components/exposition/ExpositionScene";
import { SceneView } from "./components/SceneView";
import { useGame } from "./engine/useGame";

// what's on screen: the book menu + opening -> "how it started" -> the game
type Stage = "opening" | "exposition" | "game";

export default function App() {
  const { scene, backgrounds, goTo } = useGame();
  const [stage, setStage] = useState<Stage>("opening");

  if (stage === "opening") return <OpeningScene onComplete={() => setStage("exposition")} />;
  if (stage === "exposition") return <ExpositionScene onComplete={() => setStage("game")} />;

  if (!scene) {
    return (
      <main className="game-shell missing-scene">
        <p>That scene is missing from the story JSON.</p>
      </main>
    );
  }

  return <SceneView scene={scene} backgrounds={backgrounds} onChoose={goTo} />;
}
