import React from 'react';
import Two from 'two.js';
import type { Sprite as Instance } from 'two.js/src/effects/sprite';
import type { Texture } from 'two.js/src/effects/texture';
import { RectangleProps } from './Rectangle';
import { applyOrigin, type EventHandlers, type OriginProp } from './Properties';
import { useTwoObject } from './useTwoObject';

export type SpriteProps =
  | RectangleProps
  | 'texture'
  | 'columns'
  | 'rows'
  | 'frameRate'
  | 'index'
  | 'firstFrame'
  | 'lastFrame'
  | 'loop';

type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<SpriteProps, keyof Instance>]?: K extends 'origin'
      ? OriginProp
      : Instance[K];
  } & {
    src?: string | Texture;
    x?: number;
    y?: number;
    origin?: OriginProp;
    autoPlay?: boolean;
  } & Partial<EventHandlers>
>;

export type RefSprite = Instance;

export const Sprite = React.forwardRef<Instance, ComponentProps>(
  (props, forwardedRef) => {
    useTwoObject(props, forwardedRef, {
      factory: (p) => new Two.Sprite(p.src),
      constructionProps: ['src'],
      specialProps: ['autoPlay', 'origin'],
      applySpecialProps: (sprite, currentProps, changed, removed) => {
        if ('origin' in changed) {
          applyOrigin(sprite, currentProps.origin);
        } else if (removed.includes('origin')) {
          sprite.origin.set(0, 0);
        }

        if (currentProps.autoPlay) {
          sprite.play();
        } else {
          sprite.pause();
        }
      },
      disposeOwned: (sprite) => {
        sprite.pause();
      },
    });

    return <></>;
  }
);
