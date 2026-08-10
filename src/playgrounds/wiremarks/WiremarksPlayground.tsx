import { useEffect, useRef, useState } from 'react';
import { Canvas } from '../../../lib/main';
import type { ZUIControls } from '../../../lib/main';
import Two from 'two.js';
import { WiremarkCanvas } from './WiremarkCanvas';
import { PlaygroundProps } from '../types';
import { Button } from '@/components/catalyst/Button';
import {
  ArrowDownTrayIcon,
  CodeBracketSquareIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/20/solid';

const defaultPrompt = `
# Wiremarks is a simple interface to compose
# wireframes and organizational structures
# through text. Connect things with an arrow
# like so:
react -> react-two.js

# Each line of text is a connection.
react-dom -> react-two.js

# And you can label connections by using
# brackets like so:
react-two.js -[wraps]-> two.js

# Lastly, starting a line with a hashtag
# makes your text a comment and will not
# be compiled into any connections.
`.trim();

export function WiremarksPlayground({ width, height }: PlaygroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const zuiRef = useRef<ZUIControls | null>(null);
  const [scale, setScale] = useState(1);

  const [text, setText] = useState(() => {
    return window.localStorage.getItem('wiremarks-state') || defaultPrompt;
  });
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    window.localStorage.setItem('wiremarks-state', text);
  }, [text]);

  const handleOpen = () => {
    setIsOpen(true);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleReset = () => {
    setText(defaultPrompt);
  };

  const handleDownload = () => {
    const svgElement = containerRef.current?.querySelector('svg');
    if (!svgElement) return;

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgElement);
    const a = document.createElement('a');
    a.href = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
    a.download = 'wiremarks.svg';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[500px] overflow-hidden bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800"
    >
      {/* Two.js Canvas Stage */}
      <div className="absolute inset-0 z-0">
        <Canvas
          type={Two.Types.canvas}
          width={width}
          height={height}
          autostart={true}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          style={{ userSelect: 'none', touchAction: 'none' }}
          aria-label="Wiremarks interactive visual graph canvas"
        >
          <WiremarkCanvas
            instructions={text}
            controlsRef={zuiRef}
            onZoomChange={setScale}
          />
        </Canvas>
      </div>

      {/* Floating Action Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2 pointer-events-auto">
        {!isOpen && (
          <Button color="dark/zinc" onClick={handleOpen} className="shadow-lg">
            <CodeBracketSquareIcon className="w-4 h-4 mr-1.5" />
            Edit Instructions
          </Button>
        )}
        <Button color="light" onClick={handleDownload} className="shadow-lg">
          <ArrowDownTrayIcon className="w-4 h-4 mr-1.5" />
          Export SVG
        </Button>
      </div>

      {/* Floating Zoom Controls Overlay */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 rounded-lg p-1 shadow-lg pointer-events-auto">
        <button
          onClick={() => zuiRef.current?.reset()}
          className="px-2 py-1 text-xs font-mono text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
          aria-label="Reset zoom"
          title="Reset Zoom"
        >
          {Math.round(scale * 100)}%
        </button>
      </div>

      {/* DSL Editor Overlay Panel */}
      {isOpen && (
        <div className="absolute inset-0 z-20 flex flex-col bg-zinc-900/80 backdrop-blur-md p-6 text-zinc-100 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-700/60 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <CodeBracketSquareIcon className="w-5 h-5 text-blue-400" />
                Wiremarks Script Editor
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Define nodes and connections using simple text syntax.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                plain
                onClick={handleReset}
                title="Reset to default prompt"
                className="text-zinc-400 hover:text-white"
              >
                <ArrowPathIcon className="w-4 h-4" />
                Reset
              </Button>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                aria-label="Close instructions editor"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              spellCheck="false"
              className="w-full h-full bg-zinc-950/70 border border-zinc-800 rounded-lg p-4 font-mono text-sm leading-relaxed text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none shadow-inner"
              placeholder="Type your wiremarks code here..."
            />
          </div>

          <div className="pt-4 flex justify-between items-center text-xs text-zinc-400">
            <span>Syntax: EntityA -[Label]-&gt; EntityB</span>
            <Button color="blue" onClick={handleClose}>
              Apply & View Canvas
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
