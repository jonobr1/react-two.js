import { useEffect, useState } from 'react';
import { useFrame } from 'react-two.js';
import { DiffsModel } from '../types';

export function useProgressiveReveal(model: DiffsModel): number {
  const [revealed, setRevealed] = useState(0);

  // Reset to 0 when model identity changes
  useEffect(() => {
    setRevealed(0);
  }, [model]);

  useFrame(() => {
    setRevealed((current) => {
      if (current >= model.totalLines) {
        return model.totalLines;
      }
      const chunkSize = Math.min(
        Math.max(Math.floor(model.totalChars / 100), 1),
        250
      );
      const next = current + chunkSize;
      return Math.min(next, model.totalLines);
    });
  });

  return revealed;
}
