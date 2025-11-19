# Native Bindings Guide for react-two.js

This guide explains how to implement native rendering bindings for `react-two.js`, enabling high-performance 2D graphics on iOS (via Metal) and Android (via Canvas/OpenGL) while keeping the declarative React API.

## Architecture Overview

`react-two.js` runs in the JavaScript thread. To render on native platforms, we need a bridge that:
1.  **Intercepts Two.js commands**: The JS side generates a scene graph.
2.  **Serializes Rendering Data**: We need to send draw calls (paths, fills, strokes) to the native side.
3.  **Native Renderer**: A native view (Swift/Kotlin) that interprets these commands and draws them.

### The "Headless" Approach

Two.js supports running in a headless environment (no DOM). We can leverage this to use Two.js as a scene graph manager and math engine, while offloading the actual pixel pushing to the native GPU.

## iOS Implementation (Metal)

For iOS, we use Swift Package Manager (SPM) to manage the native module.

### 1. Create the Native Module

We have provided a `Package.swift` file in the root. This defines the `react-two` library.

**Swift Package Manager Setup**:
1.  In your React Native project (if using Expo with CNG or a bare workflow), you can add the local package or git dependency.
2.  For local development, drag the `react-two.js` folder (or just the `Package.swift`) into your Xcode project's "Package Dependencies".

**The View Manager (`ios/TwoViewManager.swift`)**:
This Swift class exposes the `TwoView` to JavaScript.

```swift
@objc(TwoViewManager)
class TwoViewManager: RCTViewManager {
  override func view() -> UIView! {
    return TwoMetalView()
  }
  
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
```

### 2. Create the Metal View

`TwoMetalView` (`ios/TwoMetalView.swift`) handles the Metal rendering pipeline.

```swift
import MetalKit

class TwoMetalView: MTKView {
  // ... Metal setup code ...
  
  // Receive draw commands from JS
  @objc var drawCommands: NSDictionary = [:] {
    didSet {
      self.setNeedsDisplay()
    }
  }
  
  override func draw(_ rect: CGRect) {
    // 1. Create Command Buffer
    // 2. Parse drawCommands
    // 3. Encode render commands (draw primitives)
    // 4. Commit buffer
  }
}
```

### 3. The JS-Native Bridge

In your React Native app, you will use the `react-two.js/native` exports.

```typescript
import { Canvas, Circle } from 'react-two.js/native';

function App() {
  return (
    <Canvas style={{ flex: 1 }}>
       <Circle x={100} y={100} radius={50} fill="red" />
    </Canvas>
  );
}
```

**Crucial Step**: The `Provider` in `lib/native/Provider.tsx` uses `requireNativeComponent` to connect to the native view. You must ensure your native module is correctly linked so React Native can find `TwoView`.

## Android Implementation

The concept is similar for Android.

1.  Create a `SimpleViewManager` in Java/Kotlin.
2.  Create a custom `View` that overrides `onDraw(Canvas canvas)`.
3.  Receive the serialized JSON commands and map them to `canvas.drawCircle`, `canvas.drawPath`, etc.

## Optimization Tips

-   **Batch Updates**: Don't send updates for every single property change. Batch them per frame.
-   **Binary Format**: For complex scenes, JSON serialization is slow. Consider using ArrayBuffers or JSI (JavaScript Interface) for direct memory access between JS and C++ (Native).
-   **Reanimated**: Integrate with `react-native-reanimated` for running animations on the UI thread to avoid bridge traffic.
