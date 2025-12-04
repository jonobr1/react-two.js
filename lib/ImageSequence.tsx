import React, { useEffect, useImperativeHandle, useMemo } from 'react';
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
    paths?: string | string[] | Texture | Texture[];
    x?: number;
    y?: number;
    autoPlay?: boolean;
  } & Partial<EventHandlers>
>;

export type RefImageSequence = Instance;

export const ImageSequence = React.forwardRef<Instance, ComponentProps>(
  ({ paths, x, y, autoPlay, ...props }, forwardedRef) => {
    const { parent, registerEventShape, unregisterEventShape } = useTwo();

    // Create the instance synchronously so it's available for refs immediately
    const imageSequence = useMemo(() => new Two.ImageSequence(paths), [paths]);

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
          (imageSequence as any)[key] = (shapeProps as any)[key];
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
    }, [imageSequence, registerEventShape, unregisterEventShape, parent, eventHandlers]);

    useImperativeHandle(forwardedRef, () => imageSequence, [imageSequence]);

    return <></>;
  }
);
