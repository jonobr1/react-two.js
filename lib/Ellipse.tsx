import React from 'react';
import Two from 'two.js';
import type { Ellipse as Instance } from 'two.js/src/shapes/ellipse';
import { PathProps } from './Path';
import { type EventHandlers } from './Properties';
import { useTwoObject } from './useTwoObject';

type EllipseProps = PathProps | 'width' | 'height';
type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<EllipseProps, keyof Instance>]?: Instance[K];
  } & {
    x?: number;
    y?: number;
    resolution?: number;
  } & Partial<EventHandlers>
>;

export type RefEllipse = Instance;

export const Ellipse = React.forwardRef<Instance, ComponentProps>(
  (props, forwardedRef) => {
    useTwoObject(props, forwardedRef, {
      factory: (p) => new Two.Ellipse(0, 0, 0, 0, p.resolution),
      constructionProps: ['resolution'],
    });

    return <></>;
  }
);
