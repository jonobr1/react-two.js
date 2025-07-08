# Testing Guide for React Two.js Library

## Current Setup

The testing framework is configured with:
- **Vitest** - Fast test runner with ES modules support
- **React Testing Library** - Component testing utilities
- **jsdom** - Browser environment for testing
- **@testing-library/jest-dom** - Custom DOM matchers

## Running Tests

```bash
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:ui       # Run tests with UI interface
npm run test:coverage # Generate coverage report
```

## Test Structure

Tests are organized in `__tests__` directories:
- `src/__tests__/` - Application-level tests
- `lib/__tests__/` - Library component tests (TODO)

## Writing Tests

### Basic Unit Tests
```typescript
import { describe, it, expect } from 'vitest';

describe('Component Name', () => {
  it('should perform expected behavior', () => {
    expect(true).toBe(true);
  });
});
```

### Component Tests (Future)
Due to the complex nature of Two.js integration and canvas rendering, component tests require:
1. Proper Two.js mocking strategy
2. Canvas/SVG/WebGL rendering mocks
3. Context provider setup for useTwo/useFrame hooks

## TODO: Enhanced Testing

- [ ] Create comprehensive Two.js mocks
- [ ] Add component integration tests
- [ ] Add visual regression tests
- [ ] Set up coverage reporting
- [ ] Add performance benchmarks
- [ ] Create test utilities for common patterns

## Testing Philosophy

This library focuses on:
1. **Unit testing** - Individual component logic
2. **Integration testing** - Component + Two.js interactions
3. **Visual testing** - Canvas rendering verification (future)
4. **Performance testing** - Animation and rendering performance