import React, { useEffect, useImperativeHandle, useMemo } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { Sprite as Instance } from 'two.js/src/effects/sprite';
import { RectangleProps } from './Rectangle';
import { type EventHandlers } from './Properties';

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
    const { parent, registerEventShape, unregisterEventShape } = useTwo();

    // Create the instance synchronously so it's available for refs immediately
    const sprite = useMemo(() => new Two.Sprite(path), [path]);

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
        parent.add(sprite);

        return () => {
          parent.remove(sprite);
        };
      }
    }, [parent, sprite]);

    useEffect(() => {
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
    }, [shapeProps, sprite, x, y, autoPlay]);

    // Register event handlers
    useEffect(() => {
      if (Object.keys(eventHandlers).length > 0) {
        registerEventShape(sprite, eventHandlers, parent ?? undefined);

        return () => {
          unregisterEventShape(sprite);
        };
      }
    }, [sprite, registerEventShape, unregisterEventShape, parent, eventHandlers]);

    useImperativeHandle(forwardedRef, () => sprite, [sprite]);

    return <></>;
  }
);
