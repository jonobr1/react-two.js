import React, { useEffect, useImperativeHandle, useRef } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { Sprite as Instance } from 'two.js/src/effects/sprite';
import { PathProps } from './Path';

type SpriteProps =
  | PathProps
  | 'width'
  | 'height'
  | 'texture'
  | 'columns'
  | 'rows'
  | 'frameRate'
  | 'index'
  | 'firstFrame'
  | 'lastFrame'
  | 'loop';

type ComponentProps = React.PropsWithChildren<
  {
    [K in SpriteProps]?: K extends keyof Instance ? Instance[K] : never;
  } & {
    path?: string;
    x?: number;
    y?: number;
  }
>;

export type RefSprite = Instance;

export const Sprite = React.forwardRef<Instance | null, ComponentProps>(
  (props, forwardedRef) => {
    const { two, parent } = useTwo();
    const ref = useRef<Instance | null>(null);

    useEffect(() => {
      const sprite = new Two.Sprite(props.path, props.x, props.y);
      ref.current = sprite;

      return () => {
        ref.current = null;
      };
    }, [props.path, props.x, props.y, two]);

    useEffect(() => {
      const sprite = ref.current;
      if (parent && sprite) {
        parent.add(sprite);
        update();

        return () => {
          parent.remove(sprite);
        };
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [parent]);

    useEffect(update, [props]);

    function update() {
      if (ref.current) {
        const sprite = ref.current;
        for (const key in props) {
          if (key in sprite) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (sprite as any)[key] = (props as any)[key];
          }
        }
      }
    }

    useImperativeHandle(forwardedRef, () => ref.current as Instance);

    return <></>;
  }
);
