import type { DialogueLine } from "../../types/scene";

/*
  How Violet types on her phone (phone scenes). Used by the phone (GroupChat.jsx) to animate
  the text box, and by SceneView to wait until a message is fully typed before it sends.
  Lower numbers = slower.
*/
export const TYPE_SPEED = 15;     // letters per second for the message she sends
export const DRAFT_SPEED = 9;     // letters per second for the words she ends up deleting (slow, so you can read them)
export const DELETE_SPEED = 18;   // letters per second when deleting
export const HOLD = 1.4;          // seconds she stares at the words before deleting them
export const GAP = 0.35;          // little pause after deleting, before typing again
export const START = 0.35;        // seconds after the last message before she starts typing

// how long it takes to type (and delete) this line
export function typingTime(l: DialogueLine) {
  const d = l.deleted ? l.deleted.length / DRAFT_SPEED + HOLD + l.deleted.length / DELETE_SPEED + GAP : 0;
  return d + l.text.length / TYPE_SPEED;
}

// what's in the text box `e` seconds after she starts typing line `l`
export function draft(l: DialogueLine, e: number) {
  if (e < 0) return "";
  if (l.deleted) {
    const d = l.deleted;
    const t1 = d.length / DRAFT_SPEED;
    if (e < t1) return d.slice(0, Math.floor(e * DRAFT_SPEED));
    e -= t1;
    if (e < HOLD) return d;
    e -= HOLD;
    const t2 = d.length / DELETE_SPEED;
    if (e < t2) return d.slice(0, d.length - Math.floor(e * DELETE_SPEED));
    e -= t2;
    if (e < GAP) return "";
    e -= GAP;
  }
  return l.text.slice(0, Math.floor(e * TYPE_SPEED));
}
