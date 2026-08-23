# Diffs Playground — Design

Port `~/Documents/diffs` into `react-two.js` as a playground alongside Wiremarks,
rebuilt on the library's declarative components instead of imperative Two.js
scene manipulation.

## Source Material

`~/Documents/diffs` is a React 17 + esbuild app (two.js 0.8) that visually
compares texts by shared vocabulary. Its live code is ~1,900 lines across
`app.js`, `results/index.js`, `results/stat-line.js`, `results/graph-line.js`,
`results/arc.js`, `legend.js`, `keyword.js`, `registry.js`, and `utils/`.

`src/visualization/` (matter-js physics) is dead code — nothing imports it. It
is not ported.

What the app does:

- N text panes, each with a title and a body
- Words are tokenized, stripped of contractions/punctuation, and stemmed
  (Porter2, via `wink-porter2-stemmer`)
- Each text renders a column of "stat lines": a rounded rectangle in the text's
  color, the word, and a tally count. Repeat occurrences within a text collapse
  into the first line and bump its tally.
- Words appearing in two or more texts move to a shared "Shared Words" column
  and are hidden from their owning columns
- A "graph line" per column draws a vertical polyline with a point per row
- A legend maps colors to text names
- Pan/zoom over the whole scene
- Highlight mode: clicking a word (in text or on canvas) tints every matching
  stat line, marks matching points on the graph lines, draws staggered arcs from
  the visible occurrence to each hidden one, and pans the camera to the match
- State persists to `localStorage`; the scene exports as SVG

## Goals

1. Feature parity with the original.
2. The scene is a pure function of state, rendered with `react-two.js`
   components. No imperative scene-graph construction, no mutable registry, no
   frame-driven cursors into half-built state.
3. Follow the structural conventions Wiremarks already established in this repo.

## Non-Goals

- No changes to `lib/`. `useZUI` already provides pointer pan, two-pointer
  pinch, wheel/trackpad zoom, `pan: 'background'` gating, and the `panTo` /
  `clientToSurface` / `surfaceToClient` conversions this design needs.
- No port of `src/visualization/` (matter-js).
- No new DSL, no new file format. Input is plain text, as before.

## Architecture

```
src/playgrounds/diffs/
├── DiffsPlayground.tsx        # DOM chrome; owns texts, mode, selection, toggles
├── DiffsCanvas.tsx            # <Canvas> child: useZUI, TWEEN tick, camera pan
├── components/
│   ├── DiffsScene.tsx         # arcs / graph lines / columns groups
│   ├── StatLine.tsx           # RoundedRectangle + word Text + tally Text
│   ├── GraphLine.tsx          # Line + row Points + highlight Points
│   ├── Arc.tsx                # Path with computed arc vertices
│   ├── Legend.tsx             # swatch + name per text, plus Shared Words
│   └── TextColumn.tsx         # DOM pane: textarea, or tokenized highlight view
├── hooks/
│   ├── useDiffsModel.ts       # texts -> deferred model + reveal progress
│   ├── useProgressiveReveal.ts
│   └── useTweenTick.ts        # one useFrame -> TWEEN.update()
├── model/
│   ├── tokenize.ts            # split, strip contractions/non-words
│   ├── stem.ts                # Porter2 wrapper with a memo cache
│   ├── analyze.ts             # per-text stems, counts, sorting
│   ├── merge.ts               # cross-text shared-word resolution
│   └── layout.ts              # row/column coordinates, graph-line extents
├── stopwords.ts               # ported from the original utils/string.js
├── storage.ts                 # versioned localStorage load/save
├── constants.ts               # leading, size, characterWidth, column pitch
└── types.ts
```

Registered in `src/playgrounds/registry.ts`:

```ts
{
  id: 'diffs',
  name: 'Diffs',
  description: 'Visually compare texts by shared vocabulary',
  component: DiffsPlayground,
}
```

## State

User-owned, persisted:

```ts
interface TextDoc {
  id: string;
  name: string;
  color: string; // rgb(...) string, assigned on creation
  body: string;
}
```

Plus `mode: SortMode` (`'chronologic' | 'frequency' | 'alphabetic'`),
`selectedStem: string | null`, and three booleans for the Text / Visuals /
Highlight toggles.

Everything else is derived.

## The Model

One pure function, `buildModel(texts: TextDoc[], mode: SortMode): DiffsModel`:

1. **Tokenize** each body: split on whitespace, strip trailing contractions
   (`/['’]\w*$/`) and non-word characters (`/[^\w\-_]+/g`), drop empties.
2. **Stem** each token with Porter2. A module-level `Map<string, string>` cache
   keeps repeated words cheap; it is a pure memo, not shared state.
