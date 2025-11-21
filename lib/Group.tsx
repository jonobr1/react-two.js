import React, {
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import Two from 'two.js';
import { Context, useTwo } from './Context';

import type { Group as Instance } from 'two.js/src/group';
import { ShapeProps, type EventHandlers } from './Properties';
import { EVENT_HANDLER_NAMES } from './Events';

type GroupProps =
  | ShapeProps
  | 'fill'
  | 'stroke'
  | 'linewidth'
  | 'cap'
  | 'join'
  | 'miter'
  | 'closed'
  | 'curved'
  | 'automatic';
type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<GroupProps, keyof Instance>]?: Instance[K];
  } & {
    x?: number;
    y?: number;
  } & Partial<EventHandlers>
>;

export type RefGroup = Instance;

export const Group = React.forwardRef<Instance, ComponentProps>(
  ({ x, y, ...props }, forwardedRef) => {
    const {
      two,
      parent,
      width,
      height,
      registerEventShape,
      unregisterEventShape,
    } = useTwo();
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

    useEffect(() => {
      if (two) {
        const group = new Two.Group();

        set(group);

        return () => {
          set(null);
        };
      }
    }, [two]);

    useEffect(() => {
      const group = ref;
      if (parent && group) {
        parent.add(group);

        return () => {
          parent.remove(group);
        };
      }
    }, [ref, parent]);

    useEffect(() => {
      if (ref) {
        const group = ref;
        // Update position
        if (typeof x === 'number') group.translation.x = x;
        if (typeof y === 'number') group.translation.y = y;

        const args = { ...shapeProps };
        delete args.children; // Allow react to handle children

        // Update other properties (excluding event handlers)
        for (const key in args) {
          if (key in group) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (group as any)[key] = (args as any)[key];
          }
        }
      }
    }, [ref, x, y, shapeProps]);

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

    return (
      <Context.Provider
        value={{
          two,
          parent: ref,
          width,
          height,
          registerEventShape,
          unregisterEventShape,
        }}
      >
        {props.children}
      </Context.Provider>
    );
  }
);
