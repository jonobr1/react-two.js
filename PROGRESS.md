# Progress Log

## Last Updated
2026-05-18 23:45 PDT

## Completed
- [x] Phase 0 complete
- [ ] Phase 1 complete
- [ ] Phase 2 complete
- [ ] Phase 3 complete
- [ ] Phase 4 complete
- [ ] Phase 5 complete
- [ ] Phase 6 complete
- [ ] Phase 7 complete
- [ ] Phase 8 complete
- [ ] Phase 9 complete
- [ ] Phase 10 complete

## Currently In Progress
- Phase 1 viewport work in `src/components/Canvas.tsx` and `src/canvas/useCanvasEditor.ts`.
- Early Phase 2 selection work: shape hit testing, selection overlay, and drag translation with history batching.

## Blocked / Needs Decision
- Primary renderer assumption remains `Two.Types.canvas`, which matches the default decision from the brief. SVG-specific culling behavior is not implemented yet.
- Resize handles, marquee selection, and explicit rotate/resize interactions are still pending.

## Notes
- The local `../tldraw` checkout is now available and is being used as the reference for camera math, selection behavior, and tool state structure.
- The editor foundation now lives in `src/canvas/` with reducer-owned camera, selection, tool, and document state plus a snapshot-based history stack.
- `package-lock.json` only changed to sync the root package version from `0.8.23-r.1` to `0.8.23-r.2`.
- Fixed grid zoom drift by removing the zoom clamp from the CSS grid scale and normalizing the background offset to the live scene transform.
- Fixed text selection bounds by measuring text width/height at runtime instead of relying on the stale record dimensions.
