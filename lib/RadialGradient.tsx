import React from 'react';
import Two from 'two.js';
import type { RadialGradient as Instance } from 'two.js/src/effects/radial-gradient';
import { applyVector, GradientProps, type VectorProp } from './Properties';
import { useTwoObject } from './useTwoObject';

export type RadialGradientProps = GradientProps | 'center' | 'radius' | 'focal';

type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<RadialGradientProps, keyof Instance>]?: K extends 'center' | 'focal'
      ? VectorProp
      : Instance[K];
  } & {
    x?: number;
    y?: number;
    focalX?: number;
    focalY?: number;
    center?: VectorProp;
    focal?: VectorProp;
  }
>;

export type RefRadialGradient = Instance;

export const RadialGradient = React.forwardRef<Instance | null, ComponentProps>(
  (props, forwardedRef) => {
    useTwoObject(props as Record<string, unknown>, forwardedRef, {
      factory: () => new Two.RadialGradient(),
      isSceneObject: false,
      specialProps: ['x', 'y', 'focalX', 'focalY', 'center', 'focal'],
      applySpecialProps: (gradient, currentProps, changed, removed) => {
        const p = currentProps as unknown as ComponentProps;
        const grad = gradient as unknown as Instance;

        if ('center' in changed) {
          applyVector(grad.center, p.center);
        }
        if ('focal' in changed) {
          applyVector(grad.focal, p.focal);
        }

        if ('x' in changed) {
          grad.center.x = typeof p.x === 'number' ? p.x : 0;
        } else if (removed.includes('x') && !('center' in p)) {
          grad.center.x = 0;
        }

        if ('y' in changed) {
          grad.center.y = typeof p.y === 'number' ? p.y : 0;
        } else if (removed.includes('y') && !('center' in p)) {
          grad.center.y = 0;
        }

        if ('focalX' in changed) {
          grad.focal.x = typeof p.focalX === 'number' ? p.focalX : 0;
        } else if (removed.includes('focalX') && !('focal' in p)) {
          grad.focal.x = 0;
        }

        if ('focalY' in changed) {
          grad.focal.y = typeof p.focalY === 'number' ? p.focalY : 0;
        } else if (removed.includes('focalY') && !('focal' in p)) {
          grad.focal.y = 0;
        }

        if (removed.includes('center') && !('x' in p) && !('y' in p)) {
          grad.center.set(0, 0);
        }
        if (removed.includes('focal') && !('focalX' in p) && !('focalY' in p)) {
          grad.focal.set(0, 0);
        }
      },
    });

    return null;
  }
);
