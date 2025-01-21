import Two from 'two.js';
import { Group, Canvas, Path, useTwo } from '../lib/main';

function Scene() {
  const { two } = useTwo();
  if (!two) {
    return null;
  }
  return (
    <Group position={new Two.Vector(two.width / 2, two.height / 2)}>
      <Path
        vertices={[
          new Two.Anchor(-10, 0),
          new Two.Anchor(0, 10),
          new Two.Anchor(0, -10),
          new Two.Anchor(10, 0),
        ]}
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
