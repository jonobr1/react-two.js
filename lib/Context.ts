import { createContext, useContext, useEffect, useRef } from 'react';
import Two from 'two.js';
import type { Group } from 'two.js/src/group';
import type { Shape } from 'two.js/src/shape';
import type { EventHandlers } from './Events';

export interface TwoCoreContextValue {
  two: Two | null;
  registerEventShape: (
    shape: Shape | Group,
    handlers: Partial<EventHandlers>,
    parent?: Group
  ) => void;
  unregisterEventShape: (shape: Shape | Group) => void;
}

export interface TwoParentContextValue {
  parent: Group | null;
}

export interface TwoSizeContextValue {
  width: number;
  height: number;
}

export const TwoCoreContext = createContext<TwoCoreContextValue>({
  two: null,
  registerEventShape: () => {},
  unregisterEventShape: () => {},
});

export const TwoParentContext = createContext<TwoParentContextValue>({
  parent: null,
});

export const TwoSizeContext = createContext<TwoSizeContextValue>({
  width: 0,
  height: 0,
});

// Keep the existing name for backwards compatibility with imports
export const Context = TwoCoreContext;

export const useTwo = (): TwoCoreContextValue &
  TwoParentContextValue &
  TwoSizeContextValue => {
  const core = useContext(TwoCoreContext);
  const parent = useContext(TwoParentContext);
  const size = useContext(TwoSizeContext);

  return { ...core, ...parent, ...size };
};

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
