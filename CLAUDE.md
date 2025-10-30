# React Two.js Library - Claude Context

## Project Overview
This is **react-two.js** - a React wrapper library for Two.js, providing declarative React components for the Two.js 2D drawing API. It supports SVG, Canvas, and WebGL rendering with a complete React virtual DOM implementation.

## Tech Stack
- **TypeScript** - Primary language with strict typing
- **React 18.3+** - Peer dependency for component system
- **Vite** - Development server and build tool
- **Two.js** - Core graphics library (peer dependency from @jonobr1/two.js#dev)
- **ESLint** - Code linting with React-specific rules
- **Vitest** - Next-generation testing framework with React Testing Library

## Development Commands
```bash
npm run dev      # Start Vite dev server on port 3000
npm run build    # Build library with TypeScript + Vite
npm run lint     # Run ESLint on all files
npm run preview  # Preview built library

# Testing Commands
npm test              # Run all tests with Vitest
npm run test:watch    # Run tests in watch mode
npm run test:ui       # Run tests with UI interface
npm run test:coverage # Generate coverage report
```

## Architecture Overview

### Core Components
- **Canvas** - Main container component (`<Canvas>`)
  - **IMPORTANT**: Canvas only accepts react-two.js components as children
  - DOM elements (`<div>`, `<span>`, etc.) cannot be used inside Canvas
  - This follows React Three Fiber's strict boundary pattern
  - Warnings are issued in development mode for invalid children
- **Context System** - `useTwo()` and `useFrame()` hooks
- **Group** - Container for organizing components
- **15+ Shape Components** - All Two.js primitives wrapped

### Library Structure
```
lib/
├── main.ts           # Main exports
├── Provider.tsx      # Canvas provider component
├── Context.ts        # React context + hooks
├── Group.tsx         # Group container
├── [Shape].tsx       # Individual shape components
└── Properties.ts     # Shared type definitions
```

### Build Configuration
- **ES Modules only** - Modern format
- **TypeScript declarations** - Full type support
- **External dependencies** - React and Two.js as peer deps
- **Library entry** - `lib/main.ts`

## Available Components

### Primitives
- `Circle` - Basic circle with radius
- `Rectangle` - Rectangle with width/height
- `RoundedRectangle` - Rectangle with corner radius
- `Ellipse` - Oval shape with width/height
- `Line` - Straight line between two points
- `Path` - Custom path with vertices
- `Points` - Collection of points
- `Polygon` - Regular polygon with sides
- `Star` - Star shape with inner/outer radius
- `ArcSegment` - Arc segment with angles
- `Text` - Text rendering component

### Advanced Components
- `Sprite` - Image sprite component
- `ImageSequence` - Animated image sequence
- `LinearGradient` - Linear gradient fill
- `RadialGradient` - Radial gradient fill
- `Texture` - Texture mapping component
- `Group` - Container for grouping components

### Component Patterns
All components support:
- **Ref forwarding** - `RefShape` types for imperative access
- **Two.js properties** - fill, stroke, linewidth, etc.
- **Transform props** - x, y, rotation, scale
- **Animation support** - via `useFrame()` hook

## Context System

### useTwo() Hook
```typescript
const { width, height, instance } = useTwo();
```
Provides access to Two.js instance and canvas dimensions.

### useFrame() Hook
```typescript
useFrame((elapsed: number) => {
  // Animation logic runs on every frame
  if (ref.current) {
    ref.current.rotation = elapsed * 0.5;
  }
});
```
Frame-based animation system for smooth animations.

## Ref System
Each component has a corresponding ref type:
- `RefCircle`, `RefRectangle`, `RefPath`, etc.
- Provides direct access to underlying Two.js objects
- Enables imperative animations and property access

## Code Standards

### TypeScript Patterns
- Strict type checking enabled
- Interface-based prop definitions
- Generic ref types for components
- Exported type definitions for consumers

### Component Structure
```typescript
interface ShapeProps {
  // Two.js properties
  fill?: string;
  stroke?: string;
  // Component-specific props
  radius?: number;
  // Standard props
  x?: number;
  y?: number;
}

export const Shape = forwardRef<RefShape, ShapeProps>((props, ref) => {
  // Component implementation
});
```

### ESLint Configuration
- React hooks rules enabled
- React refresh plugin active
- TypeScript ESLint integration
- Strict linting for consistent code quality

## Performance Considerations

### Animation Patterns
- Use `useFrame()` for smooth 60fps animations
- Prefer ref-based animations over state updates
- Batch property updates within single frame callback

### Rendering Optimization
- Two.js handles efficient canvas/SVG/WebGL rendering
- Group components to minimize scene graph updates
- Use appropriate Two.js rendering type for use case

## Development Workflow

### Adding New Components
1. Create component file in `lib/` directory
2. Implement React wrapper with forwardRef
3. Add to `lib/main.ts` exports
4. Update TypeScript definitions
5. Test with example in `src/App.tsx`

### Testing Components
- Use Vite dev server for interactive testing
- Example implementations in `src/App.tsx`
- Manual testing with different Two.js renderer types

### Build Process
- TypeScript compilation for type checking
- Vite builds ES modules with bundled dependencies
- Generates TypeScript declaration files
- Outputs to `dist/` directory

## Common Issues & Solutions

### Canvas Children Restrictions
- **Problem**: DOM elements inside `<Canvas>` cause warnings
- **Solution**: Only use react-two.js components inside Canvas
- **Pattern**: Place DOM elements outside of Canvas
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

### Peer Dependencies
- Ensure React 18.3+ is installed
- Two.js must be from @jonobr1/two.js#dev branch
- Check peer dependency warnings during install

### Animation Performance
- Use requestAnimationFrame via useFrame() hook
- Avoid frequent React state updates for animations
- Prefer direct Two.js object manipulation via refs

### TypeScript Errors
- Check component prop interfaces match Two.js API
- Verify ref types are correctly typed
- Ensure proper generic type usage

## Future Roadmap
- [ ] Support for effects
- [ ] Make props cascade and updates more discrete  
- [ ] Add helpers (aka gizmos)

## Testing Framework

### Current Setup
- **Vitest** - Fast test runner with ES modules support
- **React Testing Library** - Component testing utilities  
- **jsdom** - Browser environment for testing
- **@testing-library/jest-dom** - Custom DOM matchers

### Testing Strategy
- **Unit tests** - Individual component logic and utilities
- **Integration tests** - Component + Two.js interactions (TODO)
- **Visual tests** - Canvas rendering verification (TODO)

### Known Limitations
Component testing requires sophisticated Two.js mocking due to:
- Canvas/SVG/WebGL rendering complexity
- Context provider dependencies (useTwo, useFrame)
- Direct Two.js object manipulation via refs

Basic utility and logic tests are working. Component tests need enhanced mocking strategy.

## Contributing
This library follows React patterns with Two.js integration. When adding features:
1. Maintain TypeScript strict mode compliance
2. Follow existing component patterns
3. Write tests for new functionality
4. Test across different Two.js renderer types
5. Update documentation and examples
6. Ensure proper ref forwarding and type safety