import Two from 'two.js';

export interface NativeCanvasProps {
  style?: Record<string, unknown>;
  children?: React.ReactNode;
}

export interface NativeTwoInstance extends Two {
  // Add any native-specific extensions to the Two instance here
  // For now, it matches the standard Two instance
}
