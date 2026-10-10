# react-two.js

![Version](https://img.shields.io/npm/v/react-two.js?style=flat&colorA=000000&colorB=000000)
![License](https://img.shields.io/npm/l/react-two.js?style=flat&colorA=000000&colorB=000000)

A React renderer for [Two.js](https://two.js.org) — bringing declarative, component-based 2D graphics to React. Build interactive SVG, Canvas, or WebGL scenes using familiar React patterns.

```bash
npm install react-two.js react react-dom two.js
```

```jsx
import { Canvas, Rectangle, useFrame } from 'react-two.js'

function RotatingRectangle() {
  const ref = useRef()
  useFrame((t) => ref.current.rotation = t * 0.5)
  return <Rectangle ref={ref} radius={50} fill="#00AEFF" />
}

<Canvas width={800} height={600} autostart={true}>
  <RotatingRectangle />
</Canvas>
```

## Why react-two.js?

- 🎨 **Declarative 2D Graphics** — Describe your Two.js scene using React components
- ⚡ **Renderer Agnostic** — Switch between SVG, Canvas, and WebGL without changing code
- 🪝 **React Hooks** — Built-in `useFrame` for smooth animations and `useTwo` for instance access
- 📦 **Fully Typed** — Complete TypeScript support with proper types for all components
- 🎯 **Zero Overhead** — Direct mapping to Two.js primitives with no performance penalty
- 🔄 **Everything Works** — All Two.js features work seamlessly in React

## What does it look like?

Create complex 2D scenes using React components:

```jsx
import { Canvas, Group, Rectangle, Circle, Star, useFrame } from 'react-two.js'

function Scene() {
  const groupRef = useRef()

  useFrame((elapsed) => {
    groupRef.current.rotation = Math.sin(elapsed) * 0.5
  })

  return (
    <Group ref={groupRef} x={400} y={300}>
      <Rectangle width={100} height={100} fill="#FF6B6B" />
      <Circle radius={40} fill="#4ECDC4" x={60} />
      <Star innerRadius={20} outerRadius={40} sides={5} fill="#FFE66D" x={-60} />
    </Group>
  )
}

<Canvas width={800} height={600} type="webgl">
  <Scene />
</Canvas>
```

## Installation

```bash
npm install react-two.js react react-dom two.js
```

**Requirements** as peer dependencies:
- React 19+
- Two.js v0.8.24+

> [!IMPORTANT]
> react-two.js is a React renderer, it must pair with a major version of React, like react-dom.

## First Steps

### Creating a Canvas

The `<Canvas>` component is your entry point. It creates a Two.js instance and manages the rendering context:

```jsx
import { Canvas } from 'react-two.js'

function App() {
  return (
    <Canvas
      width={800}
      height={600}
      type="SVGRenderer"
      autostart={true}
    >
      {/* Your scene goes here */}
    </Canvas>
  )
}
```

> [!IMPORTANT]
> **Canvas Children Restrictions:** Similar to [react-three-fiber](https://github.com/pmndrs/react-three-fiber), the `<Canvas>` component only accepts react-two.js components as children. DOM elements like `<div>` or `<span>` cannot be used inside Canvas. Place UI elements outside the Canvas:
>
> ```jsx
> // ✅ Correct
> <div>
>   <Canvas>
>     <Circle radius={50} />
>   </Canvas>
>   <div className="controls">UI here</div>
> </div>
>
> // ❌ Incorrect - will trigger warnings
> <Canvas>
>   <div>This will warn</div>
>   <Circle radius={50} />
> </Canvas>
> ```

Canvas accepts `svg` / `SVGRenderer`, `canvas` / `CanvasRenderer`, and
`webgl` / `WebGLRenderer`. The default is SVG. `width` and `height` update the
existing renderer; changing `autostart` plays or pauses the existing instance.
`type`, `fullscreen`, `ratio`, `overdraw`, and `smoothing` are construction
options. Change the Canvas `key` to apply new values and recreate its scene.
Changing these options without a remount warns in development.

```tsx
<Canvas key={renderer} type={renderer} width={800} height={600}>
  <Scene />
</Canvas>
```

When sizing SVG with CSS, use a `viewBox` to scale the artwork with its viewport:

```tsx
<Canvas type="svg" width={800} height={600} viewBox="0 0 800 600"
  style={{ width: '100%', height: 'auto' }}>
  <Scene />
</Canvas>
```

### Adding Shapes

All Two.js primitives are available as React components:

```jsx
<Canvas width={800} height={600} autostart={true}>
  <Circle radius={50} fill="#00AEFF" x={400} y={300} />
  <Rectangle width={100} height={60} stroke="#FF0000" linewidth={3} />
  <Polygon sides={6} radius={40} fill="#00FF00" />
</Canvas>
```

### Animating with useFrame

The `useFrame` hook runs on every frame, perfect for animations:

```jsx
import { useRef } from 'react'
import { Rectangle, useFrame } from 'react-two.js'

function AnimatedRectangle() {
  const ref = useRef()

  useFrame((elapsed) => {
    ref.current.rotation = elapsed * 0.5
    ref.current.scale = 1 + Math.sin(elapsed) * 0.2
  })

  return <Rectangle ref={ref} width={50} height={50} fill="#00AEFF" />
}
```

### Accessing Two.js Instance

Use `useTwo` to access the underlying Two.js instance:

```jsx
import { useTwo } from 'react-two.js'

function Component() {
  const { two, width, height } = useTwo()

  useEffect(() => {
    if (!two) return;
    two.play();
    console.log('Canvas size:', width, height)
    console.log('Two.js instance:', instance)
  }, [two])
}
```

## API

### Components

#### Core
- **`<Canvas>`** — Main container that creates Two.js instance
- **`<Group>`** — Container for organizing and transforming multiple shapes

#### Primitives
- **`<Circle>`** — Circle with radius
- **`<Rectangle>`** — Rectangle with width and height
- **`<RoundedRectangle>`** — Rectangle with rounded corners
- **`<Ellipse>`** — Ellipse with width and height
- **`<Line>`** — Straight line between two points
- **`<Polygon>`** — Regular polygon with specified sides
- **`<Star>`** — Star shape with inner and outer radius
- **`<ArcSegment>`** — Arc segment with start and end angles

#### Paths & Text
- **`<Path>`** — Custom path with vertices
- **`<Points>`** — Collection of points rendered in one draw call
- **`<Text>`** — Text rendering

#### Advanced
- **`<SVG>`** — Load and interpret SVG files or inline SVG markup
- **`<Image>`** - Basic image class inspired by Figma
- **`<Sprite>`** — Animated sprite sheets
- **`<ImageSequence>`** — Animated image sequence
- **`<LinearGradient>`** — Linear gradient fill
- **`<RadialGradient>`** — Radial gradient fill
- **`<Texture>`** — Texture mapping

### Hooks

#### `useTwo()`

Access the Two.js instance and canvas properties:

```jsx
const { two, width, height } = useTwo()
```

Returns:
- `two` — The Two.js instance
- `width` — Canvas width
- `height` — Canvas height

#### `useFrame(callback)`

Register a callback that runs on every animation frame:

```jsx
useFrame((elapsed: number) => {
  // elapsed is time in seconds since animation started
})
```

#### `useZUI(targetRef, options?)`

Adds zoom and pan interactions to a `<Group>` component. Panning is gated on registered shape hit testing so node dragging and canvas panning never conflict.

```tsx
import { useRef } from 'react';
import { Canvas, Group, Circle, useZUI, RefGroup } from 'react-two.js';

function Scene() {
  const groupRef = useRef<RefGroup | null>(null);
  const zui = useZUI(groupRef, { minZoom: 0.25, maxZoom: 8 });

  return (
    <Group ref={groupRef}>
      <Circle x={0} y={0} radius={50} fill="#00AEFF" />
    </Group>
  );
}
```

Returns `ZUIControls`:
- `controls.zoomBy(ratio, clientX?, clientY?)` — Zoom relative to center or given client point.
- `controls.zoomTo(scale, clientX?, clientY?)` — Set absolute zoom scale.
- `controls.panBy(dx, dy)` — Pan by screen pixel delta.
- `controls.reset()` — Reset zoom and pan to identity state.
- `controls.clientToSurface(clientX, clientY)` — Convert screen coordinates to surface coordinates.
- `controls.state` — Ref containing `{ scale, x, y }`.

#### `useZUIState(zui, onChange?)`

Subscribes to ZUI zoom and pan state updates for rendering reactive zoom UI controls.

```tsx
const zui = useZUI(groupRef);
const { scale } = useZUIState(zui);
```

### Props

All Two.js properties work as React props:

```jsx
<Circle
  radius={50}
  fill="#00AEFF"
  stroke="#000000"
  linewidth={2}
  opacity={0.8}
  x={400}
  y={300}
  rotation={Math.PI / 4}
  scale={1.5}
/>
```

### Pointer events and dragging

Shapes and Groups accept click, double-click, context-menu, wheel, and pointer
handlers. Every `TwoEvent.point` is in **renderer world coordinates**, measured
in logical pixels from the top-left origin, before shape or Group transforms.
Canvas/WebGL CSS sizing and pixel ratio are accounted for; SVG uses its screen
transform, including `viewBox` and `preserveAspectRatio`. Bubbling and capture
use the same coordinates. To obtain target-local coordinates, apply the inverse
of the target's `worldMatrix` to `event.point`.

The topmost interactive geometry follows the current complete Two.js scene
order. `event.target` is the hit leaf shape, including when only its Group has
handlers. `event.currentTarget` is the shape or Group running the handler.
Handlers bubble through all ancestor Groups; `stopPropagation()` stops that
dispatch. Noninteractive shapes do not block interactive shapes underneath.

A Group is interactive through its descendants' geometry, so empty space in a
sparse Group does not hit. Invisible or zero-opacity shapes and ancestors,
`clip` shapes, and paths with neither visible fill nor stroke are excluded.
Masks restrict hits to their geometry in the owner's local space. Geometry
precision and fill/stroke tests otherwise follow Two.js `contains()` behavior.
Pointer over/out bubble once per target transition; enter/leave run once for
each entered or exited ancestor, without bubbling again.

Use the event's capture methods for dragging. Capture belongs to
`currentTarget`, is independent for each pointer, and routes subsequent move,
up, and cancel events through that target's ancestors even outside the
renderer. Release occurs automatically on up, cancel, lost native capture,
removal of the last handler, or unmount; it can also be explicit.

```tsx
<Circle x={200} y={150} radius={40}
  onPointerDown={(event) => {
    event.setPointerCapture((event.nativeEvent as PointerEvent).pointerId);
  }}
  onPointerMove={(event) => {
    const id = (event.nativeEvent as PointerEvent).pointerId;
    if (event.hasPointerCapture(id)) {
      // This example has no transformed parent Group.
      event.currentTarget.translation.set(event.point.x, event.point.y);
    }
  }}
  onPointerUp={(event) => {
    event.releasePointerCapture((event.nativeEvent as PointerEvent).pointerId);
  }}
/>
```

`Canvas.onPointerMissed` runs once on pointer-up for a complete primary-button
press that both began and ended outside interactive geometry. A hit at either
end, any capture during the press, cancellation, a nonprimary/right-button
press, or an up without a preceding down suppresses it. The subsequent click
does not fire a second missed notification; click handlers use the geometry
under the click independently of pointer capture.

## TypeScript

Full TypeScript support with ref types for all components:

```tsx
import { useRef } from 'react'
import { Circle, RefCircle } from 'react-two.js'

function Component() {
  const circleRef = useRef<RefCircle | null>(null)

  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.rotation = Math.PI / 4
    }
  }, [])

  return <Circle ref={circleRef} radius={50} />
}
```

## Examples

### Rotating Group

```jsx
function RotatingGroup() {
  const ref = useRef()
  useFrame((t) => ref.current.rotation = t)

  return (
    <Group ref={ref}>
      <Rectangle width={100} height={100} fill="#FF6B6B" />
      <Circle radius={50} fill="#4ECDC4" x={120} />
    </Group>
  )
}
```

### Gradient Fill

```jsx
function () {
  const [gradient, setGradient] = useState(null);

  const updateRef = useMemo((ref) => {
    if (ref) {
      setGradient(ref);
    }
  }, [setGradient]);

  return (
    <Canvas width={800} height={600}>
      <LinearGradient
        ref={updateRef}
        x1={0} y1={0}
        x2={100} y2={100}
        stops={[
          { offset: 0, color: '#FF6B6B' },
          { offset: 1, color: '#4ECDC4' }
        ]}
      />
      <Rectangle width={200} height={200} fill={gradient} />
    </Canvas>
  );
}
```

### Loading SVG Files

Load external SVG files or use inline SVG markup with the `<SVG>` component:

```jsx
import { SVG } from 'react-two.js'

// Load from external URL
function Logo() {
  return (
    <SVG
      src="/assets/logo.svg"
      x={100}
      y={100}
      onLoad={(group, svg) => {
        console.log('SVG loaded with', group.children.length, 'objects')
      }}
      onError={(error) => {
        console.error('Failed to load SVG:', error)
      }}
    />
  )
}

// Use inline SVG markup
function Icon() {
  return (
    <SVG
      content={`
        <svg viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="#FF6B6B" />
          <circle cx="35" cy="40" r="8" fill="white" />
          <circle cx="65" cy="40" r="8" fill="white" />
        </svg>
      `}
      x={200}
      y={200}
      scale={0.5}
    />
  )
}

// Animate loaded SVG
function AnimatedIcon() {
  const svgRef = useRef()

  useFrame((elapsed) => {
    if (svgRef.current) {
      svgRef.current.rotation = Math.sin(elapsed) * 0.5
      svgRef.current.scale = 1 + Math.sin(elapsed * 2) * 0.1
    }
  })

  return <SVG ref={svgRef} src="/icon.svg" x={400} y={300} />
}
```

**SVG Props:**
- `src` — URL to external .svg file
- `content` — Inline SVG markup string
- `x`, `y` — Position
- `scale`, `rotation` — Transform properties
- `onLoad(group, svg)` — Callback when SVG loads successfully
- `onError(error)` — Callback when loading fails
- All Two.js Group properties (fill, stroke, opacity, etc.)

`shallow` (default `false`) removes the imported top-level SVG Group and places
its children directly in the component's stable wrapper. Nested `<g>` groups
remain intact. This mirrors Two.js shallow interpretation: root SVG transforms
are discarded with that top-level Group, so leave `shallow` off when preserving
root transforms matters. Changing `src`, `content`, or `shallow` replaces only
the imported artwork; JSX children remain attached after the imports in scene
order and stay visible during loading.

URL sources use `fetch` and an `AbortSignal`, including URLs with query strings.
Source replacement and unmount abort pending requests, ignore stale responses,
and release imported resources. Inline content must be a well-formed SVG
document. Successful loads apply declarative styles before invoking the latest
`onLoad` callback once per load; network, HTTP, and parsing failures invoke
`onError`. Cancellation does not invoke either callback. Updating callbacks
does not reload the artwork. User callback exceptions are logged separately
from loading errors. If both sources are supplied at runtime, `src` wins with
a warning; missing sources report an error.

> [!NOTE]
> The SVG component uses Two.js's `load()` method which supports a subset of SVG 1.1 features. Complex SVG features like filters, animations (SMIL), and some advanced elements may not be fully supported. Refer to [Two.js SVG documentation](https://two.js.org/docs/two/#two-interpret) for details on supported features.

## Learn More

- **[Two.js Documentation](https://two.js.org/docs/)** — Complete Two.js API reference
- **[Two.js Examples](https://two.js.org/examples/)** — Interactive examples and demos
- **[Two.js Repository](https://github.com/jonobr1/two.js)** — Source code and issues
- **[Two.js Tutor on ChatGPT](https://chatgpt.com/g/g-hkcTX8uPm-two-js-tutor)** - Talk to a custom ChatGPT trained on Two.js and react-two.js

## Development

### Building the Library

```bash
# Build the library for npm distribution
npm run build:lib

# Build the documentation site
npm run build:docs

# Preview the documentation locally
npm run preview:docs
```

### Local Development

```bash
# Install dependencies
npm install

# Start development server (documentation)
npm run dev

# Run tests
npm test

# Run linting
npm run lint
```

For real renderer and native pointer-capture checks, run `npm run dev` and open
`http://localhost:3000/tests/browser/`. The harness checks every renderer
spelling with real SVG, Canvas, and WebGL, then offers drag checks for native
capture, bubbling, and release outside the renderer. The unit tests mock the
WebGL constructor because jsdom does not provide a GPU context.

The development server runs the documentation site which imports the library components directly from the `lib/` directory, allowing you to see changes in real-time.

## Acknowledgments

Built on top of [Two.js](https://github.com/jonobr1/two.js) by [Jono Brandel](https://jono.fyi). Inspired by [Three.js](https://threejs.org/) and [react-three-fiber](https://github.com/pmndrs/react-three-fiber).
