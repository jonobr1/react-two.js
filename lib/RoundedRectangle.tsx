import React, { useEffect, useImperativeHandle, useRef } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { RoundedRectangle as Instance } from 'two.js/src/shapes/rounded-rectangle';
import { PathProps } from './Path';

type RoundedRectangleProps = PathProps | 'width' | 'height' | 'radius';
type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<RoundedRectangleProps, keyof Instance>]?: Instance[K];
  } & {
    x?: number;
    y?: number;
  }
>;

export type RefRoundedRectangle = Instance;

export const RoundedRectangle = React.forwardRef<
  Instance | null,
  ComponentProps
>(({ x, y, ...props }, forwardedRef) => {
  const { two, parent } = useTwo();
  const ref = useRef<Instance | null>(null);

  useEffect(() => {
    const roundedRectangle = new Two.RoundedRectangle(
      x,
      y,
      props.width,
      props.height,
      props.radius
    );
    ref.current = roundedRectangle;

    return () => {
      ref.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [x, y, two]);

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

  useImperativeHandle(forwardedRef, () => ref.current as Instance, []);

  return <></>;
});
