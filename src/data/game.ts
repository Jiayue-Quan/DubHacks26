import type { GameData, Scene, Speaker } from "../types/scene";
import speakers from "./speakers.json" with { type: "json" };

const sceneModules = import.meta.glob("./scenes/*.json", {
  eager: true,
  import: "default",
}) as Record<string, Scene>;

export const gameData: GameData = {
  startScene: "scene_01",
  speakers: speakers as Speaker[],
  scenes: Object.values(sceneModules),
};

export const sceneById: Record<string, Scene> = Object.fromEntries(
  gameData.scenes.map((scene) => [scene.id, scene]),
);

export const speakerById: Record<string, Speaker> = Object.fromEntries(
  gameData.speakers.map((speaker) => [speaker.id, speaker]),
);
