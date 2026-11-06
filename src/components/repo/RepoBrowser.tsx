"use client";
import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { Icon } from "@/components/Icons";
import { hazardsOf, sourceName } from "@/lib/qsim";
import type { Sim } from "@/lib/repo";
import { RatingStars } from "./RatingStars";
import { UploadDialog } from "./UploadDialog";

const score = (sim: Sim) => (sim.rating.count ? sim.rating.sum / sim.rating.count : 0);
const sorters: Record<string, (a: Sim, b: Sim) => number> = {
  newest: (a, b) => b.postedAt.localeCompare(a.postedAt),
  rated: (a, b) => score(b) - score(a) || b.rating.count - a.rating.count,
  reviewed: (a, b) => b.rating.count - a.rating.count,
};
const title = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);

function SimCard({ sim }: { sim: Sim }) {
  const hazards = hazardsOf(sim.entities);
  const minds = [...new Set(sim.entities.flatMap((entity) => (entity.mind ? [entity.mind] : [])))];
  const sources = [...new Set(sim.entities.map((entity) => sourceName(entity.source)))];
  return (
    <article className="q-card sim-card" data-accent style={{ "--accent": sim.official ? "var(--green)" : "var(--purple)" } as React.CSSProperties}>
      <div className="badge-row">
        <span className="q-badge" style={{ "--tone": sim.official ? "var(--green-dark)" : "var(--purple)" } as React.CSSProperties}>
          {sim.official ? "Qognition team" : "Community"}
        </span>
        {sim.needsDataPack && (
          <span className="q-badge" style={{ "--tone": "var(--ember)" } as React.CSSProperties}>
            Needs data pack
          </span>
        )}
      </div>
      <h2>{sim.title}</h2>
      <p className="sim-sub">
        By {sim.author || "Anonymous"} &nbsp;•&nbsp; Seed {sim.seed}
      </p>
      <p className="sim-desc">{sim.description || "The author didn't add a description."}</p>
      <ul className="spec-list">
        <li>
          <b>People</b>
          <span>
            {sim.people} over {sim.hours} hours
          </span>
        </li>
        <li>
          <b>Hazards</b>
          <span>{hazards.map(title).join(", ") || "None set"}</span>
        </li>
        <li>
          <b>Mind</b>
          <span>{minds.map((mind) => title(mind.replaceAll("_", " "))).join(", ") || "Not set"}</span>
        </li>
        <li>
          <b>Numbers</b>
          <span>{sources.join(", ")}</span>
        </li>
      </ul>
      <div className="sim-card-foot">
        <RatingStars rating={sim.rating} />
        <Link className="q-btn q-btn--vivid q-btn--small q-btn--blue" href={`/repo/${sim.id}/`} aria-label={`View sim: ${sim.title}`}>
          <span>View sim</span>
        </Link>
      </div>
    </article>
  );
}

export function RepoBrowser({ sims, canPost, storeOk }: { sims: Sim[]; canPost: boolean; storeOk: boolean }) {
  const [query, setQuery] = useState("");
  const [hazard, setHazard] = useState("");
  const [sort, setSort] = useState("rated");
  const [sharing, setSharing] = useState(false);
  const search = useDeferredValue(query.trim().toLowerCase());
  const hazards = useMemo(() => [...new Set(sims.flatMap((sim) => hazardsOf(sim.entities)))], [sims]);
  const shown = useMemo(
    () =>
      sims
        .filter((sim) => !hazard || sim.entities.some((entity) => entity.kind === hazard))
        .filter((sim) => !search || `${sim.title} ${sim.author} ${sim.description}`.toLowerCase().includes(search))
        .toSorted(sorters[sort]),
    [sims, hazard, search, sort],
  );
  return (
    <>
      <header className="repo-top">
        <div className="page-heading">
          <p className="q-kicker">Community</p>
          <h1>Public Repo</h1>
          <p>Scenarios people have built in Qognition. Download one, run it, and say how it went.</p>
        </div>
        <button className="q-btn q-btn--gold" onClick={() => setSharing(true)} disabled={!canPost}>
          <Icon name="upload" />
          <span>Post a sim</span>
        </button>
      </header>
      <p className="q-sub repo-warning">
        <strong>Anyone can publish, and nobody has validated these.</strong> A sim is a model someone built, not a prediction of any real event, and it is not
        advice for any real emergency.
        {!storeOk && " The database can't be reached right now, so only the team's sims are showing."}
        {storeOk && !canPost && " Posting isn't switched on yet: this site has no database connected."}
      </p>
      <div className="repo-tools">
        <label className="q-field">
          Search
          <input className="q-input" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Title, author or description" />
        </label>
        <label className="q-field">
          Hazard
          <select className="q-select" value={hazard} onChange={(event) => setHazard(event.target.value)}>
            <option value="">All hazards</option>
            {hazards.map((name) => (
              <option value={name} key={name}>
                {title(name)}
              </option>
            ))}
          </select>
        </label>
        <label className="q-field">
          Sort by
          <select className="q-select" value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="rated">Top rated</option>
            <option value="reviewed">Most reviewed</option>
            <option value="newest">Newest</option>
          </select>
        </label>
      </div>
      {shown.length ? (
        <div className="repo-grid">
          {shown.map((sim) => (
            <SimCard sim={sim} key={sim.id} />
          ))}
        </div>
      ) : (
        <div className="q-card empty-state">
          <h2 className="q-heading">Nothing matches that</h2>
          <p style={{ marginTop: 6 }}>Try fewer words, or a different hazard.</p>
        </div>
      )}
      {sharing && <UploadDialog close={() => setSharing(false)} />}
    </>
  );
}
