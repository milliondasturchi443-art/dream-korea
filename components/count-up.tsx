"use client";
import { useEffect, useRef, useState } from "react";

// Animated counter — starts when it scrolls into view, one rAF run, then stops.
export function CountUp({ value, duration = 900 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const hasIO = typeof IntersectionObserver !== "undefined";
  const animate = Number.isFinite(value) && value > 0 && hasIO;
  const [display, setDisplay] = useState(() => (animate ? 0 : value));

  useEffect(() => {
    const el = ref.current;
    if (!el || !animate) return;
    let raf = 0;
    let started = false;
    const io = new IntersectionObserver(entries => {
      if (started || !entries.some(e => e.isIntersecting)) return;
      started = true;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / duration);
        setDisplay(Math.round(value * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.35 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [value, duration, animate]);

  return <span ref={ref}>{display}</span>;
}
