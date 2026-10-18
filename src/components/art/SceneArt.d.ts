// Lets TypeScript files use SceneArt (which is written in plain JavaScript).
import type { FC } from 'react';
import type { DialogueLine } from '../../types/scene';

export const ART: Record<string, FC<{ mood?: string; caption?: string; line?: number; lines?: DialogueLine[] }>>;
declare const SceneArt: FC<{ name: string; mood?: string; caption?: string; line?: number; lines?: DialogueLine[] }>;
export default SceneArt;
