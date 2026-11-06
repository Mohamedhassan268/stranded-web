"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { EruptionScene, type Bubble } from "./scene";

const FRAME_MS = 1000 / 30;

/** The opening scene, with the page's text card over its sky. */
export function EruptionHero({ children }: { children: ReactNode }) {
  const hero = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const quantum = useRef<HTMLSpanElement>(null);
  const control = useRef<HTMLSpanElement>(null);
  const scene = useRef<EruptionScene | null>(null);
  const [still, setStill] = useState(false);

  useEffect(() => {
    const host = hero.current;
    const painted = canvas.current;
    if (!host || !painted) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setStill(reduced);
    const world = new EruptionScene(painted);
    scene.current = world;
    let pixel = 3;

    const measure = () => {
      const box = painted.getBoundingClientRect();
      if (!box.width || !box.height) return;
      pixel = box.width < 760 ? 2 : 3;
      const cardBox = card.current?.getBoundingClientRect();
      // Beside the card on wide screens. Stacked on phones, where the whole canvas is free.
      const overlaps = cardBox && cardBox.top < box.bottom - 40 && box.width >= 760;
      const left = overlaps ? Math.ceil((cardBox.right - box.left) / pixel) : 0;
      world.layout(Math.ceil(box.width / pixel), Math.ceil(box.height / pixel), left);
    };

    const showBubble = (element: HTMLSpanElement | null, bubble?: Bubble) => {
      if (!element) return;
      element.hidden = !bubble;
      if (!bubble) return;
      if (element.textContent !== bubble.text) element.textContent = bubble.text;
      element.style.transform = `translate(calc(${Math.round(bubble.x * pixel)}px - 50%), calc(${Math.round(bubble.y * pixel)}px - 100%))`;
    };

    const paint = () => {
      world.draw();
      const bubbles = world.bubbles();
      showBubble(quantum.current, bubbles.find((bubble) => bubble.id === "quantum"));
      showBubble(control.current, bubbles.find((bubble) => bubble.id === "control"));
      host.dataset.phase = world.phase;
      host.dataset.eruptions = String(world.eruptions);
    };

    measure();
    if (reduced) world.settle();
    paint();

    const resized = new ResizeObserver(() => {
      measure();
      paint();
    });
    resized.observe(painted);
    if (reduced) return () => resized.disconnect();

    // It only runs while someone can see it.
    let onScreen = true;
    const seen = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
    });
    seen.observe(host);

    let frame = 0;
    let last = performance.now();
    let drawn = 0;
    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      const gap = now - last;
      last = now;
      if (!onScreen || document.hidden) return;
      world.advance(gap / 1000);
      if (now - drawn < FRAME_MS - 2) return;
      drawn = now;
      paint();
    };
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      seen.disconnect();
      resized.disconnect();
    };
  }, []);

  return (
    <section ref={hero} className="erupt-hero" data-phase="calm" data-eruptions="0">
      <div className="erupt-stage">
        <canvas
          ref={canvas}
          className="erupt-canvas"
          role="img"
          aria-label="Pixel art of an island. A volcano erupts while villagers in straw hats run to a boat."
          onClick={() => scene.current?.erupt()}
        />
        <span ref={quantum} className="erupt-bubble" aria-hidden="true" hidden />
        <span ref={control} className="erupt-bubble erupt-bubble--control" aria-hidden="true" hidden />
        {!still && (
          <button className="q-btn q-btn--gold erupt-again" onClick={() => scene.current?.erupt()}>
            Erupt again
          </button>
        )}
      </div>
      <div className="erupt-inner">
        <div ref={card} className="q-card erupt-card">
          {children}
        </div>
      </div>
    </section>
  );
}
