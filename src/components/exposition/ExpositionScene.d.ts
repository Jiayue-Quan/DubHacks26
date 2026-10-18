// Lets TypeScript files import the exposition scene (which is written in plain JavaScript).
import type { FC } from 'react';

declare const ExpositionScene: FC<{
  onComplete?: () => void;   // called when it finishes (or is skipped)
  speed?: number;            // 2 = twice as fast (for testing)
  startAt?: number;          // jump to this many seconds (for testing)
}>;
export default ExpositionScene;
