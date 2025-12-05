import React, { useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { Path as Instance } from 'two.js/src/path';
import { ShapeProps, type EventHandlers } from './Properties';

export type PathProps =
  | ShapeProps
  | 'fill'
  | 'stroke'
  | 'linewidth'
  | 'opacity'
  | 'visible'
  | 'cap'
  | 'join'
  | 'miter'
  | 'closed'
  | 'curved'
  | 'automatic'
  | 'beginning'
  | 'ending'
  | 'dashes'
  | 'vertices';
type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<PathProps, keyof Instance>]?: Instance[K];
  } & {
    manual?: boolean;
    x?: number;
    y?: number;
  } & Partial<EventHandlers>
>;

export type RefPath = Instance;

export const Path = React.forwardRef<Instance, ComponentProps>(
  (
    {
      manual,
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
    const path = useMemo(() => new Two.Path(), []);

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
        parent.add(path);

        return () => {
          parent.remove(path);
        };
      }
    }, [parent, path]);

    // Register event handlers
    useEffect(() => {
      if (Object.keys(eventHandlers).length > 0) {
        registerEventShape(path, eventHandlers, parent ?? undefined);

        return () => {
          unregisterEventShape(path);
        };
      }
    }, [path, registerEventShape, unregisterEventShape, parent, eventHandlers]);

    useEffect(() => {
      // Update position
      if (typeof x === 'number') path.translation.x = x;
      if (typeof y === 'number') path.translation.y = y;

      if (typeof manual !== 'undefined') {
        path.automatic = !manual;
      }

      // Update other properties (excluding event handlers)
      for (const key in shapeProps) {
        if (key in path) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const nextVal = (shapeProps as any)[key];
          if (applied.current[key] !== nextVal) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (path as any)[key] = nextVal;
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
    }, [shapeProps, path, x, y, manual]);

    useImperativeHandle(forwardedRef, () => path, [path]);

    return <></>;
  }
);
