import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react';
import Two from 'two.js';
import { Canvas as TwoCanvas, Group, useTwo } from '../../lib/main';
import { CanvasEditorProvider, useCanvasEditorContext } from '@/canvas/CanvasContext';
import { CanvasShapeRenderer } from '@/canvas/shapes';
import { Toolbar } from '@/components/Toolbar';
import { SelectionOverlay } from '@/components/SelectionOverlay';
import { boundsIntersect, expandBounds, getShapeBounds, unionBounds } from '@/utils/boundingBox';
import { cloneDocument } from '@/utils/serialize';
import type { CanvasDocument, CanvasPoint, CanvasShapeRecord } from '@/canvas/types';

interface GestureSnapshot {
  center: CanvasPoint;
  distance: number;
}

interface TranslationSnapshot {
  before: CanvasDocument;
  originPagePoint: CanvasPoint;
  pointerId: number;
  selectedIds: Set<string>;
}

function getDistance(a: CanvasPoint, b: CanvasPoint) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function getCenter(a: CanvasPoint, b: CanvasPoint): CanvasPoint {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

function translateShape(shape: CanvasShapeRecord, delta: CanvasPoint): CanvasShapeRecord {
  switch (shape.type) {
    case 'rectangle':
    case 'ellipse':
    case 'text':
    case 'sticky':
    case 'frame':
      return {
        ...shape,
        x: shape.x + delta.x,
        y: shape.y + delta.y,
      };
    case 'arrow':
      return {
        ...shape,
        x: shape.x + delta.x,
        y: shape.y + delta.y,
        x2: shape.x2 + delta.x,
        y2: shape.y2 + delta.y,
      };
    case 'line':
    case 'path':
      return {
        ...shape,
        points: shape.points.map((point) => ({
          x: point.x + delta.x,
          y: point.y + delta.y,
        })),
      };
  }
}

function snapShape(shape: CanvasShapeRecord): CanvasShapeRecord {
  switch (shape.type) {
    case 'rectangle':
    case 'ellipse':
    case 'text':
    case 'sticky':
    case 'frame':
      return {
        ...shape,
        x: Math.round(shape.x),
        y: Math.round(shape.y),
      };
    case 'arrow':
      return {
        ...shape,
        x: Math.round(shape.x),
        y: Math.round(shape.y),
        x2: Math.round(shape.x2),
        y2: Math.round(shape.y2),
      };
    case 'line':
    case 'path':
      return {
        ...shape,
        points: shape.points.map((point) => ({
          x: Math.round(point.x),
          y: Math.round(point.y),
        })),
      };
  }
}

function translateDocumentSelection(
  document: CanvasDocument,
  selectedIds: Set<string>,
  delta: CanvasPoint,
) {
  return {
    shapes: document.shapes.map((shape) =>
      selectedIds.has(shape.id) ? translateShape(shape, delta) : shape,
    ),
  };
}

function snapDocumentSelection(document: CanvasDocument, selectedIds: Set<string>) {
  return {
    shapes: document.shapes.map((shape) =>
      selectedIds.has(shape.id) ? snapShape(shape) : shape,
    ),
  };
}

function EditorScene() {
  const editor = useCanvasEditorContext();
  const { two } = useTwo();
  const { camera, document, viewport } = editor.state;

  const viewportBounds = editor.getViewportPageBounds();
  const visibleShapeIds = useMemo(() => {
    return new Set(
      document.shapes
        .filter((shape) =>
          boundsIntersect(expandBounds(getShapeBounds(shape), 120 / camera.z), viewportBounds),
        )
        .map((shape) => shape.id),
    );
  }, [camera.z, document.shapes, viewportBounds]);

  useEffect(() => {
    editor.setTwo(two);
  }, [editor, two]);

  useEffect(() => {
    if (!two) {
      return;
    }

    two.update();
  }, [camera, document.shapes, editor, viewport.width, viewport.height, visibleShapeIds, two]);

  return (
    <Group
      ref={(group) => editor.setSceneRoot(group)}
      x={camera.x * camera.z}
      y={camera.y * camera.z}
      scale={camera.z}
    >
      {document.shapes.map((shape) => (
        <CanvasShapeRenderer
          key={shape.id}
          shape={shape}
          visible={visibleShapeIds.has(shape.id)}
        />
      ))}
    </Group>
  );
}

function CanvasSurface() {
  const editor = useCanvasEditorContext();
  const stageRef = useRef<HTMLDivElement | null>(null);
  const fittedRef = useRef(false);
  const panPointerIdRef = useRef<number | null>(null);
  const lastScreenPointRef = useRef<CanvasPoint | null>(null);
  const touchPointsRef = useRef<Map<number, CanvasPoint>>(new Map());
  const gestureRef = useRef<GestureSnapshot | null>(null);
  const translationRef = useRef<TranslationSnapshot | null>(null);
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
  const [dragReadout, setDragReadout] = useState<CanvasPoint | null>(null);

  useEffect(() => {
    const stage = stageRef.current;

    if (!stage) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      editor.setViewport({
        width: Math.round(entry.contentRect.width),
        height: Math.round(entry.contentRect.height),
      });
    });

    observer.observe(stage);

    return () => observer.disconnect();
  }, [editor]);

  useEffect(() => {
    if (canvasElementRef.current) {
      editor.setCanvasElement(canvasElementRef.current);
    }
  }, [editor]);

  useEffect(() => {
    if (fittedRef.current) {
      return;
    }

    if (editor.state.viewport.width === 0 || editor.state.viewport.height === 0) {
      return;
    }

    const bounds = unionBounds(
      editor.state.document.shapes.map((shape) => getShapeBounds(shape)),
    );

    if (bounds) {
      editor.zoomToBounds(bounds, 120);
      fittedRef.current = true;
    }
  }, [editor]);

  const gridStyle = useMemo(() => {
    const { camera } = editor.state;
    const gridSize = Math.max(1, 24 * camera.z);
    const offsetX = ((camera.x * camera.z) % gridSize + gridSize) % gridSize;
    const offsetY = ((camera.y * camera.z) % gridSize + gridSize) % gridSize;
    const backgroundPosition = `${offsetX}px ${offsetY}px`;

    return {
      backgroundPosition,
      backgroundSize: `${gridSize}px ${gridSize}px`,
    };
  }, [editor.state]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = stageRef.current?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    const point = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    if (event.pointerType === 'touch') {
      touchPointsRef.current.set(event.pointerId, point);

      if (touchPointsRef.current.size === 2) {
        const [first, second] = [...touchPointsRef.current.values()];
        gestureRef.current = {
          center: getCenter(first, second),
          distance: getDistance(first, second),
        };
      }

      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    if (event.button === 1) {
      panPointerIdRef.current = event.pointerId;
      lastScreenPointRef.current = point;
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    const pagePoint = editor.screenToPage(point);
    const hitShape = editor.hitTest(pagePoint);

    if (hitShape && editor.state.activeTool === 'select' && event.button === 0) {
      const selectedIds = editor.state.selectedShapeIds.has(hitShape.id)
        ? new Set(editor.state.selectedShapeIds)
        : new Set([hitShape.id]);
      const hitBounds = getShapeBounds(hitShape);

      editor.setSelectedShapeIds(selectedIds);
      translationRef.current = {
        before: cloneDocument(editor.state.document),
        originPagePoint: pagePoint,
        pointerId: event.pointerId,
        selectedIds,
      };
      setDragReadout({ x: hitBounds.x, y: hitBounds.y });
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    if (editor.state.activeTool === 'hand' || !hitShape) {
      panPointerIdRef.current = event.pointerId;
      lastScreenPointRef.current = point;
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    if (hitShape) {
      editor.setSelectedShapeIds([hitShape.id]);
    } else {
      editor.selectNone();
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = stageRef.current?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    const point = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    if (event.pointerType === 'touch' && touchPointsRef.current.has(event.pointerId)) {
      touchPointsRef.current.set(event.pointerId, point);

      if (touchPointsRef.current.size === 2) {
        const [first, second] = [...touchPointsRef.current.values()];
        const currentGesture = {
          center: getCenter(first, second),
          distance: getDistance(first, second),
        };

        if (gestureRef.current) {
          const scaleDelta =
            gestureRef.current.distance === 0
              ? 1
              : currentGesture.distance / gestureRef.current.distance;
          editor.panCamera({
            x: currentGesture.center.x - gestureRef.current.center.x,
            y: currentGesture.center.y - gestureRef.current.center.y,
          });
          editor.zoomCameraAtScreenPoint(
            editor.state.camera.z * scaleDelta,
            currentGesture.center,
          );
        }

        gestureRef.current = currentGesture;
      }

      return;
    }

    if (translationRef.current?.pointerId === event.pointerId) {
      const selectedIds = translationRef.current.selectedIds;
      const currentPagePoint = editor.screenToPage(point);
      const delta = {
        x: currentPagePoint.x - translationRef.current.originPagePoint.x,
        y: currentPagePoint.y - translationRef.current.originPagePoint.y,
      };
      const nextDocument = translateDocumentSelection(
        translationRef.current.before,
        selectedIds,
        delta,
      );

      editor.replaceDocument(nextDocument);

      const movedBounds = unionBounds(
        nextDocument.shapes
          .filter((shape) => selectedIds.has(shape.id))
          .map((shape) => getShapeBounds(shape)),
      );

      if (movedBounds) {
        setDragReadout({ x: movedBounds.x, y: movedBounds.y });
      }

      return;
    }

    if (panPointerIdRef.current !== event.pointerId || !lastScreenPointRef.current) {
      return;
    }

    editor.panCamera({
      x: point.x - lastScreenPointRef.current.x,
      y: point.y - lastScreenPointRef.current.y,
    });
    lastScreenPointRef.current = point;
  };

  const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (translationRef.current?.pointerId === event.pointerId) {
      if (event.type === 'pointercancel') {
        editor.replaceDocument(translationRef.current.before);
      } else {
        const snappedDocument = snapDocumentSelection(
          editor.state.document,
          translationRef.current.selectedIds,
        );

        editor.replaceDocument(snappedDocument);

        if (
          JSON.stringify(translationRef.current.before) !== JSON.stringify(snappedDocument)
        ) {
          editor.commitDocumentCommand(
            'move selection',
            translationRef.current.before,
            snappedDocument,
          );
        }
      }

      translationRef.current = null;
      setDragReadout(null);
    }

    if (event.pointerType === 'touch') {
      touchPointsRef.current.delete(event.pointerId);
      if (touchPointsRef.current.size < 2) {
        gestureRef.current = null;
      }
    }

    if (panPointerIdRef.current === event.pointerId) {
      panPointerIdRef.current = null;
      lastScreenPointRef.current = null;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault();

    const rect = stageRef.current?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    const screenPoint = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    const nextZoom = editor.state.camera.z * Math.exp(-event.deltaY * 0.0015);

    editor.zoomCameraAtScreenPoint(nextZoom, screenPoint);
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const isAccelerator = event.metaKey || event.ctrlKey;

    if (isAccelerator && event.key === '=') {
      event.preventDefault();
      editor.zoomIn();
      return;
    }

    if (isAccelerator && event.key === '-') {
      event.preventDefault();
      editor.zoomOut();
      return;
    }

    if (isAccelerator && event.key === '0') {
      event.preventDefault();
      const bounds = unionBounds(
        editor.state.document.shapes.map((shape) => getShapeBounds(shape)),
      );

      if (bounds) {
        editor.zoomToBounds(bounds, 120);
      } else {
        editor.resetZoom();
      }

      return;
    }

    switch (event.key.toLowerCase()) {
      case 'v':
        editor.setActiveTool('select');
        break;
      case 'h':
        editor.setActiveTool('hand');
        break;
      case 'r':
        editor.setActiveTool('rectangle');
        break;
      case 'e':
        editor.setActiveTool('ellipse');
        break;
      case 'a':
        editor.setActiveTool('arrow');
        break;
      case 'l':
        editor.setActiveTool('line');
        break;
      case 't':
        editor.setActiveTool('text');
        break;
    }
  };

  return (
    <div className="interactive-canvas">
      <Toolbar />
      <div className="interactive-canvas__status">
        <span>Camera</span>
        <strong>
          {editor.state.camera.x.toFixed(1)}, {editor.state.camera.y.toFixed(1)}
        </strong>
        <span>Zoom</span>
        <strong>{(editor.state.camera.z * 100).toFixed(0)}%</strong>
      </div>
      <div
        ref={stageRef}
        className="interactive-canvas__stage"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onWheel={handleWheel}
      >
        <div className="interactive-canvas__grid" style={gridStyle} />
        <TwoCanvas
          ref={canvasElementRef}
          type={Two.Types.canvas}
          width={editor.state.viewport.width}
          height={editor.state.viewport.height}
          autostart={false}
          className="interactive-canvas__surface"
          style={{ pointerEvents: 'none' }}
          aria-label="Interactive react-two.js infinite canvas"
        >
          <EditorScene />
        </TwoCanvas>
        <SelectionOverlay />
        {dragReadout ? (
          <div
            className="interactive-canvas__readout"
            style={{
              left: editor.pageToScreen(dragReadout).x,
              top: Math.max(16, editor.pageToScreen(dragReadout).y - 36),
            }}
          >
            x {Math.round(dragReadout.x)} · y {Math.round(dragReadout.y)}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Interactive canvas example mounted inside the demo app. */
export default function InteractiveCanvas() {
  return (
    <CanvasEditorProvider>
      <CanvasSurface />
    </CanvasEditorProvider>
  );
}
