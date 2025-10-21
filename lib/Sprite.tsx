import React, {
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useState,
} from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { Sprite as Instance } from 'two.js/src/effects/sprite';
import { RectangleProps } from './Rectangle';

type SpriteProps =
  | RectangleProps
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
    [K in Extract<SpriteProps, keyof Instance>]?: K extends keyof Instance
      ? Instance[K]
      : never;
  } & {
    path?: string;
    x?: number;
    y?: number;
    autoPlay?: boolean;
  }
>;

export type RefSprite = Instance;

export const Sprite = React.forwardRef<Instance, ComponentProps>(
  ({ path, x, y, autoPlay, ...props }, forwardedRef) => {
    const { two, parent } = useTwo();
    const [ref, set] = useState<Instance | null>(null);

    useLayoutEffect(() => {
      const sprite = new Two.Sprite(path);
      set(sprite);

      return () => {
        set(null);
      };
    }, [path, two]);

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
        const sprite = ref;
        // Update position
        if (typeof x === 'number') sprite.translation.x = x;
        if (typeof y === 'number') sprite.translation.y = y;

        if (autoPlay) {
          sprite.play();
        } else {
          sprite.pause();
        }

        // Update other properties
        for (const key in props) {
          if (key in sprite) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (sprite as any)[key] = (props as any)[key];
          }
        }
      }
    }, [props, ref, x, y, autoPlay]);

    useImperativeHandle(forwardedRef, () => ref as Instance, [ref]);

    return <></>;
  }
);
