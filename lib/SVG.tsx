import React, { useEffect, useRef } from 'react';
import { Context, TwoParentContext, TwoSizeContext, useTwo } from './Context';
import type { Group as Instance } from 'two.js/src/group';
import { ShapeProps, type EventHandlers } from './Properties';
import { useTwoGroup } from './useTwoObject';

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
  | 'automatic';

type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<GroupProps, keyof Instance>]?: Instance[K];
  } & (
    | {
        src: string;
        content?: never;
      }
    | {
        src?: never;
        content: string;
      }
  ) & {
      x?: number;
      y?: number;
      onLoad?: (group: Instance, svg: SVGElement | SVGElement[]) => void;
      onError?: (error: Error) => void;
      shallow?: boolean;
    } & Partial<EventHandlers>
>;

export type RefSVG = Instance;

export const SVG = React.forwardRef<Instance, ComponentProps>(
  (props, forwardedRef) => {
    const { two } = useTwo();
    const { src, content, onLoad, onError, shallow, ...restProps } = props;

    const onLoadRef = useRef(onLoad);
    const onErrorRef = useRef(onError);
    const rafRef = useRef<number | null>(null);
    const lastLoadedSource = useRef<{
      two: unknown;
      key: string | null;
    }>({ two: null, key: null });

    useEffect(() => {
      onLoadRef.current = onLoad;
    }, [onLoad]);

    useEffect(() => {
      onErrorRef.current = onError;
    }, [onError]);

    const {
      instance: svg,
      coreValue,
      parentValue,
      sizeValue,
      renderChildren,
    } = useTwoGroup(restProps, forwardedRef);

    // Validate props
    useEffect(() => {
      if (!src && !content) {
        console.warn(
          '[react-two.js] SVG component requires either "src" or "content" prop'
        );
      }
      if (src && content) {
        console.warn(
          '[react-two.js] SVG component has both "src" and "content" props. Using "src" and ignoring "content"'
        );
      }
    }, [src, content]);

    // Load <svg /> using two.load()
    useEffect(() => {
      if (!two) return;

      const source = src || content;
      if (!source) return;

      const currentKey = source;
      const last = lastLoadedSource.current;

      if (last.two === two && last.key === currentKey) {
        return;
      }

      let mounted = true;
      lastLoadedSource.current = { two, key: currentKey };

      try {
        two.load(
          source,
          (loadedGroup: Instance, svgElement: SVGElement | SVGElement[]) => {
            if (!mounted) return;

            if (shallow) {
              svg.add(loadedGroup.children);
            } else {
              svg.add(loadedGroup.children);
            }

            const handleLoad = onLoadRef.current;
            if (handleLoad) {
              try {
                if (rafRef.current !== null) {
                  cancelAnimationFrame(rafRef.current);
                }
                rafRef.current = requestAnimationFrame(() => {
                  rafRef.current = null;
                  if (mounted) {
                    handleLoad(svg, svgElement);
                  }
                });
              } catch (err) {
                console.error('[react-two.js] Error in SVG onLoad callback:', err);
              }
            }
          }
        );
      } catch (err) {
        if (!mounted) return;

        const error =
          err instanceof Error ? err : new Error('Failed to load SVG');

        const handleError = onErrorRef.current;
        if (handleError) {
          try {
            handleError(error);
          } catch (callbackErr) {
            console.error(
              '[react-two.js] Error in SVG onError callback:',
              callbackErr
            );
          }
        } else {
          console.error('[react-two.js] SVG loading error:', error);
        }
      }

      return () => {
        mounted = false;
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        lastLoadedSource.current = { two: null, key: null };
        svg.remove(svg.children);
      };
    }, [two, src, content, shallow, svg]);

    return (
      <Context.Provider value={coreValue}>
        <TwoParentContext.Provider value={parentValue}>
          <TwoSizeContext.Provider value={sizeValue}>
            {renderChildren()}
          </TwoSizeContext.Provider>
        </TwoParentContext.Provider>
      </Context.Provider>
    );
  }
);
