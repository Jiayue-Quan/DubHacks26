export type SpeakerId = string;

export type DialogueLine = {
  speaker: SpeakerId;
  text: string;
  pause?: number;     // optional: extra seconds to wait before this line shows up
  time?: string;      // optional: a small label like "3 months ago" (for texts)
  history?: boolean;  // optional (phone scenes): an old text that's already in the chat when the scene starts
  deleted?: string;   // optional (phone scenes): typed first, then deleted, before the real text is sent
  note?: string;      // optional (phone scenes): small grey text under the message, like "Seen"
  aloud?: boolean;    // optional (phone scenes): said out loud, not a text
  thought?: boolean;  // optional: inner monologue (drawn as a thought bubble)
};

export type Choice = {
  text: string;
  next: string | null;
};

export type Glossary = {
  label: string;
  body: string;
  autoOpen?: boolean;   // pop up by itself when the scene appears
  delay?: number;       // seconds to wait after the last line before it pops up (default 2)
  steps?: { letter: string; word: string; quote: string }[];   // each part of the tactic + the line that showed it
  note?: string;        // an extra line at the bottom
};

export type Scene = {
  id: string;
  title?: string;
  sceneNumber?: number;
  background: string | string[];
  art?: string;   // animated scene art (e.g. "living_room"); shown instead of the background image
  mood?: string;  // optional: how the blobs act in that art (e.g. "tense", "hurt", "apology", "calm")
  timeSkip?: string;  // optional: a card like "a few weeks later" shown when the scene starts
  layout?: "phone" | "full";  // optional: "phone" = the phone on screen is the conversation; "full" = just the art, full screen
  wait?: number;      // optional: seconds before the first line shows (to let something happen first)
  dialogue: DialogueLine[];
  choices: Choice[];
  glossary?: Glossary | Glossary[];   // one popup, or a list that opens one after another
};

export type Speaker = {
  id: SpeakerId;
  name: string;
  color: string;
  face: "neutral" | "sad" | "annoyed" | "soft";
};

export type GameData = {
  startScene: string;
  speakers: Speaker[];
  scenes: Scene[];
};
