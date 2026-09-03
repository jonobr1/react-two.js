import React from 'react';
import Two from 'two.js';
import type { Polygon as Instance } from 'two.js/src/shapes/polygon';
import { PathProps } from './Path';
import { type EventHandlers } from './Properties';
import { useTwoObject } from './useTwoObject';

export type PolygonProps = PathProps | 'width' | 'height' | 'sides' | 'radius';
type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<PolygonProps, keyof Instance>]?: Instance[K];
  } & {
    x?: number;
    y?: number;
    radius?: number;
  } & Partial<EventHandlers>
>;

export type RefPolygon = Instance;

export const Polygon = React.forwardRef<Instance, ComponentProps>(
  (props, forwardedRef) => {
    useTwoObject(props, forwardedRef, {
      factory: (p) => new Two.Polygon(0, 0, p.radius, p.sides),
      constructionProps: ['sides'],
    });

    return <></>;
  }
);
