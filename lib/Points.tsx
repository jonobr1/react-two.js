import React, { useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { Points as Instance } from 'two.js/src/shapes/points';
import { ShapeProps, type EventHandlers } from './Properties';
import { EVENT_HANDLER_NAMES } from './Events';

type PointsProps =
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
  | 'vertices';
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
  ({ x, y, ...props }, forwardedRef) => {
    const { parent, registerEventShape, unregisterEventShape } = useTwo();
    const applied = useRef<Record<string, unknown>>({});

    // Create the instance synchronously so it's available for refs immediately
    const points = useMemo(() => new Two.Points(), []);

    // Extract event handlers from props
    const { eventHandlers, shapeProps } = useMemo(() => {
      const eventHandlers: Partial<EventHandlers> = {};
      const shapeProps: Record<string, unknown> = {};

      for (const key in props) {
        if (EVENT_HANDLER_NAMES.includes(key as keyof EventHandlers)) {
          eventHandlers[key as keyof EventHandlers] = props[
            key as keyof EventHandlers
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ] as any;
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          shapeProps[key] = (props as any)[key];
        }
      }

      return { eventHandlers, shapeProps };
    }, [props]);

    useEffect(() => {
      if (parent) {
        parent.add(points);

        return () => {
          parent.remove(points);
        };
      }
    }, [parent, points]);

    useEffect(() => {
      // Update position
      if (typeof x === 'number') points.translation.x = x;
      if (typeof y === 'number') points.translation.y = y;

      // Update other properties (excluding event handlers)
      for (const key in shapeProps) {
        if (key in points) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const nextVal = (shapeProps as any)[key];
          if (applied.current[key] !== nextVal) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (points as any)[key] = nextVal;
            applied.current[key] = nextVal;
          }
        }
      }

      // Drop any previously applied keys that are no longer present
      for (const key in applied.current) {
        if (!(key in shapeProps)) {
          delete applied.current[key];
        }
      }
    }, [shapeProps, points, x, y]);

    // Register event handlers
    useEffect(() => {
      if (Object.keys(eventHandlers).length > 0) {
        registerEventShape(points, eventHandlers, parent ?? undefined);

        return () => {
          unregisterEventShape(points);
        };
      }
    }, [
      points,
      registerEventShape,
      unregisterEventShape,
      parent,
      eventHandlers,
    ]);

    useImperativeHandle(forwardedRef, () => points, [points]);

    return <></>;
  }
);
