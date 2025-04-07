import Two from 'two.js';
import {
  Group,
  Canvas,
  Path,
  RefPath,
  useTwo,
  Points,
  RefPoints,
} from '../lib/main';
import { useRef } from 'react';
import { useFrame } from '../lib/Context';

function Scene() {
  const { two, width, height } = useTwo();

  const path = useRef<RefPath | null>(null);
  const points = useRef<RefPoints | null>(null);

  useFrame((elapsed) => {
    if (path.current) {
      path.current.rotation = elapsed;
    }
    if (points.current) {
      points.current.rotation = -elapsed;
    }
  });

  if (!two) {
    return null;
  }

  return (
    <Group position={new Two.Vector(width / 2, height / 2)}>
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
      <Points
        ref={points}
        vertices={[
          new Two.Vector(0, -100),
          new Two.Vector(0, 0),
          new Two.Vector(0, 100),
        ]}
        stroke="transparent"
        fill="blue"
        size={10}
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
