# It Comes In Waves — branching story game

A React app that plays a pre-written story from JSON. Each scene has a background, dialogue, and choices that jump to another scene.

## Run it

```bash
cd ~/ItComesInWaves
npm install
npm run dev
```

## How a scene works

Put one JSON file per scene in `src/data/scenes/`. Files are picked up automatically.

```json
{
  "id": "scene_02",
  "title": "The Weight of It",
  "sceneNumber": 2,
  "background": ["/images/kitchen.png", "/images/kitchen2.png"],
  "dialogue": [
    { "speaker": "purple", "text": "I asked you to take care of the laundry." },
    { "speaker": "orange", "text": "And I work all day. What exactly do you do?" }
  ],
  "choices": [
    { "text": "I'm doing my best. I'm tired.", "next": "scene_03a" },
    { "text": "I can pick up more shifts.", "next": "scene_03b" },
    { "text": "That's not fair.", "next": "scene_03c" }
  ],
  "glossary": {
    "label": "What is financial control?",
    "body": "Optional help text shown under the choices."
  }
}
```

- `background` can be one image path or several. Extra images crossfade on top so a scene can feel slightly alive without animation-heavy art.
- `next` is another scene `id`. Use `null` if a choice should end the story.
- Speakers live in `src/data/speakers.json`. The `speaker` field on a line must match a speaker `id`.
- Drop illustration files in `public/images/` and point `background` at `/images/your-file.png`.

## Code map

| Path | Role |
| --- | --- |
| `src/types/scene.ts` | Scene / choice / speaker types |
| `src/data/scenes/*.json` | Story content |
| `src/data/game.ts` | Loads every scene JSON into a lookup map |
| `src/engine/useGame.ts` | Current scene + choice navigation |
| `src/components/SceneView.tsx` | Layout from the mock: art on top, play panel below |
| `src/App.tsx` | Wires the engine to the view |

To add a scene: create `src/data/scenes/scene_04.json` and set some choice's `next` to `"scene_04"`.
