import React from 'react';
import Two from 'two.js';
import type { Star as Instance } from 'two.js/src/shapes/star';
import { PathProps } from './Path';
import { type EventHandlers } from './Properties';
import { useTwoObject } from './useTwoObject';

export type StarProps = PathProps | 'innerRadius' | 'outerRadius' | 'sides';
type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<StarProps, keyof Instance>]?: Instance[K];
  } & {
    x?: number;
    y?: number;
  } & Partial<EventHandlers>
>;

export type RefStar = Instance;

export const Star = React.forwardRef<Instance, ComponentProps>(
  (props, forwardedRef) => {
    useTwoObject(props, forwardedRef, {
      factory: () => new Two.Star(),
    });

    return <></>;
  }
);
