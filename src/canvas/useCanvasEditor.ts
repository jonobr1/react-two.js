import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type Dispatch,
  type SetStateAction,
} from 'react';
import type Two from 'two.js';
import type { Group } from 'two.js/src/group';
import {
  createCanvasHistory,
  pushCanvasCommand,
  redoCanvasCommand,
  undoCanvasCommand,
  type CanvasCommand,
  type CanvasHistory,
} from '@/canvas/history';
import type {
  CanvasBounds,
  CanvasCamera,
  CanvasDocument,
  CanvasPoint,
  CanvasShapeRecord,
  CanvasStyle,
  CanvasToolId,
  CanvasViewport,
} from '@/canvas/types';
import { cloneDocument } from '@/utils/serialize';
import { getShapeBounds, unionBounds } from '@/utils/boundingBox';
import { hitTestShape } from '@/utils/hitTest';

const MIN_ZOOM = 0.05;
const MAX_ZOOM = 8;
const DEFAULT_TOOL: CanvasToolId = 'select';

const DEFAULT_STYLE: CanvasStyle = {
  fill: '#e8e8e8',
  stroke: '#1d1d1d',
  strokeWidth: 2,
  opacity: 1,
  fontSize: 20,
  fontFamily: '"DM Sans", sans-serif',
  dash: 'solid',
};

const INITIAL_DOCUMENT: CanvasDocument = {
  shapes: [
    {
      id: 'frame-foundation',
      type: 'frame',
      x: 40,
      y: 48,
      width: 340,
      height: 244,
      label: 'Phase 0 Frame',
      fill: 'rgba(255,255,255,0)',
      stroke: '#8a7f73',
      strokeWidth: 2,
      fontSize: 16,
      fontFamily: '"DM Sans", sans-serif',
      rotation: 0,
      opacity: 1,
      parentId: null,
    },
    {
      id: 'sticky-welcome',
      type: 'sticky',
      x: 82,
      y: 102,
      width: 170,
      height: 126,
      text: 'Pan the board by dragging the background.\nUse the wheel to zoom toward your cursor.',
      fill: '#f9ed9b',
      stroke: '#7c6427',
      strokeWidth: 2,
      fontSize: 18,
      fontFamily: '"DM Sans", sans-serif',
      rotation: -0.05,
      opacity: 1,
      parentId: 'frame-foundation',
    },
    {
      id: 'rect-library',
      type: 'rectangle',
      x: 434,
      y: 92,
      width: 188,
      height: 116,
      radius: 18,
      fill: '#dce9ff',
      stroke: '#153c76',
      strokeWidth: 2,
      dash: 'solid',
      rotation: 0.03,
      opacity: 1,
      parentId: null,
    },
    {
      id: 'ellipse-backend',
      type: 'ellipse',
      x: 714,
      y: 114,
      width: 170,
      height: 96,
      fill: '#ffd2c0',
      stroke: '#9d3d1a',
      strokeWidth: 2,
      dash: 'dashed',
      rotation: -0.08,
      opacity: 1,
      parentId: null,
    },
    {
      id: 'arrow-link',
      type: 'arrow',
      x: 252,
      y: 166,
      x2: 434,
      y2: 148,
      stroke: '#1d1d1d',
      strokeWidth: 3,
      dash: 'solid',
      rotation: 0,
      opacity: 1,
      parentId: null,
    },
    {
      id: 'text-title',
      type: 'text',
      x: 432,
      y: 252,
      width: 246,
      height: 42,
      text: 'react-two.js canvas editor',
      fill: '#101828',
      fontSize: 28,
      fontFamily: '"DM Sans", sans-serif',
      align: 'left',
      rotation: 0,
      opacity: 1,
      parentId: null,
    },
  ],
};

interface CanvasEditorState {
  camera: CanvasCamera;
  viewport: CanvasViewport;
  document: CanvasDocument;
  selectedShapeIds: Set<string>;
  activeTool: CanvasToolId;
  currentStyle: CanvasStyle;
  history: CanvasHistory<CanvasDocument>;
}

type CanvasEditorAction =
  | { type: 'set_camera'; camera: CanvasCamera }
  | { type: 'set_viewport'; viewport: CanvasViewport }
  | { type: 'set_tool'; tool: CanvasToolId }
  | { type: 'set_selected_shape_ids'; selectedShapeIds: Set<string> }
  | { type: 'set_current_style'; currentStyle: CanvasStyle }
  | { type: 'replace_document'; document: CanvasDocument }
  | { type: 'apply_command'; command: CanvasCommand<CanvasDocument> }
  | { type: 'undo' }
  | { type: 'redo' };

export interface CanvasEditorRuntime {
  two: Two | null;
  sceneRoot: Group | null;
  canvasElement: HTMLCanvasElement | SVGElement | null;
}

