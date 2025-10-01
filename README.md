# @react-two.js

A React virtual DOM for Two.js — a renderer agnostic two-dimensional drawing API for the web. Supports SVG, Canvas, and WebGL rendering. Declaratively describe your Two.js scene within your React application.

## Installation

```bash
npm install @react-two.js react react-dom two.js
```

## Quick Start

```jsx
import { Canvas, Circle, Rectangle, useFrame } from '@react-two.js';
import { useRef } from 'react';

function AnimatedRectangle() {
  const rectangle = useRef();
  
  useFrame((elapsed) => {
    if (rectangle.current) {
      rectangle.current.rotation = elapsed * 0.5;
    }
  });
  
  return <Rectangle ref={rectangle} width={100} height={100} fill="#00AEFF" x={400} y={400} />;
}

function App() {
  return (
    <Canvas width={800} height={600}>
      <AnimatedRectangle />
    </Canvas>
  );
}
```

## Available Components

### Core Components
- `<Canvas>` - Main container component
- `<Group>` - Container for organizing components

### Shape Components
- `<Circle>` - Basic circle with radius
- `<Rectangle>` - Rectangle with width/height
- `<RoundedRectangle>` - Rectangle with corner radius
- `<Ellipse>` - Oval shape with width/height
- `<Line>` - Straight line between two points
- `<Path>` - Custom path with vertices
- `<Points>` - Collection of points
- `<Polygon>` - Regular polygon with sides
- `<Star>` - Star shape with inner/outer radius
- `<ArcSegment>` - Arc segment with angles
- `<Text>` - Text rendering component

### Advanced Components
- `<Sprite>` - Image sprite component
- `<ImageSequence>` - Animated image sequence
- `<LinearGradient>` - Linear gradient fill
- `<RadialGradient>` - Radial gradient fill
- `<Texture>` - Texture mapping component

## Hooks

### `useTwo()`
Access the Two.js instance and canvas dimensions:
```jsx
const { width, height, instance } = useTwo();
```

### `useFrame()`
Create smooth animations with frame-based updates:
```jsx
useFrame((elapsed) => {
  // Animation logic runs on every frame
  if (ref.current) {
    ref.current.rotation = elapsed * 0.5;
  }
});
```

## TypeScript Support

Full TypeScript support with proper types for all components and refs:

```tsx
import { RefCircle } from '@react-two.js';

const circleRef = useRef<RefCircle>(null);
```

## Roadmap
- [ ] Add helpers (aka gizmos)
