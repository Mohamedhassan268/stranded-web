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
      aria-label="Interactive island story"
    >
      <div className="cinematic-stage">
        <div
          ref={host}
          className="cinematic-canvas"
          role="img"
          aria-label="A survivor falls to an island, connects with a quantum mind, evades a falling tree and takes cover from a storm"
        />
        <div className="cinema-vignette" aria-hidden="true" />
        <div className="cinema-lid top" aria-hidden="true" />
        <div className="cinema-lid bottom" aria-hidden="true" />
        <header className="cinema-header" inert={inspect}>
          <Link className="q-btn q-btn--sand" href="/">
            &lt; Home
          </Link>
          <Link href="/" className="q-ribbon" aria-label="Qognition home">
            <span className="q-ribbon-title">QOGNITION</span>
            <span className="q-ribbon-sub">ONE HUMAN &nbsp;•&nbsp; A QUANTUM MIND</span>
          </Link>
          <Link className="q-btn q-btn--sand" href="/demo/">
            REPLAY
          </Link>
        </header>
        <div className="q-card cinema-copy" key={shot} aria-hidden={inspect}>
          <span className="q-badge" style={{ "--tone": "var(--green-dark)" } as React.CSSProperties}>
            {String(shot + 1).padStart(2, "0")} / {shots[shot].name}
          </span>
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
          <span className="q-btn q-btn--vivid q-btn--purple">Touch the mind</span>
        </button>
        {inspect && <QuantumPanel close={() => toggleMind(false)} />}
        <p className="q-hintbar cinema-scroll" aria-hidden={inspect}>
          {moving
            ? "LET THE SHOT UNFOLD"
            : shot === 6
              ? "EXPLORE THE RECORDED DECISIONS IN THE REPLAY"
              : "SCROLL TO TRIGGER THE NEXT SHOT"}
        </p>
        <nav
          className="cinema-chapters"
          aria-label="Cinematic shots"
          inert={inspect}
        >
          {shots.map((s, i) => (
            <button
              className="q-btn q-btn--sand"
              key={s.name}
              onClick={() => goto(i)}
              aria-current={i === shot ? "step" : undefined}
            >
              <b>{String(i + 1).padStart(2, "0")}</b>
              <span className="chapter-name">{s.name}</span>
            </button>
          ))}
        </nav>
        {!ready && !error && (
          <div className="cinema-loading" role="status">
            <div className="q-card">
              <span className="q-label loader-bars">BUILDING THE WORLD...</span>
            </div>
          </div>
        )}
        {error && (
          <div className="cinema-loading" role="alert">
            <div className="q-card">
              <h2 className="q-heading">This scene needs WebGL</h2>
              <p>The island could not start in this browser.</p>
              <Link className="q-btn q-btn--vivid q-btn--green" href="/demo/">
                Open the replay
              </Link>
            </div>
          </div>
        )}
        {reduced && (
          <p className="q-hintbar reduced-notice">
            Reduced motion: static shots. Use the numbered controls.
          </p>
        )}
      </div>
    </section>
  );
}
