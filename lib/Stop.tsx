import React, { useContext, useImperativeHandle, useLayoutEffect, useMemo, useRef } from 'react';
import Two from 'two.js';
import type { Stop as Instance } from 'two.js/src/effects/stop';
import { GradientContext } from './GradientContext';

export interface StopProps {
  offset?: number;
  color?: string;
  opacity?: number;
}
export type RefStop = Instance;

/** A gradient stop, ordered by its position in the React tree. */
export const Stop = React.forwardRef<Instance, StopProps>((props, ref) => {
  const scope = useContext(GradientContext);
  if (!scope) throw new Error('Stop must be rendered inside LinearGradient or RadialGradient.');
  const stop = useMemo(() => new Two.Stop(0, '#fff', 1), []);
  const marker = useRef<HTMLTemplateElement>(null);
  useImperativeHandle(ref, () => stop, [stop]);
  useLayoutEffect(() => {
    stop.offset = props.offset ?? 0;
    stop.color = props.color ?? '#fff';
    stop.opacity = props.opacity ?? 1;
  }, [stop, props.offset, props.color, props.opacity]);
  useLayoutEffect(() => {
    const element = marker.current!;
    scope.entries.set(element, stop);
    scope.sync();
    return () => {
      scope.entries.delete(element);
      scope.sync();
    };
  }, [scope, stop]);
  useLayoutEffect(() => { scope.sync(); });
  // Canvas already renders React children in a hidden container. This inert
  // marker also preserves order through fragments, memo and custom components.
  return <template ref={marker} />;
});
Stop.displayName = 'Stop';
