import React, { useEffect, useImperativeHandle, useMemo } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { Image as Instance } from 'two.js/src/effects/image';
import { RectangleProps } from './Rectangle';
import type { Texture } from 'two.js/src/effects/texture';
import { type EventHandlers } from './Properties';

type ImageProps = RectangleProps | 'mode' | 'texture';

type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<ImageProps, keyof Instance>]?: Instance[K];
  } & {
    x?: number;
    y?: number;
    mode?: string;
    src?: string | Texture;
    texture?: Texture;
  } & Partial<EventHandlers>
>;

export type RefImage = Instance;

export const Image = React.forwardRef<Instance, ComponentProps>(
  (
    {
      mode,
      src,
      texture,
      x,
      y,
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
    const image = useMemo(() => new Two.Image(src), [src]);

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
      return () => {
        image.dispose();
      };
    }, [image]);

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

      // Update other properties (excluding event handlers)
      for (const key in shapeProps) {
        if (key in image) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (image as any)[key] = (shapeProps as any)[key];
        }
      }
    }, [image, shapeProps, mode, texture, x, y]);

    // Register event handlers
    useEffect(() => {
      if (Object.keys(eventHandlers).length > 0) {
        registerEventShape(image, eventHandlers, parent ?? undefined);

        return () => {
          unregisterEventShape(image);
        };
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
