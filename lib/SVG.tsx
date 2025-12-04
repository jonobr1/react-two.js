import React, {
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
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

export interface SVGProps
  extends React.PropsWithChildren<{
      [K in Extract<GroupProps, keyof Instance>]?: Instance[K];
    }>,
    Partial<EventHandlers> {
  // Source (one required)
  src?: string; // URL to .svg file
  content?: string; // Inline SVG markup string

  // Positioning & Transform
  x?: number;
  y?: number;

  // Callbacks
  onLoad?: (group: RefSVG, svg: SVGElement | SVGElement[]) => void;
  onError?: (error: Error) => void;

  // Loading behavior
  shallow?: boolean; // Flatten groups when interpreting
}

export type RefSVG = Instance;

export const SVG = React.forwardRef<RefSVG, SVGProps>(
  ({ x, y, src, content, onLoad, onError, ...props }, forwardedRef) => {
    const {
      two,
      parent,
      width,
      height,
      registerEventShape,
      unregisterEventShape,
    } = useTwo();
    const [ref, set] = useState<Instance | null>(null);

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

    // Load SVG using two.load()
    useEffect(() => {
      if (!two) return;

      const source = src || content;
      if (!source) return;

      let mounted = true;

      try {
        // two.load() returns a Group immediately (empty initially)
        // and populates it asynchronously via callback
        const group = two.load(
          source,
          (loadedGroup: Instance, svg: SVGElement | SVGElement[]) => {
            if (!mounted) return;

            set(loadedGroup);

            // Invoke user callback if provided
            if (onLoad) {
              try {
                onLoad(loadedGroup, svg);
              } catch (err) {
                console.error('[react-two.js] Error in SVG onLoad callback:', err);
              }
            }
          }
        );

        // Store the group immediately (even though it's empty)
        set(group);
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

    // Add group to parent
    useEffect(() => {
      if (parent && ref) {
        parent.add(ref);

        return () => {
          parent.remove(ref);
        };
      }
    }, [ref, parent]);

    // Update position and properties
    useEffect(() => {
      if (ref) {
        const group = ref;
        // Update position
        if (typeof x === 'number') group.translation.x = x;
        if (typeof y === 'number') group.translation.y = y;

        const args = { ...shapeProps };
        delete args.children; // Allow react to handle children

        // Update other properties (excluding event handlers)
        for (const key in args) {
          if (key in group) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (group as any)[key] = (args as any)[key];
          }
        }
      }
    }, [ref, x, y, shapeProps]);

    // Register event handlers
    useEffect(() => {
      if (ref && Object.keys(eventHandlers).length > 0) {
        registerEventShape(ref, eventHandlers, parent ?? undefined);

        return () => {
          unregisterEventShape(ref);
        };
      }
    }, [ref, registerEventShape, unregisterEventShape, parent, eventHandlers]);

    useImperativeHandle(forwardedRef, () => ref as Instance, [ref]);

    return (
      <Context.Provider
        value={{
          two,
          parent: ref,
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
