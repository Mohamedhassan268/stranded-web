import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icons";
import { CopyCommand } from "@/components/repo/CopyCommand";
import { Reviews } from "@/components/repo/Reviews";
import { RatingStars } from "@/components/repo/RatingStars";
import { SimContents } from "@/components/repo/SimContents";
import { canPost, getSim } from "@/lib/repo";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await getSim((await params).id);
  return found ? { title: found.sim.title, description: found.sim.description } : { title: "Sim not found" };
}

export default async function SimPage({ params }: Props) {
  const { id } = await params;
  const found = await getSim(id);
  if (!found) notFound();
  const { sim, raw, reviews } = found;
  const scenario = (JSON.parse(raw) as { scenario: string }).scenario;
  const host = (await headers()).get("host") ?? "";
  const scheme = host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
  const fileUrl = `/api/sims/${sim.id}/file/`;
  return (
    <div className="q-page">
      <Link className="back-link" href="/repo/">
        &lt; Public Repo
      </Link>
      <header className="detail-top">
        <h1>{sim.title}</h1>
        <p>
          By {sim.author || "Anonymous"} &nbsp;•&nbsp; Seed {sim.seed} &nbsp;•&nbsp; {sim.hours} hours
        </p>
        <div className="hero-actions">
          <a className="q-btn q-btn--gold" href={fileUrl} download={`${sim.id}.qsim`}>
            <Icon name="download" />
            <span>Download .qsim</span>
          </a>
        </div>
      </header>
      <p className="q-sub repo-warning">
        <strong>Nobody has validated this.</strong> A sim is a model someone built, not a prediction of any real event, and it is not advice for any real
        emergency.
      </p>
      <div className="detail-grid">
        <div className="detail-stack">
          <section className="q-card">
            <h2 className="q-heading">What it is</h2>
            <p>{sim.description || "The author didn't add a description."}</p>
            <div className="badge-row">
              <span className="q-badge" style={{ "--tone": sim.official ? "var(--green-dark)" : "var(--purple)" } as React.CSSProperties}>
                {sim.official ? "Qognition team" : "Community"}
              </span>
              <span className="q-badge" style={{ "--tone": sim.needsDataPack ? "var(--ember)" : "var(--cyan)" } as React.CSSProperties}>
                {sim.needsDataPack ? "Needs the data pack" : "Runs anywhere"}
              </span>
            </div>
          </section>
          <section className="q-card">
            <SimContents entities={sim.entities} />
          </section>
          <section className="q-card">
            <h2 className="q-heading">Run it</h2>
            <p>With the simulator installed, this opens the sim directly. The app checks a file again before opening it.</p>
            <CopyCommand command={`python main.py --open ${scheme}://${host}${fileUrl}`} />
            {sim.needsDataPack && (
              <p className="q-notice" style={{ marginTop: 8 }}>
                This sim uses recorded data, so it also needs the 230 MB data pack: <code>python tools/fetch_artifacts.py</code>
              </p>
            )}
            <details style={{ marginTop: 12 }}>
              <summary className="q-label">Read the scenario file</summary>
              <pre className="q-sub raw-scenario" tabIndex={0}>{scenario}</pre>
            </details>
            <p className="q-notice" style={{ marginTop: 8, overflowWrap: "anywhere" }}>
              SHA-256 <code>{sim.sha256}</code>
              {sim.licence === "CC-BY-4.0" && (
                <>
                  <br />
                  Shared under <a href="/licences/CC-BY-4.0.txt">CC BY 4.0</a>
                </>
              )}
            </p>
          </section>
        </div>
        <div className="detail-stack">
          <section className="q-card">
            <h2 className="q-heading">Reviews</h2>
            <p style={{ marginTop: 6 }}>
              <RatingStars rating={sim.rating} />
            </p>
            <Reviews simId={sim.id} initial={reviews} canPost={canPost()} />
          </section>
        </div>
      </div>
    </div>
  );
}
