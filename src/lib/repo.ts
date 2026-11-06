// The public repo: sims that ship with the site, plus sims people post. Both pages and API routes
// use these functions, so each rule is written once.
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import community from "@/data/community-sims.json";
import { plainText, readSim, SimError, type ParsedSim } from "./qsim";
import { getStore, type Rating, type Review, type StoredSim } from "./store";

export type Sim = StoredSim & { official: boolean; rating: Rating };

const NAME_LIMIT = 40;
const REVIEW_LIMIT = 1000;
const UPLOADS_PER_HOUR = 5;
const REVIEWS_PER_HOUR = 20;
const REVIEWS_PER_SIM_PER_DAY = 3;

let official: Promise<{ sim: StoredSim; raw: string }[]> | undefined;

function officialSims() {
  official ??= Promise.all(
    community.sims.map(async ({ raw }) => {
      const sim: ParsedSim = await readSim(raw);
      return { sim: { ...sim, postedAt: sim.createdUtc }, raw };
    }),
  );
  return official;
}

const noRating: Rating = { sum: 0, count: 0 };

/** Everything to show. If the database is down the shipped sims still appear. */
export async function listSims(): Promise<{ sims: Sim[]; storeOk: boolean }> {
  const shipped = await officialSims();
  const store = getStore();
  let posted: StoredSim[] = [];
  let ratings: Record<string, Rating> = {};
  let storeOk = true;
  try {
    [posted, ratings] = await Promise.all([store.list(), store.ratings()]);
  } catch (error) {
    console.error("Public repo: could not read the store", error);
    storeOk = false;
  }
  const sims = [...shipped.map(({ sim }) => ({ sim, official: true })), ...posted.map((sim) => ({ sim, official: false }))];
  return { sims: sims.map(({ sim, official }) => ({ ...sim, official, rating: ratings[sim.id] ?? noRating })), storeOk };
}

export async function getSim(id: string): Promise<{ sim: Sim; raw: string; reviews: Review[] } | null> {
  const store = getStore();
  const shipped = (await officialSims()).find(({ sim }) => sim.id === id);
  let reviews: Review[] = [];
  try {
    reviews = await store.reviews(id);
  } catch (error) {
    console.error("Public repo: could not read reviews", error);
  }
  reviews = reviews.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt));
  const rating = { sum: reviews.reduce((total, review) => total + review.rating, 0), count: reviews.length };
  if (shipped) return { sim: { ...shipped.sim, official: true, rating }, raw: shipped.raw, reviews };
  const [sim, raw] = await Promise.all([store.get(id), store.raw(id)]);
  return sim && raw ? { sim: { ...sim, official: false, rating }, raw, reviews } : null;
}

export async function rawSim(id: string): Promise<string | null> {
  return (await officialSims()).find(({ sim }) => sim.id === id)?.raw ?? getStore().raw(id);
}

export function canPost() {
  return getStore().writable;
}

/** A request's address, hashed. Only counts of it are kept, for rate limits, and they expire. */
export function requester(request: Request): string {
  const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  return createHash("sha256")
    .update(`${process.env.RATE_LIMIT_SALT ?? "qognition"}:${address}`)
    .digest("hex")
    .slice(0, 32);
}

export class RepoError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function requireWritable() {
  if (!getStore().writable) throw new RepoError("Posting isn't switched on yet: this site has no database connected.", 503);
}

export async function postSim(raw: string, who: string): Promise<ParsedSim> {
  requireWritable();
  const sim = await readSim(raw);
  if ((await officialSims()).some((row) => row.sim.id === sim.id)) throw new RepoError(`"${sim.id}" is already in the repo. Give yours a new id in the builder's Advanced view`, 409);
  const store = getStore();
  if (!(await store.allow(`upload:${who}`, UPLOADS_PER_HOUR, 3600))) throw new RepoError("That's a lot of sims in an hour. Please try again later.", 429);
  const result = await store.add({ ...sim, postedAt: new Date().toISOString() }, raw);
  if (result === "id-taken") throw new RepoError(`"${sim.id}" is already in the repo. Give yours a new id in the builder's Advanced view`, 409);
  if (result === "duplicate") throw new RepoError("This exact scenario is already in the repo.", 409);
  return sim;
}

export async function postReview(simId: string, input: { name?: unknown; rating?: unknown; text?: unknown }, who: string): Promise<Review> {
  requireWritable();
  const rating = input.rating;
  if (!Number.isInteger(rating) || (rating as number) < 1 || (rating as number) > 5) throw new SimError("Choose from one to five stars");
  const text = plainText(input.text, REVIEW_LIMIT, "Your review").trim();
  if (text.length < 3) throw new SimError("Say a little about how it went");
  const name = plainText(input.name ?? "", NAME_LIMIT, "Your name").trim() || "Anonymous";
  const found = await getSim(simId);
  if (!found) throw new RepoError("That sim isn't in the repo.", 404);
  const store = getStore();
  const allowed = (await store.allow(`review:${who}`, REVIEWS_PER_HOUR, 3600)) && (await store.allow(`review:${who}:${simId}`, REVIEWS_PER_SIM_PER_DAY, 86400));
  if (!allowed) throw new RepoError("You've reviewed a lot recently. Please try again later.", 429);
  const review: Review = { id: randomUUID(), name, rating: rating as number, text, createdAt: new Date().toISOString() };
  await store.addReview(simId, review);
  return review;
}

/** True when the request carries MODERATION_TOKEN. With no token set, nobody can moderate. */
export function isModerator(request: Request): boolean {
  const expected = process.env.MODERATION_TOKEN;
  if (!expected) return false;
  const digest = (text: string) => createHash("sha256").update(text).digest();
  return timingSafeEqual(digest(request.headers.get("authorization") ?? ""), digest(`Bearer ${expected}`));
}

/** The JSON answer for anything a route handler throws. */
export function errorResponse(error: unknown): Response {
  if (error instanceof RepoError) return Response.json({ error: error.message }, { status: error.status });
  if (error instanceof SimError) return Response.json({ error: error.message }, { status: 400 });
  console.error("Public repo:", error);
  return Response.json({ error: "Something went wrong on our side. Nothing was saved." }, { status: 500 });
}
