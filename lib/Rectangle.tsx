import React, { useEffect, useImperativeHandle, useMemo } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { Rectangle as Instance } from 'two.js/src/shapes/rectangle';
import { PathProps } from './Path';
import { type EventHandlers } from './Properties';
import { EVENT_HANDLER_NAMES } from './Events';

export type RectangleProps = PathProps | 'width' | 'height' | 'origin';
type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<RectangleProps, keyof Instance>]?: K extends 'origin'
      ? Instance[K] | { x?: number; y?: number } | [number, number]
      : Instance[K];
  } & {
    x?: number;
    y?: number;
    origin?: Instance['origin'] | { x?: number; y?: number } | [number, number];
  } & Partial<EventHandlers>
>;

export type RefRectangle = Instance;

export const Rectangle = React.forwardRef<Instance, ComponentProps>(
  ({ x, y, origin, ...props }, forwardedRef) => {
    const { parent, registerEventShape, unregisterEventShape } = useTwo();

    // Create the instance synchronously so it's available for refs immediately
    const rectangle = useMemo(() => new Two.Rectangle(), []);

    // Extract event handlers from props
    const { eventHandlers, shapeProps } = useMemo(() => {
      const eventHandlers: Partial<EventHandlers> = {};
      const shapeProps: Record<string, unknown> = {};

      for (const key in props) {
        if (EVENT_HANDLER_NAMES.includes(key as keyof EventHandlers)) {
          // An explicitly `undefined` handler means "not interactive", so it
          // must not count toward the registered handler set.
          const handler = props[key as keyof EventHandlers];
          if (handler !== undefined) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            eventHandlers[key as keyof EventHandlers] = handler as any;
          }
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          shapeProps[key] = (props as any)[key];
        }
      }

      return { eventHandlers, shapeProps };
    }, [props]);

    useEffect(() => {
      if (parent) {
        parent.add(rectangle);

        return () => {
          parent.remove(rectangle);
        };
      }
    }, [parent, rectangle]);

    useEffect(() => {
      // Update position
      if (typeof x === 'number') rectangle.translation.x = x;
      if (typeof y === 'number') rectangle.translation.y = y;

      // Update origin
      if (typeof origin !== 'undefined') {
        if (origin instanceof Two.Vector) {
          rectangle.origin = origin;
        } else if (Array.isArray(origin) && origin.length >= 2) {
          rectangle.origin.set(origin[0], origin[1]);
        } else if (typeof origin === 'object' && origin !== null) {
          const originObj = origin as { x?: number; y?: number };
          if (typeof originObj.x === 'number') rectangle.origin.x = originObj.x;
          if (typeof originObj.y === 'number') rectangle.origin.y = originObj.y;
        }
      }

      // Update other properties (excluding event handlers)
      for (const key in shapeProps) {
        if (key in rectangle) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (rectangle as any)[key] = (shapeProps as any)[key];
        }
      }
    }, [shapeProps, rectangle, x, y, origin]);

    // Unregister on unmount only
    useEffect(() => {
      return () => {
        unregisterEventShape(rectangle);
      };
    }, [rectangle, unregisterEventShape]);

    // Register / update event handlers
    useEffect(() => {
      if (Object.keys(eventHandlers).length > 0) {
        registerEventShape(rectangle, eventHandlers, parent ?? undefined);
      } else {
        unregisterEventShape(rectangle);
      }
    }, [
      rectangle,
      registerEventShape,
      unregisterEventShape,
      parent,
      eventHandlers,
    ]);

    useImperativeHandle(forwardedRef, () => rectangle, [rectangle]);

    return <></>;
  }
);
