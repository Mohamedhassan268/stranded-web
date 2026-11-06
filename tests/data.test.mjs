import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const read = (p) =>
  JSON.parse(readFileSync(new URL("../" + p, import.meta.url), "utf8"));
const manifest = read("public/runs/manifest.json");
test("recordings retain verified identities, normalized decisions and sidecar snapshots", () => {
  assert.equal(manifest.runs.length, 6);
  assert.equal(manifest.sourceDirty, false);
  for (const entry of manifest.runs) {
    const bytes = readFileSync(
      new URL("../public" + entry.path, import.meta.url),
    );
    assert.equal(
      createHash("sha256").update(bytes).digest("hex"),
      entry.sha256,
    );
    const run = JSON.parse(bytes);
    assert.equal(run.world.seed, entry.seed);
    assert.equal(run.world.scenario, entry.scenario);
    assert.equal(run.world.mind, entry.policy);
    assert.equal(run.recording.sourceCommit, manifest.sourceCommit);
    assert.equal(run.steps.length, entry.steps);
    assert.equal(run.recording.stateAfterStep.length, entry.steps);
    run.steps.forEach((s, i) => {
      assert.ok(s.quantum);
      assert.ok(!s.reason.startsWith("Stub"));
      assert.ok(
        Math.abs(Object.values(s.probs).reduce((a, b) => a + b, 0) - 1) < 1e-5,
      );
      assert.deepEqual(run.recording.stateAfterStep[i].pos, s.pos_after);
      if (entry.policy === "classical_mixture") assert.equal(s.quantum.lam, 1);
    });
  }
});
test("paired controls share world, weather, hazard schedule and first decision state", () => {
  for (const entry of manifest.runs.filter((r) => r.policy === "quantum")) {
    const pair = manifest.runs.find(
      (r) =>
        r.seed === entry.seed &&
        r.scenario === entry.scenario &&
        r.policy === "classical_mixture",
    );
    assert.ok(pair);
    const a = read("public" + entry.path),
      b = read("public" + pair.path);
    assert.deepEqual(a.world.initial_tiles, b.world.initial_tiles);
    assert.deepEqual(a.world.weather, b.world.weather);
    assert.deepEqual(a.world.volcano, b.world.volcano);
    assert.deepEqual(a.steps[0].state, b.steps[0].state);
  }
});
