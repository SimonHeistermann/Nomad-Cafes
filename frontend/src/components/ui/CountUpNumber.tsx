import React, { useEffect, useRef, useState } from 'react';

interface CountUpNumberProps {
  end: number;
  duration?: number;
  format?: (num: number) => string;
  className?: string;
  suffix?: React.ReactNode;
}

/**
 * A component that animates a number counting up when it comes into view.
 * Uses native Intersection Observer for visibility detection.
 */
const CountUpNumber: React.FC<CountUpNumberProps> = ({
  end,
  duration = 2000,
  format,
  className,
  suffix,
}) => {
  const [count, setCount] = useState(0);
  const elementRef = useRef<HTMLSpanElement>(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimatedRef.current && end > 0) {
          hasAnimatedRef.current = true;

          // Start animation
          const startTime = performance.now();

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (easeOutQuart)
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(end * easeOutQuart);

            setCount(current);

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setCount(end);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [end, duration]);

  // Reset animation if end value changes significantly
  useEffect(() => {
    if (end > 0 && hasAnimatedRef.current) {
      setCount(end);
    }
  }, [end]);

  const displayValue = format ? format(count) : count;

  return (
    <span ref={elementRef} className={className}>
      {displayValue}{suffix}
    </span>
  );
};

export default CountUpNumber;
