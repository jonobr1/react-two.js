import React, { useEffect, useImperativeHandle, useRef } from 'react';
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

export const Text = React.forwardRef<Instance | null, ComponentProps>(
  ({ x, y, ...props }, forwardedRef) => {
    const { two, parent } = useTwo();
    const ref = useRef<Instance | null>(null);

    useEffect(() => {
      const text = new Two.Text(props.value, x, y);
      ref.current = text;

      return () => {
        ref.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [x, y, two]);

    useEffect(() => {
      const text = ref.current;
      if (parent && text) {
        parent.add(text);
        update();

        return () => {
          parent.remove(text);
        };
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [parent]);

    useEffect(update, [props]);

    function update() {
      if (ref.current) {
        const text = ref.current;
        for (const key in props) {
          if (key in text) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (text as any)[key] = (props as any)[key];
          }
        }
      }
    }

    useImperativeHandle(forwardedRef, () => ref.current!);

    return <></>;
  }
);
