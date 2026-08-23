import { useEffect, useRef, useState } from 'react';

/**
 * Tracks an element's rendered height so overlays can reserve space for it.
 * The toolbar wraps at narrow widths, so a fixed offset would be wrong.
 */
export function useMeasuredHeight<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measure = () => setHeight(element.getBoundingClientRect().height);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, height] as const;
}
