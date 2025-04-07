import { createContext, useContext, useEffect, useRef } from 'react';
import Two from 'two.js';
import type { Group } from 'two.js/src/group';

export const Context = createContext<{
  two: Two | null;
  parent: Group | null;
  width: number;
  height: number;
}>({ two: null, parent: null, width: 0, height: 0 });

export const useTwo = () => useContext(Context);
export const useFrame = (
  callback: (elapsed: number, frameDelta: number) => void,
  deps: unknown[] = []
) => {
  const { two } = useTwo();
  const ref = useRef(callback);

  useEffect(() => {
    ref.current = callback;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callback, ...deps]);

  useEffect(() => {
    if (!two) {
      return;
    }

    let elapsed = 0;
    two.bind('update', update);

    return () => two.unbind('update', update);

    function update(_frameCount: number, frameDelta: number) {
      elapsed += frameDelta / 1000;
      ref.current?.(elapsed, frameDelta);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [two, ...deps]);
};
