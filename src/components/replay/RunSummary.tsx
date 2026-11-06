"use client";
import { label } from "@/data/site";
import type { Replay } from "@/lib/replay";

// How each recorded run ended, in the wording of the simulator's engine/debrief.py: survival is
// only claimed for the whole horizon.
const VOLCANIC = new Set(["tremor", "gas_plume", "eruption", "ash_fall"]);
const KEY_EVENTS: [string, string][] = [
  ["first_sign_step", "First sign reached the person"],
  ["left_danger_step", "Left the danger zone"],
  ["reached_safe_step", "Reached the safe zone"],
  ["onset_step", "Hazard onset"],
  ["reached_assembly_step", "Reached an assembly point"],
  ["first_pdc_step", "First pyroclastic flow"],
];

/** Runs start at 08:00 on day 1 and take two hours a step. */
function clock(step: number) {
  const hours = 8 + step * 2;
  return `Day ${Math.floor(hours / 24) + 1}, ${String(hours % 24).padStart(2, "0")}:00`;
}

function hidAfterSign(run: Replay) {
  const sign = run.steps.find((step) => VOLCANIC.has(step.event))?.t;
  if (sign === undefined) return null;
  const hide = run.steps.find((step) => step.action === "hide" && step.t >= sign)?.t;
  return hide === undefined ? null : hide - sign;
}

const hideText = (steps: number | null) => (steps === null ? "never hid" : `hid ${steps} step${steps === 1 ? "" : "s"} after the first sign`);
const mindName = (run: Replay) => (run.world.mind === "quantum" ? "Quantum mind" : "Mixture control");

function outcome(run: Replay) {
  const hours = run.steps.length * 2;
  return run.outcome === "survived" ? `survived the full ${hours} hours` : `died after ${hours} hours (${label(run.cause ?? "unknown")})`;
}

export function RunSummary({ run, paired }: { run: Replay; paired: Replay | null }) {
  const events = KEY_EVENTS.flatMap(([key, name]) => {
    const step = run.evacuation?.[key];
    return step === null || step === undefined ? [] : [{ name, step }];
  })
    .toSorted((a, b) => a.step - b.step)
    .map(({ name, step }) => `${clock(step)}: ${name}`);
  return (
    <section className="q-card run-summary" aria-labelledby="run-summary">
      <h2 id="run-summary">How this run ended</h2>
      <p style={{ marginTop: 6 }}>
        {mindName(run)}: {outcome(run)}, {hideText(hidAfterSign(run))}.
        {paired && ` ${mindName(paired)} on this seed: ${outcome(paired)}, ${hideText(hidAfterSign(paired))}.`}
      </p>
      {events.length > 0 && (
        <ul>
          {events.map((event) => (
            <li key={event}>{event}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
