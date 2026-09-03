import React from 'react';
import Two from 'two.js';
import type { RoundedRectangle as Instance } from 'two.js/src/shapes/rounded-rectangle';
import { PathProps } from './Path';
import { type EventHandlers } from './Properties';
import { useTwoObject } from './useTwoObject';

type RoundedRectangleProps = PathProps | 'width' | 'height' | 'radius';
type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<RoundedRectangleProps, keyof Instance>]?: Instance[K];
  } & {
    x?: number;
    y?: number;
  } & Partial<EventHandlers>
>;

export type RefRoundedRectangle = Instance;

export const RoundedRectangle = React.forwardRef<Instance, ComponentProps>(
  (props, forwardedRef) => {
    useTwoObject(props, forwardedRef, {
      factory: () => new Two.RoundedRectangle(),
    });

    return <></>;
  }
);
