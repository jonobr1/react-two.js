import React, {
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from 'react';
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

export const Sprite = React.forwardRef<Instance | null, ComponentProps>(
  ({ path, x, y, autoPlay, ...props }, forwardedRef) => {
    const { two, parent } = useTwo();
    const ref = useRef<Instance | null>(null);

    // TODO: Make more synchronous for instant ref usage in parent components
    useLayoutEffect(() => {
      const sprite = new Two.Sprite(
        path,
        x,
        y,
        props.columns,
        props.rows,
        props.frameRate
      );
      ref.current = sprite;

      if (autoPlay) {
        ref.current.play();
      }

      return () => {
        ref.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [path, x, y, two]);

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

    useEffect(() => {
      if (autoPlay) {
        ref.current?.play();
      } else {
        ref.current?.pause();
      }
    }, [autoPlay]);

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

    useImperativeHandle(forwardedRef, () => ref.current!);

    return <></>;
  }
);
