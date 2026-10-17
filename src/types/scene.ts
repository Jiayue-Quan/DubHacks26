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
};

export type Scene = {
  id: string;
  title?: string;
  sceneNumber?: number;
  background: string | string[];
  dialogue: DialogueLine[];
  choices: Choice[];
  glossary?: Glossary;
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
