import React from 'react';
import Two from 'two.js';
import type { Points as Instance } from 'two.js/src/shapes/points';
import { ShapeProps, type EventHandlers } from './Properties';
import { useTwoObject } from './useTwoObject';

export type PointsProps =
  | ShapeProps
  | 'fill'
  | 'stroke'
  | 'linewidth'
  | 'opacity'
  | 'visible'
  | 'size'
  | 'sizeAttenuation'
  | 'beginning'
  | 'ending'
  | 'dashes'
  | 'vertices'
  | 'strokeAttenuation';
type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<PointsProps, keyof Instance>]?: Instance[K];
  } & {
    x?: number;
    y?: number;
  } & Partial<EventHandlers>
>;

export type RefPoints = Instance;

export const Points = React.forwardRef<Instance, ComponentProps>(
  (props, forwardedRef) => {
    useTwoObject(props, forwardedRef, {
      factory: () => new Two.Points(),
    });

    return <></>;
  },
);
