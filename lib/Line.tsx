import React, { useEffect, useImperativeHandle, useMemo } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { Line as Instance } from 'two.js/src/shapes/line';
import { PathProps } from './Path';
import { type EventHandlers } from './Properties';
import { EVENT_HANDLER_NAMES } from './Events';

type LineProps = PathProps | 'left' | 'right';
type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<LineProps, keyof Instance>]?: Instance[K];
  } & {
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
  } & Partial<EventHandlers>
>;

export type RefLine = Instance;

export const Line = React.forwardRef<Instance, ComponentProps>(
  ({ x1, y1, x2, y2, ...props }, forwardedRef) => {
    const { parent, registerEventShape, unregisterEventShape } = useTwo();

    // Create the instance synchronously so it's available for refs immediately
    const line = useMemo(() => new Two.Line(), []);

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
        parent.add(line);

        return () => {
          parent.remove(line);
        };
      }
    }, [parent, line]);

    useEffect(() => {
      // Update vertices
      if (typeof x1 === 'number') line.left.x = x1;
      if (typeof y1 === 'number') line.left.y = y1;

      if (typeof x2 === 'number') line.right.x = x2;
      if (typeof y2 === 'number') line.right.y = y2;

      // Update other properties (excluding event handlers)
      for (const key in shapeProps) {
        if (key in line) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (line as any)[key] = (shapeProps as any)[key];
        }
      }
    }, [shapeProps, line, x1, y1, x2, y2]);

    // Register event handlers
    useEffect(() => {
      if (Object.keys(eventHandlers).length > 0) {
        registerEventShape(line, eventHandlers, parent ?? undefined);

        return () => {
          unregisterEventShape(line);
        };
      }
    }, [line, registerEventShape, unregisterEventShape, parent, eventHandlers]);

    useImperativeHandle(forwardedRef, () => line, [line]);

    return <></>;
  }
);
