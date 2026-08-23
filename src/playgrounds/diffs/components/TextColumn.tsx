import { useMemo } from 'react';
import { stem } from '../model/stem';
import { TextDoc } from '../types';

export interface TextColumnProps {
  doc: TextDoc;
  index: number;
  widthPercent: string;
  /** False while the pane is faded out, so it never swallows canvas clicks. */
  interactive?: boolean;
  highlightMode: boolean;
  selectedStem: string | null;
  onUpdateTitle: (id: string, name: string) => void;
  onUpdateBody: (id: string, body: string) => void;
  onSelectStem: (stem: string) => void;
}

export function TextColumn({
  doc,
  index,
  widthPercent,
  interactive = true,
  highlightMode,
  selectedStem,
  onUpdateTitle,
  onUpdateBody,
  onSelectStem,
}: TextColumnProps) {
  // Memoized tokenized view for Highlight Mode
  const renderedTokens = useMemo(() => {
    if (!doc.body) return null;
    // Split text into words and delimiters (whitespace & punctuation)
    const parts = doc.body.split(/(\s+|[^\w\-_]+)/g);

    return parts.map((part, i) => {
      if (!part) return null;

      const cleaned = part
        .replace(/['’]\w*$/i, '')
        .replace(/[^\w\-_]+/g, '')
        .trim();

      if (cleaned && /\w/.test(cleaned)) {
        const wordStem = stem(cleaned);
        const isHighlighted = selectedStem !== null && wordStem === selectedStem;

        return (
          <span
            key={i}
            data-stem={wordStem}
            onClick={() => onSelectStem(wordStem)}
            className={`${
              interactive ? 'pointer-events-auto' : ''
            } cursor-pointer transition-colors duration-150 rounded px-0.5 ${
              isHighlighted
                ? 'bg-yellow-400 text-zinc-950 font-bold shadow-sm ring-2 ring-yellow-400/50'
                : 'hover:bg-amber-200 dark:hover:bg-amber-500/30'
            }`}
          >
            {part}
          </span>
        );
      }

      return <span key={i}>{part}</span>;
    });
  }, [doc.body, selectedStem, onSelectStem, interactive]);

  return (
    <div
      className="flex flex-col h-full border-r border-zinc-200 dark:border-zinc-800 last:border-r-0 p-4 transition-all duration-200"
      style={{ width: widthPercent }}
    >
      <input
        type="text"
        value={doc.name}
        onChange={(e) => onUpdateTitle(doc.id, e.target.value)}
        placeholder={`Text ${index + 1}`}
        disabled={!interactive}
        className={`w-full mb-3 px-3 py-1.5 font-semibold text-sm bg-transparent border-b border-zinc-300 dark:border-zinc-700 focus:border-blue-500 focus:outline-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 ${
          interactive ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      />

      {highlightMode ? (
        <>
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
            Highlight mode — click a word
          </div>
          {/* Click-through except on the words themselves, so the canvas
              underneath can still be panned from the gaps. */}
          <div className="pointer-events-none flex-1 w-full overflow-y-auto p-3 font-mono text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap bg-amber-50/80 dark:bg-amber-950/30 rounded-lg border-2 border-dashed border-amber-400/70 dark:border-amber-500/40 select-none">
            {renderedTokens}
          </div>
        </>
      ) : (
        <>
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
            Editing
          </div>
          <textarea
            value={doc.body}
            onChange={(e) => onUpdateBody(doc.id, e.target.value)}
            placeholder="Paste or type text here..."
            spellCheck="false"
            disabled={!interactive}
            className={`flex-1 w-full p-3 font-mono text-sm leading-relaxed bg-white/75 dark:bg-zinc-900/75 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-zinc-800 dark:text-zinc-200 resize-none shadow-inner ${
              interactive ? 'pointer-events-auto' : 'pointer-events-none'
            }`}
          />
        </>
      )}
    </div>
  );
}
