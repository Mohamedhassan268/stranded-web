import Link from "next/link";
export default function NotFound() {
  return (
    <section className="section-wrap not-found">
      <p className="eyebrow">404 / OFF THE MAP</p>
      <h1>
        Lost in the
        <br />
        <span className="violet-text">wilderness?</span>
      </h1>
      <p>This route is uncharted. There’s still a way back.</p>
      <div className="hero-actions">
        <Link href="/" className="button secondary">
          Return home
        </Link>
        <Link href="/demo/" className="button primary">
          Open the replay →
        </Link>
      </div>
    </section>
  );
}
