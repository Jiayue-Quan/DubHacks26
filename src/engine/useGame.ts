import { useCallback, useMemo, useState } from "react";
import { gameData, sceneById } from "../data/game";
import type { Scene } from "../types/scene";

export function useGame() {
  const [sceneId, setSceneId] = useState(gameData.startScene);
  const [history, setHistory] = useState<string[]>([]);

  const scene: Scene | undefined = sceneById[sceneId];

  const goTo = useCallback((nextId: string | null) => {
    if (!nextId) return;
    setHistory((prev) => [...prev, sceneId]);
    setSceneId(nextId);
  }, [sceneId]);

  const restart = useCallback(() => {
    setHistory([]);
    setSceneId(gameData.startScene);
  }, []);

  const backgrounds = useMemo(() => {
    if (!scene) return [];
    return Array.isArray(scene.background)
      ? scene.background
      : [scene.background];
  }, [scene]);

  return { scene, sceneId, backgrounds, goTo, restart, history };
}
