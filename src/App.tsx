import Two from 'two.js';
import {
  Group,
  Canvas,
  Path,
  RefPath,
  useTwo,
  Points,
  RefPoints,
  Circle,
  RefCircle,
  Rectangle,
  RefRectangle,
  RoundedRectangle,
  RefRoundedRectangle,
  Ellipse,
  RefEllipse,
  Line,
  RefLine,
  Polygon,
  RefPolygon,
  Star,
  RefStar,
  ArcSegment,
  RefArcSegment,
  Sprite,
  RefSprite,
  ImageSequence,
  RefImageSequence,
  LinearGradient,
  RefLinearGradient,
  RadialGradient,
  RefRadialGradient,
  Texture,
  RefTexture,
  Text,
} from '../lib/main';
import { useRef, useState } from 'react';
import { useFrame } from '../lib/Context';

function Scene() {
  const { width, height } = useTwo();

  // Create refs for all components
  const path = useRef<RefPath | null>(null);
  const points = useRef<RefPoints | null>(null);
  const circle = useRef<RefCircle | null>(null);
  const rectangle = useRef<RefRectangle | null>(null);
  const roundedRectangle = useRef<RefRoundedRectangle | null>(null);
  const ellipse = useRef<RefEllipse | null>(null);
  const line = useRef<RefLine | null>(null);
  const polygon = useRef<RefPolygon | null>(null);
  const star = useRef<RefStar | null>(null);
  const arcSegment = useRef<RefArcSegment | null>(null);
  const sprite = useRef<RefSprite | null>(null);
  const imageSequence = useRef<RefImageSequence | null>(null);

  // Gradient refs
  const [linearGradient, setLinearGradient] = useState<
    string | RefLinearGradient
  >('#FF6B6B');
  const [radialGradient, setRadialGradient] = useState<
    string | RefRadialGradient
  >('#F7DC6F');

  // Texture ref
  const [texture, setTexture] = useState<string | RefTexture>('#E8E8E8');

  useFrame((elapsed) => {
    // Animate all the components
    if (path.current) {
      path.current.rotation = elapsed * 0.5;
    }
    if (points.current) {
      points.current.rotation = -elapsed * 0.3;
    }
    if (circle.current) {
      circle.current.scale = Math.sin(elapsed) * 0.25 + 1;
    }
    if (rectangle.current) {
      rectangle.current.rotation = elapsed * 0.2;
    }
    if (roundedRectangle.current) {
      roundedRectangle.current.rotation = -elapsed * 0.15;
    }
    if (ellipse.current) {
      ellipse.current.scale = Math.cos(elapsed * 0.5) * 0.25 + 1;
      ellipse.current.dashes.offset = -50 * elapsed;
    }
    if (line.current) {
      line.current.rotation = elapsed * 0.4;
    }
    if (polygon.current) {
      polygon.current.rotation = elapsed * 0.1;
    }
    if (star.current) {
      star.current.rotation = -elapsed * 0.25;
      star.current.innerRadius = 20 + Math.sin(elapsed * 2) * 10;
    }
    if (arcSegment.current) {
      arcSegment.current.startAngle = elapsed % (Math.PI * 2);
    }
    if (sprite.current) {
      sprite.current.rotation = elapsed * 0.3;
    }
    if (imageSequence.current) {
      imageSequence.current.scale = Math.cos(elapsed * 1.2) * 0.15 + 1;
    }
  });

  // Calculate grid positions
  const gridSize = 4;
  const cellWidth = width / gridSize;
  const cellHeight = height / gridSize;

  return (
    <Group>
      {/* Original components */}
      <Group x={cellWidth * 0.5} y={cellHeight * 0.5}>
        <Path
          ref={path}
          vertices={[
            new Two.Anchor(-10, 0),
            new Two.Anchor(0, 10),
            new Two.Anchor(0, -10),
            new Two.Anchor(10, 0),
          ]}
          scale={5}
          stroke="#FF5733"
          linewidth={2}
          fill="transparent"
        />
        <Points
          ref={points}
          vertices={[
            new Two.Vector(-20, -20),
            new Two.Vector(0, 0),
            new Two.Vector(20, 20),
            new Two.Vector(-20, 20),
            new Two.Vector(20, -20),
          ]}
          stroke="transparent"
          fill="#3498DB"
          size={5}
        />
      </Group>

      {/* Circle */}
      <Group x={cellWidth * 1.5} y={cellHeight * 0.5}>
        <Circle
          ref={circle}
          radius={30}
          fill="#F1C40F"
          stroke="#E67E22"
          linewidth={3}
        />
      </Group>

      {/* Rectangle */}
      <Group x={cellWidth * 2.5} y={cellHeight * 0.5}>
        <Rectangle
          ref={rectangle}
          width={60}
          height={40}
          fill="#2ECC71"
          stroke="#27AE60"
          linewidth={2}
        />
      </Group>

      {/* Text */}
      <Group x={cellWidth * 3.5} y={cellHeight * 0.5}>
        <Text value="React" fill="#ccc" size={20} baseline="middle" />
      </Group>

      {/* Rounded Rectangle */}
      <Group x={cellWidth * 0.5} y={cellHeight * 1.5}>
        <RoundedRectangle
          ref={roundedRectangle}
          width={60}
          height={40}
          radius={10}
          fill="#9B59B6"
          stroke="#8E44AD"
          linewidth={2}
        />
      </Group>

      {/* Ellipse */}
      <Group x={cellWidth * 1.5} y={cellHeight * 1.5}>
        <Ellipse
          ref={ellipse}
          width={70}
          height={40}
          fill="#3498DB"
          stroke="#2980B9"
          linewidth={2}
          dashes={[5, 5]}
        />
      </Group>

      {/* Line */}
      <Group x={cellWidth * 2.5} y={cellHeight * 1.5}>
        <Line
          ref={line}
          left={new Two.Anchor(-50, 20)}
          right={new Two.Anchor(50, 20)}
          stroke="#34495E"
          linewidth={4}
          cap="round"
        />
      </Group>

      {/* Text */}
      <Group x={cellWidth * 3.5} y={cellHeight * 1.5}>
        <Text value="Two.js" fill="#61DAFB" size={24} baseline="middle" />
      </Group>

      {/* Polygon */}
      <Group x={cellWidth * 0.5} y={cellHeight * 2.5}>
        <Polygon
          ref={polygon}
          width={100}
          height={100}
          sides={5}
          fill="#16A085"
          stroke="#1ABC9C"
          linewidth={2}
        />
      </Group>

      {/* Star */}
      <Group x={cellWidth * 1.5} y={cellHeight * 2.5}>
        <Star
          ref={star}
          innerRadius={20}
          outerRadius={40}
          sides={5}
          fill="#F39C12"
          stroke="#D35400"
          linewidth={2}
        />
      </Group>

      {/* ArcSegment */}
      <Group x={cellWidth * 2.5} y={cellHeight * 2.5}>
        <ArcSegment
          ref={arcSegment}
          innerRadius={20}
          outerRadius={40}
          startAngle={0}
          endAngle={Math.PI * 1.5}
          fill="#E74C3C"
          stroke="#C0392B"
          linewidth={2}
        />
      </Group>

      {/* Sprite */}
      <Group x={cellWidth * 3.5} y={cellHeight * 2.5}>
        <Sprite ref={sprite} path="https://placehold.co/60x60" />
      </Group>

      {/* Extra components in the 4th row */}
      <Group x={cellWidth * 0.5} y={cellHeight * 3.5}>
        <ImageSequence
          ref={imageSequence}
          paths={[
            'https://placehold.co/60x60/FF6B6B/FFFFFF?text=1',
            'https://placehold.co/60x60/4ECDC4/FFFFFF?text=2',
            'https://placehold.co/60x60/45B7D1/FFFFFF?text=3',
            'https://placehold.co/60x60/F7DC6F/FFFFFF?text=4',
          ]}
          frameRate={1}
          autoPlay={true}
        />
      </Group>

      {/* Linear Gradient Example */}
      <Group x={cellWidth * 1.5} y={cellHeight * 3.5}>
        <LinearGradient
          ref={(ref) => ref && setLinearGradient(ref)}
          x1={0}
          y1={0}
          x2={1}
          y2={1}
          stops={[
            new Two.Stop(0, 'red'),
            new Two.Stop(0.5, 'green'),
            new Two.Stop(1, 'blue'),
          ]}
        />
        <Circle radius={30} fill={linearGradient} stroke="#333" linewidth={2} />
      </Group>

      {/* Radial Gradient Example */}
      <Group x={cellWidth * 2.5} y={cellHeight * 3.5}>
        <RadialGradient
          ref={(ref) => ref && setRadialGradient(ref)}
          x={0}
          y={0}
          radius={1}
          stops={[
            new Two.Stop(0, '#F7DC6F'),
            new Two.Stop(0.7, '#F39C12'),
            new Two.Stop(1, '#E67E22'),
          ]}
        />
        <Rectangle
          width={60}
          height={40}
          fill={radialGradient}
          stroke="#333"
          linewidth={2}
        />
      </Group>

      {/* Texture Example */}
      <Group x={cellWidth * 3.5} y={cellHeight * 3.5}>
        <Texture
          ref={(ref) => ref && setTexture(ref)}
          source="https://placehold.co/60x60/9B59B6/FFFFFF?text=TEX"
        />
        <Rectangle
          width={60}
          height={40}
          fill={texture}
          stroke="#333"
          linewidth={2}
        />
      </Group>
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
