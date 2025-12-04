import React, { useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { Rectangle as Instance } from 'two.js/src/shapes/rectangle';
import { PathProps } from './Path';
import { type EventHandlers } from './Properties';

export type RectangleProps = PathProps | 'width' | 'height';
type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<RectangleProps, keyof Instance>]?: Instance[K];
  } & {
    x?: number;
    y?: number;
  } & Partial<EventHandlers>
>;

export type RefRectangle = Instance;

export const Rectangle = React.forwardRef<Instance, ComponentProps>(
  (
    {
      x,
      y,
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
    const rectangle = useMemo(() => new Two.Rectangle(), []);

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
      return () => {
        rectangle.dispose();
      };
    }, [rectangle]);

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

      // Update other properties (excluding event handlers)
      for (const key in shapeProps) {
        if (key in rectangle) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const nextVal = (shapeProps as any)[key];
          if (applied.current[key] !== nextVal) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (rectangle as any)[key] = nextVal;
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
    }, [shapeProps, rectangle, x, y]);

    // Register event handlers
    useEffect(() => {
      if (Object.keys(eventHandlers).length > 0) {
        registerEventShape(rectangle, eventHandlers, parent ?? undefined);

        return () => {
          unregisterEventShape(rectangle);
        };
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
