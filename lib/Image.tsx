import React, {
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { Image as Instance } from 'two.js/src/effects/image';
import { RectangleProps } from './Rectangle';
import type { Texture } from 'two.js/src/effects/texture';
import { type EventHandlers } from './Properties';
import { EVENT_HANDLER_NAMES } from './Events';

type ImageProps = RectangleProps | 'mode' | 'texture';

type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<ImageProps, keyof Instance>]?: Instance[K];
  } & {
    x?: number;
    y?: number;
    mode?: string;
    texture?: Texture;
  } & Partial<EventHandlers>
>;

export type RefImage = Instance;

export const Image = React.forwardRef<Instance, ComponentProps>(
  ({ mode, texture, x, y, ...props }, forwardedRef) => {
    const { two, parent, registerEventShape, unregisterEventShape } = useTwo();
    const [ref, set] = useState<Instance | null>(null);

    // Extract event handlers from props
    const { eventHandlers, shapeProps } = useMemo(() => {
      const eventHandlers: Partial<EventHandlers> = {};
      const shapeProps: Record<string, unknown> = {};

      for (const key in props) {
        if (EVENT_HANDLER_NAMES.includes(key as keyof EventHandlers)) {
          eventHandlers[key as keyof EventHandlers] = props[
            key as keyof EventHandlers
          ] as any;
        } else {
          shapeProps[key] = (props as any)[key];
        }
      }

      return { eventHandlers, shapeProps };
    }, [props]);

    useLayoutEffect(() => {
      const image = new Two.Image();
      set(image);

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
        const image = ref;
        if (typeof mode !== 'undefined') image.mode = mode;
        if (typeof texture !== 'undefined') image.texture = texture;

        // Update position
        if (typeof x === 'number') image.translation.x = x;
        if (typeof y === 'number') image.translation.y = y;

        // Update other properties (excluding event handlers)
        for (const key in shapeProps) {
          if (key in image) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (image as any)[key] = (shapeProps as any)[key];
          }
        }
      }
    }, [ref, shapeProps, mode, texture, x, y]);

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
