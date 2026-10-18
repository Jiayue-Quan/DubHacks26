// Lets TypeScript files use SceneArt (which is written in plain JavaScript).
import type { FC } from 'react';

export const ART: Record<string, FC<{ mood?: string; caption?: string; line?: number }>>;
declare const SceneArt: FC<{ name: string; mood?: string; caption?: string; line?: number }>;
export default SceneArt;
