import React from 'react';
import Two from 'two.js';
import type { LinearGradient as Instance } from 'two.js/src/effects/linear-gradient';
import { applyVector, GradientProps, type VectorProp } from './Properties';
import { useTwoObject } from './useTwoObject';

export type LinearGradientProps = GradientProps | 'left' | 'right';

type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<LinearGradientProps, keyof Instance>]?: K extends 'left' | 'right'
      ? VectorProp
      : Instance[K];
  } & {
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
    left?: VectorProp;
    right?: VectorProp;
  }
>;

export type RefLinearGradient = Instance;

export const LinearGradient = React.forwardRef<Instance, ComponentProps>(
  (props, forwardedRef) => {
    useTwoObject(props as Record<string, unknown>, forwardedRef, {
      factory: () => new Two.LinearGradient(),
      isSceneObject: false,
      specialProps: ['x1', 'y1', 'x2', 'y2', 'left', 'right'],
      applySpecialProps: (gradient, currentProps, changed, removed) => {
        const p = currentProps as unknown as ComponentProps;
        const grad = gradient as unknown as Instance;

        if ('left' in changed) {
          applyVector(grad.left, p.left);
        }
        if ('right' in changed) {
          applyVector(grad.right, p.right);
        }

        if ('x1' in changed) {
          grad.left.x = typeof p.x1 === 'number' ? p.x1 : 0;
        } else if (removed.includes('x1') && !('left' in p)) {
          grad.left.x = 0;
        }

        if ('y1' in changed) {
          grad.left.y = typeof p.y1 === 'number' ? p.y1 : 0;
        } else if (removed.includes('y1') && !('left' in p)) {
          grad.left.y = 0;
        }

        if ('x2' in changed) {
          grad.right.x = typeof p.x2 === 'number' ? p.x2 : 0;
        } else if (removed.includes('x2') && !('right' in p)) {
          grad.right.x = 0;
        }

        if ('y2' in changed) {
          grad.right.y = typeof p.y2 === 'number' ? p.y2 : 0;
        } else if (removed.includes('y2') && !('right' in p)) {
          grad.right.y = 0;
        }

        if (removed.includes('left') && !('x1' in p) && !('y1' in p)) {
          grad.left.set(0, 0);
        }
        if (removed.includes('right') && !('x2' in p) && !('y2' in p)) {
          grad.right.set(0, 0);
        }
      },
    });

    return null;
  }
);
