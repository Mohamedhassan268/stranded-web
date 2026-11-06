// Where posted sims and reviews live. Redis in production, a local JSON file in development.
//
//   KV_REST_API_URL, KV_REST_API_TOKEN   an Upstash Redis database, the names Vercel sets when one
//                                        is connected (UPSTASH_REDIS_REST_* also work)
//   REPO_DATA_FILE                       where the local file goes (default .data/repo.json)
//
// With no database on Vercel the file system is read-only, so the store says it can't be written
// to and the site keeps showing the sims that ship with it.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { ParsedSim } from "./qsim";

export type StoredSim = ParsedSim & { postedAt: string };
export type Review = { id: string; name: string; rating: number; text: string; createdAt: string };
export type Rating = { sum: number; count: number };

export interface Store {
  readonly writable: boolean;
  list(): Promise<StoredSim[]>;
  ratings(): Promise<Record<string, Rating>>;
  get(id: string): Promise<StoredSim | null>;
  raw(id: string): Promise<string | null>;
  /** Claims the id and hash. Says which was already taken, and stores nothing in that case. */
  add(sim: StoredSim, raw: string): Promise<"added" | "id-taken" | "duplicate">;
  remove(id: string): Promise<boolean>;
  reviews(id: string): Promise<Review[]>;
  addReview(simId: string, review: Review): Promise<void>;
  removeReview(simId: string, reviewId: string): Promise<boolean>;
  /** Counts one use of `key`. False once it passes `limit` within `seconds`. */
  allow(key: string, limit: number, seconds: number): Promise<boolean>;
}

class ReadOnlyStore implements Store {
  readonly writable = false;
  async list() {
    return [];
  }
  async ratings() {
    return {};
  }
  async get() {
    return null;
  }
  async raw() {
    return null;
  }
  async reviews() {
    return [];
  }
  async add(): Promise<never> {
    throw new Error("read-only");
  }
  async remove(): Promise<never> {
    throw new Error("read-only");
  }
  async addReview(): Promise<never> {
    throw new Error("read-only");
  }
  async removeReview(): Promise<never> {
    throw new Error("read-only");
  }
  async allow() {
    return false;
  }
}

type FileData = {
  sims: Record<string, { sim: StoredSim; raw: string }>;
  reviews: Record<string, Review[]>;
  hits: Record<string, { count: number; until: number }>;
};

export class FileStore implements Store {
  readonly writable = true;
  private readonly path: string;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(path: string) {
    this.path = path;
  }

  private async load(): Promise<FileData> {
    try {
      return JSON.parse(await readFile(this.path, "utf8"));
    } catch {
      return { sims: {}, reviews: {}, hits: {} };
    }
  }

