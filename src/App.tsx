import Two from 'two.js';
import { Group, Canvas, Path, useTwo } from '../lib/main';
import { useRef } from 'react';
import { useFrame } from '../lib/Context';

function Scene() {
  const { two } = useTwo();
  const path = useRef<Two.Path | null>(null);

  useFrame((elapsed) => {
    if (path.current) {
      path.current.rotation = elapsed;
    }
  });

  if (!two) {
    return null;
  }

  return (
    <Group position={new Two.Vector(two.width / 2, two.height / 2)}>
      <Path
        ref={path}
        vertices={[
          new Two.Anchor(-10, 0),
          new Two.Anchor(0, 10),
          new Two.Anchor(0, -10),
          new Two.Anchor(10, 0),
        ]}
        scale={5}
        stroke="black"
        fill="transparent"
      />
    </Group>
  );
}

function App() {
  return (
    <Canvas type={Two.Types.canvas} fullscreen={true} autostart={true}>
      <Scene />
    </Canvas>
  );
}

export default App;
