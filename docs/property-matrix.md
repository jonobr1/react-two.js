# Two.js Property Matrix & Declarative Coverage

This document outlines the declarative prop coverage for `react-two.js` components against **Two.js v0.8.23**.

## Overview

`react-two.js` exposes Two.js scenegraph objects as declarative React components. All scene-relevant, writable Two.js properties are exposed as React props with their upstream Two.js types.

Where ergonomic improvements are possible without breaking Two.js parity (for example, passing `{ x, y }` or `[x, y]` to `Rectangle.origin`, or passing a `Two.Texture` directly to `Sprite.src`), these are supported alongside upstream types.

---

## Property Matrix Table

| Component | Upstream Two.js Class | Supported Declarative Props | Key Additions in v0.8.23-r.2 |
|---|---|---|---|
| `<Group>` | `Two.Group` | `id`, `className`, `position`, `translation`, `rotation`, `scale`, `skewX`, `skewY`, `matrix`, `fill`, `stroke`, `linewidth`, `cap`, `join`, `miter`, `closed`, `curved`, `automatic`, `opacity`, `visible`, `mask`, `beginning`, `ending`, `strokeAttenuation`, `x`, `y` | `mask`, `beginning`, `ending`, `strokeAttenuation` |
| `<SVG>` | `Two.Group` | All `<Group>` props, plus `src`, `content`, `shallow`, `onLoad`, `onError` | `opacity`, `visible`, `mask`, `beginning`, `ending`, `strokeAttenuation` |
| `<Path>` | `Two.Path` | `id`, `className`, `position`, `translation`, `rotation`, `scale`, `skewX`, `skewY`, `matrix`, `fill`, `stroke`, `linewidth`, `opacity`, `visible`, `cap`, `join`, `miter`, `closed`, `curved`, `automatic`, `beginning`, `ending`, `dashes`, `vertices`, `mask`, `clip`, `strokeAttenuation`, `manual`, `x`, `y` | `mask`, `clip`, `strokeAttenuation` |
| `<Rectangle>` | `Two.Rectangle` | All `<Path>` props, plus `width`, `height`, `origin` | `origin`, `mask`, `clip`, `strokeAttenuation` |
| `<Circle>` | `Two.Circle` | All `<Path>` props, plus `radius`, `resolution` | `mask`, `clip`, `strokeAttenuation` |
| `<Ellipse>` | `Two.Ellipse` | All `<Path>` props, plus `width`, `height`, `resolution` | `mask`, `clip`, `strokeAttenuation` |
| `<Line>` | `Two.Line` | All `<Path>` props, plus `left`, `right`, `x1`, `y1`, `x2`, `y2` | `mask`, `clip`, `strokeAttenuation` |
| `<Polygon>` | `Two.Polygon` | All `<Path>` props, plus `width`, `height`, `sides`, `radius` | `radius`, `mask`, `clip`, `strokeAttenuation` |
| `<RoundedRectangle>` | `Two.RoundedRectangle` | All `<Path>` props, plus `width`, `height`, `radius` | `mask`, `clip`, `strokeAttenuation` |
| `<Star>` | `Two.Star` | All `<Path>` props, plus `innerRadius`, `outerRadius`, `sides` | `mask`, `clip`, `strokeAttenuation` |
| `<ArcSegment>` | `Two.ArcSegment` | All `<Path>` props, plus `startAngle`, `endAngle`, `innerRadius`, `outerRadius`, `resolution` | `mask`, `clip`, `strokeAttenuation` |
| `<Points>` | `Two.Points` | `id`, `className`, `position`, `translation`, `rotation`, `scale`, `skewX`, `skewY`, `matrix`, `fill`, `stroke`, `linewidth`, `opacity`, `visible`, `size`, `sizeAttenuation`, `beginning`, `ending`, `dashes`, `vertices`, `strokeAttenuation`, `x`, `y` | `strokeAttenuation` |
| `<Text>` | `Two.Text` | `id`, `className`, `position`, `translation`, `rotation`, `scale`, `skewX`, `skewY`, `matrix`, `value`, `family`, `size`, `leading`, `alignment`, `linewidth`, `style`, `weight`, `decoration`, `direction`, `baseline`, `opacity`, `visible`, `fill`, `stroke`, `dashes`, `mask`, `clip`, `strokeAttenuation`, `x`, `y` | `mask`, `clip`, `strokeAttenuation` |
| `<Image>` | `Two.Image` | All `<Rectangle>` props, plus `texture`, `mode`, `src` | `origin`, `mask`, `clip`, `strokeAttenuation` |
| `<Sprite>` | `Two.Sprite` | All `<Rectangle>` props, plus `texture`, `columns`, `rows`, `frameRate`, `index`, `firstFrame`, `lastFrame`, `loop`, `src`, `autoPlay` | `origin`, `Two.Texture` as `src`, `mask`, `clip`, `strokeAttenuation` |
| `<ImageSequence>` | `Two.ImageSequence` | All `<Rectangle>` props, plus `textures`, `frameRate`, `index`, `firstFrame`, `lastFrame`, `loop`, `src`, `autoPlay` | `origin`, `mask`, `clip`, `strokeAttenuation` |
| `<LinearGradient>` | `Two.LinearGradient` | `id`, `className`, `spread`, `units`, `stops`, `left`, `right`, `x1`, `y1`, `x2`, `y2` | Full declarative parity |
| `<RadialGradient>` | `Two.RadialGradient` | `id`, `className`, `spread`, `units`, `stops`, `center`, `radius`, `focal`, `x`, `y`, `focalX`, `focalY` | Full declarative parity |
| `<Texture>` | `Two.Texture` | `id`, `className`, `src`, `loaded`, `repeat`, `scale`, `offset`, `image` | Full declarative parity |

