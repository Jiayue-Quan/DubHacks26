import type { Choice } from "../types/scene";

export function ChoiceList({
  choices,
  onChoose,
}: {
  choices: Choice[];
  onChoose: (next: string | null) => void;
}) {
  return (
    <div className="choice-list">
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
