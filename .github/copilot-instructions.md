# GitHub Copilot Instructions for react-two.js

## Project Overview
react-two.js is a React wrapper library for Two.js, providing declarative React components for the Two.js 2D drawing API. It supports SVG, Canvas, and WebGL rendering with a complete React virtual DOM implementation.

## Tech Stack
- **TypeScript** - Primary language with strict typing enabled
- **React 19+** - Peer dependency for component system
- **Vite** - Development server and build tool
- **Two.js** - Core graphics library (peer dependency from @jonobr1/two.js#dev)
- **ESLint** - Code linting with React-specific rules
- **Vitest** - Testing framework with React Testing Library

## Development Commands
```bash
npm run dev      # Start Vite dev server on port 3000
npm run build    # Build library with TypeScript + Vite
npm run lint     # Run ESLint on all files
npm test         # Run tests with Vitest
```

## Code Standards

### TypeScript
- Use strict type checking (already enabled in tsconfig)
- Define interfaces for all component props
- Use generic ref types for components (e.g., `RefCircle`, `RefRectangle`)
- Export all type definitions for library consumers
- Prefer `interface` over `type` for component props

### Component Patterns
All shape components should follow this structure:
```typescript
interface ShapeProps {
  // Two.js properties
  fill?: string;
  stroke?: string;
  linewidth?: number;
  // Component-specific props
  radius?: number;
  // Transform props
  x?: number;
  y?: number;
  rotation?: number;
  scale?: number;
}

export const Shape = forwardRef<RefShape, ShapeProps>((props, ref) => {
  // Component implementation
});
```

### React Patterns
- Use `forwardRef` for all shape components to enable ref forwarding
- Use hooks (`useTwo`, `useFrame`) for context access and animations
- Follow React 19 best practices
- Avoid using state for animations - prefer `useFrame` hook with refs

### Canvas Component Rules
- Canvas only accepts react-two.js components as children
- DOM elements (`<div>`, `<span>`, etc.) cannot be used inside `<Canvas>`
- This follows React Three Fiber's strict boundary pattern
- Development mode issues warnings for invalid children

Example:
```tsx
// ✅ Correct
<div>
  <Canvas>
    <Circle radius={50} />
  </Canvas>
  <div>UI controls here</div>
</div>

// ❌ Incorrect - triggers warning
<Canvas>
  <div>This will warn</div>
  <Circle radius={50} />
</Canvas>
```

## Library Structure
```
lib/
├── main.ts           # Main exports - add new components here
├── Provider.tsx      # Canvas provider component
├── Context.ts        # React context + hooks (useTwo, useFrame)
├── Group.tsx         # Group container
├── [Shape].tsx       # Individual shape components
└── Properties.ts     # Shared type definitions
```

## Available Components

### Primitives
Circle, Rectangle, RoundedRectangle, Ellipse, Line, Path, Points, Polygon, Star, ArcSegment, Text

### Advanced Components
Sprite, ImageSequence, LinearGradient, RadialGradient, Texture, Group

### Component Features
- Ref forwarding with typed refs (e.g., `RefCircle`)
- Two.js properties (fill, stroke, linewidth, etc.)
- Transform props (x, y, rotation, scale)
- Animation support via `useFrame()` hook

## Context System

### useTwo() Hook
```typescript
const { width, height, instance } = useTwo();
```
Access Two.js instance and canvas dimensions.

### useFrame() Hook
```typescript
useFrame((elapsed: number) => {
  if (ref.current) {
    ref.current.rotation = elapsed * 0.5;
  }
});
```
Frame-based animation system for smooth 60fps animations.

## Performance Best Practices

### Animation
- Use `useFrame()` for 60fps animations
- Prefer ref-based animations over state updates
- Batch property updates within single frame callback
- Avoid frequent React state updates for animations

### Rendering
- Two.js handles efficient canvas/SVG/WebGL rendering
- Group components to minimize scene graph updates
- Use appropriate Two.js rendering type for use case

## Adding New Components
1. Create component file in `lib/` directory
2. Implement React wrapper with `forwardRef`
3. Define TypeScript interface for props
4. Add to `lib/main.ts` exports
5. Update TypeScript definitions
6. Test with example in `src/App.tsx`

## ESLint Rules
- React hooks rules enabled (`eslint-plugin-react-hooks`)
- React refresh plugin active
- TypeScript ESLint integration
- Fix all linting errors before committing

## Testing
- Use Vitest for unit tests
- Component tests require Two.js mocking (complex due to canvas/SVG/WebGL)
- Test utilities and logic first
- Integration tests for component + Two.js interactions are planned

## Common Pitfalls

### Canvas Children
Only react-two.js components can be children of `<Canvas>`. DOM elements will trigger warnings.

### Peer Dependencies
- Ensure React 19+ is installed
- Two.js must be from @jonobr1/two.js#dev branch
- Check peer dependency warnings during install

### TypeScript
- Component prop interfaces must match Two.js API
- Verify ref types are correctly typed
- Use proper generic types for components

### Animation
- Don't use React state for animations
- Use `useFrame()` with refs for direct Two.js object manipulation
- Avoid `setState` in animation loops

## Build Configuration
- ES Modules only (modern format)
- TypeScript declarations generated
- React and Two.js are peer dependencies (external)
- Library entry point: `lib/main.ts`
- Output directory: `dist/`

## Comments
- Match existing comment style in files
- Use comments for complex logic only
- Document public APIs and non-obvious behavior
- Prefer self-documenting code over comments

## Dependencies
- Only add new libraries if absolutely necessary
- Prefer using existing Two.js and React APIs
- Check for existing solutions before adding dependencies
