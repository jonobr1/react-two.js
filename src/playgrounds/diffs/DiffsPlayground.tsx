import { useCallback, useEffect, useRef, useState } from 'react';
import Two from 'two.js';
import { Button } from '@/components/catalyst/Button';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  PlusIcon,
  MinusIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/20/solid';
import { Canvas, type ZUIControls } from 'react-two.js';
import { PlaygroundProps } from '../types';
import { DiffsCanvas } from './DiffsCanvas';
import { useDiffsModel } from './hooks/useDiffsModel';
import { useMeasuredHeight } from './hooks/useMeasuredHeight';
import { CHROME_GAP, CHROME_INSET } from './constants';
import {
  clearStoredState,
  generateColor,
  loadStoredState,
  saveStoredState,
} from './storage';
import { TextColumn } from './components/TextColumn';
import { SORT_MODES, SortMode, TextDoc } from './types';

const defaultTexts: TextDoc[] = [
  {
    id: 'text-1',
    name: 'Text 1',
    color: 'rgb(220, 80, 80)',
    body: 'The quick brown fox jumps over the lazy dog.',
  },
  {
    id: 'text-2',
    name: 'Text 2',
    color: 'rgb(80, 160, 220)',
    body: 'The lazy dog sleeps under the warm sun.',
  },
];

