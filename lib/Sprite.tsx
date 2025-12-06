import React, { useEffect, useImperativeHandle, useMemo } from 'react';
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
    src?: string;
    x?: number;
    y?: number;
    autoPlay?: boolean;
  } & Partial<EventHandlers>
>;

export type RefSprite = Instance;

export const Sprite = React.forwardRef<Instance, ComponentProps>(
  ({ src, x, y, autoPlay, ...props }, forwardedRef) => {
    const { parent, registerEventShape, unregisterEventShape } = useTwo();

    // Create the instance synchronously so it's available for refs immediately
    const sprite = useMemo(() => new Two.Sprite(src), [src]);

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
    }, [
      sprite,
      registerEventShape,
      unregisterEventShape,
      parent,
      eventHandlers,
    ]);

    useImperativeHandle(forwardedRef, () => sprite, [sprite]);

    return <></>;
  }
);
