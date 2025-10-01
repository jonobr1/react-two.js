import React, {
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
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
    mode?: string;
    texture?: Texture;
  }
>;

export type RefImage = Instance;

export const Image = React.forwardRef<Instance | null, ComponentProps>(
  ({ mode, texture, ...props }, forwardedRef) => {
    const { two, parent } = useTwo();
    const ref = useRef<Instance | null>(null);

    // TODO: Make more synchronous for instant ref usage in parent components
    useLayoutEffect(() => {
      const image = new Two.Image(texture);
      ref.current = image;

      return () => {
        ref.current = null;
      };
    }, [mode, texture, two]);

    useEffect(() => {
      const image = ref.current;
      if (parent && image) {
        parent.add(image);
        update();

        return () => {
          parent.remove(image);
        };
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [parent]);

    useEffect(update, [props]);

    function update() {
      if (ref.current) {
        const image = ref.current;
        for (const key in props) {
          if (key in image) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (image as any)[key] = (props as any)[key];
          }
        }
      }
    }

    useImperativeHandle(forwardedRef, () => ref.current!);

    return <></>;
  }
);
