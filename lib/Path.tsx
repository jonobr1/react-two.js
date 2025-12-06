import React, { useEffect, useImperativeHandle, useMemo } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { Path as Instance } from 'two.js/src/path';
import { ShapeProps, type EventHandlers } from './Properties';
import { EVENT_HANDLER_NAMES } from './Events';

export type PathProps =
  | ShapeProps
  | 'fill'
  | 'stroke'
  | 'linewidth'
  | 'opacity'
  | 'visible'
  | 'cap'
  | 'join'
  | 'miter'
  | 'closed'
  | 'curved'
  | 'automatic'
  | 'beginning'
  | 'ending'
  | 'dashes'
  | 'vertices';
type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<PathProps, keyof Instance>]?: Instance[K];
  } & {
    manual?: boolean;
    x?: number;
    y?: number;
  } & Partial<EventHandlers>
>;

export type RefPath = Instance;

export const Path = React.forwardRef<Instance, ComponentProps>(
  ({ manual, x, y, ...props }, forwardedRef) => {
    const { parent, registerEventShape, unregisterEventShape } = useTwo();

    // Create the instance synchronously so it's available for refs immediately
    const path = useMemo(() => new Two.Path(), []);

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
        parent.add(path);

        return () => {
          parent.remove(path);
        };
      }
    }, [parent, path]);

    // Register event handlers
    useEffect(() => {
      if (Object.keys(eventHandlers).length > 0) {
        registerEventShape(path, eventHandlers, parent ?? undefined);

        return () => {
          unregisterEventShape(path);
        };
      }
    }, [path, registerEventShape, unregisterEventShape, parent, eventHandlers]);

    useEffect(() => {
      // Update position
      if (typeof x === 'number') path.translation.x = x;
      if (typeof y === 'number') path.translation.y = y;

      if (typeof manual !== 'undefined') {
        path.automatic = !manual;
      }

      // Update other properties (excluding event handlers)
      for (const key in shapeProps) {
        if (key in path) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (path as any)[key] = (shapeProps as any)[key];
        }
      }
    }, [shapeProps, path, x, y, manual]);

    useImperativeHandle(forwardedRef, () => path, [path]);

    return <></>;
  }
);
