import React, { useImperativeHandle, useEffect, useMemo, useRef } from 'react';
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
    const applied = useRef<Record<string, unknown>>({});

    useEffect(() => {
      // Update other properties (excluding event handlers)
      for (const key in props) {
        if (key in texture) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const nextVal = (props as any)[key];
          if (applied.current[key] !== nextVal) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (texture as any)[key] = nextVal;
            applied.current[key] = nextVal;
          }
        }
      }

      // Drop any previously applied keys that are no longer present
      for (const key in applied.current) {
        if (!(key in props)) {
          delete applied.current[key];
        }
      }
    }, [props, texture]);

    useImperativeHandle(forwardedRef, () => texture, [texture]);

    return null; // No visual representation
  }
);
