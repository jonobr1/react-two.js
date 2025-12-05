import React, { useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { Circle as Instance } from 'two.js/src/shapes/circle';
import { PathProps } from './Path';
import { type EventHandlers } from './Properties';

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
  (
    {
      x,
      y,
      resolution,
      // Event handlers
      onClick,
      onContextMenu,
      onDoubleClick,
      onWheel,
      onPointerDown,
      onPointerUp,
      onPointerOver,
      onPointerOut,
      onPointerEnter,
      onPointerLeave,
      onPointerMove,
      onPointerCancel,
      // All other props are shape props
      ...shapeProps
    },
    forwardedRef
  ) => {
    const { parent, registerEventShape, unregisterEventShape } = useTwo();
    const applied = useRef<Record<string, unknown>>({});

    // Create the instance synchronously so it's available for refs immediately
    const circle = useMemo(
      () => new Two.Circle(0, 0, 0, resolution),
      [resolution]
    );

    // Build event handlers object with explicit dependencies
    const eventHandlers = useMemo(
      () => ({
        ...(onClick && { onClick }),
        ...(onContextMenu && { onContextMenu }),
        ...(onDoubleClick && { onDoubleClick }),
        ...(onWheel && { onWheel }),
        ...(onPointerDown && { onPointerDown }),
        ...(onPointerUp && { onPointerUp }),
        ...(onPointerOver && { onPointerOver }),
        ...(onPointerOut && { onPointerOut }),
        ...(onPointerEnter && { onPointerEnter }),
        ...(onPointerLeave && { onPointerLeave }),
        ...(onPointerMove && { onPointerMove }),
        ...(onPointerCancel && { onPointerCancel }),
      }),
      [
        onClick,
        onContextMenu,
        onDoubleClick,
        onWheel,
        onPointerDown,
        onPointerUp,
        onPointerOver,
        onPointerOut,
        onPointerEnter,
        onPointerLeave,
        onPointerMove,
        onPointerCancel,
      ]
    );

    useEffect(() => {
      // Update position
      if (typeof x === 'number') circle.translation.x = x;
      if (typeof y === 'number') circle.translation.y = y;

      // Update other properties (excluding event handlers)
      for (const key in shapeProps) {
        if (key in circle) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const nextVal = (shapeProps as any)[key];
          if (applied.current[key] !== nextVal) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (circle as any)[key] = nextVal;
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
    }, [circle, shapeProps, x, y]);

    useEffect(() => {
      if (parent) {
        parent.add(circle);
        return () => {
          parent.remove(circle);
        };
      }
    }, [parent, circle]);

    // Register event handlers
    useEffect(() => {
      if (Object.keys(eventHandlers).length > 0) {
        registerEventShape(circle, eventHandlers, parent ?? undefined);

        return () => {
          unregisterEventShape(circle);
        };
      }
    }, [
      circle,
      registerEventShape,
      unregisterEventShape,
      parent,
      eventHandlers,
    ]);

    useImperativeHandle(forwardedRef, () => circle, [circle]);

    return <></>;
  }
);
