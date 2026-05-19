# Architecture Notes

## Audit Summary
- `lib/Provider.tsx` is the root renderer boundary. It creates the `Two` instance, appends the real canvas or SVG node into the host container, and exposes the instance through `useTwo()`.
- Every shape wrapper in `lib/` is a thin `forwardRef` component that creates one `Two.js` object with `useMemo`, adds it to the current parent group, then mirrors React props onto the instance in an effect.
- `lib/Context.ts` is the integration seam between React and Two.js. `useFrame()` subscribes directly to the `two.update` loop, and nested `Group` / `SVG` components swap the active parent context to build a scene graph declaratively.
- Pointer events are not native to Two.js in this repo. `lib/Events.ts` plus the event registry in `lib/Provider.tsx` implement a separate hit-test and bubbling layer over registered shapes.

## Current Demo App
- `src/App.tsx` is a docs-style shell with a sidebar and a main demo surface.
- Before this work, `src/Playground.tsx` was a broad capability showcase for all existing primitives. The new interactive canvas example is being introduced alongside the library rather than inside `lib/`.
- Styling currently comes from Tailwind v4 plus a small set of local CSS rules in `src/styles.css`.

## Build And Test Surface
- The package is ESM-only and builds from `lib/main.ts` using Vite plus `tsc --p tsconfig.build.json`.
- Vite aliases `react-two.js` back to `lib/main.ts` for local development.
- The Vitest config is present, but there are currently no `src/**/*.test.{ts,tsx}` files, so verification is build- and runtime-oriented today.

## Implications For The Interactive Canvas
- The editor should live entirely in `src/` and consume `lib/` the same way an external app would.
- Camera transforms should be applied to a single scene-root `Group`, matching tldraw’s editor model rather than mutating individual shapes.
- Selection, marquee, handles, and other editor chrome should render in DOM / SVG overlays above the Two.js surface, not inside the scene graph.
- Shape metadata, history, tools, and hit testing belong in editor state; Two.js objects are the rendering backend, not the source of truth.
