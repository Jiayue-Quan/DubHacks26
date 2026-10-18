import type { Speaker } from "../types/scene";

export function SpeakerFace({ speaker, size = 44 }: { speaker?: Speaker; size?: number }) {
  const color = speaker?.color ?? "#ddd";
  const face = speaker?.face ?? "neutral";

  return (
    <svg
      className="speaker-face"
      style={{ flexShrink: 0 }}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden
    >
      <circle cx="32" cy="32" r="30" fill={color} />
      {face === "sad" && (
        <>
          <circle cx="24" cy="28" r="3.2" fill="#3d3550" />
          <circle cx="40" cy="28" r="3.2" fill="#3d3550" />
          <path d="M24 42c4-4 12-4 16 0" fill="none" stroke="#3d3550" strokeWidth="2.4" strokeLinecap="round" />
        </>
      )}
      {face === "annoyed" && (
        <>
          <path d="M18 24l10 3" stroke="#3d3550" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M46 24l-10 3" stroke="#3d3550" strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="24" cy="30" r="3.2" fill="#3d3550" />
          <circle cx="40" cy="30" r="3.2" fill="#3d3550" />
          <path d="M26 44h12" stroke="#3d3550" strokeWidth="2.4" strokeLinecap="round" />
        </>
      )}
      {face === "soft" && (
        <>
          <circle cx="24" cy="28" r="3.2" fill="#3d3550" />
          <circle cx="40" cy="28" r="3.2" fill="#3d3550" />
          <path d="M24 40c4 5 12 5 16 0" fill="none" stroke="#3d3550" strokeWidth="2.4" strokeLinecap="round" />
        </>
      )}
      {face === "neutral" && (
        <>
          <circle cx="24" cy="28" r="3.2" fill="#3d3550" />
          <circle cx="40" cy="28" r="3.2" fill="#3d3550" />
          <path d="M26 42h12" stroke="#3d3550" strokeWidth="2.4" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
