import React, { useEffect, useImperativeHandle, useMemo } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { Image as Instance } from 'two.js/src/effects/image';
import { RectangleProps } from './Rectangle';
import type { Texture } from 'two.js/src/effects/texture';
import { type EventHandlers } from './Properties';
import { EVENT_HANDLER_NAMES } from './Events';

export type ImageProps = RectangleProps | 'mode' | 'texture';

type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<ImageProps, keyof Instance>]?: K extends 'origin'
      ? Instance[K] | { x?: number; y?: number } | [number, number]
      : Instance[K];
  } & {
    x?: number;
    y?: number;
    origin?: Instance['origin'] | { x?: number; y?: number } | [number, number];
    mode?: string;
    src?: string | Texture;
    texture?: Texture;
  } & Partial<EventHandlers>
>;

export type RefImage = Instance;

export const Image = React.forwardRef<Instance, ComponentProps>(
  ({ mode, src, texture, x, y, origin, ...props }, forwardedRef) => {
    const { parent, registerEventShape, unregisterEventShape } = useTwo();

    // Create the instance synchronously so it's available for refs immediately
    const image = useMemo(() => new Two.Image(src), [src]);

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
        parent.add(image);

        return () => {
          parent.remove(image);
        };
      }
    }, [parent, image]);

    useEffect(() => {
      if (typeof mode !== 'undefined') image.mode = mode;
      if (typeof texture !== 'undefined') image.texture = texture;

      // Update position
      if (typeof x === 'number') image.translation.x = x;
      if (typeof y === 'number') image.translation.y = y;

      // Update origin
      if (typeof origin !== 'undefined') {
        if (origin instanceof Two.Vector) {
          image.origin = origin;
        } else if (Array.isArray(origin) && origin.length >= 2) {
          image.origin.set(origin[0], origin[1]);
        } else if (typeof origin === 'object' && origin !== null) {
          const originObj = origin as { x?: number; y?: number };
          if (typeof originObj.x === 'number') image.origin.x = originObj.x;
          if (typeof originObj.y === 'number') image.origin.y = originObj.y;
        }
      }

      // Update other properties (excluding event handlers)
      for (const key in shapeProps) {
        if (key in image) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (image as any)[key] = (shapeProps as any)[key];
        }
      }
    }, [image, shapeProps, mode, texture, x, y, origin]);

    // Unregister on unmount only
    useEffect(() => {
      return () => {
        unregisterEventShape(image);
      };
    }, [image, unregisterEventShape]);

    // Register / update event handlers
    useEffect(() => {
      if (Object.keys(eventHandlers).length > 0) {
        registerEventShape(image, eventHandlers, parent ?? undefined);
      } else {
        unregisterEventShape(image);
      }
    }, [
      image,
      registerEventShape,
      unregisterEventShape,
      parent,
      eventHandlers,
    ]);

    useImperativeHandle(forwardedRef, () => image, [image]);

    return <></>;
  }
);
