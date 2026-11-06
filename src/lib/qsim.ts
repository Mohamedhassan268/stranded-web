// Reads a .qsim file the way stranded_physics/entities/simfile.py does, for a website that takes
// uploads from strangers. Runs on the server before anything is stored, and in the browser so a
// person sees the result before posting. File-level rules match the app's: format, version, exact
// fields, hash, seed, text checks and hard limits. The app's full scenario rules live in Python,
// so the app still makes its own check when a sim is opened.
import { parse } from "smol-toml";

export const MAX_BYTES = 256 * 1024;
const FORMAT = "qognition-sim";
const VERSION = 1;
const MAX_ENTITIES = 64;
const MAX_PEOPLE = 500;
const MAX_HOURS = 240;
const MAX_SEED = 2 ** 31 - 1;
const MAX_SHORT_TEXT = 120;
const MAX_LONG_TEXT = 600;
const ENVELOPE_KEYS = ["author", "created_utc", "description", "format", "needs_data_pack", "scenario", "seed", "sha256", "title", "version"];
const OPTIONAL_ENVELOPE_KEYS = ["licence"]; // Files saved before licences were added don't have it.
const ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,39}$/;
const SHIP_KINDS = new Set(["ship", "breach", "lifeboats", "sea", "passengers"]);
const DATA_PACK_SOURCES = new Set(["terrain/replay", "weather/replay", "weather/catalogue", "eruption/replay", "storm/replay"]);
// Results belong to a shipped scenario's id, so a sim file can't borrow one. From stranded_physics/scenario_cards/.
const SHIPPED_IDS = new Set([
  "beryl_2024",
  "example_village",
  "generated_eruption",
  "generated_island",
  "generated_storm",
  "st_vincent_2021",
  "st_vincent_2021_full",
  "titanic_1912",
]);
const BAD_TEXT = /[\p{Cc}\p{Cf}\p{Cs}\p{Co}\p{Cn}]/u;

/** A problem with a file or a form, worded for the person who sent it. */
export class SimError extends Error {}

export type SimEntity = { kind: string; source: string; name?: string; mind?: string; count?: number };

export type ParsedSim = {
  id: string;
  title: string;
  author: string;
  description: string;
  createdUtc: string;
  seed: number;
  hours: number;
  needsDataPack: boolean;
  sha256: string;
  licence: string;
  people: number;
  entities: SimEntity[];
};

/** One piece of someone else's text. Control and direction-changing characters are refused, not cleaned. */
export function plainText(value: unknown, limit: number, what: string): string {
  if (typeof value !== "string") throw new SimError(`${what} has to be text`);
  if ([...value].length > limit) throw new SimError(`${what} is longer than ${limit} characters`);
  if (BAD_TEXT.test(value.replaceAll("\n", ""))) throw new SimError(`${what} holds characters that can't be shown`);
  return value;
}

function walkText(value: unknown): void {
  if (typeof value === "string") plainText(value, MAX_SHORT_TEXT, "The scenario");
  else if (Array.isArray(value)) value.forEach(walkText);
  else if (value && typeof value === "object" && !(value instanceof Date)) {
    for (const [key, item] of Object.entries(value)) {
      walkText(key);
      walkText(item);
    }
  }
}

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function isSeed(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= MAX_SEED;
}

