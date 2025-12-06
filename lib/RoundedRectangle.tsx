import React, { useEffect, useImperativeHandle, useMemo } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { RoundedRectangle as Instance } from 'two.js/src/shapes/rounded-rectangle';
import { PathProps } from './Path';
import { type EventHandlers } from './Properties';
import { EVENT_HANDLER_NAMES } from './Events';

type RoundedRectangleProps = PathProps | 'width' | 'height' | 'radius';
type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<RoundedRectangleProps, keyof Instance>]?: Instance[K];
  } & {
    x?: number;
    y?: number;
  } & Partial<EventHandlers>
>;

export type RefRoundedRectangle = Instance;

export const RoundedRectangle = React.forwardRef<Instance, ComponentProps>(
  ({ x, y, ...props }, forwardedRef) => {
    const { parent, registerEventShape, unregisterEventShape } = useTwo();

    // Create the instance synchronously so it's available for refs immediately
    const roundedRectangle = useMemo(() => new Two.RoundedRectangle(), []);

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
        parent.add(roundedRectangle);

        return () => {
          parent.remove(roundedRectangle);
        };
      }
    }, [parent, roundedRectangle]);

    useEffect(() => {
      // Update position
      if (typeof x === 'number') roundedRectangle.translation.x = x;
      if (typeof y === 'number') roundedRectangle.translation.y = y;

      // Update other properties (excluding event handlers)
      for (const key in shapeProps) {
        if (key in roundedRectangle) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (roundedRectangle as any)[key] = (shapeProps as any)[key];
        }
      }
    }, [shapeProps, roundedRectangle, x, y]);

    // Register event handlers
    useEffect(() => {
      if (Object.keys(eventHandlers).length > 0) {
        registerEventShape(
          roundedRectangle,
          eventHandlers,
          parent ?? undefined
        );

        return () => {
          unregisterEventShape(roundedRectangle);
        };
      }
    }, [
      roundedRectangle,
      registerEventShape,
      unregisterEventShape,
      parent,
      eventHandlers,
    ]);

    useImperativeHandle(forwardedRef, () => roundedRectangle, [
      roundedRectangle,
    ]);

    return <></>;
  }
);
