import { CANVAS_TOOL_DEFINITIONS } from '@/canvas/tools';
import { useCanvasEditorContext } from '@/canvas/CanvasContext';

/** Toolbar for viewport controls and tool selection. */
export function Toolbar() {
  const editor = useCanvasEditorContext();
  const { activeTool, camera } = editor.state;

  return (
    <div className="interactive-canvas__toolbar">
      <div className="interactive-canvas__toolbar-group">
        {CANVAS_TOOL_DEFINITIONS.slice(0, 6).map((tool) => (
          <button
            key={tool.id}
            className={
              tool.id === activeTool
                ? 'interactive-canvas__tool interactive-canvas__tool--active'
                : 'interactive-canvas__tool'
            }
            type="button"
            onClick={() => editor.setActiveTool(tool.id)}
            title={`${tool.label} (${tool.shortcut})`}
          >
            <span>{tool.label}</span>
            <kbd>{tool.shortcut}</kbd>
          </button>
        ))}
      </div>
      <div className="interactive-canvas__toolbar-group">
        <button
          className="interactive-canvas__control"
          type="button"
          onClick={() => editor.zoomOut()}
        >
          -
        </button>
        <button
          className="interactive-canvas__zoom"
          type="button"
          onClick={() => editor.resetZoom()}
        >
          {Math.round(camera.z * 100)}%
        </button>
        <button
          className="interactive-canvas__control"
          type="button"
          onClick={() => editor.zoomIn()}
        >
          +
        </button>
      </div>
    </div>
  );
}
