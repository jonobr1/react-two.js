import React from 'react';
import Two from 'two.js';
import type { Rectangle as Instance } from 'two.js/src/shapes/rectangle';
import { PathProps } from './Path';
import { applyOrigin, type EventHandlers, type OriginProp } from './Properties';
import { useTwoObject } from './useTwoObject';

export type RectangleProps = PathProps | 'width' | 'height' | 'origin';
type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<RectangleProps, keyof Instance>]?: K extends 'origin'
      ? OriginProp
      : Instance[K];
  } & {
    x?: number;
    y?: number;
    origin?: OriginProp;
  } & Partial<EventHandlers>
>;

export type RefRectangle = Instance;

export const Rectangle = React.forwardRef<Instance, ComponentProps>(
  (props, forwardedRef) => {
    useTwoObject(props, forwardedRef, {
      factory: () => new Two.Rectangle(),
      specialProps: ['origin'],
      applySpecialProps: (rectangle, currentProps, changed, removed) => {
        if ('origin' in changed) {
          applyOrigin(rectangle, currentProps.origin);
        } else if (removed.includes('origin')) {
          rectangle.origin.set(0, 0);
        }
      },
    });

    return <></>;
  }
);
