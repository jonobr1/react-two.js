import React, { useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { ArcSegment as Instance } from 'two.js/src/shapes/arc-segment';
import { PathProps } from './Path';
import { type EventHandlers } from './Properties';

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
    const arcSegment = useMemo(
      () => new Two.ArcSegment(0, 0, 0, 0, 0, 0, resolution),
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
          const nextVal = (shapeProps as any)[key];
          if (applied.current[key] !== nextVal) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (arcSegment as any)[key] = nextVal;
            applied.current[key] = nextVal;
          }
        }
      }

      // Drop any previously applied keys that are no longer present
      for (const key in applied) {
        if (!(key in shapeProps)) {
          delete applied.current[key];
        }
      }
    }, [shapeProps, arcSegment, x, y]);

    // Register event handlers
    useEffect(() => {
      if (Object.keys(eventHandlers).length > 0) {
        registerEventShape(arcSegment, eventHandlers, parent ?? undefined);

        return () => {
          unregisterEventShape(arcSegment);
        };
      }
    }, [
      arcSegment,
      registerEventShape,
      unregisterEventShape,
      parent,
      eventHandlers,
    ]);

    useImperativeHandle(forwardedRef, () => arcSegment, [arcSegment]);

    return <></>;
  }
);
