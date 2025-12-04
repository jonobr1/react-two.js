import React, { useEffect, useImperativeHandle, useMemo } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { Line as Instance } from 'two.js/src/shapes/line';
import { PathProps } from './Path';
import { type EventHandlers } from './Properties';

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
  (
    {
      x1,
      y1,
      x2,
      y2,
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

    // Create the instance synchronously so it's available for refs immediately
    const line = useMemo(() => new Two.Line(), []);

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
        line.dispose();
      };
    }, [line]);

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
