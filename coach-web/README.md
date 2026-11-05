# Coach Studio (web)

Coach-side program builder for the personal trainer app, built from the Figma
"Desktop — Coach Studio & Program Builder" frames (dark and light).

## Run

```sh
npm install
npm run dev      # http://localhost:5173
npm run build
npm run lint
```

## Stack

Vite · React · TypeScript · Tailwind CSS v4 · dnd-kit · Zustand · lucide-react

## Layout

| Path | What lives there |
| --- | --- |
| `src/index.css` | Design tokens (colors, type scale) for dark and light themes |
| `src/components/ui` | Shared primitives: buttons, tags, chips, inputs, tabs, switch, menu |
| `src/data` | Exercise library, program meta, session model and demo program |
| `src/lib` | Pure helpers: session metrics, search, structure lookups |
| `src/store/useStudio.ts` | App state, editing actions, undo/redo, local persistence |
| `src/components/library` | Exercise Library pane |
| `src/components/session` | Session Builder canvas (tiers, rows, drag-to-reorder) |
| `src/components/inspector` | Exercise Inspector pane |
| `src/components/layout` | Top bar and three-pane workspace |
| `src/components/overlays` | ⌘K Quick Insert palette and toasts |

## Palette

The Figma uses red / green / yellow for status. Here every one of those is a
shade of blue, defined once in `src/index.css`:

| Figma | Role | Used for |
| --- | --- | --- |
| Emerald | `accent` — royal blue | Primary actions, active and selected states |
| Amber | `caution` — pale ice blue | Draft, involved limb, high tissue load |
| Rose | `critical` — deep navy-cobalt | Clinical guardrail, pain flags |
| Sky | `info` — cyan-blue | Rehab tags, linked regressions |

Since hue alone no longer separates states, warnings also carry an icon or dot.

## Shortcuts

| Keys | Action |
| --- | --- |
| ⌘K / Ctrl K | Quick Insert palette |
| / | Focus library search |
| ⌘Z / ⇧⌘Z | Undo / redo |

The program is saved to this browser's localStorage. "Reset to demo program"
in the Quick Insert palette restores the sample data (undoable).
