import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checklist, entityTitle, hazardsOf, readSim, SimError } from "../src/lib/qsim.ts";
import { FileStore, RedisStore } from "../src/lib/store.ts";

const community = JSON.parse(readFileSync(new URL("../src/data/community-sims.json", import.meta.url), "utf8"));
const base = JSON.parse(community.sims[0].raw);
const digest = (text) => createHash("sha256").update(text).digest("hex");

/** A well-formed sim with one thing changed. */
function envelope(changes = {}, scenario = base.scenario) {
  return JSON.stringify({ ...base, scenario, sha256: digest(scenario), ...changes });
}
const edit = (from, to) => envelope({}, base.scenario.replace(from, to));

test("every sim that ships with the site passes the file checks", async () => {
  assert.equal(community.sims.length, 3);
  for (const { file, raw } of community.sims) {
    const sim = await readSim(raw);
    assert.equal(`${sim.id}.qsim`, file);
    assert.equal(sim.needsDataPack, JSON.parse(raw).needs_data_pack);
    assert.ok(checklist(sim.entities).every((item) => item.done));
  }
});

test("a sim's contents are read for display", async () => {
  const sim = await readSim(community.sims[0].raw);
  assert.equal(sim.id, "made_up_island_eruption");
  assert.equal(sim.people, 1);
  assert.equal(sim.hours, 96);
  assert.deepEqual(hazardsOf(sim.entities), ["eruption", "ash", "flow"]);
  assert.equal(entityTitle(sim.entities[5]), 'Person "A villager": Quantum');
  const contest = await readSim(community.sims[2].raw);
  assert.ok(contest.people > 1, "groups count every member");
});

test("a file saved before licences were added still opens", async () => {
  const { licence, ...older } = JSON.parse(community.sims[0].raw);
  assert.equal(licence, "CC-BY-4.0");
  assert.equal((await readSim(JSON.stringify(older))).licence, "");
});

