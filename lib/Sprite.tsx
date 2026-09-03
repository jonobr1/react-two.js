import React from 'react';
import Two from 'two.js';
import type { Sprite as Instance } from 'two.js/src/effects/sprite';
import { RectangleProps } from './Rectangle';
import { type EventHandlers } from './Properties';
import { useTwoObject } from './useTwoObject';

type SpriteProps =
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
    [K in Extract<SpriteProps, keyof Instance>]?: K extends keyof Instance
      ? Instance[K]
      : never;
  } & {
    src?: string;
    x?: number;
    y?: number;
    autoPlay?: boolean;
  } & Partial<EventHandlers>
>;

export type RefSprite = Instance;

export const Sprite = React.forwardRef<Instance, ComponentProps>(
  (props, forwardedRef) => {
    useTwoObject(props, forwardedRef, {
      factory: (p) => new Two.Sprite(p.src),
      constructionProps: ['src'],
      specialProps: ['autoPlay'],
      applySpecialProps: (sprite, currentProps) => {
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
