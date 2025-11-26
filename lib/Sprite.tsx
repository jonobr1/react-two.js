import React, {
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { Sprite as Instance } from 'two.js/src/effects/sprite';
import { RectangleProps } from './Rectangle';
import { type EventHandlers } from './Properties';
import { EVENT_HANDLER_NAMES } from './Events';

type SpriteProps =
  | RectangleProps
  | 'texture'
  | 'columns'
  | 'rows'
  | 'frameRate'
  | 'index'
  | 'firstFrame'
  | 'lastFrame'
  | 'loop';

type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<SpriteProps, keyof Instance>]?: K extends keyof Instance
      ? Instance[K]
      : never;
  } & {
    path?: string;
    x?: number;
    y?: number;
    autoPlay?: boolean;
  } & Partial<EventHandlers>
>;

export type RefSprite = Instance;

export const Sprite = React.forwardRef<Instance, ComponentProps>(
  (
    {
      path,
      x,
      y,
      autoPlay,
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

    useLayoutEffect(() => {
      const sprite = new Two.Sprite(path);
      set(sprite);

      return () => {
        set(null);
      };
    }, [path, two]);

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
        const sprite = ref;
        // Update position
        if (typeof x === 'number') sprite.translation.x = x;
        if (typeof y === 'number') sprite.translation.y = y;

        if (autoPlay) {
          sprite.play();
        } else {
          sprite.pause();
        }

        // Update other properties (excluding event handlers)
        for (const key in shapeProps) {
          if (key in sprite) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (sprite as any)[key] = (shapeProps as any)[key];
          }
        }
      }
    }, [shapeProps, ref, x, y, autoPlay]);

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
