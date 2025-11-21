import React, {
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
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
      const imageSequence = new Two.ImageSequence(paths);
      set(imageSequence);

      return () => {
        set(null);
      };
    }, [two, paths]);

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
        const imageSequence = ref;
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
      }
    }, [shapeProps, ref, paths, x, y, autoPlay]);

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
