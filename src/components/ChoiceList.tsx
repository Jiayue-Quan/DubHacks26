import { useEffect, useRef } from "react";
import type { Choice } from "../types/scene";

export function ChoiceList({
  choices,
  onChoose,
}: {
  choices: Choice[];
  onChoose: (next: string | null) => void;
}) {
  const list = useRef<HTMLDivElement>(null);
  // scroll the choices into view when they show up
  useEffect(() => {
    list.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  return (
    <div className="choice-list" ref={list}>
      {choices.map((choice) => (
        <button
          key={choice.text}
          className="choice-button"
          type="button"
          onClick={() => onChoose(choice.next)}
        >
          {choice.text}
        </button>
      ))}
    </div>
  );
}
