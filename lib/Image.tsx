import React from 'react';
import Two from 'two.js';
import type { Image as Instance } from 'two.js/src/effects/image';
import { RectangleProps } from './Rectangle';
import type { Texture } from 'two.js/src/effects/texture';
import { type EventHandlers } from './Properties';
import { useTwoObject } from './useTwoObject';

type ImageProps = RectangleProps | 'mode' | 'texture';

type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<ImageProps, keyof Instance>]?: Instance[K];
  } & {
    x?: number;
    y?: number;
    mode?: string;
    src?: string | Texture;
    texture?: Texture;
  } & Partial<EventHandlers>
>;

export type RefImage = Instance;

export const Image = React.forwardRef<Instance, ComponentProps>(
  (props, forwardedRef) => {
    useTwoObject(props, forwardedRef, {
      factory: (p) => new Two.Image(p.src),
      constructionProps: ['src'],
      specialProps: ['mode', 'texture'],
      applySpecialProps: (image, currentProps, changed, removed) => {
        if ('mode' in changed && currentProps.mode !== undefined) {
          image.mode = currentProps.mode;
        } else if (removed.includes('mode')) {
          image.mode = 'fill';
        }

        if ('texture' in changed && currentProps.texture !== undefined) {
          image.texture = currentProps.texture;
        } else if (removed.includes('texture')) {
          image.texture = null as unknown as Texture;
        }
      },
    });

    return <></>;
  }
);