3. **Fold per text**: group tokens by stem. The first occurrence becomes the
   visible line; `count` is the number of occurrences. Stopword stems are marked
   not visible (the original's `regex.restricted`).
4. **Merge across texts**: any stem present in two or more texts moves into the
   shared column with a summed count, and is marked hidden in every owning
   column.
5. **Sort** each column's lines by mode: `chronologic` by first token index,
   `frequency` by count descending, `alphabetic` by stem.
6. **Lay out**: visible lines get `y = row * leading * 1.15`; column `n` sits at
   `x = (n + 1) * 250`; the shared column sits at `x = 40`. Each column's graph
   line spans its first to last visible row and carries a point per row. Line
   width is `(word.length + 1 + String(count).length) * characterWidth`, matching
   the original — a character-count estimate, so the model stays pure and needs
   no DOM measurement.

Output:

```ts
interface StatLineDatum {
  key: string;      // `${textId}:${stem}`
  word: string;     // display form (first occurrence)
  stem: string;
  count: number;
  x: number;
  y: number;
  width: number;
}

interface Column {
  id: string;        // a TextDoc id, or the literal 'shared'
  color: string;
  x: number;
  lines: StatLineDatum[];
  graph: { top: number; bottom: number; points: { x: number; y: number }[] };
}

interface DiffsModel {
  columns: Column[];   // one per text
  shared: Column;
  byStem: Map<string, StatLineDatum[]>; // for highlight + arc lookup
  totalLines: number;
  totalChars: number;
}
```

This replaces the original's mutable `Registry` class, its `needsUpdate` flags,
and the `layout` / `reconcile` / `merge` frame machinery with its
`index` / `yid` / `mergeId` cursors. Same output, one function, directly
testable without a canvas.

## Progressive Reveal

The original builds the scene incrementally — `MAX_ITERATIONS` lines per frame,
with a spinning indicator while it works. That build-up is preserved, but as
state rather than as partially-constructed scene graph.

`useDiffsModel(texts, mode)`:

- `const deferred = useDeferredValue(texts)` so typing stays responsive
- `const model = useMemo(() => buildModel(deferred, mode), [deferred, mode])`
- `const revealed = useProgressiveReveal(model)` — a `useFrame`-driven counter
  that grows by `clamp(floor(model.totalChars / 100), 1, 250)` per frame, the
  original's `MAX_ITERATIONS` formula. It resets to 0 whenever `model` identity
  changes and stops once it reaches `model.totalLines`.
- `processing = revealed < model.totalLines || deferred !== texts`

Reveal is allocated across columns in order, so `DiffsScene` renders
`column.lines.slice(0, revealedForColumn)`.

**Known risk.** Growing a state counter each frame re-renders the scene during
build-up, and React reconciliation is heavier than the original's direct object
creation. `StatLine` is wrapped in `memo` and keyed by `StatLineDatum.key`, so
settled lines neither re-render nor remount and only newly revealed lines mount.
The chunk size already scales with input length. This is the riskiest part of
the port; measure it with a large paired text during phase 4 and, if it stalls,
raise the chunk floor before reaching for a worker.

## Rendering

`DiffsCanvas` mounts inside `<Canvas type={Two.Types.svg}>`, holds the
`useZUI(sceneGroupRef, { minZoom: 0.06, maxZoom: 8 })` (the original's limits),
and runs one `useFrame` that calls `TWEEN.update()`.

`DiffsScene` renders, in z-order:

```tsx
<Group>              {/* arcs */}
<Group>              {/* graph lines */}
<Group>              {/* columns of stat lines */}
```

- **StatLine** — `<Group x y onPointerDown>` containing `<RoundedRectangle>`
  (fill = column color, stroke = yellow when highlighted), a left-aligned
  `<Text>` for the word, and a right-aligned `<Text>` for the tally. The
  pointer handler only reports a selection when highlight mode is on.
- **GraphLine** — `<Line>` from `graph.top` to `graph.bottom`, a `<Points
  size={4}>` for row ticks, and a `<Points size={12} fill="yellow">` whose
  vertices are the rows matching `selectedStem`.
- **Arc** — `<Path curved beginning={...}>` whose vertices are computed from the
  source and target points in a `useMemo`. The original's custom `Two.Path`
  subclass is unnecessary: `Path` already exposes `beginning`, `ending`,
  `curved`, and `vertices`.
- **Legend** — rendered by `DiffsCanvas` as a sibling of the ZUI group, not
  inside `DiffsScene`, so it stays fixed to the viewport while the scene pans.
  This matches the original, which added the legend to `two` rather than to the
  panned stage. One row per text plus a Shared Words row, each a `<Circle>`
  swatch and a `<Text>`.

## Highlight Mode

`selectedStem` is the single source of truth. Both entry points — clicking a
word span in a text pane, and clicking a stat line on the canvas — call the same
setter, which toggles off if the stem is already selected.

Derived from it:

- `line.stem === selectedStem` decides a stat line's highlight styling
- graph-line highlight points are a `useMemo` over the model
- arcs are a `useMemo` from the visible occurrence (shared column, or the first
  column containing it) to each hidden occurrence

This removes `stage.getByClassName()`, the
`className.replace(/(sl|highlight)/ig, '')` string parsing, the
`document.querySelectorAll('svg g.sl')` listener add/remove toggle, and the
`requestAnimationFrame` tick loops in `addHighlightsToGraphLines` and the
`show`/`hide` text highlighters.

## Text Panes

`TextColumn` renders a controlled `<input>` for the title and, depending on
mode:

- **Editing** — a controlled `<textarea value={body} onChange={...}>`. State
  updates immediately; only the `localStorage` write is debounced.
- **Highlight mode** — a read-only `<div style={{ whiteSpace: 'pre-wrap' }}>`
  rendering memoized tokens, where each word is a `<span data-stem>` that gets a
  highlight class when its stem matches `selectedStem`. Clicking a span is a
  plain `onClick` that reads `data-stem`.

This removes the `contentEditable` panes, the `innerHTML` regex rewriting, the
manual selection-offset word-boundary scanner, and the
`execCommand('insertHTML')` paste handler — which also resolves the original
README's open "on paste don't strip carriage returns" item.

## Chrome and Layout

Inside the playground's bounded container: the canvas fills it, and the text
columns overlay it in a flex row with translucent backgrounds, fading in and out
via the Text Visible / Visuals Visible toggles exactly as the original does.

Controls become a floating Catalyst button bar, in the idiom Wiremarks
established:

- Add Text Field / Remove Text Field
- Sort By: {mode} (cycles)
- Text Visible / Visuals Visible / Highlight Mode toggles
- Clear Session (confirms first)
- Export SVG
- A processing indicator that spins while `processing` is true

A zoom-percentage readout sits bottom-right and resets zoom on click, matching
Wiremarks.

## Renderer and Export

The canvas uses `Two.Types.svg`, as the original did. Text stays crisp at any
zoom and Export SVG works by serializing the live `<svg>` element, the same way
`WiremarksPlayground.handleDownload` does. The cost is one DOM node group per
stat line; the progressive reveal already spreads that creation across frames.

## Persistence

`storage.ts` mirrors `wiremarks/storage.ts`: a `DIFFS_STATE_VERSION` constant, a
`diffs-state-v1` key, and a stored payload of `{ id, name, color, body }[]` plus
`mode`. A version mismatch discards the stored state rather than migrating it.
Writes are debounced (1s, as in the original); reads happen once on mount.

## Dependencies

Added to the demo app (not to the library's peer dependencies):

- `wink-porter2-stemmer` — Porter2 stemming, MIT
- `@tweenjs/tween.js` — arc reveal and camera pan tweens

Not carried over: `matter-js` (dead code), the `less` color-function import
(replaced by a local HSL→RGB helper), the custom `Arc extends Two.Path` class,
the `Registry` class, and `utils/easing.js` (TWEEN supplies the easing).

## Testing

Following the repo's existing `tests/` conventions:

- `diffsTokenize.test.ts` — contractions, punctuation, empty tokens, stopwords
- `diffsModel.test.ts` — within-text tally collapse, cross-text merge into the
  shared column, all three sort modes, computed row/column coordinates
- `diffsStorage.test.ts` — round-trip and version invalidation
- `diffsStatLine.test.tsx` — renders word and tally, emits its stem on click
  only in highlight mode, applies highlight styling
- `diffsReveal.test.ts` — the counter reaches `totalLines`, resets on model
  change, and sizes chunks from `totalChars`

## Phases

1. **Model** — `tokenize`, `stem`, `analyze`, `merge`, `layout`, `stopwords`,
   with tests. No UI.
2. **Shell** — `DiffsPlayground`, `TextColumn` editing, add/remove, sort cycle,
   `storage`, registry entry. Canvas empty.
3. **Scene** — `DiffsCanvas`, `DiffsScene`, `StatLine`, `GraphLine`, `Legend`,
   `useZUI`. Full model rendered at once.
4. **Reveal** — `useProgressiveReveal`, the processing indicator, and a
   measurement pass on a large paired text.
5. **Highlight** — `selectedStem`, tokenized text view, canvas selection,
   stat-line tinting, graph-line highlight points.
6. **Arcs and camera** — `Arc`, `useTweenTick`, staggered reveal, `panTo` tween.
7. **Finish** — Export SVG, Clear Session, visual polish against the original,
   and a `CLAUDE.md` section documenting the playground.
