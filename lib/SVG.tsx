import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { Context, TwoParentContext, TwoSizeContext, useTwo } from './Context';
import Two from 'two.js';
import type { Group as Instance } from 'two.js/src/group';
import type { Shape } from 'two.js/src/shape';
import { type EventHandlers } from './Properties';
import type { GroupProps } from './Group';
import { useTwoGroup } from './useTwoObject';
import { reconcileSceneOrder } from './reconciliation';

export type SVGProps = GroupProps;

type ComponentProps = React.PropsWithChildren<
  { [K in Extract<GroupProps, keyof Instance>]?: Instance[K] } & (
    | { src: string; content?: never }
    | { src?: never; content: string }
  ) & {
    x?: number;
    y?: number;
    onLoad?: (group: Instance, svg: SVGElement | SVGElement[]) => void;
    onError?: (error: Error) => void;
    /** Remove the imported top-level SVG group, retaining nested groups. */
    shallow?: boolean;
  } & Partial<EventHandlers>
>;

export type RefSVG = Instance;

interface ImportedResource {
  unbind: () => unknown;
  _renderer?: unknown;
}

// Record resources before declarative styles can substitute borrowed effects.
function importedResources(root: unknown): Set<ImportedResource> {
  const owned = new Set<ImportedResource>();
  const visited = new Set<unknown>();
  const visit = (value: unknown) => {
    if (!value || typeof value !== 'object' || visited.has(value)) return;
    visited.add(value);
    const object = value as Record<string, unknown>;
    if (typeof object.unbind === 'function') {
      owned.add(value as ImportedResource);
    }
    for (const key of ['children', 'vertices', 'stops']) {
      const list = object[key];
      if (Array.isArray(list)) {
        visit(list);
        list.forEach(visit);
      }
    }
    for (const key of ['fill', 'stroke', 'mask', 'texture', 'translation', 'controls', 'left', 'right']) {
      visit(object[key]);
    }
  };
  visit(root);
  return owned;
}

function releaseImportedResources(two: Two, owned: Set<ImportedResource>): void {
  owned.forEach((resource) => {
    // Release the captured graph one resource at a time. Recursing through its
    // current children or paints could release borrowed effects or JSX objects.
    two.release({
      unbind: () => resource.unbind(),
      _renderer: resource._renderer,
    } as unknown as Shape);
  });
}

export const SVG = React.forwardRef<Instance, ComponentProps>((props, forwardedRef) => {
  const { two } = useTwo();
  const { src, content, shallow = false, onLoad, onError, ...restProps } = props;
  const callbacks = useRef({ onLoad, onError });
  const styleProps = useRef(restProps);
  const importedChildren = useRef<Array<Shape | Instance>>([]);
  callbacks.current = { onLoad, onError };
  styleProps.current = restProps;

  const { instance: svg, coreValue, parentValue, sizeValue, renderChildren } =
    useTwoGroup(restProps, forwardedRef);

  useLayoutEffect(() => {
    const imported = importedChildren.current;
    if (imported.length > 0) {
      const owned = new Set(imported);
      reconcileSceneOrder(svg, [...imported, ...Array.from(svg.children).filter((child) => !owned.has(child))]);
    }
  });

  useEffect(() => {
    if (!two) return;
    const controller = new AbortController();
    let active = true;
    let imported: Array<Shape | Instance> = [];
    let owned = new Set<ImportedResource>();

    const reportError = (error: unknown) => {
      if (!active) return;
      const normalized = error instanceof Error ? error : new Error('Failed to load SVG');
      if (callbacks.current.onError) {
        try { callbacks.current.onError(normalized); }
        catch (error) { console.error('[react-two.js] Error in SVG onError callback:', error); }
      } else console.error('[react-two.js] SVG loading error:', normalized);
    };

    const interpret = (markup: string) => {
      if (!active) return;
      const document = new DOMParser().parseFromString(markup, 'image/svg+xml');
      if (document.querySelector('parsererror') || document.documentElement.localName !== 'svg') {
        throw new Error('Invalid SVG markup: expected an SVG document');
      }
      two.load(markup, (loaded: Instance, elements: SVGElement | SVGElement[]) => {
        owned = importedResources(loaded);
        if (!active) {
          releaseImportedResources(two, owned);
          return;
        }
        imported = shallow
          ? Array.from(loaded.children).flatMap((child) =>
              child instanceof Two.Group ? Array.from(child.children) : [child])
          : Array.from(loaded.children);
        importedChildren.current = imported;
        const declaredChildren = Array.from(svg.children);
        svg.add(imported);
        reconcileSceneOrder(svg, [...imported, ...declaredChildren]);
        // Apply cascading styles after attaching the imported artwork.
        for (const key of ['fill', 'stroke', 'linewidth', 'cap', 'join', 'miter', 'closed', 'curved', 'automatic', 'beginning', 'ending', 'strokeAttenuation'] as const) {
          const value = (styleProps.current as Record<string, unknown>)[key];
          if (value !== undefined) (svg as unknown as Record<string, unknown>)[key] = value;
        }
        if (!two.playing) two.update();
        try { callbacks.current.onLoad?.(svg, elements); }
        catch (error) { console.error('[react-two.js] Error in SVG onLoad callback:', error); }
      });
    };

    if (src && content) {
      console.warn('[react-two.js] SVG has both src and content; using src.');
    }
    if (src) {
      void (async () => {
        try {
          const response = await fetch(src, { signal: controller.signal });
          if (!response.ok) throw new Error(`Failed to load SVG: HTTP ${response.status}`);
          interpret(await response.text());
        } catch (error) {
          reportError(error);
        }
      })();
    } else {
      try {
        if (!content) throw new Error('SVG requires either src or content');
        interpret(content);
      } catch (error) {
        reportError(error);
      }
    }

    return () => {
      active = false;
      controller.abort();
      svg.remove(imported);
      if (importedChildren.current === imported) importedChildren.current = [];
      releaseImportedResources(two, owned);
      if (!two.playing && two.renderer.domElement.isConnected) two.update();
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
});
