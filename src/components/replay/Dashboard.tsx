"use client";
import { actions, needKeys, type Replay } from "@/lib/replay";
import { label } from "@/data/site";

// Recorded values for one decision. Colours are the simulator's action colours.
const ACTION_COLORS: Record<string, string> = {
  forage: "#3ea820",
  drink: "#1c92d0",
  build_shelter: "#d47622",
  rest: "#923ac4",
  explore: "#da860e",
  craft: "#76604c",
  hide: "#d43026",
};
const NEED_COLORS: Record<string, string> = {
  hunger: "#b07a30",
  thirst: "#2c8ed4",
  warmth: "#e06c2c",
  energy: "#4cb83c",
  safety: "#7f8ea3",
  morale: "#a94fd6",
};
const NEED_NAMES: Record<string, string> = { hunger: "Food", thirst: "Water", warmth: "Warmth", energy: "Energy", safety: "Safety", morale: "Morale" };
const TERRAIN = ["water", "plains", "forest", "mountain", "shelter"];
const sentence = (text: string) => label(text).replace(/^./, (letter) => letter.toUpperCase());

function Vital({ name, value, color }: { name: string; value: number; color: string }) {
  const percent = Math.round(value * 100);
  return (
    <div className="vital">
      <span>{name}</span>
      <div className="q-meter" role="meter" aria-label={`${name} level`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
        <i style={{ width: `${percent}%`, "--fill": color } as React.CSSProperties} />
      </div>
      <span>{percent}%</span>
    </div>
  );
}

function ProtectTimeline({ run, index }: { run: Replay; index: number }) {
  const series = run.steps.slice(0, index + 1).map((step) => step.quantum);
  const width = 240;
  const height = 92;
  const line = (value: (row: (typeof series)[number]) => number) =>
    series.map((row, i) => `${series.length > 1 ? (i / (series.length - 1)) * width : 0},${height - value(row) * height}`).join(" ");
  return (
    <div className="q-sub widget">
      <span>P(protect) so far</span>
      <svg viewBox={`0 -2 ${width} ${height + 4}`} role="img" aria-label="P(protect) so far, for the quantum mind and the mixture control">
        <line x1="0" x2={width} y1={height} y2={height} stroke="#6a401c" />
        <line x1="0" x2={width} y1={height / 2} y2={height / 2} stroke="#6a401c" />
        {series.length > 1 && (
          <>
            <polyline points={line((row) => row.p_classical)} fill="none" stroke="#106ca0" strokeWidth="2" />
            <polyline points={line((row) => row.p_protect)} fill="none" stroke="#923ac4" strokeWidth="3" />
          </>
        )}
      </svg>
      <div className="widget-key">
        <span>
          <i style={{ "--dot": "#923ac4" } as React.CSSProperties} />
          quantum
        </span>
        <span>
          <i style={{ "--dot": "#106ca0", height: 2 } as React.CSSProperties} />
          control
        </span>
      </div>
    </div>
  );
}

function BeliefCircle({ run, index }: { run: Replay; index: number }) {
  const points = run.steps.slice(Math.max(0, index - 23), index + 1).map((step) => [step.quantum.bloch[0], step.quantum.bloch[2]]);
  const radius = 46;
  const center = 50;
  const toXY = ([x, z]: number[]) => [center + x * radius, center - z * radius];
  const [tipX, tipY] = toXY(points.at(-1) ?? [0, 0]);
  const coherence = run.steps[index].quantum.coherence;
  return (
    <div className="q-sub widget">
      <span>Belief, x-z</span>
      <svg viewBox="0 0 100 100" role="img" aria-label={`Belief position, coherence ${coherence.toFixed(2)}`}>
        <circle cx={center} cy={center} r={radius} fill="#faefd4" stroke="#6a401c" />
        <line x1={center - radius} x2={center + radius} y1={center} y2={center} stroke="#6a401c" />
        <line y1={center - radius} y2={center + radius} x1={center} x2={center} stroke="#6a401c" />
        <polyline points={points.map((point) => toXY(point).join(",")).join(" ")} fill="none" stroke="#923ac4" strokeWidth="1.6" />
        <circle cx={tipX} cy={tipY} r="3.2" fill="#be281e" />
      </svg>
      <span>Coherence {coherence.toFixed(2)}</span>
    </div>
  );
}

function StressDial({ stress, lambda }: { stress: number; lambda: number }) {
  const radius = 42;
  const angle = Math.PI * Math.min(1, lambda);
  const tipX = 50 - (radius - 8) * Math.cos(angle);
  const tipY = 54 - (radius - 8) * Math.sin(angle);
  const arc = `M${50 - radius} 54 A${radius} ${radius} 0 0 1 ${50 + radius} 54`;
  return (
    <div className="q-sub widget">
      <span>Stress to dephasing</span>
      <svg viewBox="0 0 100 64" role="img" aria-label={`Stress ${stress.toFixed(2)}, dephasing ${lambda.toFixed(2)}`}>
        <path d={arc} fill="none" stroke="#6a401c" strokeWidth="7" />
        <path d={arc} fill="none" stroke="#923ac4" strokeWidth="7" pathLength={1} strokeDasharray={`${Math.max(0.03, Math.min(1, lambda))} 1`} />
        <line x1="50" y1="54" x2={tipX} y2={tipY} stroke="#36200e" strokeWidth="3" />
        <circle cx="50" cy="54" r="4" fill="#36200e" />
      </svg>
      <span>
        Stress {stress.toFixed(2)}, λ {lambda.toFixed(2)}
      </span>
    </div>
  );
}

export function Dashboard({ run, index, compared }: { run: Replay; index: number; compared: boolean }) {
  const step = run.steps[index];
  const state = step.state;
  const quantum = step.quantum;
  const [x, y] = state.pos;
  const chain = state.recent_events.filter((event) => event !== "none").map(label);
  const top = actions.reduce((best, action) => (step.probs[action] > step.probs[best] ? action : best), actions[0]);
  const phase = run.world.scenario === "volcano" ? step.phase : null;
  return (
    <div className="dash">
      <section className="q-card" aria-label="The person">
        <div className="dash-head">
          <h2>The person</h2>
          <span className="q-muted">
            Day {state.day}, {String(state.hour).padStart(2, "0")}:00
          </span>
        </div>
        <div className="vitals">
          {needKeys.map((need) => (
            <Vital key={need} name={NEED_NAMES[need]} value={state.needs[need]} color={NEED_COLORS[need]} />
          ))}
          <Vital name="Stress" value={state.stress} color="var(--yellow)" />
          <Vital name="Dephasing" value={quantum.lam} color="var(--purple)" />
        </div>
        <p className="dash-line" role="status">
          At [{x}, {y}] in {TERRAIN[run.world.initial_tiles[y][x]]}.{state.injured ? " Injured." : ""}
          {run.recording.executionBlockedByArrivingFlow[index] ? " Action blocked by arriving flow." : ""}
        </p>
        <p className="dash-line">
          Event: <strong>{label(step.event)}</strong>
          {phase ? `, phase: ${label(phase)}` : ""}. Recent signs: {chain.length ? chain.join(", then ") : "none"}.
        </p>
      </section>
      <section className="q-card" aria-label="The decision">
        <div className="dash-head">
          <h2>The decision</h2>
          <span className="q-muted">
            P(danger) {quantum.p_danger.toFixed(2)}, P(protect) {quantum.p_protect.toFixed(2)}
          </span>
        </div>
        <div className="badge-row">
          <span className="q-badge" style={{ "--tone": "var(--gold)" } as React.CSSProperties} data-testid="selected-action">
            Chose: {label(step.action)}
          </span>
        </div>
        <div className="probs">
          {actions.map((action) => (
            <div className={action === top ? "prob is-top" : "prob"} key={action}>
              <span>{sentence(action)}</span>
              <span className="prob-bar">
                <i style={{ width: `${step.probs[action] * 100}%`, "--fill": ACTION_COLORS[action] } as React.CSSProperties} />
              </span>
              <span>{(step.probs[action] * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
        <div className="widgets">
          <ProtectTimeline run={run} index={index} />
          <BeliefCircle run={run} index={index} />
          <StressDial stress={state.stress} lambda={quantum.lam} />
        </div>
        <details className="q-sub reason-box" open={!compared}>
          <summary>Why this decision?</summary>
          <p>{step.reason}</p>
          {quantum.reflex && <p className="reflex-note">Reflex override: {quantum.reflex}. The selected action can differ from the most probable action.</p>}
          {quantum.order_gap !== null && <p>Order gap: {quantum.order_gap.toFixed(4)}.</p>}
        </details>
      </section>
    </div>
  );
}
