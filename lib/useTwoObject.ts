import React, {
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';
import Two from 'two.js';
import type { Shape } from 'two.js/src/shape';
import type { Group } from 'two.js/src/group';
import {
  ChildSlotContext,
  useTwo,
  type TwoCoreContextValue,
  type TwoParentContextValue,
  type TwoSizeContextValue,
} from './Context';
import { EVENT_HANDLER_NAMES, type EventHandlers } from './Events';
import {
  captureDefaultProps,
  diffProps,
  reconcileSceneOrder,
  TWO_DEFAULT_PROPS,
} from './reconciliation';

export type TwoSceneItem = Shape | Group;

const IGNORED_PROP_KEYS = new Set([
  'children',
  'key',
  'ref',
  ...EVENT_HANDLER_NAMES,
]);

export interface TwoObjectConfig<
  T,
  P extends Record<string, unknown>
> {
  /**
   * Factory function to instantiate the Two.js object.
   */
  factory: (props: P) => T;

  /**
   * Prop keys that require destroying and recreating the object if changed
   * (e.g. ['resolution'], ['sides'], ['spokes'], ['src']).
   */
  constructionProps?: Array<keyof P>;

  /**
   * Prop keys that should not be assigned directly to instance[key]
   * (e.g. ['x', 'y', 'x1', 'y1', 'manual', 'autoPlay']).
   */
  specialProps?: Array<keyof P>;

  /**
   * Custom handler to apply changed/removed special props to the instance.
   */
  applySpecialProps?: (
    instance: T,
    props: P,
    changed: Partial<P>,
    removed: Array<keyof P>
  ) => void;

  /**
   * Custom disposal logic for owned resources (e.g. internal textures).
   */
  disposeOwned?: (instance: T) => void;

  /**
   * Whether this object is added to parent.children. Defaults to true.
   * False for non-scene objects like LinearGradient, RadialGradient, Texture.
   */
  isSceneObject?: boolean;
}

/**
 * Standard handler for applying position (x, y) to translation.
 */
export function applyDefaultPositionProps<T>(
  instance: T,
  props: { x?: number; y?: number },
  changed: { x?: number; y?: number },
  removed: Array<string | number | symbol>
): void {
  const inst = instance as unknown as Record<string, unknown>;
  if ('translation' in inst && inst.translation) {
    const translation = inst.translation as { x: number; y: number };

    if ('x' in changed) {
      translation.x = typeof props.x === 'number' ? props.x : 0;
    } else if (removed.includes('x')) {
      translation.x = 0;
    }

    if ('y' in changed) {
      translation.y = typeof props.y === 'number' ? props.y : 0;
    } else if (removed.includes('y')) {
      translation.y = 0;
    }
  }
}

/**
 * Shared lifecycle hook for Two.js scene objects and effects.
 */
export function useTwoObject<
  T,
  P extends Record<string, unknown>
>(
  props: P,
  forwardedRef: React.ForwardedRef<T>,
  config: TwoObjectConfig<T, P>
): {
  instance: T;
  eventHandlers: Partial<EventHandlers>;
  shapeProps: Record<string, unknown>;
} {
  const {
    parent,
    attachChild,
    detachChild,
    registerChildOrder,
    registerEventShape,
    unregisterEventShape,
  } = useTwo();

  // Listen to ChildSlotContext to guarantee re-render when sibling order changes,
  // even if this component was wrapped in React.memo
  useContext(ChildSlotContext);

  const isSceneObject = config.isSceneObject !== false;
  const constructionProps = config.constructionProps ?? [];
  const specialPropsSet = useMemo(
    () => new Set<string>(['x', 'y', ...(config.specialProps as string[] ?? [])]),
    [config.specialProps]
  );

  // Extract event handlers vs shape props
  const { eventHandlers, shapeProps } = useMemo(() => {
    const handlers: Partial<EventHandlers> = {};
    const shape: Record<string, unknown> = {};

    for (const key in props) {
      if (EVENT_HANDLER_NAMES.includes(key as keyof EventHandlers)) {
        const handler = props[key as keyof EventHandlers];
        if (handler !== undefined) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          handlers[key as keyof EventHandlers] = handler as any;
        }
      } else {
        shape[key] = props[key];
      }
    }

    return { eventHandlers: handlers, shapeProps: shape };
  }, [props]);

  // Track construction props to detect when recreation is necessary
  const lastConstructionPropsRef = useRef<Record<string, unknown>>({});
  const instanceRef = useRef<T | null>(null);
  const defaultPropsRef = useRef<Record<string, unknown>>({});
  const prevPropsRef = useRef<Record<string, unknown>>({});
  const isInitialMountRef = useRef<boolean>(true);
  const pendingReplacementRef = useRef<{
    oldInstance: T;
    newInstance: T;
  } | null>(null);

  // Check if any construction-only prop changed
  let needsRecreation = instanceRef.current === null;
  if (!needsRecreation) {
    for (const cp of constructionProps) {
      if (props[cp] !== lastConstructionPropsRef.current[cp as string]) {
        needsRecreation = true;
        break;
      }
    }
  }

  // Create or recreate instance synchronously so it's ready during render / ref forwarding.
  // Note: All scene-graph mutations and resource disposals are deferred to commit-phase layout effects.
  if (needsRecreation) {
    const oldInstance = instanceRef.current;
    const newInstance = config.factory(props);

    if (oldInstance) {
      pendingReplacementRef.current = { oldInstance, newInstance };
    }

    instanceRef.current = newInstance;
    defaultPropsRef.current = captureDefaultProps(
      newInstance as unknown as Record<string, unknown>
    );

    // Save construction props snapshot
    const cSnapshot: Record<string, unknown> = {};
    for (const cp of constructionProps) {
      cSnapshot[cp as string] = props[cp];
    }
    lastConstructionPropsRef.current = cSnapshot;

    // Reset prevProps so all properties are applied to the new instance
    prevPropsRef.current = {};
  }

  const instance = instanceRef.current!;

  // Forward ref
  useImperativeHandle(forwardedRef, () => instance, [instance]);

  // Apply discrete property updates and resets
  useLayoutEffect(() => {
    const prev = prevPropsRef.current;
    const current = shapeProps;

    const { changed, removed, hasChanges } = diffProps(
      prev,
      current,
      IGNORED_PROP_KEYS
    );

    if (hasChanges || isInitialMountRef.current) {
      const instRecord = instance as unknown as Record<string, unknown>;

      // 1. Apply changed properties
      for (const key in changed) {
        if (!specialPropsSet.has(key)) {
          if (key in instRecord) {
            instRecord[key] = changed[key];
          }
        }
      }

      // 2. Reset removed properties to Two.js defaults
      for (const key of removed) {
        if (!specialPropsSet.has(key as string)) {
          if (key in instRecord) {
            const defaultVal =
              defaultPropsRef.current[key as string] ??
              TWO_DEFAULT_PROPS[key as string];
            if (defaultVal !== undefined) {
              instRecord[key as string] = defaultVal;
            }
          }
        }
      }

      // 3. Handle default position props (x, y)
      applyDefaultPositionProps(
        instance,
        props as { x?: number; y?: number },
        changed as { x?: number; y?: number },
        removed as string[]
      );

      // 4. Custom special props callback
      if (config.applySpecialProps) {
        config.applySpecialProps(
          instance,
          props,
          changed as Partial<P>,
          removed as Array<keyof P>
        );
      }

      prevPropsRef.current = { ...current };
      isInitialMountRef.current = false;
    }
  });

  const configRef = useRef(config);
  configRef.current = config;

  // Scene-graph attachment, in-place replacement, and reparenting lifecycle
  useLayoutEffect(() => {
    const pending = pendingReplacementRef.current;

    if (pending && pending.newInstance === instance) {
      pendingReplacementRef.current = null;
      const { oldInstance } = pending;

      if (isSceneObject && parent) {
        const children = parent.children as unknown as Array<T>;
        const idx = children.indexOf(oldInstance);
        if (idx !== -1) {
          // Replace in-place at the exact same child index
          children.splice(idx, 1, instance);
          (instance as unknown as { parent?: Group }).parent = parent;
          if (typeof (parent as unknown as { _flagOrder?: boolean })._flagOrder !== 'undefined') {
            (parent as unknown as { _flagOrder: boolean })._flagOrder = true;
          }
        } else {
          // Fallback if not found in children: attach to current parent
          const sceneItem = instance as unknown as Shape | Group;
          if (attachChild) {
            attachChild(sceneItem);
          } else {
            parent.add(sceneItem as unknown as Shape);
          }
        }
      }

      // Cleanup old instance owned resources and event handlers in commit phase
      unregisterEventShape(oldInstance as unknown as Shape | Group);
      configRef.current.disposeOwned?.(oldInstance);
    } else if (isSceneObject && parent) {
      const sceneItem = instance as unknown as Shape | Group;
      if (attachChild) {
        attachChild(sceneItem);
      } else {
        parent.add(sceneItem as unknown as Shape);
      }
    }

    return () => {
      // If this instance is about to be replaced by a pending newInstance on the same parent,
      // do not remove it here; the pending replacement will splice the new instance in-place.
      const nextPending = pendingReplacementRef.current;
      if (nextPending && nextPending.oldInstance === instance && isSceneObject) {
        return;
      }

      if (isSceneObject && parent) {
        const sceneItem = instance as unknown as Shape | Group;
        if (detachChild) {
          detachChild(sceneItem);
        } else {
          parent.remove(sceneItem as unknown as Shape);
        }
      }
    };
  }, [instance, parent, isSceneObject, attachChild, detachChild, unregisterEventShape]);

  // Sibling order registration (runs on every commit in document order)
  useLayoutEffect(() => {
    if (!isSceneObject || !parent) return;

    if (registerChildOrder) {
      registerChildOrder(instance as unknown as Shape | Group);
    }
  });

  // Event handler registration and cleanup
  useEffect(() => {
    const eventItem = instance as unknown as Shape | Group;
    if (Object.keys(eventHandlers).length > 0) {
      registerEventShape(eventItem, eventHandlers, parent ?? undefined);
    } else {
      unregisterEventShape(eventItem);
    }

    return () => {
      unregisterEventShape(eventItem);
    };
  }, [instance, parent, eventHandlers, registerEventShape, unregisterEventShape]);

  // Cleanup on unmount (strict mode safe)
  useEffect(() => {
    return () => {
      configRef.current.disposeOwned?.(instance);
    };
  }, [instance]);

  return { instance, eventHandlers, shapeProps };
}

