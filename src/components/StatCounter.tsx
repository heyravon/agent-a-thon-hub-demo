import { useEffect, useRef } from 'react';
import { animate, useInView } from 'framer-motion';

interface StatCounterProps {
  to: number;
  duration?: number;
  format?: (n: number) => string;
}

export function StatCounter({ to, duration = 1.5, format }: StatCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!inView || !ref.current) return;
    const node = ref.current;
    const controls = animate(0, to, {
      duration,
      ease: 'easeOut',
      onUpdate(value) {
        const n = Math.round(value);
        node.textContent = format ? format(n) : n.toString();
      },
    });
    return () => controls.stop();
  }, [inView, to, duration, format]);

  return <span ref={ref}>{format ? format(0) : '0'}</span>;
}
