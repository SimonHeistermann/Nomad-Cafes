import { useEffect, useRef, useState, useCallback } from 'react';

interface UseCountUpOptions {
  end: number;
  duration?: number;
  start?: number;
}

interface UseCountUpResult {
  count: number;
  ref: React.RefObject<HTMLElement>;
}

export function useCountUp({ end, duration = 2000, start = 0 }: UseCountUpOptions): UseCountUpResult {
  const [count, setCount] = useState(start);
  const ref = useRef<HTMLElement>(null);
  const hasAnimatedRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const animate = useCallback(() => {
    if (end === 0) {
      setCount(0);
      return;
    }

    const startTime = performance.now();
    const range = end - start;

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation (easeOutQuart)
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = start + range * easeOutQuart;

      setCount(Math.floor(current));

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(step);
  }, [end, start, duration]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Reset if end value changes
    if (end > 0 && hasAnimatedRef.current) {
      // Re-animate when value changes
      hasAnimatedRef.current = false;
    }

    // Create intersection observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimatedRef.current && end > 0) {
          hasAnimatedRef.current = true;
          animate();
        }
      },
      { threshold: 0.3 }
    );

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [end, animate]);

  return { count, ref };
}
