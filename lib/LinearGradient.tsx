import React from 'react';
import Two from 'two.js';
import type { LinearGradient as Instance } from 'two.js/src/effects/linear-gradient';
import { GradientProps } from './Properties';
import { useTwoObject } from './useTwoObject';

export type LinearGradientProps = GradientProps | 'left' | 'right';

type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<LinearGradientProps, keyof Instance>]?: Instance[K];
  } & {
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
  }
>;

export type RefLinearGradient = Instance;

export const LinearGradient = React.forwardRef<Instance, ComponentProps>(
  (props, forwardedRef) => {
    useTwoObject(props as Record<string, unknown>, forwardedRef, {
      factory: () => new Two.LinearGradient(),
      isSceneObject: false,
      specialProps: ['x1', 'y1', 'x2', 'y2'],
      applySpecialProps: (gradient, currentProps, changed, removed) => {
        const p = currentProps as unknown as {
          x1?: number;
          y1?: number;
          x2?: number;
          y2?: number;
        };
        const grad = gradient as unknown as Instance;

        if ('x1' in changed) {
          grad.left.x = typeof p.x1 === 'number' ? p.x1 : 0;
        } else if (removed.includes('x1')) {
          grad.left.x = 0;
        }

        if ('y1' in changed) {
          grad.left.y = typeof p.y1 === 'number' ? p.y1 : 0;
        } else if (removed.includes('y1')) {
          grad.left.y = 0;
        }

        if ('x2' in changed) {
          grad.right.x = typeof p.x2 === 'number' ? p.x2 : 0;
        } else if (removed.includes('x2')) {
          grad.right.x = 0;
        }

        if ('y2' in changed) {
          grad.right.y = typeof p.y2 === 'number' ? p.y2 : 0;
        } else if (removed.includes('y2')) {
          grad.right.y = 0;
        }
      },
    });

    return null;
  }
);