export interface UseTwoGroupResult {
  instance: Group;
  coreValue: TwoCoreContextValue;
  parentValue: TwoParentContextValue;
  sizeValue: TwoSizeContextValue;
  renderChildren: () => React.ReactNode;
}

/**
 * Shared hook for Group components to coordinate child ordering and context propagation.
 */
export function useTwoGroup<P extends Record<string, unknown>>(
  props: React.PropsWithChildren<P>,
  forwardedRef: React.ForwardedRef<Group>,
  config?: Partial<TwoObjectConfig<Group, P>>
): UseTwoGroupResult {
  const { two, width, height, registerEventShape, unregisterEventShape, hitTestPoint } =
    useTwo();

  const childrenOrderRef = useRef<Array<Shape | Group>>([]);
  const attachedChildrenRef = useRef<Set<Shape | Group>>(new Set());

  // Attach a child to this group
  const attachChild = useCallback((child: Shape | Group) => {
    attachedChildrenRef.current.add(child);
    groupRef.current?.add(child);
  }, []);

  // Detach a child from this group
  const detachChild = useCallback((child: Shape | Group) => {
    attachedChildrenRef.current.delete(child);
    groupRef.current?.remove(child);
  }, []);

  // Register child order during commit
  const registerChildOrder = useCallback((child: Shape | Group) => {
    childrenOrderRef.current.push(child);
  }, []);

  const groupRef = useRef<Group | null>(null);

  const { instance } = useTwoObject(
    props as P,
    forwardedRef,
    {
      factory: () => new Two.Group(),
      ...config,
    }
  );

  groupRef.current = instance;

  // Reconcile children order after all child layout effects run
  useLayoutEffect(() => {
    if (childrenOrderRef.current.length > 0) {
      reconcileSceneOrder(instance, childrenOrderRef.current);
      childrenOrderRef.current = [];
    }
  });

  // Clean up all attached children on unmount
  useEffect(() => {
    const attached = attachedChildrenRef.current;
    return () => {
      attached.clear();
      childrenOrderRef.current = [];
    };
  }, []);

  const coreValue = useMemo(
    () => ({
      two,
      registerEventShape,
      unregisterEventShape,
      hitTestPoint,
    }),
    [two, registerEventShape, unregisterEventShape, hitTestPoint]
  );

  const parentValue = useMemo<TwoParentContextValue>(
    () => ({
      parent: instance,
      attachChild,
      detachChild,
      registerChildOrder,
    }),
    [instance, attachChild, detachChild, registerChildOrder]
  );

  const sizeValue = useMemo(
    () => ({
      width,
      height,
    }),
    [width, height]
  );

  const renderChildren = useCallback(() => {
    return React.Children.map(props.children, (child, index) => {
      if (!React.isValidElement(child)) return child;
      return React.createElement(
        ChildSlotContext.Provider,
        { value: index, key: child.key ?? index },
        child
      );
    });
  }, [props.children]);

  return {
    instance,
    coreValue,
    parentValue,
    sizeValue,
    renderChildren,
  };
}
