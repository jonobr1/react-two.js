import React, { useEffect, useImperativeHandle, useMemo } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { ImageSequence as Instance } from 'two.js/src/effects/image-sequence';
import { RectangleProps } from './Rectangle';
import type { Texture } from 'two.js/src/effects/texture';
import { type EventHandlers } from './Properties';
import { EVENT_HANDLER_NAMES } from './Events';

export type ImageSequenceProps =
  | RectangleProps
  | 'textures'
  | 'frameRate'
  | 'index'
  | 'firstFrame'
  | 'lastFrame'
  | 'loop';

type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<ImageSequenceProps, keyof Instance>]?: K extends 'origin'
      ? Instance[K] | { x?: number; y?: number } | [number, number]
      : Instance[K];
  } & {
    src?: string | string[] | Texture | Texture[];
    x?: number;
    y?: number;
    origin?: Instance['origin'] | { x?: number; y?: number } | [number, number];
    autoPlay?: boolean;
  } & Partial<EventHandlers>
>;

export type RefImageSequence = Instance;

export const ImageSequence = React.forwardRef<Instance, ComponentProps>(
  ({ src, x, y, origin, autoPlay, ...props }, forwardedRef) => {
    const { parent, registerEventShape, unregisterEventShape } = useTwo();

    // Create the instance synchronously so it's available for refs immediately
    const imageSequence = useMemo(() => new Two.ImageSequence(src), [src]);

    // Extract event handlers from props
    const { eventHandlers, shapeProps } = useMemo(() => {
      const eventHandlers: Partial<EventHandlers> = {};
      const shapeProps: Record<string, unknown> = {};

      for (const key in props) {
        if (EVENT_HANDLER_NAMES.includes(key as keyof EventHandlers)) {
          // An explicitly `undefined` handler means "not interactive", so it
          // must not count toward the registered handler set.
          const handler = props[key as keyof EventHandlers];
          if (handler !== undefined) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            eventHandlers[key as keyof EventHandlers] = handler as any;
          }
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          shapeProps[key] = (props as any)[key];
        }
      }

      return { eventHandlers, shapeProps };
    }, [props]);

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

      // Update origin
      if (typeof origin !== 'undefined') {
        if (origin instanceof Two.Vector) {
          imageSequence.origin = origin;
        } else if (Array.isArray(origin) && origin.length >= 2) {
          imageSequence.origin.set(origin[0], origin[1]);
        } else if (typeof origin === 'object' && origin !== null) {
          const originObj = origin as { x?: number; y?: number };
          if (typeof originObj.x === 'number') imageSequence.origin.x = originObj.x;
          if (typeof originObj.y === 'number') imageSequence.origin.y = originObj.y;
        }
      }

      // Update other properties (excluding event handlers)
      for (const key in shapeProps) {
        if (key in imageSequence) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (imageSequence as any)[key] = (shapeProps as any)[key];
        }
      }
    }, [shapeProps, imageSequence, x, y, origin, autoPlay]);

    // Unregister on unmount only
    useEffect(() => {
      return () => {
        unregisterEventShape(imageSequence);
      };
    }, [imageSequence, unregisterEventShape]);

    // Register / update event handlers
    useEffect(() => {
      if (Object.keys(eventHandlers).length > 0) {
        registerEventShape(imageSequence, eventHandlers, parent ?? undefined);
      } else {
        unregisterEventShape(imageSequence);
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