const refused = [
  ["text that isn't JSON", "not json", /can't be read/],
  ["another JSON file", '{"format":"something-else"}', /isn't a Qognition sim file/],
  ["a newer version", envelope({ version: 2 }), /newer version/],
  ["an unknown field", JSON.stringify({ ...JSON.parse(envelope()), extra: 1 }), /missing or unknown fields/],
  ["a changed scenario", envelope({ sha256: "0".repeat(64) }), /damaged/],
  ["a negative seed", envelope({ seed: -1 }), /usable seed/],
  ["a true seed", envelope({ seed: true }), /usable seed/],
  ["control characters", envelope({ description: "bad\u0007text" }), /can't be shown/],
  ["direction-changing characters", envelope({ author: "evil‮author" }), /can't be shown/],
  ["a description over the limit", envelope({ description: "x".repeat(601) }), /longer than 600/],
  ["a shipped scenario's id", edit('id = "made_up_island_eruption"', 'id = "titanic_1912"'), /belongs to a shipped scenario/],
  ["an unusable id", edit('id = "made_up_island_eruption"', 'id = "../../etc"'), /id can't be used/],
  ["too many hours", edit("hours = 96", "hours = 241"), /240 hours/],
  ["a ship scenario", edit('kind = "terrain"', 'kind = "ship"'), /Ship scenarios/],
  ["nobody in it", edit('kind = "person"', 'kind = "resource"'), /nobody in this/],
  ["scenario text that isn't TOML", envelope({}, "not = = toml"), /can't be read/],
  ["a file over 256 KB", envelope({ description: " ".repeat(300 * 1024) }), /too big/],
];

for (const [name, text, reason] of refused) {
  test(`refuses ${name}`, async () => {
    await assert.rejects(readSim(text), (error) => error instanceof SimError && reason.test(error.message));
  });
}

test("the builder's checklist reports what's missing", () => {
  const items = checklist([{ kind: "person", source: "dials" }]);
  assert.deepEqual(
    items.filter((item) => item.done).map((item) => item.label),
    ["People"],
  );
});

/** Just enough of Upstash's REST API: POST a command, or a list of them to /pipeline. */
function fakeUpstash() {
  const data = new Map();
  const hash = (key) => data.get(key) ?? data.set(key, new Map()).get(key);
  const commands = {
    GET: (key) => data.get(key) ?? null,
    SET(key, value, ...options) {
      if (options.includes("NX") && data.has(key)) return null;
      data.set(key, value);
      return "OK";
    },
    DEL: (key) => (data.delete(key) ? 1 : 0),
    INCR(key) {
      const next = Number(data.get(key) ?? 0) + 1;
      data.set(key, String(next));
      return next;
    },
    HSET: (key, field, value) => (hash(key).set(field, value), 1),
    HGET: (key, field) => hash(key).get(field) ?? null,
    HDEL: (key, field) => (hash(key).delete(field) ? 1 : 0),
    HGETALL: (key) => [...hash(key)].flat(),
    HINCRBY(key, field, by) {
      const next = Number(hash(key).get(field) ?? 0) + Number(by);
      hash(key).set(field, String(next));
      return next;
    },
  };
  const run = ([name, ...args]) => ({ result: commands[name](...args.map(String)) });
  return createServer((request, response) => {
    let body = "";
    request.on("data", (chunk) => (body += chunk));
    request.on("end", () => {
      if (request.headers.authorization !== "Bearer secret") {
        response.writeHead(401).end("{}");
        return;
      }
      const parsed = JSON.parse(body);
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify(request.url === "/pipeline" ? parsed.map(run) : run(parsed)));
    });
  });
}

const sim = (id, sha256) => ({ id, sha256, licence: "", title: id, author: "", description: "", createdUtc: "", seed: 1, hours: 24, needsDataPack: false, people: 1, entities: [], postedAt: "2026-11-06T00:00:00Z" });
const review = (id, rating) => ({ id, name: "A", rating, text: "Fine", createdAt: "2026-11-06T00:00:00Z" });

async function behavesAsAStore(store) {
  assert.equal(await store.add(sim("one", "a"), "raw-one"), "added");
  assert.equal(await store.add(sim("one", "b"), "raw-two"), "id-taken");
  assert.equal(await store.add(sim("two", "a"), "raw-two"), "duplicate");
  assert.equal(await store.raw("one"), "raw-one");
  assert.equal((await store.get("one")).id, "one");
  assert.equal(await store.get("nope"), null);
  assert.deepEqual((await store.list()).map((row) => row.id), ["one"]);
  // A refused id must not hold on to its hash, or the same file could never be posted under a new id.
  assert.equal(await store.add(sim("three", "b"), "raw-three"), "added");

  await store.addReview("one", review("r1", 5));
  await store.addReview("one", review("r2", 2));
  assert.deepEqual((await store.ratings()).one, { sum: 7, count: 2 });
  assert.equal((await store.reviews("one")).length, 2);
  assert.equal(await store.removeReview("one", "r1"), true);
  assert.equal(await store.removeReview("one", "r1"), false);
  assert.deepEqual((await store.ratings()).one, { sum: 2, count: 1 });

  assert.equal(await store.allow("key", 2, 60), true);
  assert.equal(await store.allow("key", 2, 60), true);
  assert.equal(await store.allow("key", 2, 60), false);

  assert.equal(await store.remove("one"), true);
  assert.equal(await store.remove("one"), false);
  assert.equal(await store.raw("one"), null);
  assert.deepEqual(await store.reviews("one"), []);
  assert.equal(await store.add(sim("again", "a"), "raw"), "added", "removing a sim frees its hash");
}

test("the file store keeps sims, reviews and limits", async () => {
  const folder = mkdtempSync(join(tmpdir(), "qognition-store-"));
  try {
    await behavesAsAStore(new FileStore(join(folder, "nested", "repo.json")));
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});

test("the file store doesn't lose writes made at the same moment", async () => {
  const folder = mkdtempSync(join(tmpdir(), "qognition-store-"));
  try {
    const store = new FileStore(join(folder, "repo.json"));
    await Promise.all(Array.from({ length: 20 }, (_, index) => store.addReview("one", review(`r${index}`, 3))));
    assert.equal((await store.reviews("one")).length, 20);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});

test("the Redis store behaves the same, against a stand-in for Upstash", async () => {
  const server = fakeUpstash();
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  try {
    const url = `http://127.0.0.1:${server.address().port}`;
    await behavesAsAStore(new RedisStore(url, "secret"));
    await assert.rejects(new RedisStore(url, "wrong").list(), /401/);
  } finally {
    server.close();
  }
});
