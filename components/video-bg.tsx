"use client";
import { useEffect, useRef, useState } from "react";

// Animated video background — DESKTOP ONLY, muted/looped, never on phones
// (continuous 720p decode under scroll = guaranteed mobile jank + battery drain).
// Also disabled for users with prefers-reduced-motion.
export function VideoBg() {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const mqDesktop = window.matchMedia("(min-width: 768px)");
    const mqReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setShow(mqDesktop.matches && !mqReduced.matches);
    queueMicrotask(update);
    mqDesktop.addEventListener("change", update);
    mqReduced.addEventListener("change", update);
    // pause decoding when tab is hidden — saves CPU/battery
    const onVis = () => {
      const v = ref.current;
      if (!v) return;
      if (document.hidden) v.pause(); else v.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      mqDesktop.removeEventListener("change", update);
      mqReduced.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  if (!show) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <video
        ref={ref}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/background.webp"
        disablePictureInPicture
        className="h-full w-full object-cover"
      >
        <source src="/bg-loop.webm" type="video/webm" />
        <source src="/bg-loop.mp4" type="video/mp4" />
      </video>
      {/* readability veil — content stays crisp above the motion */}
      <div className="absolute inset-0 bg-white/45" />
    </div>
  );
}
