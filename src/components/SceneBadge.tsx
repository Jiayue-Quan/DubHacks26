import type { Scene } from "../types/scene";

export function SceneBadge({ scene }: { scene: Scene }) {
  const number = String(scene.sceneNumber ?? "").padStart(2, "0");
  const title = scene.title ?? scene.id;

  return (
    <div className="scene-badge">
      {scene.sceneNumber != null ? `Scene ${number}` : "Scene"}
      <span className="scene-badge-dot">·</span>
      {title}
    </div>
  );
}
