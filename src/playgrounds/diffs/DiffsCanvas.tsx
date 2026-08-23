import { useEffect, useRef, type MutableRefObject } from 'react';
import TWEEN from '@tweenjs/tween.js';
import { Group, RefGroup, useTwo, useZUI, type ZUIControls } from 'react-two.js';
import { DiffsScene } from './components/DiffsScene';
import { Legend } from './components/Legend';
import { usePrefersDark } from './hooks/usePrefersDark';
import { useProgressiveReveal } from './hooks/useProgressiveReveal';
import { useTweenTick } from './hooks/useTweenTick';
import { DiffsModel } from './types';

export interface DiffsCanvasProps {
  model: DiffsModel;
  selectedStem: string | null;
  highlightMode: boolean;
  onSelectStem: (stem: string) => void;
  controlsRef?: MutableRefObject<ZUIControls | null>;
  onZoomChange?: (scale: number) => void;
  /** Fires only when the reveal starts or finishes, never per frame. */
  onProcessingChange?: (isProcessing: boolean) => void;
}

export function DiffsCanvas({
  model,
  selectedStem,
  highlightMode,
  onSelectStem,
  controlsRef,
  onZoomChange,
  onProcessingChange,
}: DiffsCanvasProps) {
  const { two, height } = useTwo();
  const sceneGroupRef = useRef<RefGroup | null>(null);
  const isDark = usePrefersDark();

  // This must live inside <Canvas>: `useFrame` reads the Two instance from
  // context, and outside the provider it gets null and never binds, which
  // left `revealed` pinned at 0 and rendered no stat lines at all.
  const revealed = useProgressiveReveal(model);
  const isRevealing = revealed < model.totalLines;

  useEffect(() => {
    onProcessingChange?.(isRevealing);
  }, [isRevealing, onProcessingChange]);

  const zui = useZUI(sceneGroupRef, {
    minZoom: 0.06,
    maxZoom: 8,
    pan: 'background',
    onChange: (st) => onZoomChange?.(st.scale),
  });

  // Enable TWEEN updates each frame
  useTweenTick();

  useEffect(() => {
    if (controlsRef) {
      controlsRef.current = zui;
    }
  }, [controlsRef, zui]);

  // Camera pan tween to selected stem's visible occurrence
  useEffect(() => {
    if (!selectedStem || !two || !zui.instance.current) return;

    const occurrences = model.byStem.get(selectedStem);
    const visibleOccurrence = occurrences?.find((o) => o.visible);
    if (!visibleOccurrence) return;

    const zuiInst = zui.instance.current;
    const am = zuiInst.surfaceMatrix;
    const currentScale = am.elements[0];

    const destX = two.width * 0.5 - visibleOccurrence.x * currentScale;
    const destY = two.height * 0.5 - (visibleOccurrence.y + 100) * currentScale;

    const startPos = { x: am.elements[2], y: am.elements[5] };
    const tween = new TWEEN.Tween(startPos)
      .to({ x: destX, y: destY }, 350)
      .easing(TWEEN.Easing.Sinusoidal.Out)
      .onUpdate(() => {
        zui.panTo(startPos.x, startPos.y);
      })
      .start();

    return () => {
      tween.stop();
    };
  }, [selectedStem, model.byStem, two, zui]);

  return (
    <>
      <Group ref={sceneGroupRef}>
        <DiffsScene
          model={model}
          revealed={revealed}
          selectedStem={selectedStem}
          highlightMode={highlightMode}
          onSelectStem={onSelectStem}
        />
      </Group>

      {/* Viewport-fixed Legend */}
      <Legend
        columns={model.columns}
        shared={model.shared}
        canvasHeight={height}
        isDark={isDark}
      />
    </>
  );
}
