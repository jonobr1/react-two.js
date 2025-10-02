import React, {
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useState,
} from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { Image as Instance } from 'two.js/src/effects/image';
import { RectangleProps } from './Rectangle';
import type { Texture } from 'two.js/src/effects/texture';

type ImageProps = RectangleProps | 'mode' | 'texture';

type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<ImageProps, keyof Instance>]?: Instance[K];
  } & {
    x?: number;
    y?: number;
    mode?: string;
    texture?: Texture;
  }
>;

export type RefImage = Instance;

export const Image = React.forwardRef<Instance, ComponentProps>(
  ({ mode, texture, x, y, ...props }, forwardedRef) => {
    const { two, parent } = useTwo();
    const [ref, set] = useState<Instance | null>(null);

    useLayoutEffect(() => {
      const image = new Two.Image();
      set(image);

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
        const image = ref;
        if (typeof mode !== 'undefined') image.mode = mode;
        if (typeof texture !== 'undefined') image.texture = texture;

        // Update position
        if (typeof x === 'number') image.translation.x = x;
        if (typeof y === 'number') image.translation.y = y;

        // Update other properties
        for (const key in props) {
          if (key in image) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (image as any)[key] = (props as any)[key];
          }
        }
      }
    }, [ref, props, mode, texture, x, y]);

    useImperativeHandle(forwardedRef, () => ref as Instance, [ref]);

    return <></>;
  }
);
