import React, { useEffect, useImperativeHandle, useMemo } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { Text as Instance } from 'two.js/src/text';
import { ShapeProps, type EventHandlers } from './Properties';
import { EVENT_HANDLER_NAMES } from './Events';

type TextProps =
  | ShapeProps
  | 'value'
  | 'family'
  | 'size'
  | 'leading'
  | 'alignment'
  | 'linewidth'
  | 'style'
  | 'weight'
  | 'decoration'
  | 'direction'
  | 'baseline'
  | 'opacity'
  | 'visible'
  | 'fill'
  | 'stroke'
  | 'dashes';
type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<TextProps, keyof Instance>]?: Instance[K];
  } & {
    x?: number;
    y?: number;
  } & Partial<EventHandlers>
>;

export type RefText = Instance;

export const Text = React.forwardRef<Instance, ComponentProps>(
  ({ x, y, ...props }, forwardedRef) => {
    const { parent, registerEventShape, unregisterEventShape } = useTwo();

    // Create the instance synchronously so it's available for refs immediately
    const text = useMemo(() => new Two.Text(), []);

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
        parent.add(text);

        return () => {
          parent.remove(text);
        };
      }
    }, [parent, text]);

    useEffect(() => {
      // Update position
      if (typeof x === 'number') text.translation.x = x;
      if (typeof y === 'number') text.translation.y = y;

      // Update other properties (excluding event handlers)
      for (const key in shapeProps) {
        if (key in text) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (text as any)[key] = (shapeProps as any)[key];
        }
      }
    }, [shapeProps, text, x, y]);

    // Register event handlers
    useEffect(() => {
      if (Object.keys(eventHandlers).length > 0) {
        registerEventShape(text, eventHandlers, parent ?? undefined);

        return () => {
          unregisterEventShape(text);
        };
      }
    }, [text, registerEventShape, unregisterEventShape, parent, eventHandlers]);

    useImperativeHandle(forwardedRef, () => text, [text]);

    return <></>;
  }
);
