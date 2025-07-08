import React, { useImperativeHandle, useEffect, useRef, useCallback } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { Texture as Instance } from 'two.js/src/effects/texture';
import { ElementProps } from './Properties';

type TextureProps = ElementProps | 'src' | 'offset' | 'repeat' | 'scale';

type ComponentProps = React.PropsWithChildren<
  {
    [K in TextureProps]?: Instance[K];
  } & {
    source?: string | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement;
  }
>;

export type RefTexture = Instance;

export const Texture = React.forwardRef<Instance | null, ComponentProps>(
  ({ source, ...props }, forwardedRef) => {
    const { two } = useTwo();

    const ref = useRef<Instance | null>(null);

    if (!ref.current && two && source) {
      ref.current = new Two.Texture(source);
    }


    const update = useCallback(() => {
      if (ref.current) {
        const texture = ref.current;
        for (const key in props) {
          if (key in texture) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (texture as any)[key] = (props as any)[key];
          }
        }
      }
    }, [props]);

    useEffect(update, [update]);

    useImperativeHandle(forwardedRef, () => ref.current, []);

    return null; // No visual representation
  }
);