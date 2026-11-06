import type { Metadata } from "next";
import Link from "next/link";
import { FeaturedPost, PostCard } from "@/components/blog/PostCard";
import { posts } from "@/lib/docs";

export const metadata: Metadata = {
  title: { absolute: "Qognition: quantum against classical minds in an evacuation" },
  description:
    "Can quantum probability explain how people decide to evacuate? Qognition tests a two-qubit model of decision-making against classical minds across five scenarios. A model, not a prediction.",
};

// Each line is the simulator's own summary of the scenario, from _hub_cards in engine/gui.py.
const scenarios = [
  {
    title: "Island wilderness",
    text: "One survivor balances food, water and warmth against storms and animals.",
    image: "03_island_survival_sim.png",
    href: "/demo/?case=island-42-quantum",
    more: "Watch a replay",
  },
  {
    title: "Volcano evacuation",
    text: "A fictional volcano enters unrest. Cue order and stress change when the person leaves.",
    image: "04_volcano_evacuation_sim.png",
    href: "/demo/?case=volcano-42-quantum",
    more: "Watch a replay",
  },
  {
    title: "Titanic, April 1912",
    text: "One mind, with deck position setting who hears what, and when, for 2,208 people.",
    image: "06_titanic_evacuation_sim.png",
    href: "/docs/titanic-model/",
    more: "Read the model",
  },
  {
    title: "Pompeii, AD 79",
    text: "How far deaths move with the cue translation you assume, for a whole town.",
    image: "07_pompeii_evacuation_sim.png",
    href: "/docs/pompeii-sources/",
    more: "Read the sources",
  },
  {
    title: "Waterloo chlorine leak",
    text: "A hypothetical evacuation at a real site. The leak and head-count are labelled settings.",
    image: "08_waterloo_chlorine_sim.png",
    href: "/docs/waterloo-sources/",
    more: "Read the sources",
  },
];

// From "Results at a glance" in the simulator's docs/CHANGES_AND_RESULTS.md.
const findings = [
  {
    question: "Does hesitation cost survival when warning is short?",
    answer: "No",
    detail: "The pre-registered test failed, so the claim is not supported.",
  },
  {
    question: "Does quantum predict human data better?",
    answer: "No",
    detail: "Fixed η error is 0.176, against 0.171 for the classical average and 0.071 for Markov held out.",
  },
  {
    question: "Is the default-batch delay from interference?",
    answer: "Yes, on this batch",
    detail: "With k forced to 0 the delay is -0.16 steps, against +0.55.",
  },
];

export default function Home() {
  const [featured, ...rest] = posts;
  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <div>
            <p className="q-kicker">A research project from Qiskit Fall Fest 2026</p>
            <h1>Can quantum probability explain how people decide to evacuate?</h1>
            <p className="hero-lede">
              Qognition simulates people making decisions under pressure, and puts a two-qubit model of the mind against classical controls across five evacuation
              scenarios. A model, not a prediction.
            </p>
            <div className="hero-actions">
              <Link className="q-btn q-btn--gold" href="/blog/">
                Read the blog
              </Link>
              <Link className="q-btn q-btn--ghost" href="/demo/">
                Watch a replay
              </Link>
            </div>
          </div>
          <figure className="hero-shot">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/docs-assets/docs/images/04_volcano_evacuation_sim.png" alt="The Qognition simulator running the volcano evacuation scenario" width="1920" height="1080" />
            <figcaption>The Qognition simulator, a desktop app you can run yourself.</figcaption>
          </figure>
        </div>
      </section>
      <div className="q-page">
        <section className="home-section" aria-labelledby="latest">
          <div className="section-head">
            <h2 id="latest">Latest from the blog</h2>
            <Link href="/blog/">All posts</Link>
          </div>
          <FeaturedPost post={featured} />
          <div className="post-grid">
            {rest.slice(0, 3).map((post) => (
              <PostCard post={post} key={post.slug} />
            ))}
          </div>
        </section>
        <section className="home-section" aria-labelledby="findings">
          <div className="section-head">
            <h2 id="findings">What the results say</h2>
            <Link href="/blog/changes-and-results/">Read the full results</Link>
            <p>Several results go against the original idea. They're reported anyway.</p>
          </div>
          <div className="findings">
            {findings.map((finding) => (
              <article className="q-card finding" key={finding.question}>
                <h3>{finding.question}</h3>
                <strong>{finding.answer}</strong>
                <p>{finding.detail}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="home-section" aria-labelledby="scenarios">
          <div className="section-head">
            <h2 id="scenarios">Five scenarios</h2>
            <Link href="/docs/overview/">How they work</Link>
          </div>
          <div className="scenario-grid">
            {scenarios.map((scenario) => (
              <Link className="q-card media-card" href={scenario.href} key={scenario.title}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/docs-assets/docs/images/${scenario.image}`} alt="" loading="lazy" />
                <div className="media-card-body">
                  <h3>{scenario.title}</h3>
                  <p>{scenario.text}</p>
                  <span className="media-more">{scenario.more}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
        <section className="home-section band" aria-label="Get involved">
          <article className="q-card">
            <h3>Public Repo</h3>
            <p>Build a scenario in the simulator, share its .qsim file, and review what other people have made.</p>
            <Link className="q-btn q-btn--vivid q-btn--blue" href="/repo/">
              Browse sims
            </Link>
          </article>
          <article className="q-card">
            <h3>Documentation</h3>
            <p>Install the simulator, run a scenario, and read how the quantum mind, the physics and the engine fit together.</p>
            <Link className="q-btn q-btn--vivid q-btn--green" href="/docs/quickstart/">
              Get started
            </Link>
          </article>
        </section>
      </div>
    </>
  );
}
