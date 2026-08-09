import React, { useEffect, useImperativeHandle, useMemo } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { ArcSegment as Instance } from 'two.js/src/shapes/arc-segment';
import { PathProps } from './Path';
import { type EventHandlers } from './Properties';
import { EVENT_HANDLER_NAMES } from './Events';

type ArcSegmentProps =
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
  ({ x, y, resolution, ...props }, forwardedRef) => {
    const { parent, registerEventShape, unregisterEventShape } = useTwo();

    // Create the instance synchronously so it's available for refs immediately
    const arcSegment = useMemo(
      () => new Two.ArcSegment(0, 0, 0, 0, 0, 0, resolution),
      [resolution]
    );

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
        parent.add(arcSegment);
        return () => {
          parent.remove(arcSegment);
        };
      }
    }, [parent, arcSegment]);

    useEffect(() => {
      // Update position
      if (typeof x === 'number') arcSegment.translation.x = x;
      if (typeof y === 'number') arcSegment.translation.y = y;

      // Update other properties (excluding event handlers)
      for (const key in shapeProps) {
        if (key in arcSegment) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (arcSegment as any)[key] = (shapeProps as any)[key];
        }
      }
    }, [shapeProps, arcSegment, x, y]);

    // Unregister on unmount only
    useEffect(() => {
      return () => {
        unregisterEventShape(arcSegment);
      };
    }, [arcSegment, unregisterEventShape]);

    // Register / update event handlers
    useEffect(() => {
      if (Object.keys(eventHandlers).length > 0) {
        registerEventShape(arcSegment, eventHandlers, parent ?? undefined);
      }
    }, [arcSegment, registerEventShape, parent, eventHandlers]);

    useImperativeHandle(forwardedRef, () => arcSegment, [arcSegment]);

    return <></>;
  }
);
