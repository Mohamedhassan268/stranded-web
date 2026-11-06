"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
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
    line: "There’s something in the silence.",
  },
  {
    name: "FOLLOW",
    title: (
      <>
        FOLLOW
        <br />
        THE SIGNAL.
      </>
    ),
    line: "A mind. A path. A chance.",
  },
];
export default function CinematicStudy() {
  const host = useRef<HTMLDivElement>(null),
    shell = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false),
    [error, setError] = useState(false),
    [shot, setShot] = useState(0),
    [moving, setMoving] = useState(false),
    [reduced, setReduced] = useState(false);
  useEffect(() => {
    let stop: (() => void) | undefined;
    let gone = false;
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
  function goto(i: number) {
    const element = shell.current;
    if (!element) return;
    const top = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: top + (i + 0.12) * window.innerHeight,
      behavior: "instant",
    });
    element.dispatchEvent(new CustomEvent("cinematic-shot",{detail:i}));
  }
  return (
    <section
      ref={shell}
      className="cinematic-page"
      aria-label="Stranded cinematic opening design sample"
    >
      <div className="cinematic-stage">
        <div
          ref={host}
          className="cinematic-canvas"
          role="img"
          aria-label="3D story of a yellow-jacketed survivor falling toward a tropical island, awakening and discovering a luminous quantum mind"
        />
        <div className="cinema-grain" aria-hidden="true" />
        <div className="cinema-vignette" aria-hidden="true" />
        <div className="cinema-lid top" aria-hidden="true" />
        <div className="cinema-lid bottom" aria-hidden="true" />
        <header className="cinema-header">
          <Link href="/" className="cinema-brand">
            STRANDED<span>_</span>
          </Link>
          <span className="study-label">VISUAL STUDY / 01</span>
          <Link className="cinema-exit" href="/demo/">
            SKIP TO REPLAY <span>↗</span>
          </Link>
        </header>
        <div className="cinema-side">
          <span>ONE HUMAN</span>
          <i />
          <span>UNKNOWN TERRITORY</span>
        </div>
        <div className="cinema-copy" key={shot}>
          <p className="cinema-eyebrow">
            {String(shot + 1).padStart(2, "0")} / {shots[shot].name}
          </p>
          <h1>{shots[shot].title}</h1>
          <p className="cinema-line">{shots[shot].line}</p>
        </div>
        <div className="cinema-scroll">
          <span className="scroll-glyph">↓</span>
          <span>
            {moving
              ? "LET THE SHOT UNFOLD"
              : shot === 4
                ? "END OF OPENING STUDY"
                : "SCROLL TO TRIGGER THE NEXT SHOT"}
          </span>
        </div>
        <nav className="cinema-chapters" aria-label="Cinematic shots">
          {shots.map((s, i) => (
            <button
              key={s.name}
              onClick={() => goto(i)}
              aria-current={i === shot ? "step" : undefined}
              aria-label={`Shot ${i + 1}: ${s.name.toLowerCase()}`}
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
            <p>The 3D study could not start in this browser.</p>
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