  /** Runs one change at a time, so two requests can't overwrite each other. */
  private change<T>(work: (data: FileData) => T): Promise<T> {
    const run = this.queue.then(async () => {
      const data = await this.load();
      const result = work(data);
      await mkdir(dirname(this.path), { recursive: true });
      await writeFile(this.path, JSON.stringify(data));
      return result;
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  async list() {
    return Object.values((await this.load()).sims).map((row) => row.sim);
  }

  async ratings() {
    const { reviews } = await this.load();
    return Object.fromEntries(Object.entries(reviews).map(([id, rows]) => [id, { sum: rows.reduce((total, row) => total + row.rating, 0), count: rows.length }]));
  }

  async get(id: string) {
    return (await this.load()).sims[id]?.sim ?? null;
  }

  async raw(id: string) {
    return (await this.load()).sims[id]?.raw ?? null;
  }

  add(sim: StoredSim, raw: string) {
    return this.change((data) => {
      if (data.sims[sim.id]) return "id-taken" as const;
      if (Object.values(data.sims).some((row) => row.sim.sha256 === sim.sha256)) return "duplicate" as const;
      data.sims[sim.id] = { sim, raw };
      return "added" as const;
    });
  }

  remove(id: string) {
    return this.change((data) => {
      const existed = Boolean(data.sims[id]);
      delete data.sims[id];
      delete data.reviews[id];
      return existed;
    });
  }

  async reviews(id: string) {
    return (await this.load()).reviews[id] ?? [];
  }

  addReview(simId: string, review: Review) {
    return this.change((data) => {
      (data.reviews[simId] ??= []).push(review);
    });
  }

  removeReview(simId: string, reviewId: string) {
    return this.change((data) => {
      const rows = data.reviews[simId] ?? [];
      data.reviews[simId] = rows.filter((row) => row.id !== reviewId);
      return data.reviews[simId].length !== rows.length;
    });
  }

  allow(key: string, limit: number, seconds: number) {
    return this.change((data) => {
      const now = Date.now();
      const hit = data.hits[key]?.until > now ? data.hits[key] : { count: 0, until: now + seconds * 1000 };
      hit.count += 1;
      data.hits[key] = hit;
      return hit.count <= limit;
    });
  }
}

const key = {
  sims: "qsim:sims",
  file: (id: string) => `qsim:file:${id}`,
  hash: (sha: string) => `qsim:hash:${sha}`,
  reviews: (id: string) => `qsim:reviews:${id}`,
  sum: "qsim:rating:sum",
  count: "qsim:rating:count",
  hit: (name: string) => `qsim:hit:${name}`,
};

type Command = (string | number)[];

/** Talks to Upstash's REST API with plain fetch, so the site needs no database driver. */
export class RedisStore implements Store {
  readonly writable = true;
  private readonly url: string;
  private readonly token: string;

  constructor(url: string, token: string) {
    this.url = url;
    this.token = token;
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(this.url.replace(/\/$/, "") + path, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Redis answered ${response.status}`);
    return response.json();
  }

  private async run<T = unknown>(command: Command): Promise<T> {
    const { result, error } = await this.post<{ result: T; error?: string }>("", command);
    if (error) throw new Error(error);
    return result;
  }

  private async pipeline(commands: Command[]): Promise<unknown[]> {
    const rows = await this.post<{ result: unknown; error?: string }[]>("/pipeline", commands);
    return rows.map((row) => {
      if (row.error) throw new Error(row.error);
      return row.result;
    });
  }

  /** HGETALL comes back as a flat list: field, value, field, value. */
  private static pairs(flat: unknown): [string, string][] {
    const list = (flat ?? []) as string[];
    return Array.from({ length: list.length / 2 }, (_, index) => [list[index * 2], list[index * 2 + 1]]);
  }

  async list() {
    return RedisStore.pairs(await this.run(["HGETALL", key.sims])).map(([, json]) => JSON.parse(json) as StoredSim);
  }

  async ratings() {
    const [sums, counts] = await this.pipeline([
      ["HGETALL", key.sum],
      ["HGETALL", key.count],
    ]);
    const sum = Object.fromEntries(RedisStore.pairs(sums));
    return Object.fromEntries(RedisStore.pairs(counts).map(([id, count]) => [id, { sum: Number(sum[id] ?? 0), count: Number(count) }]));
  }

  async get(id: string) {
    const json = await this.run<string | null>(["HGET", key.sims, id]);
    return json ? (JSON.parse(json) as StoredSim) : null;
  }

  raw(id: string) {
    return this.run<string | null>(["GET", key.file(id)]);
  }

  async add(sim: StoredSim, raw: string) {
    // SET NX claims each name in one step, so two people posting at once can't both win.
    if ((await this.run(["SET", key.hash(sim.sha256), sim.id, "NX"])) === null) return "duplicate" as const;
    if ((await this.run(["SET", key.file(sim.id), raw, "NX"])) === null) {
      await this.run(["DEL", key.hash(sim.sha256)]);
      return "id-taken" as const;
    }
    await this.run(["HSET", key.sims, sim.id, JSON.stringify(sim)]);
    return "added" as const;
  }

  async remove(id: string) {
    const sim = await this.get(id);
    if (!sim) return false;
    await this.pipeline([
      ["HDEL", key.sims, id],
      ["DEL", key.file(id)],
      ["DEL", key.hash(sim.sha256)],
      ["DEL", key.reviews(id)],
      ["HDEL", key.sum, id],
      ["HDEL", key.count, id],
    ]);
    return true;
  }

  async reviews(id: string) {
    return RedisStore.pairs(await this.run(["HGETALL", key.reviews(id)])).map(([, json]) => JSON.parse(json) as Review);
  }

  async addReview(simId: string, review: Review) {
    await this.pipeline([
      ["HSET", key.reviews(simId), review.id, JSON.stringify(review)],
      ["HINCRBY", key.sum, simId, review.rating],
      ["HINCRBY", key.count, simId, 1],
    ]);
  }

  async removeReview(simId: string, reviewId: string) {
    const json = await this.run<string | null>(["HGET", key.reviews(simId), reviewId]);
    if (!json) return false;
    await this.pipeline([
      ["HDEL", key.reviews(simId), reviewId],
      ["HINCRBY", key.sum, simId, -(JSON.parse(json) as Review).rating],
      ["HINCRBY", key.count, simId, -1],
    ]);
    return true;
  }

  async allow(name: string, limit: number, seconds: number) {
    // SET NX starts the window once; INCR then counts within it.
    const [, count] = await this.pipeline([
      ["SET", key.hit(name), 0, "EX", seconds, "NX"],
      ["INCR", key.hit(name)],
    ]);
    return Number(count) <= limit;
  }
}

let store: Store | undefined;

export function getStore(): Store {
  if (store) return store;
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) store = new RedisStore(url, token);
  else if (process.env.VERCEL) store = new ReadOnlyStore();
  else store = new FileStore(resolve(/*turbopackIgnore: true*/ process.env.REPO_DATA_FILE ?? ".data/repo.json"));
  return store;
}
