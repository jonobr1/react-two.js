import React, {
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { ImageSequence as Instance } from 'two.js/src/effects/image-sequence';
import { PathProps } from './Path';
import type { Texture } from 'two.js/src/effects/texture';

type ImageSequenceProps =
  | PathProps
  | 'width'
  | 'height'
  | 'textures'
  | 'frameRate'
  | 'index'
  | 'firstFrame'
  | 'lastFrame'
  | 'loop';

type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<ImageSequenceProps, keyof Instance>]?: Instance[K];
  } & {
    paths?: string | string[] | Texture | Texture[];
    x?: number;
    y?: number;
    autoPlay?: boolean;
  }
>;

export type RefImageSequence = Instance;

export const ImageSequence = React.forwardRef<Instance | null, ComponentProps>(
  ({ paths, x, y, autoPlay, ...props }, forwardedRef) => {
    const { two, parent } = useTwo();
    const ref = useRef<Instance | null>(null);

    // TODO: Make more synchronous for instant ref usage in parent components
    useLayoutEffect(() => {
      const imageSequence = new Two.ImageSequence(paths, x, y, props.frameRate);
      ref.current = imageSequence;

      if (autoPlay) {
        ref.current.play();
      }

      return () => {
        ref.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paths, x, y, two]);

    useEffect(() => {
      const imageSequence = ref.current;
      if (parent && imageSequence) {
        parent.add(imageSequence);
        update();

        return () => {
          parent.remove(imageSequence);
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
        const imageSequence = ref.current;
        for (const key in props) {
          if (key in imageSequence) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (imageSequence as any)[key] = (props as any)[key];
          }
        }
      }
    }

    useImperativeHandle(forwardedRef, () => ref.current as Instance, []);

    return <></>;
  }
);
