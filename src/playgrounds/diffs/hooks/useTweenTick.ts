import TWEEN from '@tweenjs/tween.js';
import { useFrame } from 'react-two.js';

export function useTweenTick(): void {
  useFrame(() => {
    TWEEN.update();
  });
}
