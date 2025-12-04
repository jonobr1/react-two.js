import Two from 'two.js';
import {
  Canvas,
  Group,
  Circle,
  Rectangle,
  Star,
  Text,
  useZUI,
  useTwo,
  RefGroup,
} from '../lib/main';
import { useRef } from 'react';

function ZoomableScene() {
  const groupRef = useRef<RefGroup>(null);
  const { width, height } = useTwo();

  const { zoom, scale, reset } = useZUI(groupRef, {
    minZoom: 0.5,
    maxZoom: 5.0,
    zoomDelta: 0.05,
  });

  // Create a grid of shapes
  const shapes = [];
  const gridSize = 5;
  const spacing = 120;
  const startX = -spacing * (gridSize - 1) / 2;
  const startY = -spacing * (gridSize - 1) / 2;

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const x = startX + i * spacing;
      const y = startY + j * spacing;
      const shapeType = (i + j) % 3;

      if (shapeType === 0) {
        shapes.push(
          <Circle
            key={`${i}-${j}`}
            x={x}
            y={y}
            radius={30}
            fill={`hsl(${(i * gridSize + j) * 15}, 70%, 60%)`}
            stroke="#333"
            linewidth={2}
          />
        );
      } else if (shapeType === 1) {
        shapes.push(
          <Rectangle
            key={`${i}-${j}`}
            x={x}
            y={y}
            width={50}
            height={50}
            fill={`hsl(${(i * gridSize + j) * 15}, 70%, 60%)`}
            stroke="#333"
            linewidth={2}
          />
        );
      } else {
        shapes.push(
          <Star
            key={`${i}-${j}`}
            x={x}
            y={y}
            innerRadius={15}
            outerRadius={30}
            sides={5}
            fill={`hsl(${(i * gridSize + j) * 15}, 70%, 60%)`}
            stroke="#333"
            linewidth={2}
          />
        );
      }
    }
  }

  return (
    <>
      {/* UI Controls overlay */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '15px 20px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '14px',
          zIndex: 1000,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
          ZUI Controls
        </div>
        <div>Zoom: {zoom.toFixed(2)}</div>
        <div>Scale: {scale.toFixed(2)}x</div>
        <div style={{ marginTop: '10px', fontSize: '12px', opacity: 0.8 }}>
          <div>• Mouse wheel to zoom</div>
          <div>• Click + drag to pan</div>
          <div>• Pinch to zoom (touch)</div>
        </div>
      </div>

      {/* Reset button */}
      <button
        onClick={reset}
        style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          background: '#3498db',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontFamily: 'monospace',
          fontSize: '14px',
          fontWeight: 'bold',
          zIndex: 1000,
          transition: 'background 0.2s',
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = '#2980b9')}
        onMouseOut={(e) => (e.currentTarget.style.background = '#3498db')}
      >
        Reset View
      </button>

      {/* Zoomable group */}
      <Group ref={groupRef} x={width / 2} y={height / 2}>
        {shapes}

        {/* Center marker */}
        <Circle
          radius={8}
          fill="red"
          stroke="white"
          linewidth={2}
        />

        {/* Origin label */}
        <Text
          value="Origin (0,0)"
          y={20}
          fill="#333"
          size={14}
          alignment="center"
          baseline="middle"
        />
      </Group>
    </>
  );
}

export default function ZUIExample({
  width,
  height,
}: {
  width?: number;
  height?: number;
}) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas
        type={Two.Types.canvas}
        width={width}
        height={height}
        autostart={true}
      >
        <ZoomableScene />
      </Canvas>
    </div>
  );
}
