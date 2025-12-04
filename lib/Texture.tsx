import React, { useImperativeHandle, useEffect, useMemo } from 'react';
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
    src?: string | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement;
  }
>;

export type RefTexture = Instance;

export const Texture = React.forwardRef<Instance, ComponentProps>(
  ({ src, ...props }, forwardedRef) => {
    // Create the instance synchronously so it's available for refs immediately
    const texture = useMemo(() => new Two.Texture(src), [src]);

    useEffect(() => {
      // Update other properties
      for (const key in props) {
        if (key in texture) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (texture as any)[key] = (props as any)[key];
        }
      }
    }, [props, texture]);

    useImperativeHandle(forwardedRef, () => texture, [texture]);

    return null; // No visual representation
  }
);
