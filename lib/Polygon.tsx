import React, { useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { Polygon as Instance } from 'two.js/src/shapes/polygon';
import { PathProps } from './Path';
import { type EventHandlers } from './Properties';
import { EVENT_HANDLER_NAMES } from './Events';

type PolygonProps = PathProps | 'width' | 'height' | 'sides';
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
  ({ x, y, ...props }, forwardedRef) => {
    const { parent, registerEventShape, unregisterEventShape } = useTwo();
    const applied = useRef<Record<string, unknown>>({});

    // Create the instance synchronously so it's available for refs immediately
    const polygon = useMemo(() => new Two.Polygon(), []);

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

    // useEffect(() => {
    //   return () => {
    //     polygon.dispose();
    //   };
    // }, [polygon]);

    useEffect(() => {
      if (parent) {
        parent.add(polygon);

        return () => {
          parent.remove(polygon);
        };
      }
    }, [parent, polygon]);

    useEffect(() => {
      // Update position
      if (typeof x === 'number') polygon.translation.x = x;
      if (typeof y === 'number') polygon.translation.y = y;

      // Update other properties (excluding event handlers)
      for (const key in shapeProps) {
        if (key in polygon) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const nextVal = (shapeProps as any)[key];
          if (applied.current[key] !== nextVal) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (polygon as any)[key] = nextVal;
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
    }, [shapeProps, polygon, x, y]);

    // Register event handlers
    useEffect(() => {
      if (Object.keys(eventHandlers).length > 0) {
        registerEventShape(polygon, eventHandlers, parent ?? undefined);

        return () => {
          unregisterEventShape(polygon);
        };
      }
    }, [
      polygon,
      registerEventShape,
      unregisterEventShape,
      parent,
      eventHandlers,
    ]);

    useImperativeHandle(forwardedRef, () => polygon, [polygon]);

    return <></>;
  }
);
