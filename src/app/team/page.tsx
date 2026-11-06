import type { Metadata } from "next";
import { Icon } from "@/components/Icons";
import { credits, team, type TeamMember } from "@/data/team";

export const metadata: Metadata = {
  title: "Team",
  description: "The people behind Qognition.",
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

function Links({ links }: { links: TeamMember["links"] }) {
  const rows = [
    links.github && { label: "GitHub", href: links.github },
    links.linkedin && { label: "LinkedIn", href: links.linkedin },
    links.website && { label: "Website", href: links.website },
    links.email && { label: "Email", href: `mailto:${links.email}` },
  ].filter((row) => !!row);
  if (!rows.length) return null;
  return (
    <div className="team-links">
      {rows.map((row) => (
        <a className="q-btn q-btn--small" href={row.href} key={row.label} target="_blank" rel="noreferrer">
          <Icon name="external" width="14" height="14" />
          <span>{row.label}</span>
        </a>
      ))}
    </div>
  );
}

export default function Team() {
  return (
    <div className="q-page">
      <header className="page-heading">
        <p className="q-kicker">Qiskit Fall Fest 2026</p>
        <h1>The team</h1>
        <p>The people behind Qognition.</p>
      </header>
      <div className="team-grid">
        {team.map((member) => (
          <article className="q-card team-card" key={member.name}>
            <div className="team-portrait">
              {member.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={member.photo} alt={`Portrait of ${member.name}`} width="640" height="800" />
              ) : (
                initials(member.name)
              )}
            </div>
            <h2>{member.name}</h2>
            <p className="team-school">{member.university}</p>
            <p className="team-place">{[member.study, member.country].filter(Boolean).join(" • ")}</p>
            <Links links={member.links} />
          </article>
        ))}
      </div>
      <section className="q-card team-credits" aria-labelledby="team-credits">
        <h2 id="team-credits">Credits</h2>
        <dl>
          {credits.map((credit) => (
            <div key={credit.work}>
              <dt>{credit.work}</dt>
              <dd>{credit.people}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
