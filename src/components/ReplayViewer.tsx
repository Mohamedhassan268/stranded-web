"use client";
import { useEffect, useState } from "react";
import { Icon } from "./Icons";
import { WorldMap } from "./WorldMap";
import {
  actions,
  loadReplay,
  needKeys,
  type Replay,
  type RunEntry,
} from "@/lib/replay";
import { manifest, policyName, label } from "@/data/site";
const cases = manifest.runs.filter((r) => r.policy === "quantum");
function Panel({
  run,
  index,
  compared,
}: {
  run: Replay;
  index: number;
  compared: boolean;
}) {
  const i = Math.min(index, run.steps.length - 1),
    s = run.steps[i],
    q = s.quantum,
    done = index >= run.steps.length - 1;
  return (
    <article
      className={`replay-panel ${run.world.mind === "quantum" ? "quantum-panel" : "control-panel"}`}
    >
      <header className="panel-header">
        <span>
          <i
            className={`model-key ${run.world.mind === "quantum" ? "violet-key" : "cyan-key"}`}
          />
          {policyName(run.world.mind)}
        </span>
        <span className="panel-label">
          {done ? "LAST RECORDED DECISION" : "BEFORE ACTION"}
        </span>
      </header>
      <WorldMap run={run} index={i} />
      <div className="replay-telemetry">
        <div className="frame-heading">
          <div>
            <span className="tiny-label">SELECTED ACTION</span>
            <h2 data-testid="selected-action">{label(s.action)}</h2>
          </div>
          <span className="event-pill">{label(s.event)}</span>
        </div>
        <p className="frame-status" role="status">
          Day {s.state.day} · {String(s.state.hour).padStart(2, "0")}:00 ·{" "}
          {label(run.world.weather[i])} · {label(s.phase)}
          {run.recording.executionBlockedByArrivingFlow[i]
            ? " · Action blocked by arriving flow"
            : ""}
        </p>
        <div className="needs-grid">
          {needKeys.map((n) => (
            <div className="need" key={n}>
              <div>
                <span>
                  {n === "hunger"
                    ? "Food satisfaction"
                    : n === "thirst"
                      ? "Hydration"
                      : label(n)}
                </span>
                <span>{Math.round(s.state.needs[n] * 100)}%</span>
              </div>
              <meter
                min="0"
                max="1"
                value={s.state.needs[n]}
                aria-label={`${n} satisfaction`}
              />
            </div>
          ))}
        </div>
        <p className="caption">
          Needs at decision time. Higher values mean greater satisfaction.
        </p>
        <div className="diagnostics">
          <div>
            <span>Stress</span>
            <strong>{Math.round(s.state.stress * 100)}%</strong>
          </div>
          <div>
            <span>Dephasing λ</span>
            <strong>{q.lam.toFixed(3)}</strong>
          </div>
          <div>
            <span>Coherence |x|</span>
            <strong>{q.coherence.toFixed(3)}</strong>
          </div>
          <div>
            <span>P(protect)</span>
            <strong>{q.p_protect.toFixed(3)}</strong>
          </div>
        </div>
        <details className="decision-details" open={!compared}>
          <summary>Why this decision?</summary>
          <p>{s.reason}</p>
          {q.reflex && (
            <p className="reflex-note">
              Reflex override: {q.reflex}. The selected action can differ from
              the most probable action.
            </p>
          )}
          <div className="probability-list">
            {actions.map((a) => (
              <div key={a}>
                <span>{label(a)}</span>
                <span className="probability-track">
                  <i style={{ width: `${s.probs[a] * 100}%` }} />
                </span>
                <span>{(s.probs[a] * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
          <p className="caption">
            Recorded Bloch vector: [
            {q.bloch.map((v) => v.toFixed(3)).join(", ")}]. Order gap:{" "}
            {q.order_gap === null ? "Not recorded" : q.order_gap.toFixed(4)}.
          </p>
        </details>
        {done && (
          <div className="outcome-note">
            <strong>
              Recorded outcome: {run.outcome}
              {run.cause ? ` (${label(run.cause)})` : ""}.
            </strong>
            <p>
              The map and needs above show the last recorded decision.{" "}
              {run.recording.stateAfterStep[i].injured
                ? "The post-step snapshot records an injury. "
                : ""}
              Post-step position: [{s.pos_after.join(", ")}].
            </p>
          </div>
        )}
      </div>
    </article>
  );
}
export function ReplayViewer() {
  const [caseId, setCaseId] = useState("volcano-42-quantum"),
    [policy, setPolicy] = useState("quantum"),
    [compare, setCompare] = useState(false),
    [index, setIndex] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(1),
    [data, setData] = useState<Replay[]>([]),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    setCompare(
      new URLSearchParams(window.location.search).get("compare") === "1",
    );
  }, []);
  const chosen = cases.find((c) => c.id === caseId)!;
  const entries = manifest.runs.filter(
    (r) =>
      r.scenario === chosen.scenario &&
      r.seed === chosen.seed &&
      (compare || r.policy === policy),
  );
  const selection = entries.map((e) => e.id).join("|");
  useEffect(() => {
    const controller = new AbortController();
    setPlaying(false);
    setIndex(0);
    setData([]);
    setError("");
    const selected = selection
      .split("|")
      .map((id) => manifest.runs.find((r) => r.id === id) as RunEntry);
    Promise.all(selected.map((e) => loadReplay(e, controller.signal)))
      .then((result) => {
        if (!controller.signal.aborted) setData(result);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError(
            "This recording could not be loaded or failed validation. Playback is paused. Please retry.",
          );
      });
    return () => controller.abort();
  }, [selection, retry]);
  const maxIndex = Math.max(0, ...data.map((d) => d.steps.length - 1));
  useEffect(() => {
    if (index >= maxIndex) setPlaying(false);
  }, [index, maxIndex]);
  useEffect(() => {
    if (!playing || !data.length) return;
    const timer = window.setInterval(
      () => setIndex((i) => Math.min(i + 1, maxIndex)),
      1000 / speed,
    );
    return () => window.clearInterval(timer);
  }, [playing, speed, maxIndex, data.length]);
  const jump = (i: number) => {
    setPlaying(false);
    setIndex(i);
  };
  const ready = data.length > 0 && !error;
  return (
    <div className="replay-workspace">
      <div className="run-toolbar">
        <label>
          RECORDED CASE
          <select
            aria-label="Recorded case"
            value={caseId}
            onChange={(e) => {
              setPlaying(false);
              setCaseId(e.target.value);
            }}
          >
            {cases.map((c) => (
              <option value={c.id} key={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          MODEL
          <select
            aria-label="Model"
            disabled={compare}
            value={policy}
            onChange={(e) => {
              setPlaying(false);
              setPolicy(e.target.value);
            }}
          >
            <option value="quantum">Quantum cognition</option>
            <option value="classical_mixture">Classical mixture · λ=1</option>
          </select>
        </label>
        <label className="compare-toggle">
          <input
            type="checkbox"
            checked={compare}
            onChange={(e) => {
              setPlaying(false);
              setCompare(e.target.checked);
            }}
          />
          <span>Compare models</span>
        </label>
        <span className="recorded-badge">
          <span className="status-dot cyan" />
          RECORDED · LOCAL MODEL
        </span>
      </div>
      <div className="playback-controls">
        <div className="transport">
          <button
            aria-label="Reset replay"
            disabled={!ready}
            onClick={() => jump(0)}
          >
            <Icon name="reset" />
          </button>
          <button
            aria-label="Previous step"
            disabled={!ready || index === 0}
            onClick={() => jump(index - 1)}
          >
            <Icon name="prev" />
          </button>
          <button
            className="play-button"
            aria-label={playing ? "Pause replay" : "Play replay"}
            disabled={!ready || index === maxIndex}
            onClick={() => setPlaying((p) => !p)}
          >
            <Icon name={playing ? "pause" : "play"} />
          </button>
          <button
            aria-label="Next step"
            disabled={!ready || index === maxIndex}
            onClick={() => jump(index + 1)}
          >
            <Icon name="next" />
          </button>
        </div>
        <label className="scrubber">
          <span>
            DECISION{" "}
            <strong data-testid="step-count">
              {index + 1} / {maxIndex + 1}
            </strong>
          </span>
          <input
            aria-label="Replay position"
            aria-valuetext={`Decision ${index + 1} of ${maxIndex + 1}`}
            type="range"
            min="0"
            max={maxIndex}
            value={index}
            disabled={!ready}
            onChange={(e) => jump(Number(e.target.value))}
          />
        </label>
        <label className="speed-select">
          SPEED
          <select
            aria-label="Playback speed"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          >
            <option value="1">1×</option>
            <option value="2">2×</option>
            <option value="4">4×</option>
          </select>
        </label>
      </div>
      {error ? (
        <div className="replay-error" role="alert">
          <h2>Recording unavailable</h2>
          <p>{error}</p>
          <button
            className="button secondary"
            onClick={() => setRetry((n) => n + 1)}
          >
            Retry recording <Icon name="reset" />
          </button>
        </div>
      ) : !data.length ? (
        <div className="replay-loading" role="status">
          <span className="loading-orbit" />
          Loading and verifying recording…
        </div>
      ) : (
        <div className={compare ? "replay-panels compared" : "replay-panels"}>
          {data.map((d) => (
            <Panel
              key={d.world.mind}
              run={d}
              index={index}
              compared={compare}
            />
          ))}
        </div>
      )}
      {ready && (
        <div className="event-rail">
          <h2>Jump to a decision</h2>
          <div className="event-rail-buttons">
            {data[0].steps.map((s, i) => (
              <button
                key={i}
                className={index === i ? "active" : ""}
                aria-label={`Decision ${String(i + 1).padStart(2, "0")} ${label(s.event)}`}
                aria-current={index === i ? "step" : undefined}
                onClick={() => jump(i)}
              >
                <span>{String(i + 1).padStart(2, "0")} </span>
                <small>{label(s.event)}</small>
              </button>
            ))}
          </div>
        </div>
      )}
      <details className="provenance">
        <summary>Recording provenance & downloads</summary>
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
            <dd>
              {manifest.sourceDirty
                ? "Contained local changes; see recorded file hashes"
                : "Clean at recording"}
            </dd>
          </div>
        </dl>
        <p>
          These fixed demonstration cases are not a benchmark. Matched runs
          share initial state, terrain, weather and hazard schedule; paths and
          experienced events can diverge. A shorter run holds its last recorded
          decision state.
        </p>
        {entries.map((e) => (
          <p key={e.id}>
            <a href={e.path} download>
              {policyName(e.policy)} JSON ↓
            </a>
            <code>SHA-256 {e.sha256}</code>
          </p>
        ))}
        <a href="/runs/manifest.json" download>
          Download complete manifest ↓
        </a>
      </details>
    </div>
  );
}
