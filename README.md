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
- Two.js v0.8.22+

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

The development server runs the documentation site which imports the library components directly from the `lib/` directory, allowing you to see changes in real-time.

## Acknowledgments

Built on top of [Two.js](https://github.com/jonobr1/two.js) by [Jono Brandel](https://jono.fyi). Inspired by [Three.js](https://threejs.org/) and [react-three-fiber](https://github.com/pmndrs/react-three-fiber).
