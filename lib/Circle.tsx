import React, {
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { Circle as Instance } from 'two.js/src/shapes/circle';
import { PathProps } from './Path';
import { type EventHandlers } from './Properties';
import { EVENT_HANDLER_NAMES } from './Events';

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
  ({ x, y, resolution, ...props }, forwardedRef) => {
    const { two, parent, registerEventShape, unregisterEventShape } = useTwo();
    const [ref, set] = useState<Instance | null>(null);

    // Extract event handlers from props
    const { eventHandlers, shapeProps } = useMemo(() => {
      const eventHandlers: Partial<EventHandlers> = {};
      const shapeProps: Record<string, unknown> = {};

      for (const key in props) {
        if (EVENT_HANDLER_NAMES.includes(key as keyof EventHandlers)) {
          eventHandlers[key as keyof EventHandlers] = props[
            key as keyof EventHandlers
          ] as any;
        } else {
          shapeProps[key] = (props as any)[key];
        }
      }

      return { eventHandlers, shapeProps };
    }, [props]);

    useEffect(() => {
      const circle = new Two.Circle(0, 0, 0, resolution);
      set(circle);

      return () => {
        set(null);
      };
    }, [resolution, two]);

    useEffect(() => {
      if (ref) {
        const circle = ref;
        // Update position
        if (typeof x === 'number') circle.translation.x = x;
        if (typeof y === 'number') circle.translation.y = y;

        // Update other properties (excluding event handlers)
        for (const key in shapeProps) {
          if (key in circle) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (circle as any)[key] = (shapeProps as any)[key];
          }
        }
      }
    }, [ref, shapeProps, x, y]);

    useEffect(() => {
      if (parent && ref) {
        parent.add(ref);
        return () => {
          parent.remove(ref);
        };
      }
    }, [parent, ref]);

    // Register event handlers
    useEffect(() => {
      if (ref && Object.keys(eventHandlers).length > 0) {
        registerEventShape(ref, eventHandlers, parent ?? undefined);

        return () => {
          unregisterEventShape(ref);
        };
      }
    }, [ref, registerEventShape, unregisterEventShape, parent, eventHandlers]);

    useImperativeHandle(forwardedRef, () => ref as Instance, [ref]);

    return <></>;
  }
);