export function DiffsPlayground({ width, height }: PlaygroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const zuiRef = useRef<ZUIControls | null>(null);

  // The panes sit under floating chrome, so they reserve room for it rather
  // than sliding beneath the toolbar and the zoom readout.
  const [toolbarRef, toolbarHeight] = useMeasuredHeight<HTMLDivElement>();
  const [zoomRef, zoomHeight] = useMeasuredHeight<HTMLDivElement>();

  const [texts, setTexts] = useState<TextDoc[]>(() => {
    const loaded = loadStoredState();
    return loaded?.texts && loaded.texts.length > 0 ? loaded.texts : defaultTexts;
  });

  const [mode, setMode] = useState<SortMode>(() => {
    const loaded = loadStoredState();
    return loaded?.mode || 'chronologic';
  });

  const [textIsVisible, setTextIsVisible] = useState(false);
  const [vizIsVisible, setVizIsVisible] = useState(true);
  const [highlightMode, setHighlightMode] = useState(false);
  const [selectedStem, setSelectedStem] = useState<string | null>(null);
  const [scale, setScale] = useState(1);

  // Model hook
  const { model, isDeferredPending } = useDiffsModel(texts, mode);

  // Reported by DiffsCanvas, which owns the frame-driven reveal.
  const [isRevealing, setIsRevealing] = useState(false);

  const isProcessing = isRevealing || isDeferredPending;

  // Debounced save to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      saveStoredState(texts, mode);
    }, 1000);
    return () => clearTimeout(timer);
  }, [texts, mode]);

  // Stem selection handler
  const handleSelectStem = useCallback((stem: string) => {
    setSelectedStem((current) => (current === stem ? null : stem));
  }, []);

  // Text updates
  const handleUpdateTitle = useCallback((id: string, name: string) => {
    setTexts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, name } : t))
    );
  }, []);

  const handleUpdateBody = useCallback((id: string, body: string) => {
    setTexts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, body } : t))
    );
  }, []);

  // Toolbar actions
  const handleAddText = useCallback(() => {
    setTexts((prev) => [
      ...prev,
      {
        id: `text-${Date.now()}`,
        name: `Text ${prev.length + 1}`,
        color: generateColor(0, 0.5),
        body: '',
      },
    ]);
  }, []);

  const handleRemoveText = useCallback(() => {
    setTexts((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const handleCycleMode = useCallback(() => {
    setMode((current) => {
      const idx = SORT_MODES.indexOf(current);
      return SORT_MODES[(idx + 1) % SORT_MODES.length];
    });
    setSelectedStem(null);
  }, []);

  const handleClearSession = useCallback(() => {
    if (window.confirm('This will delete your current session. Are you sure you want to continue?')) {
      clearStoredState();
      setTexts(defaultTexts);
      setMode('chronologic');
      setSelectedStem(null);
      zuiRef.current?.reset();
      setScale(1);
    }
  }, []);

  const handleDownloadSVG = useCallback(() => {
    const svgElement = containerRef.current?.querySelector('svg');
    if (!svgElement) return;

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgElement);
    const a = document.createElement('a');
    a.href = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
    a.download = 'diffs.svg';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800"
    >
      {/* Two.js Canvas Stage. Kept mounted and faded, so toggling visuals
          never tears down the scene or resets the zoom. */}
      <div
        className={`absolute inset-0 z-0 transition-opacity duration-300 ${
          vizIsVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <Canvas
          type={Two.Types.svg}
          width={width}
          height={height}
          autostart={true}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          style={{ userSelect: 'none', touchAction: 'none' }}
          aria-label="Diffs visual vocabulary comparison canvas"
        >
          <DiffsCanvas
            model={model}
            selectedStem={selectedStem}
            highlightMode={highlightMode}
            onSelectStem={handleSelectStem}
            controlsRef={zuiRef}
            onZoomChange={setScale}
            onProcessingChange={setIsRevealing}
          />
        </Canvas>
      </div>

      {/* Text panes overlay. The wrapper stays click-through so the canvas
          underneath keeps receiving pans; only the editable controls and the
          individual words claim pointer events. */}
      <div
        className={`absolute inset-0 z-10 pointer-events-none flex transition-opacity duration-300 ${
          textIsVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          paddingTop: CHROME_INSET + toolbarHeight + CHROME_GAP,
          paddingBottom: CHROME_INSET + zoomHeight + CHROME_GAP,
        }}
        aria-hidden={!textIsVisible}
      >
        <div className="flex w-full h-full">
          {texts.map((doc, idx) => (
            <TextColumn
              key={doc.id}
              doc={doc}
              index={idx}
              widthPercent={`${(100 / texts.length).toFixed(3)}%`}
              interactive={textIsVisible}
              highlightMode={highlightMode}
              selectedStem={selectedStem}
              onUpdateTitle={handleUpdateTitle}
              onUpdateBody={handleUpdateBody}
              onSelectStem={handleSelectStem}
            />
          ))}
        </div>
      </div>

      {/* Floating Action Controls */}
      <div
        ref={toolbarRef}
        className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 pointer-events-auto bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl">
        <Button color="dark/zinc" onClick={handleAddText} title="Add Text Field">
          <PlusIcon className="w-4 h-4 mr-1" />
          Add Text
        </Button>
        <Button
          color="dark/zinc"
          onClick={handleRemoveText}
          disabled={texts.length <= 1}
          title="Remove Text Field"
        >
          <MinusIcon className="w-4 h-4 mr-1" />
          Remove
        </Button>

        <Button color="light" onClick={handleCycleMode} title="Cycle sort mode">
          <AdjustmentsHorizontalIcon className="w-4 h-4 mr-1" />
          Sort: <span className="capitalize ml-1 font-semibold">{mode}</span>
        </Button>

        <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700 mx-1" />

        <label className="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer select-none px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
          <input
            type="checkbox"
            checked={textIsVisible}
            onChange={(e) => setTextIsVisible(e.target.checked)}
            className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
          />
          Text Visible
        </label>

        <label className="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer select-none px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
          <input
            type="checkbox"
            checked={vizIsVisible}
            onChange={(e) => setVizIsVisible(e.target.checked)}
            className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
          />
          Visuals Visible
        </label>

        <label className="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer select-none px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
          <input
            type="checkbox"
            checked={highlightMode}
            onChange={(e) => {
              setHighlightMode(e.target.checked);
              if (!e.target.checked) setSelectedStem(null);
            }}
            className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
          />
          Highlight Mode
        </label>

        <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700 mx-1" />

        <Button plain onClick={handleClearSession} title="Clear Session" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
          Clear
        </Button>

        <Button color="light" onClick={handleDownloadSVG} title="Export SVG">
          <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
          Export SVG
        </Button>

        {isProcessing && (
          <div className="flex items-center gap-1 text-xs text-blue-500 font-medium px-2 animate-pulse">
            <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
            Analyzing...
          </div>
        )}
      </div>

      {/* Floating Zoom Controls Overlay */}
      <div
        ref={zoomRef}
        className="absolute bottom-4 right-4 z-20 flex items-center gap-1 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 rounded-lg p-1 shadow-lg pointer-events-auto">
        <button
          onClick={() => zuiRef.current?.reset()}
          className="cursor-pointer px-2 py-1 text-xs font-mono text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
          aria-label="Reset zoom"
          title="Reset Zoom"
        >
          {Math.round(scale * 100)}%
        </button>
      </div>
    </div>
  );
}
