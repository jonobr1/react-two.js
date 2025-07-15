# @react/two.js

A React virtual DOM for Two.js — a renderer agnostic two-dimensional drawing API for the web. Supports SVG, Canvas, and WebGL rendering. Declaratively describe your Two.js scene within your React application.

## Installation

```bash
npm install @react/two.js react react-dom two.js
```

## Quick Start

```jsx
import { Canvas, Circle, Rectangle, useFrame } from '@react/two.js';
import { useRef } from 'react';

function AnimatedCircle() {
  const circleRef = useRef();
  
  useFrame((elapsed) => {
    if (circleRef.current) {
      circleRef.current.rotation = elapsed * 0.5;
    }
  });
  
  return <Circle ref={circleRef} radius={50} fill="red" />;
}

function App() {
  return (
    <Canvas width={800} height={600}>
      <Rectangle width={100} height={100} fill="blue" x={100} y={100} />
      <AnimatedCircle />
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
import { RefCircle } from '@react/two.js';

const circleRef = useRef<RefCircle>(null);
```

## Roadmap
- [ ] Add helpers (aka gizmos)
