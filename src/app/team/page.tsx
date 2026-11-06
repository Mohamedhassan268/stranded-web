import type { Metadata } from "next";
import { Icon } from "@/components/Icons";
import { team, type TeamMember } from "@/data/team";

export const metadata: Metadata = {
  title: "Team",
  description: "The people behind Qognition.",
};

const tones: Record<TeamMember["tone"], string> = {
  green: "var(--green-dark)",
  orange: "var(--ember)",
  blue: "var(--blue)",
  red: "var(--red)",
  purple: "var(--purple)",
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
        <p>The people who built the quantum mind, the physics, the engine and this site.</p>
      </header>
      <div className="team-grid">
        {team.map((member, index) => (
          <article className="q-card team-card" key={`${member.badge}-${index}`}>
            <span className="q-badge" style={{ "--tone": tones[member.tone] } as React.CSSProperties}>
              {member.badge}
            </span>
            <div className="team-portrait">
              {member.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={member.photo} alt={`Portrait of ${member.name}`} />
              ) : member.name ? (
                initials(member.name)
              ) : (
                <Icon name="people" width="44" height="44" />
              )}
            </div>
            <h2>{member.name || "Name to be added"}</h2>
            <p className="team-role">{member.role}</p>
            <p className="team-bio">{member.bio || "Details coming soon."}</p>
            <Links links={member.links} />
          </article>
        ))}
      </div>
    </div>
  );
}
