import { describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import Two from 'two.js';
import { Canvas, useTwo } from 'react-two.js';
import { DiffsCanvas } from '../src/playgrounds/diffs/DiffsCanvas';
import { buildModel } from '../src/playgrounds/diffs/model/layout';
import { TextDoc } from '../src/playgrounds/diffs/types';

const texts: TextDoc[] = [
  {
    id: 'text-1',
    name: 'Alpha',
    color: 'rgb(220, 80, 80)',
    body: 'The quick brown fox jumps over the lazy dog.',
  },
  {
    id: 'text-2',
    name: 'Beta',
    color: 'rgb(80, 160, 220)',
    body: 'The lazy dog sleeps under the warm sun.',
  },
];

/** Captures the Two instance so tests can drive frames deterministically. */
function useCapture(sink: { current: Two | null }) {
  const { two } = useTwo();
  sink.current = two;
}

function Probe({ sink }: { sink: { current: Two | null } }) {
  useCapture(sink);
  return null;
}

function renderCanvas(
  props: Partial<React.ComponentProps<typeof DiffsCanvas>> = {}
) {
  const sink: { current: Two | null } = { current: null };
  const model = buildModel(texts, 'chronologic');

  const utils = render(
    <Canvas type={Two.Types.svg} width={800} height={600} autostart={false}>
      <DiffsCanvas
        model={model}
        selectedStem={null}
        highlightMode={false}
        onSelectStem={() => {}}
        {...props}
      />
      <Probe sink={sink} />
    </Canvas>
  );

  const runFrames = (n: number) => {
    for (let i = 0; i < n; i++) {
      act(() => {
        sink.current?.update();
      });
    }
  };

  return { ...utils, model, runFrames };
}

describe('DiffsCanvas', () => {
  it('reveals stat lines once frames run', () => {
    const { container, model, runFrames } = renderCanvas();

    runFrames(10);

    const svg = container.querySelector('svg');
    const words = Array.from(svg?.querySelectorAll('text') ?? []).map(
      (node) => node.textContent
    );

    // Every visible line across both columns plus the shared column.
    for (const column of [...model.columns, model.shared]) {
      for (const line of column.lines) {
        expect(words).toContain(line.word);
      }
    }
  });

  it('reports processing until the reveal completes', () => {
    const onProcessingChange = vi.fn();
    const { runFrames } = renderCanvas({ onProcessingChange });

    runFrames(10);

    expect(onProcessingChange).toHaveBeenCalled();
    expect(onProcessingChange.mock.calls.at(-1)?.[0]).toBe(false);
  });

  it('labels legend entries with each text name', () => {
    const { container, runFrames } = renderCanvas();

    runFrames(10);

    const words = Array.from(
      container.querySelectorAll('svg text') ?? []
    ).map((node) => node.textContent);

    expect(words).toContain('Alpha');
    expect(words).toContain('Beta');
    expect(words).toContain('Shared Words');
  });
});