/** Checks text from anywhere. Throws SimError, with a reason a person can act on, for anything wrong. */
export async function readSim(text: string): Promise<ParsedSim> {
  if (new TextEncoder().encode(text).length > MAX_BYTES) throw new SimError(`That file is too big to be a sim file. The limit is ${MAX_BYTES.toLocaleString("en")} bytes`);
  let envelope: Record<string, unknown>;
  try {
    envelope = JSON.parse(text);
  } catch {
    throw new SimError("That isn't a sim file: it can't be read");
  }
  if (!envelope || typeof envelope !== "object" || Array.isArray(envelope) || envelope.format !== FORMAT) throw new SimError("That isn't a Qognition sim file");
  if (!Number.isInteger(envelope.version) || (envelope.version as number) < 1) throw new SimError("That sim file has no usable version");
  if ((envelope.version as number) > VERSION) throw new SimError("That sim file was made by a newer version of the app");
  const keys = Object.keys(envelope).filter((key) => !OPTIONAL_ENVELOPE_KEYS.includes(key));
  if (keys.sort().join() !== ENVELOPE_KEYS.join()) throw new SimError("That sim file has missing or unknown fields");
  const scenarioText = envelope.scenario;
  if (typeof scenarioText !== "string" || (await sha256(scenarioText)) !== envelope.sha256) throw new SimError("That sim file is damaged: its contents don't match its hash");
  if (!isSeed(envelope.seed)) throw new SimError("That sim file has no usable seed");
  const author = plainText(envelope.author, MAX_SHORT_TEXT, "The author");
  const description = plainText(envelope.description, MAX_LONG_TEXT, "The description");
  const createdUtc = plainText(envelope.created_utc, MAX_SHORT_TEXT, "The date");
  const licence = plainText(envelope.licence ?? "", MAX_SHORT_TEXT, "The licence");

  let scenario: Record<string, unknown>;
  try {
    scenario = parse(scenarioText) as Record<string, unknown>;
  } catch {
    throw new SimError("That sim file's scenario can't be read");
  }
  walkText(scenario);
  const id = scenario.id;
  if (typeof id !== "string" || !ID_PATTERN.test(id)) throw new SimError("That sim's id can't be used. An id is up to 40 lowercase letters, digits, hyphens or underscores");
  if (SHIPPED_IDS.has(id)) throw new SimError(`"${id}" belongs to a shipped scenario, and results are tied to it, so a sim file can't use it. Choose another id`);
  const title = plainText(scenario.title, MAX_SHORT_TEXT, "The title");
  if (!title.trim()) throw new SimError("That sim has no title");
  const hours = scenario.hours;
  if (!Number.isInteger(hours) || (hours as number) < 1 || (hours as number) > MAX_HOURS) throw new SimError(`A sim file can run for ${MAX_HOURS} hours at most`);

  const rows = scenario.entity;
  if (!Array.isArray(rows)) throw new SimError("There is nothing in that scenario yet");
  if (rows.length > MAX_ENTITIES) throw new SimError(`This has ${rows.length} things in it. A sim file can hold ${MAX_ENTITIES}`);
  const entities: SimEntity[] = rows.map((row) => {
    const { kind, source, name, mind, count } = row as Record<string, unknown>;
    if (typeof kind !== "string" || typeof source !== "string") throw new SimError("Every part of a scenario needs a kind and a source");
    return {
      kind,
      source,
      ...(typeof name === "string" ? { name } : {}),
      ...(typeof mind === "string" ? { mind } : {}),
      ...(typeof count === "number" ? { count } : {}),
    };
  });
  if (entities.some((entity) => SHIP_KINDS.has(entity.kind))) throw new SimError("Ship scenarios only run from the command line for now, so they can't be shared as sim files");
  const people = entities.reduce((total, entity) => total + (entity.kind === "person" ? 1 : entity.kind === "group" ? (entity.count ?? 0) : 0), 0);
  if (!people) throw new SimError("There is nobody in this yet. Add a person or a group");
  if (people > MAX_PEOPLE) throw new SimError(`This has ${people} people. A sim file can hold ${MAX_PEOPLE}`);

  return {
    id,
    title,
    author,
    description,
    createdUtc,
    seed: envelope.seed,
    hours: hours as number,
    needsDataPack: entities.some((entity) => DATA_PACK_SOURCES.has(`${entity.kind}/${entity.source}`)),
    sha256: envelope.sha256 as string,
    licence,
    people,
    entities,
  };
}

/** The builder's five checks, from `checklist` in stranded_physics/entities/draft.py. */
export function checklist(entities: SimEntity[]): { label: string; done: boolean }[] {
  const kinds = new Set(entities.map((entity) => entity.kind));
  return [
    { label: "Land", done: kinds.has("terrain") },
    { label: "Weather", done: kinds.has("weather") },
    { label: "Danger", done: kinds.has("eruption") || kinds.has("storm") },
    { label: "People", done: kinds.has("person") || kinds.has("group") },
    { label: "Safe place", done: kinds.has("shelter") },
  ];
}

const HAZARDS = ["eruption", "storm", "ash", "flow", "lahar", "gas", "lava"];

/** Hazards named in a sim, in a steady order, for cards and filters. */
export function hazardsOf(entities: SimEntity[]): string[] {
  const kinds = new Set(entities.map((entity) => entity.kind));
  return HAZARDS.filter((kind) => kinds.has(kind));
}

const SOURCE_NAMES: Record<string, string> = { dials: "Set by hand", catalogue: "Sampled from records", replay: "Real record" };

export const sourceName = (source: string) => SOURCE_NAMES[source] ?? source;

/** One builder row: `Person "A villager": Quantum`. */
export function entityTitle(entity: SimEntity): string {
  const kind = entity.kind.charAt(0).toUpperCase() + entity.kind.slice(1);
  const name = entity.name ? ` "${entity.name}"` : "";
  const mind = entity.mind ? `: ${entity.mind.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase())}` : "";
  const count = entity.count ? ` (${entity.count} people)` : "";
  return `${kind}${name}${count}${mind}`;
}
