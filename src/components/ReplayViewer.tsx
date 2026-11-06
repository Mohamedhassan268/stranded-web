"use client";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "./Icons";
import { WorldMap } from "./WorldMap";
import { Dashboard } from "./replay/Dashboard";
import { RunSummary } from "./replay/RunSummary";
import { loadReplay, type Replay, type RunEntry } from "@/lib/replay";
import { manifest, policyName, label } from "@/data/site";

const cases = manifest.runs.filter((run) => run.policy === "quantum");
const SPEEDS = [1, 2, 4];

export function ReplayViewer() {
  const [caseId, setCaseId] = useState("volcano-42-quantum");
  const [policy, setPolicy] = useState("quantum");
  const [compare, setCompare] = useState(false);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showEvac, setShowEvac] = useState(false);
  const [data, setData] = useState<Replay[]>([]);
  const [paired, setPaired] = useState<Replay | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCompare(params.get("compare") === "1");
    const requested = params.get("case");
    if (cases.some((run) => run.id === requested)) setCaseId(requested as string);
  }, []);

  const chosen = cases.find((run) => run.id === caseId)!;
  const entries = manifest.runs.filter((run) => run.scenario === chosen.scenario && run.seed === chosen.seed && (compare || run.policy === policy));
  const selection = entries.map((entry) => entry.id).join("|");

  useEffect(() => {
    const controller = new AbortController();
    setPlaying(false);
    setIndex(0);
    setData([]);
    setPaired(null);
    setError("");
    const selected = selection.split("|").map((id) => manifest.runs.find((run) => run.id === id) as RunEntry);
    Promise.all(selected.map((entry) => loadReplay(entry, controller.signal)))
      .then((result) => {
        if (!controller.signal.aborted) setData(result);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError("This recording could not be loaded or failed validation. Playback is paused. Please retry.");
      });
    // The other mind on this seed, for the run summary. The replay works without it.
    const other = manifest.runs.find((run) => run.scenario === selected[0].scenario && run.seed === selected[0].seed && run.policy !== selected[0].policy);
    if (other)
      loadReplay(other, controller.signal)
        .then((result) => {
          if (!controller.signal.aborted) setPaired(result);
        })
        .catch(() => undefined);
    return () => controller.abort();
  }, [selection, retry]);

  const maxIndex = Math.max(0, ...data.map((run) => run.steps.length - 1));
  const ready = data.length > 0 && !error;

  useEffect(() => {
    if (index >= maxIndex) setPlaying(false);
  }, [index, maxIndex]);

  useEffect(() => {
    if (!playing || !data.length) return;
    const timer = window.setInterval(() => setIndex((step) => Math.min(step + 1, maxIndex)), 1000 / speed);
    return () => window.clearInterval(timer);
  }, [playing, speed, maxIndex, data.length]);

  const jump = useCallback((step: number) => {
    setPlaying(false);
    setIndex(step);
  }, []);

  const first = data[0];

  return (
    <div className="replay-workspace">
      <div className="q-card replay-controls">
        <div className="replay-selects">
          <label className="q-field">
            Recorded case
            <select
              className="q-select"
              aria-label="Recorded case"
              value={caseId}
              onChange={(event) => {
                setPlaying(false);
                setCaseId(event.target.value);
              }}
            >
              {cases.map((run) => (
                <option value={run.id} key={run.id}>
                  {run.title}
                </option>
              ))}
            </select>
          </label>
          <label className="q-field">
            Model
            <select
              className="q-select"
              aria-label="Model"
              disabled={compare}
              value={policy}
              onChange={(event) => {
                setPlaying(false);
                setPolicy(event.target.value);
              }}
            >
              <option value="quantum">Quantum cognition</option>
              <option value="classical_mixture">Classical mixture (λ=1)</option>
            </select>
          </label>
          <label className="replay-check">
            <input
              type="checkbox"
              checked={compare}
              onChange={(event) => {
                setPlaying(false);
                setCompare(event.target.checked);
              }}
            />
            <span>Compare models</span>
          </label>
          <label className="replay-check">
            <input type="checkbox" checked={showEvac} onChange={(event) => setShowEvac(event.target.checked)} />
            <span>Show evacuation zones</span>
          </label>
        </div>
        <div className="replay-transport" role="group" aria-label="Replay controls">
          <button className="q-btn q-btn--sand" aria-label="Reset replay" disabled={!ready} onClick={() => jump(0)}>
            <Icon name="reset" />
          </button>
          <button className="q-btn q-btn--sand" aria-label="Previous step" disabled={!ready || index === 0} onClick={() => jump(index - 1)}>
            <Icon name="prev" />
          </button>
          <button className="q-btn q-btn--sand" aria-label={playing ? "Pause replay" : "Play replay"} disabled={!ready || index === maxIndex} onClick={() => setPlaying((on) => !on)}>
            <Icon name={playing ? "pause" : "play"} />
          </button>
          <button className="q-btn q-btn--sand" aria-label="Next step" disabled={!ready || index === maxIndex} onClick={() => jump(index + 1)}>
            <Icon name="next" />
          </button>
          <label className="replay-scrub">
            <span>Decision</span>
            <input
              aria-label="Replay position"
              aria-valuetext={`Decision ${index + 1} of ${maxIndex + 1}`}
              type="range"
              min="0"
              max={maxIndex}
              value={index}
              disabled={!ready}
              onChange={(event) => jump(Number(event.target.value))}
            />
            <strong data-testid="step-count">
              {index + 1} / {maxIndex + 1}
            </strong>
          </label>
          <select className="q-select" aria-label="Playback speed" value={speed} onChange={(event) => setSpeed(Number(event.target.value))}>
            {SPEEDS.map((rate) => (
              <option value={rate} key={rate}>
                {rate}× speed
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="q-card replay-status replay-error" role="alert">
          <h2 className="q-heading">Recording unavailable</h2>
          <p>{error}</p>
          <button className="q-btn" onClick={() => setRetry((count) => count + 1)}>
            <Icon name="reset" />
            <span>Retry recording</span>
          </button>
        </div>
      ) : !data.length ? (
        <div className="q-card replay-status" role="status">
          Loading and verifying recording...
        </div>
      ) : (
        <div className={compare ? "replay-panels compared" : "replay-panels"}>
          {data.map((run) => {
            const step = Math.min(index, run.steps.length - 1);
            return (
              <article className="replay-panel" key={run.world.mind} aria-label={policyName(run.world.mind)}>
                <div className="q-card replay-map">
                  <h2 className="q-heading">{policyName(run.world.mind)}</h2>
                  <WorldMap run={run} index={step} showEvac={showEvac} />
                  <p className="world-legend">
                    <span>
                      <i style={{ "--dot": "#2c6cb8" } as React.CSSProperties} />
                      Person
                    </span>
                    <span>
                      <i style={{ "--dot": "#e86e3c" } as React.CSSProperties} />
                      Active flow
                    </span>
                    <span>
                      <i style={{ "--dot": "#ee6918" } as React.CSSProperties} />
                      Lava
                    </span>
                    <span>
                      <i style={{ "--dot": "#5c4e4a" } as React.CSSProperties} />
                      Flow deposit
                    </span>
                    <span>
                      <i style={{ "--dot": "#d4522a" } as React.CSSProperties} />
                      Shelter
                    </span>
                  </p>
                </div>
                <Dashboard run={run} index={step} compared={compare} />
              </article>
            );
          })}
        </div>
      )}

      {first && !error && <RunSummary run={first} paired={data[1] ?? paired} />}

      {first && !error && (
        <details className="q-card event-rail">
          <summary>Jump to a decision</summary>
          <div className="event-rail-buttons">
            {first.steps.map((step, i) => (
              <button
                key={i}
                className={index === i ? "q-btn is-on" : "q-btn"}
                aria-label={`Decision ${String(i + 1).padStart(2, "0")} ${label(step.event)}`}
                aria-current={index === i ? "step" : undefined}
                onClick={() => jump(i)}
              >
                <span>{String(i + 1).padStart(2, "0")} </span>
                <small>{label(step.event)}</small>
              </button>
            ))}
          </div>
        </details>
      )}

      <details className="q-card provenance">
        <summary>Recording provenance &amp; downloads</summary>
        <dl>
          <div>
            <dt>Source revision</dt>
            <dd>{manifest.sourceCommit}</dd>
          </div>
          <div>
            <dt>Execution</dt>
            <dd>{manifest.backend}</dd>
          </div>
          <div>
            <dt>Map seed / event seed</dt>
            <dd>
              {chosen.mapSeed} / {chosen.seed}
            </dd>
          </div>
          <div>
            <dt>Source working tree</dt>
            <dd>{manifest.sourceDirty ? "Contained local changes; see recorded file hashes" : "Clean at recording"}</dd>
          </div>
        </dl>
        <p>
          These fixed demonstration cases are not a benchmark. Matched runs share initial state, terrain, weather and hazard schedule; paths and experienced events
          can diverge. A shorter run holds its last recorded decision state.
        </p>
        {entries.map((entry) => (
          <p key={entry.id}>
            <a href={entry.path} download>
              {policyName(entry.policy)} JSON
            </a>
            <code>SHA-256 {entry.sha256}</code>
          </p>
        ))}
        <p>
          <a href="/runs/manifest.json" download>
            Download complete manifest
          </a>
        </p>
      </details>
    </div>
  );
}
