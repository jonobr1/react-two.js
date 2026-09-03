import React from 'react';
import Two from 'two.js';
import type { Circle as Instance } from 'two.js/src/shapes/circle';
import { PathProps } from './Path';
import { type EventHandlers } from './Properties';
import { useTwoObject } from './useTwoObject';

type CircleProps = PathProps | 'radius';
type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<CircleProps, keyof Instance>]?: Instance[K];
  } & {
    x?: number;
    y?: number;
    resolution?: number;
  } & Partial<EventHandlers>
>;

export type RefCircle = Instance;

export const Circle = React.forwardRef<Instance, ComponentProps>(
  (props, forwardedRef) => {
    useTwoObject(props, forwardedRef, {
      factory: (p) => new Two.Circle(0, 0, 0, p.resolution),
      constructionProps: ['resolution'],
    });

    return <></>;
  }
);
