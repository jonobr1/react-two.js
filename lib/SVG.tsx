import React, { useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import Two from 'two.js';
import { Context, useTwo } from './Context';

import type { Group as Instance } from 'two.js/src/group';
import { ShapeProps, type EventHandlers } from './Properties';
import { EVENT_HANDLER_NAMES } from './Events';

// SVG-specific props
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
        src: string; // URL to .svg file
        content: never; // Inline SVG markup string
      }
    | {
        // Source (one required)
        src: never; // URL to .svg file
        content: string; // Inline SVG markup string
      }
  ) & {
      x?: number;
      y?: number;
      onLoad?: (group: Instance, svg: SVGElement | SVGElement[]) => void;
      onError?: (error: Error) => void;
      shallow?: boolean; // Flatten groups when interpreting
    } & Partial<EventHandlers>
>;

export type RefSVG = Instance;

export const SVG = React.forwardRef<Instance, ComponentProps>(
  ({ x, y, src, content, onLoad, onError, ...props }, forwardedRef) => {
    const {
      two,
      parent,
      width,
      height,
      registerEventShape,
      unregisterEventShape,
    } = useTwo();
    const svg = useMemo(() => new Two.Group(), []);
    const ref = useRef<Instance | null>(null);

    // Extract event handlers from props
    const { eventHandlers, shapeProps } = useMemo(() => {
      const eventHandlers: Partial<EventHandlers> = {};
      const shapeProps: Record<string, unknown> = {};

      for (const key in props) {
        if (EVENT_HANDLER_NAMES.includes(key as keyof EventHandlers)) {
          eventHandlers[key as keyof EventHandlers] = props[
            key as keyof EventHandlers
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ] as any;
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          shapeProps[key] = (props as any)[key];
        }
      }

      return { eventHandlers, shapeProps };
    }, [props]);

    // Hoist instance for async access
    useEffect(() => {
      ref.current = svg;
    }, [svg]);

    // Add group to parent
    useEffect(() => {
      if (parent && svg) {
        parent.add(svg);

        return () => {
          parent.remove(svg);
        };
      }
    }, [svg, parent]);

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

      let mounted = true;

      try {
        // two.load() returns a Group immediately (empty initially)
        // and populates it asynchronously via callback
        two.load(
          source,
          (loadedGroup: Instance, svg: SVGElement | SVGElement[]) => {
            if (!mounted) return;

            ref.current?.add(loadedGroup.children);

            // Invoke user callback if provided
            if (onLoad) {
              try {
                onLoad(loadedGroup, svg);
              } catch (err) {
                console.error(
                  '[react-two.js] Error in SVG onLoad callback:',
                  err
                );
              }
            }
          }
        );
      } catch (err) {
        if (!mounted) return;

        const error =
          err instanceof Error ? err : new Error('Failed to load SVG');

        if (onError) {
          try {
            onError(error);
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
        // Note: Two.js XHR requests cannot be cancelled
        // We track mounted state to prevent setState on unmounted component
      };
    }, [two, src, content, onLoad, onError]);

    // Update position and properties
    useEffect(() => {
      // Update position
      if (typeof x === 'number') svg.translation.x = x;
      if (typeof y === 'number') svg.translation.y = y;

      const args = { ...shapeProps };
      delete args.children; // Allow react to handle children

      // Update other properties (excluding event handlers)
      for (const key in args) {
        if (key in svg) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (svg as any)[key] = (args as any)[key];
        }
      }
    }, [svg, x, y, shapeProps]);

    // Register event handlers
    useEffect(() => {
      if (Object.keys(eventHandlers).length > 0) {
        registerEventShape(svg, eventHandlers, parent ?? undefined);

        return () => {
          unregisterEventShape(svg);
        };
      }
    }, [svg, registerEventShape, unregisterEventShape, parent, eventHandlers]);

    useImperativeHandle(forwardedRef, () => svg, [svg]);

    return (
      <Context.Provider
        value={{
          two,
          parent: svg,
          width,
          height,
          registerEventShape,
          unregisterEventShape,
        }}
      >
        {props.children}
      </Context.Provider>
    );
  }
);
