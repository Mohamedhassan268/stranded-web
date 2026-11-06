import { z } from "zod";
import { manifest } from "@/data/site";
export const needKeys = [
  "hunger",
  "thirst",
  "warmth",
  "energy",
  "safety",
  "morale",
] as const;
export const actions = [
  "forage",
  "drink",
  "build_shelter",
  "rest",
  "explore",
  "craft",
  "hide",
] as const;
const unit = z.number().finite().min(0).max(1),
  coord = z.tuple([z.number().int().min(0), z.number().int().min(0)]);
const needs = z.object(
  Object.fromEntries(needKeys.map((n) => [n, unit])) as Record<
    (typeof needKeys)[number],
    typeof unit
  >,
);
const state = z.object({
  day: z.number().int().positive(),
  hour: z.number().min(0).max(24),
  pos: coord,
  needs,
  stress: unit,
  injured: z.boolean(),
  inventory: z.record(z.string(), z.number().finite().nonnegative()),
  recent_events: z.array(z.string()),
});
const hazard = z.object({
  new_lava: z.array(coord),
  new_pdc: z.array(coord),
  new_lahar: z.array(coord),
  active_pdc: z.array(coord).optional(),
  active_lahar: z.array(coord).optional(),
  surge: z.array(coord).optional(),
  ash: z.number().finite().nonnegative(),
  ash_grid: z.array(z.string()).nullable().optional(),
});
export const replaySchema = z.object({
  world: z.object({
    width: z.number().int().min(1).max(100),
    height: z.number().int().min(1).max(100),
    seed: z.number().int(),
    map_seed: z.number().int(),
    scenario: z.enum(["volcano", "island"]),
    mind: z.enum(["quantum", "classical_mixture"]),
    tiles: z.array(z.array(z.number().int().min(0).max(4))),
    initial_tiles: z.array(z.array(z.number().int().min(0).max(4))),
    weather: z.array(z.string()),
    volcano: z.object({
      hazard_by_step: z.array(hazard),
      vent: coord.nullable().optional(),
      phases: z.array(z.string()).optional(),
    }),
    evacuation_map: z
      .object({
        assembly_points: z.array(coord),
        zones: z.array(z.array(z.number().int().min(0).max(2))).optional(),
        route_from_spawn: z.array(coord).optional(),
      })
      .optional(),
    scale_m_per_tile: z.number().positive().optional(),
  }),
  steps: z
    .array(
      z.object({
        t: z.number().int().nonnegative(),
        state,
        event: z.string(),
        action: z.enum(actions),
        probs: z.record(z.string(), unit),
        reason: z.string(),
        pos_after: coord,
        phase: z.string(),
        quantum: z.object({
          p_danger: unit,
          p_protect: unit,
          p_classical: unit,
          coherence: unit,
          lam: unit,
          bloch: z.tuple([
            z.number().finite(),
            z.number().finite(),
            z.number().finite(),
          ]),
          q_safe: unit,
          q_danger: unit,
          order_gap: z.number().finite().nullable(),
          reflex: z.string().nullable(),
          decision_rule: z.string(),
          cognition_model: z.string(),
        }),
      }),
    )
    .min(1)
    .max(36),
  outcome: z.enum(["survived", "died"]),
  cause: z.string().nullable(),
  evacuation: z.record(z.string(), z.number().nullable()).optional(),
  recording: z.object({
    schemaVersion: z.literal(1),
    sourceCommit: z.string(),
    policyImplementation: z.string(),
    newSheltersAfterStep: z.array(z.array(coord)),
    executionBlockedByArrivingFlow: z.array(z.boolean()),
    stateAfterStep: z.array(state),
  }),
});
export type Replay = z.infer<typeof replaySchema>;
export type RunEntry = (typeof manifest.runs)[number];
export function validateReplay(input: unknown, entry: RunEntry): Replay {
  const d = replaySchema.parse(input),
    w = d.world;
  if (
    w.seed !== entry.seed ||
    w.map_seed !== entry.mapSeed ||
    w.scenario !== entry.scenario ||
    w.mind !== entry.policy ||
    d.steps.length !== entry.steps ||
    d.outcome !== entry.outcome ||
    d.cause !== entry.cause ||
    d.recording.sourceCommit !== manifest.sourceCommit ||
    d.recording.policyImplementation !== entry.policyImplementation
  )
    throw new Error("Recording identity does not match its manifest.");
  const inBounds = ([x, y]: number[]) => x < w.width && y < w.height;
  for (const grid of [w.initial_tiles, w.tiles])
    if (grid.length !== w.height || grid.some((r) => r.length !== w.width))
      throw new Error("Invalid map dimensions.");
  if (
    d.recording.stateAfterStep.length !== d.steps.length ||
    d.recording.newSheltersAfterStep.length !== d.steps.length ||
    d.recording.executionBlockedByArrivingFlow.length !== d.steps.length ||
    w.volcano.hazard_by_step.length < d.steps.length ||
    w.weather.length < d.steps.length
  )
    throw new Error("Incomplete frame data.");
  d.steps.forEach((s, i) => {
    if (
      s.t !== i ||
      !inBounds(s.state.pos) ||
      !inBounds(s.pos_after) ||
      !inBounds(d.recording.stateAfterStep[i].pos) ||
      !actions.every((a) => a in s.probs) ||
      Object.keys(s.probs).length !== actions.length ||
      Math.abs(Object.values(s.probs).reduce((a, b) => a + b, 0) - 1) > 0.00001
    )
      throw new Error("Invalid decision frame.");
    const h = w.volcano.hazard_by_step[i];
    if (
      ![
        ...h.new_lava,
        ...h.new_pdc,
        ...h.new_lahar,
        ...(h.active_pdc ?? []),
        ...(h.active_lahar ?? []),
        ...(h.surge ?? []),
        ...d.recording.newSheltersAfterStep[i],
      ].every(inBounds)
    )
      throw new Error("Hazard coordinate outside map.");
  });
  return d;
}
export async function loadReplay(
  entry: RunEntry,
  signal: AbortSignal,
): Promise<Replay> {
  const response = await fetch(entry.path, { signal });
  if (!response.ok) throw new Error("The recording could not be downloaded.");
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > 4_000_000)
    throw new Error("Recording exceeds size limit.");
  const hash = Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", buffer)),
    (n) => n.toString(16).padStart(2, "0"),
  ).join("");
  if (hash !== entry.sha256)
    throw new Error("Recording failed its integrity check.");
  return validateReplay(JSON.parse(new TextDecoder().decode(buffer)), entry);
}
export function frameLayers(run: Replay, index: number) {
  const lava = new Set<string>(),
    pdc = new Set<string>(),
    lahar = new Set<string>(),
    shelter = new Set<string>();
  for (let i = 0; i <= index; i++) {
    const h = run.world.volcano.hazard_by_step[i];
    h.new_lava.forEach((p) => lava.add(p.join(",")));
    h.new_pdc.forEach((p) => pdc.add(p.join(",")));
    h.new_lahar.forEach((p) => lahar.add(p.join(",")));
    if (i < index)
      run.recording.newSheltersAfterStep[i].forEach((p) =>
        shelter.add(p.join(",")),
      );
  }
  const h = run.world.volcano.hazard_by_step[index];
  return {
    lava,
    pdc,
    lahar,
    shelter,
    active: new Set(
      [...(h.active_pdc ?? []), ...(h.active_lahar ?? [])].map((p) =>
        p.join(","),
      ),
    ),
    surge: new Set((h.surge ?? []).map((p) => p.join(","))),
  };
}
