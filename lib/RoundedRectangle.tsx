import React, { useEffect, useImperativeHandle, useRef } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { RoundedRectangle as Instance } from 'two.js/src/shapes/rounded-rectangle';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Properties = [
  ...Two.Shape.Properties,
  ...Two.RoundedRectangle.Properties,
];
type RoundedRectangleProps = (typeof Properties)[number];
type ComponentProps = React.PropsWithChildren<{
  [K in RoundedRectangleProps]?: Instance[K];
}>;

export type RefRoundedRectangle = Instance;

export const RoundedRectangle = React.forwardRef<
  Instance | null,
  ComponentProps
>((props, forwardedRef) => {
  const { two, parent } = useTwo();
  const ref = useRef<Instance | null>(null);

  useEffect(() => {
    const roundedRectangle = new Two.RoundedRectangle();
    ref.current = roundedRectangle;

    return () => {
      ref.current = null;
    };
  }, [two]);

  useEffect(() => {
    const roundedRectangle = ref.current;
    if (parent && roundedRectangle) {
      parent.add(roundedRectangle);
      update();

      return () => {
        parent.remove(roundedRectangle);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parent]);

  useEffect(update, [props]);

  function update() {
    if (ref.current) {
      const roundedRectangle = ref.current;
      for (const key in props) {
        if (key in roundedRectangle) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (roundedRectangle as any)[key] = (props as any)[key];
        }
      }
    }
  }

  useImperativeHandle(forwardedRef, () => ref.current as Instance);

  return <></>;
});
