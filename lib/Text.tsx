import React, {
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { Text as Instance } from 'two.js/src/text';
import { ShapeProps, type EventHandlers } from './Properties';
import { EVENT_HANDLER_NAMES } from './Events';

type TextProps =
  | ShapeProps
  | 'value'
  | 'family'
  | 'size'
  | 'leading'
  | 'alignment'
  | 'linewidth'
  | 'style'
  | 'weight'
  | 'decoration'
  | 'direction'
  | 'baseline'
  | 'opacity'
  | 'visible'
  | 'fill'
  | 'stroke'
  | 'dashes';
type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<TextProps, keyof Instance>]?: Instance[K];
  } & {
    x?: number;
    y?: number;
  } & Partial<EventHandlers>
>;

export type RefText = Instance;

export const Text = React.forwardRef<Instance, ComponentProps>(
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
    const { two, parent, registerEventShape, unregisterEventShape } = useTwo();
    const [ref, set] = useState<Instance | null>(null);

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
      const text = new Two.Text();
      set(text);

      return () => {
        set(null);
      };
    }, [two]);

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
        const text = ref;
        // Update position
        if (typeof x === 'number') text.translation.x = x;
        if (typeof y === 'number') text.translation.y = y;

        // Update other properties (excluding event handlers)
        for (const key in shapeProps) {
          if (key in text) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (text as any)[key] = (shapeProps as any)[key];
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
