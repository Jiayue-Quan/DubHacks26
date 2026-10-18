import { useEffect, useRef, useState } from "react";
import type { Scene } from "../types/scene";
import { Background } from "./Background";
import { ChoiceList } from "./ChoiceList";
import { DialogueList } from "./DialogueList";
import { GlossaryButton } from "./GlossaryButton";
import { SceneBadge } from "./SceneBadge";
import { SpeechLayer } from "./SpeechLayer";
import SceneArt from "./art/SceneArt";
import { typingTime, START } from "./art/typing";

const TIME_SKIP_WAIT = 2.9;   // seconds to wait for the "a few weeks later" card before the first line

// how long to wait before the next line, so there's time to read the one before it
function readingTime(text: string, bubbles = false) {
  // with speech bubbles only the newest line is on screen, so give a bit longer to read it
  return bubbles ? Math.min(8, 1.3 + text.length * 0.042) : Math.min(4.5, 0.9 + text.length * 0.03);
}

export function SceneView({
  scene,
  backgrounds,
  onChoose,
}: {
  scene: Scene;
  backgrounds: string[];
  onChoose: (next: string | null) => void;
}) {
  // how many dialogue lines are showing (remembered per scene, so a new scene starts at 0)
  const [progress, setProgress] = useState({ id: scene.id, shown: 0 });
  const shown = progress.id === scene.id ? progress.shown : 0;
  const done = shown >= scene.dialogue.length;
  const phone = scene.layout === "phone";   // the phone on screen is the conversation (no dialogue list)
  const full = scene.layout === "full";     // just the art, full screen (end credits)
  const stage = !!scene.art && !phone && !full;   // speech bubbles over the characters (no dialogue list)
  const showNext = () =>
    setProgress((p) => ({ id: scene.id, shown: (p.id === scene.id ? p.shown : 0) + 1 }));

  // keep the newest line (and then the choices) in view: only the dialogue panel scrolls
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = panel.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: shown <= 1 ? "auto" : "smooth" });
  }, [scene.id, shown, done]);

  // lines come in one at a time
  useEffect(() => {
    if (done) return;
    const next = scene.dialogue[shown];
    // phone scenes: wait until Violet has finished typing her message before it sends
    const typed = phone && next.speaker === "purple" && !next.history && !next.aloud
      ? START + typingTime(next) + 0.3 : 0;
    const base = shown === 0
      ? (scene.timeSkip ? TIME_SKIP_WAIT : scene.wait ?? 0.4)
      : readingTime(scene.dialogue[shown - 1].text, stage);
    // phone scenes: old texts are already on the phone, so skip past them right away
    const wait = phone && next.history ? 0.05 : Math.max(base, typed) + (next.pause ?? 0);
    const timer = setTimeout(showNext, wait * 1000);
    return () => clearTimeout(timer);
  }, [scene.id, shown, done]);

  return (
    <main className={`game-shell${phone ? " is-phone" : ""}${full ? " is-full" : ""}${stage ? " is-stage" : ""}`}>
      {/* click the scene to skip ahead to the next line */}
      <section className="art-panel" onClick={(phone || stage) && !done ? showNext : undefined}>
        <SceneBadge scene={scene} />
        {scene.art ? <SceneArt name={scene.art} mood={scene.mood} caption={scene.timeSkip} line={shown} lines={scene.dialogue} /> : <Background images={backgrounds} />}
        {stage && <SpeechLayer lines={scene.dialogue} shown={shown} done={done} choices={scene.choices} onChoose={onChoose} />}
        {stage && <div className="stage-glossary"><GlossaryButton glossary={scene.glossary} ready={done} /></div>}
      </section>
      <section className="play-panel" ref={panel}>
        {!phone && !stage && <DialogueList lines={scene.dialogue.slice(0, shown)} onClick={done ? undefined : showNext} />}
        {done && !stage && <ChoiceList choices={scene.choices} onChoose={onChoose} />}
        {!stage && <GlossaryButton glossary={scene.glossary} ready={done} />}
      </section>
    </main>
  );
}
