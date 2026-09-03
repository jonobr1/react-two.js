import React from 'react';
import Two from 'two.js';
import type { ImageSequence as Instance } from 'two.js/src/effects/image-sequence';
import { RectangleProps } from './Rectangle';
import type { Texture } from 'two.js/src/effects/texture';
import { applyOrigin, type EventHandlers, type OriginProp } from './Properties';
import { useTwoObject } from './useTwoObject';

export type ImageSequenceProps =
  | RectangleProps
  | 'textures'
  | 'frameRate'
  | 'index'
  | 'firstFrame'
  | 'lastFrame'
  | 'loop';

type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<ImageSequenceProps, keyof Instance>]?: K extends 'origin'
      ? OriginProp
      : Instance[K];
  } & {
    src?: string | string[] | Texture | Texture[];
    x?: number;
    y?: number;
    origin?: OriginProp;
    autoPlay?: boolean;
  } & Partial<EventHandlers>
>;

export type RefImageSequence = Instance;

export const ImageSequence = React.forwardRef<Instance, ComponentProps>(
  (props, forwardedRef) => {
    useTwoObject(props, forwardedRef, {
      factory: (p) => new Two.ImageSequence(p.src),
      constructionProps: ['src'],
      specialProps: ['autoPlay', 'origin'],
      applySpecialProps: (seq, currentProps, changed, removed) => {
        if ('origin' in changed) {
          applyOrigin(seq, currentProps.origin);
        } else if (removed.includes('origin')) {
          seq.origin.set(0, 0);
        }

        if (currentProps.autoPlay) {
          seq.play();
        } else {
          seq.pause();
        }
      },
      disposeOwned: (seq) => {
        seq.pause();
      },
    });

    return <></>;
  }
);
