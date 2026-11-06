import Link from "next/link";

export default function NotFound() {
  return (
    <div className="q-page">
      <section className="q-card not-found">
        <p className="q-kicker">404: off the map</p>
        <h1>Lost in the wilderness?</h1>
        <p>This route is uncharted. There's still a way back.</p>
        <div className="button-row">
          <Link href="/" className="q-btn">
            Return home
          </Link>
          <Link href="/demo/" className="q-btn q-btn--vivid q-btn--green">
            Open the replay
          </Link>
        </div>
      </section>
    </div>
  );
}
