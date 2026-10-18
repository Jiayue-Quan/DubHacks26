// Lets TypeScript files use SceneArt (which is written in plain JavaScript).
import type { FC } from 'react';

export const ART: Record<string, FC<{ mood?: string; caption?: string }>>;
declare const SceneArt: FC<{ name: string; mood?: string; caption?: string }>;
export default SceneArt;
