import React, { useEffect, useImperativeHandle, useMemo } from 'react';
import Two from 'two.js';
import { Context, TwoParentContext, TwoSizeContext, useTwo } from './Context';

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
  | 'automatic'
  | 'opacity'
  | 'visible';
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

    // Create the instance synchronously so it's available for refs immediately
    const group = useMemo(() => new Two.Group(), []);

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
        parent.add(group);

        return () => {
          parent.remove(group);
        };
      }
    }, [parent, group]);

    useEffect(() => {
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
    }, [group, x, y, shapeProps]);

    // Register event handlers
    useEffect(() => {
      if (Object.keys(eventHandlers).length > 0) {
        registerEventShape(group, eventHandlers, parent ?? undefined);

        return () => {
          unregisterEventShape(group);
        };
      }
    }, [
      group,
      registerEventShape,
      unregisterEventShape,
      parent,
      eventHandlers,
    ]);

    useImperativeHandle(forwardedRef, () => group, [group]);

    const coreValue = useMemo(
      () => ({
        two,
        registerEventShape,
        unregisterEventShape,
      }),
      [two, registerEventShape, unregisterEventShape]
    );

    const parentValue = useMemo(
      () => ({
        parent: group,
      }),
      [group]
    );

    const sizeValue = useMemo(
      () => ({
        width,
        height,
      }),
      [width, height]
    );

    return (
      <Context.Provider value={coreValue}>
        <TwoParentContext.Provider value={parentValue}>
          <TwoSizeContext.Provider value={sizeValue}>
            {props.children}
          </TwoSizeContext.Provider>
        </TwoParentContext.Provider>
      </Context.Provider>
    );
  }
);
