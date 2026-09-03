import React from 'react';
import Two from 'two.js';
import type { Rectangle as Instance } from 'two.js/src/shapes/rectangle';
import { PathProps } from './Path';
import { type EventHandlers } from './Properties';
import { useTwoObject } from './useTwoObject';

export type RectangleProps = PathProps | 'width' | 'height';
type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<RectangleProps, keyof Instance>]?: Instance[K];
  } & {
    x?: number;
    y?: number;
  } & Partial<EventHandlers>
>;

export type RefRectangle = Instance;

export const Rectangle = React.forwardRef<Instance, ComponentProps>(
  (props, forwardedRef) => {
    useTwoObject(props, forwardedRef, {
      factory: () => new Two.Rectangle(),
    });

    return <></>;
  }
);