export interface CanvasEditor {
  state: CanvasEditorState;
  runtime: CanvasEditorRuntime;
  setTwo: Dispatch<SetStateAction<Two | null>>;
  setSceneRoot: Dispatch<SetStateAction<Group | null>>;
  setCanvasElement: Dispatch<
    SetStateAction<HTMLCanvasElement | SVGElement | null>
  >;
  setViewport: (viewport: CanvasViewport) => void;
  setActiveTool: (tool: CanvasToolId) => void;
  setCurrentStyle: (style: CanvasStyle) => void;
  setSelectedShapeIds: (ids: Iterable<string>) => void;
  selectNone: () => void;
  getSelectedShapes: () => CanvasShapeRecord[];
  getSelectionBounds: () => CanvasBounds | null;
  getViewportPageBounds: () => CanvasBounds;
  hitTest: (point: CanvasPoint, tolerance?: number) => CanvasShapeRecord | null;
  setCamera: (camera: Partial<CanvasCamera>) => void;
  panCamera: (delta: CanvasPoint) => void;
  zoomCameraAtScreenPoint: (nextZoom: number, screenPoint: CanvasPoint) => void;
  zoomIn: (screenPoint?: CanvasPoint) => void;
  zoomOut: (screenPoint?: CanvasPoint) => void;
  resetZoom: () => void;
  zoomToBounds: (bounds: CanvasBounds, inset?: number) => void;
  replaceDocument: (document: CanvasDocument) => void;
  commitDocumentCommand: (
    label: string,
    before: CanvasDocument,
    after: CanvasDocument,
  ) => void;
  executeDocumentCommand: (
    label: string,
    update: (document: CanvasDocument) => CanvasDocument,
  ) => void;
  undo: () => void;
  redo: () => void;
  screenToPage: (point: CanvasPoint) => CanvasPoint;
  pageToScreen: (point: CanvasPoint) => CanvasPoint;
}

function createInitialState(): CanvasEditorState {
  return {
    camera: { x: 32, y: 28, z: 1 },
    viewport: { width: 0, height: 0 },
    document: cloneDocument(INITIAL_DOCUMENT),
    selectedShapeIds: new Set(),
    activeTool: DEFAULT_TOOL,
    currentStyle: DEFAULT_STYLE,
    history: createCanvasHistory<CanvasDocument>(),
  };
}

