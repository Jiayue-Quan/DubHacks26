export type SpeakerId = string;

export type DialogueLine = {
  speaker: SpeakerId;
  text: string;
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
