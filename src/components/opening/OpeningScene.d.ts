// Lets TypeScript files import the opening scene (which is written in plain JavaScript).
import type { FC } from 'react';

declare const OpeningScene: FC<{
  onComplete?: () => void;   // called when the opening finishes (or is skipped)
  speed?: number;            // 2 = twice as fast (for testing)
  startAt?: number;          // jump to this many seconds (for testing)
  title?: string;
}>;
export default OpeningScene;
