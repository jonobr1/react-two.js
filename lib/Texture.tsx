import React from 'react';
import Two from 'two.js';
import type { Texture as Instance } from 'two.js/src/effects/texture';
import { ElementProps } from './Properties';
import { useTwoObject } from './useTwoObject';

export type TextureProps =
  | ElementProps
  | 'src'
  | 'loaded'
  | 'repeat'
  | 'scale'
  | 'offset'
  | 'image';

export type TextureSource =
  | string
  | HTMLImageElement
  | HTMLCanvasElement
  | HTMLVideoElement;

type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<TextureProps, keyof Instance>]?: Instance[K];
  } & {
    src?: TextureSource;
  }
>;

export type RefTexture = Instance;

export const Texture = React.forwardRef<Instance, ComponentProps>(
  (props, forwardedRef) => {
    useTwoObject(props as Record<string, unknown>, forwardedRef, {
      factory: (p) => new Two.Texture(p.src as TextureSource),
      constructionProps: ['src'],
      isSceneObject: false,
    });

    return null;
  }
);
