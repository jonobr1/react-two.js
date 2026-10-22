import React, { useLayoutEffect, useMemo } from 'react';
import { GradientContext, type GradientScope } from './GradientContext';
import { ownGradient, type GradientResource } from './gradientResources';

export type GradientChildNodes<T> = React.ReactNode | ((gradient: T) => React.ReactNode);

export function GradientChildren<T extends GradientResource>({ gradient, children, stops }: {
  gradient: T;
  children?: GradientChildNodes<T>;
  stops?: T['stops'];
}) {
  const baseStops = React.useRef(stops);
  const boundary = React.useRef<HTMLTemplateElement>(null);
  const scope = useMemo<GradientScope>(() => {
    const entries = new Map<HTMLElement, T['stops'][number]>();
    const value: GradientScope = {
      gradient, entries, active: true,
      sync: () => {
        if (!value.active) return;
        const ordered = [...entries].sort(([a], [b]) =>
          a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
        ).map(([, stop]) => stop);
        // Keep borrowed stops first, followed by JSX stops in document order.
        const next = [...(baseStops.current ?? []), ...ordered];
        if (!gradient.stops || next.length !== gradient.stops.length || next.some((stop, i) => stop !== gradient.stops[i])) {
          gradient.stops = next;
          // Two.js 0.8.24 only reattaches SVG stops when the child count
          // changes. Invalidate its children for equal-length reorder/replacement.
          const renderer = (gradient as unknown as { _renderer: { elem?: Element } })._renderer;
          renderer.elem?.replaceChildren();
        }
      },
    };
    return value;
  }, [gradient]);
  useLayoutEffect(() => {
    scope.active = true;
    const release = ownGradient(gradient);
    // A memoized Stop can move when a nested component updates without this
    // scope rendering. Observe the hidden React DOM as a fallback in that case.
    const observer = new MutationObserver(() => scope.sync());
    observer.observe(boundary.current!.parentNode!, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      scope.active = false;
      release();
    };
  }, [scope, gradient]);
  useLayoutEffect(() => {
    baseStops.current = stops;
    scope.sync();
  });
  return <GradientContext.Provider value={scope}>
    <template ref={boundary} />
    {typeof children === 'function' ? children(gradient) : children}
  </GradientContext.Provider>;
}
