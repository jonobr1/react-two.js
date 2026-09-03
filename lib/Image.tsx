import React, { useEffect, useImperativeHandle, useMemo } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { Image as Instance } from 'two.js/src/effects/image';
import { RectangleProps } from './Rectangle';
import type { Texture } from 'two.js/src/effects/texture';
import { applyOrigin, type EventHandlers, type OriginProp } from './Properties';
import { EVENT_HANDLER_NAMES } from './Events';

export type ImageProps = RectangleProps | 'mode' | 'texture';

type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<ImageProps, keyof Instance>]?: K extends 'origin'
      ? OriginProp
      : Instance[K];
  } & {
    x?: number;
    y?: number;
    origin?: OriginProp;
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
      applyOrigin(image, origin);

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
