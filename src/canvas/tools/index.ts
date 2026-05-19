import type { CanvasToolId } from '@/canvas/types';

export interface CanvasToolDefinition {
  id: CanvasToolId;
  label: string;
  shortcut: string;
}

/** Tool metadata used by the example toolbar and keyboard shortcuts. */
export const CANVAS_TOOL_DEFINITIONS: CanvasToolDefinition[] = [
  { id: 'select', label: 'Select', shortcut: 'V' },
  { id: 'hand', label: 'Hand', shortcut: 'H' },
  { id: 'rectangle', label: 'Rectangle', shortcut: 'R' },
  { id: 'ellipse', label: 'Ellipse', shortcut: 'E' },
  { id: 'arrow', label: 'Arrow', shortcut: 'A' },
  { id: 'line', label: 'Line', shortcut: 'L' },
  { id: 'pen', label: 'Pen', shortcut: 'P' },
  { id: 'text', label: 'Text', shortcut: 'T' },
  { id: 'sticky', label: 'Sticky', shortcut: 'N' },
  { id: 'frame', label: 'Frame', shortcut: 'F' },
];
