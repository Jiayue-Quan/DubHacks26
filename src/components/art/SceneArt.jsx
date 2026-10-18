import LivingRoom from './LivingRoom';
import Beach from './Beach';

/*
  Animated scene art, picked by name from the scene JSON:
    "art": "living_room",   <- which scene art to show (instead of the "background" image)
    "mood": "tense"         <- optional, changes how the blobs act (see LivingRoom.jsx)
    "timeSkip": "a few weeks later"   <- optional, a card shown for a moment when the scene starts

  To add another animated scene: make the component, then add it to ART below.
*/
export const ART = {
  living_room: LivingRoom,
  beach: Beach,
};

export default function SceneArt({ name, mood, caption, line }) {
  const Art = ART[name];
  return Art ? <Art mood={mood} caption={caption} line={line} /> : null;
}
