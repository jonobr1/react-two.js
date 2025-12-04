import React, { useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { RoundedRectangle as Instance } from 'two.js/src/shapes/rounded-rectangle';
import { PathProps } from './Path';
import { type EventHandlers } from './Properties';

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
    const roundedRectangle = useMemo(() => new Two.RoundedRectangle(), []);

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
        roundedRectangle.dispose();
      };
    }, [roundedRectangle]);

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
          const nextVal = (shapeProps as any)[key];
          if (applied.current[key] !== nextVal) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (roundedRectangle as any)[key] = nextVal;
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
