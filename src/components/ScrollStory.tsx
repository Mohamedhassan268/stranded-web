"use client";
import { useEffect, useRef } from "react";
export function ScrollStory({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let cancelled = false;
    let dispose: (() => void) | undefined;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    async function setup() {
      if (media.matches || window.innerWidth < 760) return;
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled || !ref.current) return;
      gsap.registerPlugin(ScrollTrigger);
      const context = gsap.context(() => {
        gsap.fromTo(
          ".terrain-human",
          { y: -150, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: ref.current,
              start: "top 78%",
              end: "top 18%",
              scrub: 1,
            },
          },
        );
        gsap.fromTo(
          ".story-stage",
          { rotateX: 8, scale: 0.94 },
          {
            rotateX: 0,
            scale: 1,
            scrollTrigger: {
              trigger: ref.current,
              start: "top 80%",
              end: "top 15%",
              scrub: 1,
            },
          },
        );
      }, ref);
      dispose = () => context.revert();
    }
    const changed = () => {
      dispose?.();
      dispose = undefined;
      void setup();
    };
    void setup();
    media.addEventListener("change", changed);
    return () => {
      cancelled = true;
      dispose?.();
      media.removeEventListener("change", changed);
    };
  }, []);
  return (
    <div ref={ref} className="scroll-story">
      {children}
    </div>
  );
}
