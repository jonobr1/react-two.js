import React, { useImperativeHandle, useEffect, useRef } from 'react';
import Two from 'two.js';

import type { Texture as Instance } from 'two.js/src/effects/texture';
import { ElementProps } from './Properties';

export type TextureProps =
  | ElementProps
  | 'src'
  | 'loaded'
  | 'repeat'
  | 'scale'
  | 'offset'
  | 'image';
type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<TextureProps, keyof Instance>]?: Instance[K];
  } & {
    source?: string | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement;
  }
>;

export type RefTexture = Instance;

export const Texture = React.forwardRef<Instance | null, ComponentProps>(
  ({ source, ...props }, forwardedRef) => {
    const ref = useRef<Instance | null>(null);

    useEffect(() => {
      const texture = new Two.Texture(source);
      ref.current = texture;
      return () => {
        // TODO: Release texture
      };
    }, [source]);

    useEffect(update, [props]);

    function update() {
      if (ref.current) {
        const texture = ref.current;
        for (const key in props) {
          if (key in texture) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (texture as any)[key] = (props as any)[key];
          }
        }
      }
    }

    useImperativeHandle(forwardedRef, () => ref.current!);

    return null; // No visual representation
  }
);
