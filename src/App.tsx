import { SceneView } from "./components/SceneView";
import { useGame } from "./engine/useGame";

export default function App() {
  const { scene, backgrounds, goTo } = useGame();

  if (!scene) {
    return (
      <main className="game-shell missing-scene">
        <p>That scene is missing from the story JSON.</p>
      </main>
    );
  }

  return <SceneView scene={scene} backgrounds={backgrounds} onChoose={goTo} />;
}
