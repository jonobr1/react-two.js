import {
  Children,
  cloneElement,
  isValidElement,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import cn from 'clsx';

import styles from './Marquee.module.css';

const velocity = 50; // px / sec

export function Marquee({
  className,
  children,
  shouldAnimate = true,
}: {
  className?: string;
  children?: ReactNode;
  shouldAnimate?: boolean;
}) {
  const domElement = useRef<HTMLDivElement | null>(null);
  const [duration, setDuration] = useState<number>(0);

  useEffect(() => {
    mount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children]);

  async function mount() {
    const elements = Children.toArray(children);
    if (!domElement.current || !(elements.length > 0)) {
      return;
    }
    const content = domElement.current;
    const first = content.children[0];
    const parent = content.parentElement;

    if (!parent) {
      return;
    }
    const a = parent.getBoundingClientRect().width;
    const b = first.getBoundingClientRect().width;

    setDuration(a < b ? b / velocity : 0);
  }

  return (
    <span className={cn(styles.marquee, className)}>
      <span
        className={cn(styles.content, {
          [styles.animating]: !!duration && shouldAnimate,
        })}
        style={{
          animationDuration: `${duration}s`,
        }}
        ref={domElement}
      >
        {children}
        {!!duration &&
          Children.map(
            children,
            (child) => isValidElement(child) && cloneElement(child)
          )}
      </span>
    </span>
  );
}
