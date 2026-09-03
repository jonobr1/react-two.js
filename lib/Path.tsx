import React from 'react';
import Two from 'two.js';
import type { Path as Instance } from 'two.js/src/path';
import { ShapeProps, type EventHandlers } from './Properties';
import { useTwoObject } from './useTwoObject';

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
  | 'vertices'
  | 'mask'
  | 'clip'
  | 'strokeAttenuation';
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
  (props, forwardedRef) => {
    useTwoObject(props, forwardedRef, {
      factory: () => new Two.Path(),
      specialProps: ['manual'],
      applySpecialProps: (path, currentProps, changed, removed) => {
        if ('manual' in changed) {
          path.automatic = !currentProps.manual;
        } else if (removed.includes('manual')) {
          path.automatic = true;
        }
      },
    });

    return <></>;
  },
);
