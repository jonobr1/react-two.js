import React from 'react';
import Two from 'two.js';
import type { ArcSegment as Instance } from 'two.js/src/shapes/arc-segment';
import { PathProps } from './Path';
import { type EventHandlers } from './Properties';
import { useTwoObject } from './useTwoObject';

export type ArcSegmentProps =
  | PathProps
  | 'startAngle'
  | 'endAngle'
  | 'innerRadius'
  | 'outerRadius';

type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<ArcSegmentProps, keyof Instance>]?: Instance[K];
  } & {
    x?: number;
    y?: number;
    resolution?: number;
  } & Partial<EventHandlers>
>;

export type RefArcSegment = Instance;

export const ArcSegment = React.forwardRef<Instance, ComponentProps>(
  (props, forwardedRef) => {
    useTwoObject(props, forwardedRef, {
      factory: (p) => new Two.ArcSegment(0, 0, 0, 0, 0, 0, p.resolution),
      constructionProps: ['resolution'],
    });

    return <></>;
  }
);
