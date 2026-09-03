import React from 'react';
import Two from 'two.js';
import type { Line as Instance } from 'two.js/src/shapes/line';
import { PathProps } from './Path';
import { applyVector, type EventHandlers, type VectorProp } from './Properties';
import { useTwoObject } from './useTwoObject';

export type LineProps = PathProps | 'left' | 'right';
type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<LineProps, keyof Instance>]?: K extends 'left' | 'right'
      ? VectorProp
      : Instance[K];
  } & {
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
    left?: VectorProp;
    right?: VectorProp;
  } & Partial<EventHandlers>
>;

export type RefLine = Instance;

export const Line = React.forwardRef<Instance, ComponentProps>(
  (props, forwardedRef) => {
    useTwoObject(props, forwardedRef, {
      factory: () => new Two.Line(),
      specialProps: ['x1', 'y1', 'x2', 'y2', 'left', 'right'],
      applySpecialProps: (line, currentProps, changed, removed) => {
        if ('left' in changed) {
          applyVector(line.left, currentProps.left);
        }
        if ('right' in changed) {
          applyVector(line.right, currentProps.right);
        }

        if ('x1' in changed) {
          line.left.x = typeof currentProps.x1 === 'number' ? currentProps.x1 : 0;
        } else if (removed.includes('x1') && !('left' in currentProps)) {
          line.left.x = 0;
        }

        if ('y1' in changed) {
          line.left.y = typeof currentProps.y1 === 'number' ? currentProps.y1 : 0;
        } else if (removed.includes('y1') && !('left' in currentProps)) {
          line.left.y = 0;
        }

        if ('x2' in changed) {
          line.right.x = typeof currentProps.x2 === 'number' ? currentProps.x2 : 0;
        } else if (removed.includes('x2') && !('right' in currentProps)) {
          line.right.x = 0;
        }

        if ('y2' in changed) {
          line.right.y = typeof currentProps.y2 === 'number' ? currentProps.y2 : 0;
        } else if (removed.includes('y2') && !('right' in currentProps)) {
          line.right.y = 0;
        }

        if (removed.includes('left') && !('x1' in currentProps) && !('y1' in currentProps)) {
          line.left.set(0, 0);
        }
        if (removed.includes('right') && !('x2' in currentProps) && !('y2' in currentProps)) {
          line.right.set(0, 0);
        }
      },
    });

    return <></>;
  }
);
