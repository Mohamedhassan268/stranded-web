"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import QuantumPanel from "./QuantumPanel";
const shots = [
  {
    name: "FREEFALL",
    title: (
      <>
        NO WAY
        <br />
        BACK.
      </>
    ),
    line: "Somewhere above the unknown.",
  },
  {
    name: "IMPACT",
    title: (
      <>
        SIGNAL
        <br />
        LOST.
      </>
    ),
    line: "A breath. A heartbeat. Ground.",
  },
  {
    name: "AWAKEN",
    title: (
      <>
        STILL
        <br />
        ALIVE.
      </>
    ),
    line: "Open your eyes.",
  },
  {
    name: "CONTACT",
    title: (
      <>
        NOT
        <br />
        ALONE.
      </>
    ),
    line: "Touch the signal. Understand the mind.",
  },
  {
    name: "CONNECT",
    title: (
      <>
        MAKE
        <br />
        CONTACT.
      </>
    ),
    line: "A hand reaches out. A connection forms.",
  },
  {
    name: "EVADE",
    title: (
      <>
        MOVE.
        <br />
        NOW.
      </>
    ),
    line: "The canopy breaks. Change your path.",
  },
  {
    name: "SHELTER",
    title: (
      <>
        WEATHER
        <br />
        THE STORM.
      </>
    ),
    line: "Find cover. Hold on. Survive.",
  },
];
export default function CinematicStudy() {
  const host = useRef<HTMLDivElement>(null),
    shell = useRef<HTMLElement>(null),
    mindButton = useRef<HTMLButtonElement>(null),
    [ready, setReady] = useState(false),
    [error, setError] = useState(false),
    [shot, setShot] = useState(0),
    [moving, setMoving] = useState(false),
    [reduced, setReduced] = useState(false),
    [inspect, setInspect] = useState(false);
  useEffect(() => {
    let stop: (() => void) | undefined,
      gone = false;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(media.matches);
    import("./scene")
      .then(({ mountScene }) => {
        if (gone || !host.current || !shell.current) return;
        stop = mountScene(host.current, shell.current, {
          ready: () => setReady(true),
          shot: (i, playing) => {
            setShot(i);
            setMoving(playing);
          },
          error: () => setError(true),
          reduced: media.matches,
        });
      })
      .catch(() => setError(true));
    return () => {
      gone = true;
      stop?.();
    };
  }, []);
  function toggleMind(open: boolean) {
    setInspect(open);
    shell.current?.dispatchEvent(
      new CustomEvent("quantum-inspect", { detail: open }),
    );
    if (!open)
      requestAnimationFrame(() => {
        if (shell.current) shell.current.dataset.mindVisible = "true";
        mindButton.current?.focus();
      });
  }
  useEffect(() => {
    if (!inspect) return;
    const before = document.activeElement as HTMLElement;
    const dialog = shell.current?.querySelector<HTMLElement>(".quantum-panel");
    dialog?.querySelector<HTMLElement>("button")?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        toggleMind(false);
      }
      if (e.key === "Tab" && dialog) {
        const nodes = Array.from(
          dialog.querySelectorAll<HTMLElement>("button,a[href]"),
        );
        const first = nodes[0],
          last = nodes.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", key);
      document.documentElement.style.overflow = prevOverflow;
      if (before?.isConnected) before.focus();
    };
  }, [inspect]);
  function goto(i: number) {
    if (!shell.current) return;
    const top = shell.current.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: top + (i + 0.12) * window.innerHeight,
      behavior: "instant",
    });
    shell.current.dispatchEvent(
      new CustomEvent("cinematic-shot", { detail: i }),
    );
  }
  return (
    <section
      ref={shell}
      className="cinematic-page"
      data-inspecting={inspect}
      aria-label="Stranded interactive island story"
    >
      <div className="cinematic-stage">
        <div
          ref={host}
          className="cinematic-canvas"
          role="img"
          aria-label="A survivor falls to an island, connects with a quantum mind, evades a falling tree and takes cover from a storm"
        />
        <div className="cinema-grain" aria-hidden="true" />
        <div className="cinema-vignette" aria-hidden="true" />
        <div className="cinema-lid top" aria-hidden="true" />
        <div className="cinema-lid bottom" aria-hidden="true" />
        <header className="cinema-header" inert={inspect}>
          <Link href="/" className="cinema-brand">
            STRANDED<span>_</span>
          </Link>
          <span className="study-label">ONE HUMAN / A QUANTUM MIND</span>
          <Link className="cinema-exit" href="/demo/">
            REPLAY LAB <span>↗</span>
          </Link>
        </header>
        <div className="cinema-side">
          <span>ONE HUMAN</span>
          <i />
          <span>UNKNOWN TERRITORY</span>
        </div>
        <div className="cinema-copy" key={shot} aria-hidden={inspect}>
          <p className="cinema-eyebrow">
            {String(shot + 1).padStart(2, "0")} / {shots[shot].name}
          </p>
          <h1>{shots[shot].title}</h1>
          <p className="cinema-line">{shots[shot].line}</p>
        </div>
        <button
          ref={mindButton}
          className="quantum-hotspot"
          onClick={() => toggleMind(true)}
          aria-label="Touch the mind: inspect quantum mind"
          inert={inspect}
        >
          <span className="quantum-target" />
          <span>
            TOUCH THE MIND <b>＋</b>
          </span>
        </button>
        {inspect && <QuantumPanel close={() => toggleMind(false)} />}
        <div className="cinema-scroll" aria-hidden={inspect}>
          <span className="scroll-glyph">↓</span>
          <span>
            {moving
              ? "LET THE SHOT UNFOLD"
              : shot === 6
                ? "EXPLORE THE RECORDED DECISIONS IN THE REPLAY LAB"
                : "SCROLL TO TRIGGER THE NEXT SHOT"}
          </span>
        </div>
        <nav
          className="cinema-chapters"
          aria-label="Cinematic shots"
          inert={inspect}
        >
          {shots.map((s, i) => (
            <button
              key={s.name}
              onClick={() => goto(i)}
              aria-current={i === shot ? "step" : undefined}
            >
              <span>{String(i + 1).padStart(2, "0")}</span>
              <i />
              <span className="chapter-name">{s.name}</span>
            </button>
          ))}
        </nav>
        <div className="cinema-frame-code" aria-hidden="true">
          {ready ? "SCENE / ONLINE" : "BUILDING THE WORLD"}
          <span>□</span>
        </div>
        {!ready && !error && (
          <div className="cinema-loading" role="status">
            <span className="loader-bars">▰ ▰ ▰</span>
            <p>ENTERING THE UNKNOWN</p>
          </div>
        )}
        {error && (
          <div className="cinema-loading cinema-failure" role="alert">
            <h2>This scene needs WebGL.</h2>
            <p>The island could not start in this browser.</p>
            <Link href="/demo/">Open the replay lab →</Link>
          </div>
        )}
        {reduced && (
          <div className="reduced-notice">
            Reduced motion · Static shots. Use the numbered controls.
          </div>
        )}
      </div>
    </section>
  );
}