---

## Detailed Prop Support

### 1. `mask` and `clip`
- Supported on `<Path>`, `<Group>`, `<Text>`, and all Path-derived shapes (`<Rectangle>`, `<Circle>`, `<RoundedRectangle>`, etc.).
- Direct declarative assignment:
  ```tsx
  const maskRef = useRef<RefCircle>(null);
  <Circle ref={maskRef} radius={50} />
  <Rectangle width={200} height={100} mask={maskRef.current} />
  ```
- `clip` (`boolean`) can be set declaratively to indicate that an element acts as a clipping mask.

### 2. `strokeAttenuation`
- Supported on `<Path>`, `<Group>`, `<Text>`, `<Points>`, and all Path-derived shapes.
- When `true` (default), stroke width scales with matrix transformations.
- When `false`, stroke width remains constant in screen space regardless of zoom level or scaling:
  ```tsx
  <Circle radius={40} stroke="#ff0000" linewidth={2} strokeAttenuation={false} />
  ```

### 3. Rectangle `origin`
- Supported on `<Rectangle>`, `<Image>`, `<Sprite>`, and `<ImageSequence>`.
- Accepts upstream `Two.Vector`, as well as convenient object literals `{ x?: number; y?: number }` and tuples `[number, number]`:
  ```tsx
  // With Two.Vector
  <Rectangle width={100} height={100} origin={new Two.Vector(50, 50)} />

  // With object literal
  <Rectangle width={100} height={100} origin={{ x: 50, y: 50 }} />

  // With tuple
  <Rectangle width={100} height={100} origin={[50, 50]} />
  ```

### 4. `Two.Texture` as `Sprite.src`
- `<Sprite>` accepts either a URL string or a `Two.Texture` instance:
  ```tsx
  const texture = new Two.Texture('/assets/spritesheet.png');
  <Sprite src={texture} columns={4} rows={4} autoPlay />
  ```

---

## Intentional Omissions & Imperative Escape Hatch

Certain properties from Two.js instances are intentionally omitted from declarative prop interfaces. Read-only and internal properties should not be exposed merely because they exist on an instance.

### Categories of Omissions

1. **Computed & Read-Only Properties**:
   - `length` (on `Path`, `Group`, `Points`): Computed dynamically by Two.js. Setting it imperatively is a no-op or causes desynchronization. Read via `ref.current.length`.
   - `worldMatrix` (on all `Shape`s): Derived matrix calculated from the scene graph hierarchy. Read via `ref.current.worldMatrix`.

2. **Renderer-Internal State**:
   - `renderer` (on `Element` / `Shape`): Contains low-level renderer state and DOM elements (e.g. `renderer.elem` for SVG nodes). Access via `ref.current.renderer`.
   - `additions`, `subtractions` (on `Group`): Internal Two.js renderer tracking queues.

3. **React-Managed Tree Hierarchies**:
   - `children` (on `Group`): Managed through React JSX children composition rather than direct array assignment.
   - `parent`: Managed by React Context (`TwoParentContext`) and component mount/unmount lifecycle.

4. **Imperative Methods**:
   - `play()`, `pause()`, `stop()` on `Sprite` / `ImageSequence`: Handled declaratively via the `autoPlay` boolean prop, or imperatively via `ref.current.play()`.
   - `clone()`, `copy()`: Scenegraph duplication methods.
   - `subdivide()`, `plot()`: Imperative algorithmic routines.

### The Imperative Escape Hatch

For any omitted properties, renderer-specific adjustments, or high-frequency animations, use the forwarded ref to access the underlying Two.js instance:

```tsx
import { useRef, useEffect } from 'react';
import { Canvas, Rectangle, RefRectangle, useFrame } from 'react-two.js';

function MyShape() {
  const rectRef = useRef<RefRectangle>(null);

  useEffect(() => {
    if (rectRef.current) {
      // Access underlying properties or renderer-specific state
      console.log('Arc length:', rectRef.current.length);
      console.log('Computed world matrix:', rectRef.current.worldMatrix);
      console.log('SVG Element:', rectRef.current.renderer?.elem);
    }
  }, []);

  useFrame(() => {
    if (rectRef.current) {
      rectRef.current.rotation += 0.01;
    }
  });

  return <Rectangle ref={rectRef} width={100} height={100} fill="#00f" />;
}
```
