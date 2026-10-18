import LivingRoom from './LivingRoom';

/*
  Animated scene art, picked by name from the scene JSON:
    "art": "living_room",   <- which scene art to show (instead of the "background" image)
    "mood": "tense"         <- optional, changes how the blobs act (see LivingRoom.jsx)
    "timeSkip": "a few weeks later"   <- optional, a card shown for a moment when the scene starts

  To add another animated scene: make the component, then add it to ART below.
*/
export const ART = {
  living_room: LivingRoom,
};

export default function SceneArt({ name, mood, caption }) {
  const Art = ART[name];
  return Art ? <Art mood={mood} caption={caption} /> : null;
}
