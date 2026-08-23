import { useDeferredValue, useMemo } from 'react';
import { SortMode, TextDoc, DiffsModel } from '../types';
import { buildModel } from '../model/layout';

export function useDiffsModel(
  texts: TextDoc[],
  mode: SortMode
): {
  model: DiffsModel;
  deferredTexts: TextDoc[];
  isDeferredPending: boolean;
} {
  const deferredTexts = useDeferredValue(texts);
  const isDeferredPending = deferredTexts !== texts;

  const model = useMemo(() => {
    return buildModel(deferredTexts, mode);
  }, [deferredTexts, mode]);

  return {
    model,
    deferredTexts,
    isDeferredPending,
  };
}