function clampZoom(zoom: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

function canvasEditorReducer(
  state: CanvasEditorState,
  action: CanvasEditorAction,
): CanvasEditorState {
  switch (action.type) {
    case 'set_camera':
      return {
        ...state,
        camera: {
          x: action.camera.x,
          y: action.camera.y,
          z: clampZoom(action.camera.z),
        },
      };
    case 'set_viewport':
      return {
        ...state,
        viewport: action.viewport,
      };
    case 'set_tool':
      return {
        ...state,
        activeTool: action.tool,
      };
    case 'set_selected_shape_ids':
      return {
        ...state,
        selectedShapeIds: new Set(action.selectedShapeIds),
      };
    case 'set_current_style':
      return {
        ...state,
        currentStyle: action.currentStyle,
      };
    case 'replace_document':
      return {
        ...state,
        document: action.document,
      };
    case 'apply_command': {
      const result = pushCanvasCommand(state.history, action.command);

      return {
        ...state,
        document: result.state,
        history: result.history,
      };
    }
    case 'undo': {
      const result = undoCanvasCommand(state.history, state.document);

      if (!result) {
        return state;
      }

      return {
        ...state,
        document: result.state,
        history: result.history,
      };
    }
    case 'redo': {
      const result = redoCanvasCommand(state.history, state.document);

      if (!result) {
        return state;
      }

      return {
        ...state,
        document: result.state,
        history: result.history,
      };
    }
  }
}

/** Create the central editor controller used by the interactive canvas example. */
export function useCanvasEditor(): CanvasEditor {
  const [state, dispatch] = useReducer(canvasEditorReducer, undefined, createInitialState);
  const twoRef = useRef<Two | null>(null);
  const sceneRootRef = useRef<Group | null>(null);
  const canvasElementRef = useRef<HTMLCanvasElement | SVGElement | null>(null);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const editor = useMemo<CanvasEditor>(() => {
    const setCamera = (camera: Partial<CanvasCamera>) => {
      const nextCamera = {
        ...stateRef.current.camera,
        ...camera,
      };

      dispatch({ type: 'set_camera', camera: nextCamera });
    };

    const pageToScreen = (point: CanvasPoint) => {
      const { camera } = stateRef.current;

      return {
        x: (point.x + camera.x) * camera.z,
        y: (point.y + camera.y) * camera.z,
      };
    };

    const screenToPage = (point: CanvasPoint) => {
      const { camera } = stateRef.current;

      return {
        x: point.x / camera.z - camera.x,
        y: point.y / camera.z - camera.y,
      };
    };

    const getSelectedShapes = (): CanvasShapeRecord[] => {
      const ids = stateRef.current.selectedShapeIds;
      return stateRef.current.document.shapes.filter((shape) => ids.has(shape.id));
    };

    const getSelectionBounds = (): CanvasBounds | null => {
      const selectedShapes = getSelectedShapes();
      return unionBounds(selectedShapes.map((shape) => getShapeBounds(shape)));
    };

    const zoomCameraAtScreenPoint = (
      nextZoom: number,
      screenPoint: CanvasPoint,
    ) => {
      const clampedZoom = clampZoom(nextZoom);
      const pagePoint = screenToPage(screenPoint);

      setCamera({
        x: screenPoint.x / clampedZoom - pagePoint.x,
        y: screenPoint.y / clampedZoom - pagePoint.y,
        z: clampedZoom,
      });
    };

    const zoomIn = (screenPoint?: CanvasPoint) => {
      const { viewport, camera } = stateRef.current;
      const focusPoint = screenPoint ?? {
        x: viewport.width / 2,
        y: viewport.height / 2,
      };

      zoomCameraAtScreenPoint(camera.z * 1.15, focusPoint);
    };

    const zoomOut = (screenPoint?: CanvasPoint) => {
      const { viewport, camera } = stateRef.current;
      const focusPoint = screenPoint ?? {
        x: viewport.width / 2,
        y: viewport.height / 2,
      };

      zoomCameraAtScreenPoint(camera.z / 1.15, focusPoint);
    };

    const resetZoom = () => {
      const { camera, viewport } = stateRef.current;
      const point = {
        x: viewport.width / 2,
        y: viewport.height / 2,
      };

      setCamera({
        x: camera.x + point.x - point.x / camera.z,
        y: camera.y + point.y - point.y / camera.z,
        z: 1,
      });
    };

    const zoomToBounds = (bounds: CanvasBounds, inset = 80) => {
      const { viewport } = stateRef.current;

      if (viewport.width === 0 || viewport.height === 0) {
        return;
      }

      const availableWidth = Math.max(1, viewport.width - inset * 2);
      const availableHeight = Math.max(1, viewport.height - inset * 2);
      const nextZoom = clampZoom(
        Math.min(availableWidth / bounds.width, availableHeight / bounds.height),
      );

      setCamera({
        x: (viewport.width / nextZoom - bounds.width) / 2 - bounds.x,
        y: (viewport.height / nextZoom - bounds.height) / 2 - bounds.y,
        z: nextZoom,
      });
    };

    const setSelectedShapeIds = (ids: Iterable<string>) => {
      dispatch({
        type: 'set_selected_shape_ids',
        selectedShapeIds: new Set(ids),
      });
    };

    return {
      state,
      runtime: {
        get two() {
          return twoRef.current;
        },
        get sceneRoot() {
          return sceneRootRef.current;
        },
        get canvasElement() {
          return canvasElementRef.current;
        },
      },
      setTwo: (nextValue) => {
        twoRef.current =
          typeof nextValue === 'function' ? nextValue(twoRef.current) : nextValue;
      },
      setSceneRoot: (nextValue) => {
        sceneRootRef.current =
          typeof nextValue === 'function'
            ? nextValue(sceneRootRef.current)
            : nextValue;
      },
      setCanvasElement: (nextValue) => {
        canvasElementRef.current =
          typeof nextValue === 'function'
            ? nextValue(canvasElementRef.current)
            : nextValue;
      },
      setViewport: (viewport) => {
        dispatch({ type: 'set_viewport', viewport });
      },
      setActiveTool: (tool) => {
        dispatch({ type: 'set_tool', tool });
      },
      setCurrentStyle: (currentStyle) => {
        dispatch({ type: 'set_current_style', currentStyle });
      },
      setSelectedShapeIds,
      selectNone: () => {
        setSelectedShapeIds([]);
      },
      getSelectedShapes,
      getSelectionBounds,
      getViewportPageBounds: () => {
        const { camera, viewport } = stateRef.current;

        return {
          x: -camera.x,
          y: -camera.y,
          width: viewport.width / camera.z,
          height: viewport.height / camera.z,
        };
      },
      hitTest: (point, tolerance = 6) => {
        const shapes = [...stateRef.current.document.shapes].reverse();
        return (
          shapes.find((shape) => hitTestShape(shape, point, tolerance)) ?? null
        );
      },
      setCamera,
      panCamera: (delta) => {
        const { camera } = stateRef.current;
        setCamera({
          x: camera.x + delta.x / camera.z,
          y: camera.y + delta.y / camera.z,
        });
      },
      zoomCameraAtScreenPoint,
      zoomIn,
      zoomOut,
      resetZoom,
      zoomToBounds,
      replaceDocument: (document) => {
        dispatch({ type: 'replace_document', document });
      },
      commitDocumentCommand: (label, before, after) => {
        dispatch({
          type: 'apply_command',
          command: {
            label,
            before,
            after,
          },
        });
      },
      executeDocumentCommand: (label, update) => {
        const before = cloneDocument(stateRef.current.document);
        const after = update(cloneDocument(stateRef.current.document));

        dispatch({
          type: 'apply_command',
          command: {
            label,
            before,
            after,
          },
        });
      },
      undo: () => {
        dispatch({ type: 'undo' });
      },
      redo: () => {
        dispatch({ type: 'redo' });
      },
      screenToPage,
      pageToScreen,
    };
  }, [state]);

  return editor;
}
