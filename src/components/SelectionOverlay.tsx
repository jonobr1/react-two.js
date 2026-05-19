import { useMemo } from 'react';
import { useCanvasEditorContext } from '@/canvas/CanvasContext';

/** SVG overlay that visualizes the current selection bounds. */
export function SelectionOverlay() {
  const editor = useCanvasEditorContext();
  const selectionBounds = editor.getSelectionBounds();
  const { viewport } = editor.state;

  const overlay = useMemo(() => {
    if (!selectionBounds) {
      return null;
    }

    const topLeft = editor.pageToScreen({
      x: selectionBounds.x,
      y: selectionBounds.y,
    });
    const bottomRight = editor.pageToScreen({
      x: selectionBounds.x + selectionBounds.width,
      y: selectionBounds.y + selectionBounds.height,
    });
    const width = bottomRight.x - topLeft.x;
    const height = bottomRight.y - topLeft.y;
    const handleSize = 8;
    const edgeHandleSize = 6;
    const handles = [
      { x: topLeft.x, y: topLeft.y, size: handleSize },
      { x: topLeft.x + width / 2, y: topLeft.y, size: edgeHandleSize },
      { x: topLeft.x + width, y: topLeft.y, size: handleSize },
      { x: topLeft.x + width, y: topLeft.y + height / 2, size: edgeHandleSize },
      { x: topLeft.x + width, y: topLeft.y + height, size: handleSize },
      { x: topLeft.x + width / 2, y: topLeft.y + height, size: edgeHandleSize },
      { x: topLeft.x, y: topLeft.y + height, size: handleSize },
      { x: topLeft.x, y: topLeft.y + height / 2, size: edgeHandleSize },
    ];

    return { handles, topLeft, width, height };
  }, [editor, selectionBounds]);

  if (!overlay) {
    return null;
  }

  return (
    <svg
      className="interactive-canvas__overlay"
      width={viewport.width}
      height={viewport.height}
      viewBox={`0 0 ${viewport.width} ${viewport.height}`}
      aria-hidden="true"
    >
      <rect
        x={overlay.topLeft.x}
        y={overlay.topLeft.y}
        width={overlay.width}
        height={overlay.height}
        rx={8}
        fill="rgba(53, 125, 255, 0.1)"
        stroke="#357dff"
        strokeWidth={1.5}
        strokeDasharray="6 4"
      />
      {overlay.handles.map((handle, index) => (
        <rect
          key={index}
          x={handle.x - handle.size / 2}
          y={handle.y - handle.size / 2}
          width={handle.size}
          height={handle.size}
          rx={3}
          fill="#ffffff"
          stroke="#357dff"
          strokeWidth={1.5}
        />
      ))}
      <line
        x1={overlay.topLeft.x + overlay.width / 2}
        y1={overlay.topLeft.y}
        x2={overlay.topLeft.x + overlay.width / 2}
        y2={overlay.topLeft.y - 24}
        stroke="#357dff"
        strokeWidth={1.5}
      />
      <circle
        cx={overlay.topLeft.x + overlay.width / 2}
        cy={overlay.topLeft.y - 32}
        r={6}
        fill="#ffffff"
        stroke="#357dff"
        strokeWidth={1.5}
      />
    </svg>
  );
}
