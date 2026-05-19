import type { CanvasDocument, CanvasShapeRecord } from '@/canvas/types';

export interface SerializedClipboardPayload {
  format: 'twojs-clipboard';
  version: 1;
  shapes: CanvasShapeRecord[];
}

export function serializeShapes(shapes: CanvasShapeRecord[]): string {
  const payload: SerializedClipboardPayload = {
    format: 'twojs-clipboard',
    version: 1,
    shapes,
  };

  return JSON.stringify(payload, null, 2);
}

export function deserializeShapes(input: string): CanvasShapeRecord[] {
  const payload = JSON.parse(input) as SerializedClipboardPayload;

  if (payload.format !== 'twojs-clipboard' || payload.version !== 1) {
    throw new Error('Unsupported clipboard payload');
  }

  return payload.shapes;
}

export function cloneDocument(document: CanvasDocument): CanvasDocument {
  return structuredClone(document);
}
