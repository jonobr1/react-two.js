import React, {
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useState,
} from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { ImageSequence as Instance } from 'two.js/src/effects/image-sequence';
import { RectangleProps } from './Rectangle';
import type { Texture } from 'two.js/src/effects/texture';

type ImageSequenceProps =
  | RectangleProps
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

export const ImageSequence = React.forwardRef<Instance, ComponentProps>(
  ({ paths, x, y, autoPlay, ...props }, forwardedRef) => {
    const { two, parent } = useTwo();
    const [ref, set] = useState<Instance | null>(null);

    useLayoutEffect(() => {
      const imageSequence = new Two.ImageSequence(paths);
      set(imageSequence);

      return () => {
        set(null);
      };
    }, [two, paths]);

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
        const imageSequence = ref;
        if (autoPlay) {
          imageSequence.play();
        } else {
          imageSequence.pause();
        }

        // Update position
        if (typeof x === 'number') imageSequence.translation.x = x;
        if (typeof y === 'number') imageSequence.translation.y = y;

        // Update other properties
        for (const key in props) {
          if (key in imageSequence) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (imageSequence as any)[key] = (props as any)[key];
          }
        }
      }
    }, [props, ref, paths, x, y, autoPlay]);

    useImperativeHandle(forwardedRef, () => ref as Instance, [ref]);

    return <></>;
  }
);
