import React from 'react';
import Two from 'two.js';
import type { Text as Instance } from 'two.js/src/text';
import { ShapeProps, type EventHandlers } from './Properties';
import { useTwoObject } from './useTwoObject';

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
  (props, forwardedRef) => {
    useTwoObject(props, forwardedRef, {
      factory: () => new Two.Text(),
    });

    return <></>;
  }
);
