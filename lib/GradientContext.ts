import { createContext } from 'react';
import type { Stop } from 'two.js/src/effects/stop';
import type { GradientResource } from './gradientResources';

export interface GradientScope {
  gradient: GradientResource;
  entries: Map<HTMLElement, Stop>;
  sync: () => void;
  active: boolean;
}
export const GradientContext = createContext<GradientScope | null>(null);
