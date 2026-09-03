import React from 'react';
import Two from 'two.js';
import type { RadialGradient as Instance } from 'two.js/src/effects/radial-gradient';
import { GradientProps } from './Properties';
import { useTwoObject } from './useTwoObject';

type RadialGradientProps = GradientProps | 'center' | 'radius' | 'focal';

type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<RadialGradientProps, keyof Instance>]?: Instance[K];
  } & {
    x?: number;
    y?: number;
    focalX?: number;
    focalY?: number;
  }
>;

export type RefRadialGradient = Instance;

export const RadialGradient = React.forwardRef<Instance | null, ComponentProps>(
  (props, forwardedRef) => {
    useTwoObject(props as Record<string, unknown>, forwardedRef, {
      factory: () => new Two.RadialGradient(),
      isSceneObject: false,
      specialProps: ['x', 'y', 'focalX', 'focalY'],
      applySpecialProps: (gradient, currentProps, changed, removed) => {
        const p = currentProps as unknown as {
          x?: number;
          y?: number;
          focalX?: number;
          focalY?: number;
        };
        const grad = gradient as unknown as Instance;

        if ('x' in changed) {
          grad.center.x = typeof p.x === 'number' ? p.x : 0;
        } else if (removed.includes('x')) {
          grad.center.x = 0;
        }

        if ('y' in changed) {
          grad.center.y = typeof p.y === 'number' ? p.y : 0;
        } else if (removed.includes('y')) {
          grad.center.y = 0;
        }

        if ('focalX' in changed) {
          grad.focal.x = typeof p.focalX === 'number' ? p.focalX : 0;
        } else if (removed.includes('focalX')) {
          grad.focal.x = 0;
        }

        if ('focalY' in changed) {
          grad.focal.y = typeof p.focalY === 'number' ? p.focalY : 0;
        } else if (removed.includes('focalY')) {
          grad.focal.y = 0;
        }
      },
    });

    return null;
  }
);
