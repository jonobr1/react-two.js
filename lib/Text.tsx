import React, { useEffect, useImperativeHandle, useState } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { Text as Instance } from 'two.js/src/text';
import { ShapeProps } from './Properties';

type TextProps =
  | ShapeProps
  | 'value'
  | 'family'
  | 'size'
  | 'leading'
  | 'alignment'
  | 'linewidth'
  | 'style'
  | 'weight'
  | 'decoration'
  | 'direction'
  | 'baseline'
  | 'opacity'
  | 'visible'
  | 'fill'
  | 'stroke'
  | 'dashes';
type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<TextProps, keyof Instance>]?: Instance[K];
  } & {
    x?: number;
    y?: number;
  }
>;

export type RefText = Instance;

export const Text = React.forwardRef<Instance, ComponentProps>(
  ({ x, y, ...props }, forwardedRef) => {
    const { two, parent } = useTwo();
    const [ref, set] = useState<Instance | null>(null);

    useEffect(() => {
      const text = new Two.Text();
      set(text);

      return () => {
        set(null);
      };
    }, [two]);

    useEffect(() => {
      if (parent && ref) {
        parent.add(ref);

        return () => {
          parent.remove(ref);
        };
      }
    }, [parent, ref]);

    useEffect(() => {
      if (ref) {
        const text = ref;
        // Update position
        if (typeof x === 'number') text.translation.x = x;
        if (typeof y === 'number') text.translation.y = y;

        // Update other properties
        for (const key in props) {
          if (key in text) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (text as any)[key] = (props as any)[key];
          }
        }
      }
    }, [props, ref, x, y]);

    useImperativeHandle(forwardedRef, () => ref as Instance, [ref]);

    return <></>;
  }
);
