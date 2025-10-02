import React, { useImperativeHandle, useEffect, useState } from 'react';
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

export const Texture = React.forwardRef<Instance, ComponentProps>(
  ({ source, ...props }, forwardedRef) => {
    const [ref, set] = useState<Instance | null>(null);

    useEffect(() => {
      const texture = new Two.Texture(source);
      set(texture);
      return () => {
        set(null);
      };
    }, [source]);

    useEffect(() => {
      if (ref) {
        const texture = ref;

        // Update other properties
        for (const key in props) {
          if (key in texture) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (texture as any)[key] = (props as any)[key];
          }
        }
      }
    }, [props, ref]);

    useImperativeHandle(forwardedRef, () => ref as Instance, [ref]);

    return null; // No visual representation
  }
);
