import React from 'react';
import { Context, TwoParentContext, TwoSizeContext } from './Context';
import type { Group as Instance } from 'two.js/src/group';
import { ShapeProps, type EventHandlers } from './Properties';
import { useTwoGroup } from './useTwoObject';

export type GroupProps =
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
  | 'visible'
  | 'mask'
  | 'beginning'
  | 'ending'
  | 'strokeAttenuation';
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
  (props, forwardedRef) => {
    const { coreValue, parentValue, sizeValue, renderChildren } = useTwoGroup(
      props,
      forwardedRef,
    );

    return (
      <Context.Provider value={coreValue}>
        <TwoParentContext.Provider value={parentValue}>
          <TwoSizeContext.Provider value={sizeValue}>
            {renderChildren()}
          </TwoSizeContext.Provider>
        </TwoParentContext.Provider>
      </Context.Provider>
    );
  },
);
