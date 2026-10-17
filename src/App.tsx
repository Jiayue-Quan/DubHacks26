import { useState } from "react";
import OpeningScene from "./components/opening/OpeningScene";
import { SceneView } from "./components/SceneView";
import { useGame } from "./engine/useGame";

export default function App() {
  const { scene, backgrounds, goTo } = useGame();
    const [introDone, setIntroDone] = useState(false);
      if (!introDone) return <OpeningScene onComplete={() => setIntroDone(true)} />;

  if (!scene) {
    return (
      <main className="game-shell missing-scene">
        <p>That scene is missing from the story JSON.</p>
      </main>
    );
  }

  return <SceneView scene={scene} backgrounds={backgrounds} onChoose={goTo} />;
}
