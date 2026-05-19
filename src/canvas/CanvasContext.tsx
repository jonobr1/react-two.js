/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, type PropsWithChildren } from 'react';
import { useCanvasEditor, type CanvasEditor } from '@/canvas/useCanvasEditor';

const CanvasEditorContext = createContext<CanvasEditor | null>(null);

/** Provide a shared canvas editor instance to the example app tree. */
export function CanvasEditorProvider({ children }: PropsWithChildren) {
  const editor = useCanvasEditor();

  return (
    <CanvasEditorContext.Provider value={editor}>
      {children}
    </CanvasEditorContext.Provider>
  );
}

/** Access the shared canvas editor instance for the current example tree. */
export function useCanvasEditorContext() {
  const editor = useContext(CanvasEditorContext);

  if (!editor) {
    throw new Error('useCanvasEditorContext must be used within CanvasEditorProvider');
  }

  return editor;
}
