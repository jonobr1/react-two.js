import React, { useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { ImageSequence as Instance } from 'two.js/src/effects/image-sequence';
import { RectangleProps } from './Rectangle';
import type { Texture } from 'two.js/src/effects/texture';
import { type EventHandlers } from './Properties';
import { EVENT_HANDLER_NAMES } from './Events';

type ImageSequenceProps =
  | RectangleProps
  | 'textures'
  | 'frameRate'
  | 'index'
  | 'firstFrame'
  | 'lastFrame'
  | 'loop';

type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<ImageSequenceProps, keyof Instance>]?: Instance[K];
  } & {
    src?: string | string[] | Texture | Texture[];
    x?: number;
    y?: number;
    autoPlay?: boolean;
  } & Partial<EventHandlers>
>;

export type RefImageSequence = Instance;

export const ImageSequence = React.forwardRef<Instance, ComponentProps>(
  ({ src, x, y, autoPlay, ...props }, forwardedRef) => {
    const { parent, registerEventShape, unregisterEventShape } = useTwo();
    const applied = useRef<Record<string, unknown>>({});

    // Create the instance synchronously so it's available for refs immediately
    const imageSequence = useMemo(() => new Two.ImageSequence(src), [src]);

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
      return () => {
        imageSequence.dispose();
      };
    }, [imageSequence]);

    useEffect(() => {
      if (parent) {
        parent.add(imageSequence);

        return () => {
          parent.remove(imageSequence);
        };
      }
    }, [parent, imageSequence]);

    useEffect(() => {
      if (autoPlay) {
        imageSequence.play();
      } else {
        imageSequence.pause();
      }

      // Update position
      if (typeof x === 'number') imageSequence.translation.x = x;
      if (typeof y === 'number') imageSequence.translation.y = y;

      // Update other properties (excluding event handlers)
      for (const key in shapeProps) {
        if (key in imageSequence) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const nextVal = (shapeProps as any)[key];
          if (applied.current[key] !== nextVal) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (imageSequence as any)[key] = nextVal;
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
    }, [shapeProps, imageSequence, x, y, autoPlay]);

    // Register event handlers
    useEffect(() => {
      if (Object.keys(eventHandlers).length > 0) {
        registerEventShape(imageSequence, eventHandlers, parent ?? undefined);

        return () => {
          unregisterEventShape(imageSequence);
        };
      }
    }, [
      imageSequence,
      registerEventShape,
      unregisterEventShape,
      parent,
      eventHandlers,
    ]);

    useImperativeHandle(forwardedRef, () => imageSequence, [imageSequence]);

    return <></>;
  }
);
