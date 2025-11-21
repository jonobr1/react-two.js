import React, {
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
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
      const points = new Two.Points();
      set(points);

      return () => {
        set(null);
      };
    }, [two, x, y]);

    useEffect(() => {
      if (parent && ref) {
        parent.add(ref);

        return () => {
          parent.remove(ref);
        };
      }
    }, [parent, ref]);

    useEffect(() => {
      if (ref) {
        const points = ref;
        // Update position
        if (typeof x === 'number') points.translation.x = x;
        if (typeof y === 'number') points.translation.y = y;

        // Update other properties (excluding event handlers)
        for (const key in shapeProps) {
          if (key in points) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (points as any)[key] = (shapeProps as any)[key];
          }
        }
      }
    }, [shapeProps, ref, x, y]);

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
