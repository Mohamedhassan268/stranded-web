import type { Metadata } from "next";
import Link from "next/link";
import { manifest, sourceFile, sourceUrl } from "@/data/site";
import { Icon } from "@/components/Icons";
export const metadata: Metadata = {
  title: "The science & evidence",
  description:
    "What Stranded implements, what Qiskit does, how recordings are produced, and the evidence limits of quantum cognition and survival modeling.",
};
export default function Science() {
  return (
    <div className="section-wrap science-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">METHODS / EVIDENCE / LIMITS</p>
          <h1>
            A model of a choice.
            <br />
            <span className="muted-heading">A question, still open.</span>
          </h1>
        </div>
        <p>
          Can a quantum-probability model express how uncertainty, event order
          and stress change a simulated decision?
        </p>
      </div>
      <div className="science-intro">
        <p>
          Stranded connects a survival simulation to a two-qubit decision model.
          It is an exploratory abstraction for studying choices—not a claim that
          the brain is a quantum computer.
        </p>
        <Link href="/demo/" className="button primary">
          Inspect a recording <Icon />
        </Link>
      </div>
      <section className="science-section">
        <p className="eyebrow">01 / THE IMPLEMENTATION</p>
        <h2>
          Where the quantum
          <br />
          model enters.
        </h2>
        <div className="method-grid">
          <article>
            <span>INPUT</span>
            <h3>A state and a history</h3>
            <p>
              Six satisfaction levels, stress, inventory, and recent events
              enter the decision function. The classical prior uses explicit
              urgency rules; loaded ATUS metadata is not used by those rules.
            </p>
            <a href={sourceFile("contracts.py")}>
              Read the prior <Icon name="external" />
            </a>
          </article>
          <article>
            <span>BELIEF</span>
            <h3>Order-sensitive updates</h3>
            <p>
              Events rotate or collapse a density-matrix belief state.
              Non-commuting updates can make event order matter. Stress controls
              a clipped, linear dephasing parameter λ.
            </p>
            <a href={sourceFile("mind/belief.py")}>
              Read the belief model <Icon name="external" />
            </a>
          </article>
          <article>
            <span>CHOICE</span>
            <h3>From probability to action</h3>
            <p>
              The model computes P(protect), then distributes it among actions
              using the prior. The default rule selects the largest probability.
              Urgent reflexes can override that choice.
            </p>
            <a href={sourceFile("mind/quantum_mind.py")}>
              Read the decision function <Icon name="external" />
            </a>
          </article>
        </div>
      </section>
      <section className="science-section circuit-section">
        <div>
          <p className="eyebrow">02 / QISKIT’S ROLE</p>
          <h2>
            Two paths.
            <br />
            One decision model.
          </h2>
          <p>
            The replayed gameplay uses NumPy density matrices and closed-form
            probabilities. The separate Qiskit implementation builds gate-level
            circuits for model verification, including Aer simulations.
          </p>
          <p>
            These website recordings do not execute circuits in the browser and
            do not use IBM quantum hardware. The current circuit source supports
            selected collapse events via reset when explicitly enabled; older
            prose describes an earlier, rotation-only boundary.
          </p>
          <a href={sourceFile("mind/circuits.py")} className="text-link">
            Inspect current circuit source <Icon name="external" />
          </a>
        </div>
        <div
          className="circuit-figure"
          role="img"
          aria-label="Conceptual two-qubit circuit: belief preparation, event gates, deliberation unitary and measurement. The recording uses the mathematical path."
        >
          <div>
            <span>q₀ |0⟩</span>
            <i>Rᵧ</i>
            <i>EVENTS</i>
            <i className="unitary">U</i>
            <span>──</span>
          </div>
          <div>
            <span>q₁ |0⟩</span>
            <span>──────</span>
            <i className="unitary">U</i>
            <i>MEASURE</i>
          </div>
          <p>CONCEPTUAL CIRCUIT · NOT A HARDWARE JOB</p>
        </div>
      </section>
      <section className="science-section">
        <p className="eyebrow">03 / THE COMPARISON</p>
        <h2>
          Remove coherence.
          <br />
          Keep the machinery.
        </h2>
        <p className="science-lede">
          The primary control is <strong>classical mixture</strong>: the same
          decision function with dephasing fixed at λ = 1. It differs from the
          separate rule-based, prior-argmax classical baseline in the research
          repository.
        </p>
        <div className="evidence-table-wrap">
          <table>
            <caption>Website recording setup</caption>
            <tbody>
              <tr>
                <th scope="row">Engine</th>
                <td>Legacy generated-world survival engine; 40 × 40 grid</td>
              </tr>
              <tr>
                <th scope="row">Fixed cases</th>
                <td>Volcano seeds 42 and 91; island seed 42</td>
              </tr>
              <tr>
                <th scope="row">Conditions</th>
                <td>Quantum cognition; classical mixture (λ = 1)</td>
              </tr>
              <tr>
                <th scope="row">Horizon</th>
                <td>Up to 36 two-hour steps, ending early on death</td>
              </tr>
              <tr>
                <th scope="row">Matched inputs</th>
                <td>
                  Initial state, map, weather and hazard schedule checked for
                  equality
                </td>
              </tr>
              <tr>
                <th scope="row">Reproducibility</th>
                <td>
                  Each complete recording regenerated twice and checked for
                  exact equality
                </td>
              </tr>
              <tr>
                <th scope="row">QPU execution</th>
                <td>None</td>
              </tr>
              <tr>
                <th scope="row">Source revision</th>
                <td>
                  <a href={sourceUrl}>{manifest.sourceCommit.slice(0, 12)} ↗</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Paired demonstrations show what happened in these cases. They do not
          estimate a causal survival benefit. Different policies can encounter
          different local events; this is not the preregistered
          historical-disaster benchmark.
        </p>
        <a href="/runs/manifest.json" className="text-link">
          Download hashes, runtime versions & provenance ↓
        </a>
      </section>
      <section id="limitations" className="science-section limitations">
        <p className="eyebrow">04 / WHAT THE EVIDENCE SUPPORTS</p>
        <h2>
          The limits belong
          <br />
          <span className="amber-text">in the foreground.</span>
        </h2>
        <p>
          The expanded physics research is separate from the generated-world
          recordings shown here. Its engine-status record, dated 5 November
          2026, reports the following findings. They have not been independently
          rerun as part of this website build.
        </p>
        <div className="evidence-table-wrap">
          <table>
            <caption>
              Reported research findings, not new website experiments
            </caption>
            <thead>
              <tr>
                <th scope="col">Research check</th>
                <th scope="col">Recorded finding</th>
                <th scope="col">Meaning</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">St Vincent energy-cone flow model</th>
                <td>1 of 3 blind checks passes</td>
                <td>Over-reach remains a material failure.</td>
              </tr>
              <tr>
                <th scope="row">Titanic flooding</th>
                <td>201 minutes vs 160 recorded</td>
                <td>The simplified hull model founders too slowly.</td>
              </tr>
              <tr>
                <th scope="row">Titanic quantum vs mixture</th>
                <td>Both report 3.4% saved vs 32.3% historical</td>
                <td>That scenario does not reproduce the event.</td>
              </tr>
              <tr>
                <th scope="row">Human prediction</th>
                <td>Not established</td>
                <td>
                  Different model decisions do not validate human survival
                  predictions.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <a
          href={sourceFile("workboard/ENGINE_STATUS.md")}
          className="text-link"
        >
          Read full engine status and qualifications <Icon name="external" />
        </a>
        <ul>
          <li>
            Quantum cognition is a model of decisions, not proof of quantum
            processes in the brain.
          </li>
          <li>
            No computational speedup, quantum advantage, or validated survival
            benefit is claimed.
          </li>
          <li>
            Threat responses, exposure assumptions and the two-hour timestep
            shape the simulated outcomes.
          </li>
          <li>
            The historical benchmark is preregistered; Titanic is calibration
            data after its results were inspected.
          </li>
          <li>
            Raw geographic/weather datasets and their unresolved redistribution
            licences are excluded from this site.
          </li>
        </ul>
        <a
          href={sourceFile("benchmark/PRE_REGISTERED.md")}
          className="text-link"
        >
          Read benchmark preregistration <Icon name="external" />
        </a>
      </section>
      <section className="science-section">
        <p className="eyebrow">05 / SOURCES & CONTRIBUTIONS</p>
        <h2>Follow the trail.</h2>
        <p>
          The original research repository records the engine, mathematical
          model, physics tracks and contributor history. Personal roles and
          photos are not inferred here.
        </p>
        <div className="reference-list">
          <a href={sourceUrl}>
            Research implementation & contributors <Icon name="external" />
          </a>
          <a href={sourceFile("docs/tech-a/07-validation-report.md")}>
            Existing model validation report (historical artifact){" "}
            <Icon name="external" />
          </a>
          <a href="https://doi.org/10.1098/rspb.2009.0121">
            Pothos & Busemeyer (2009): quantum probability and decision theory{" "}
            <Icon name="external" />
          </a>
          <a href="https://quantum.cloud.ibm.com/docs/en/api/qiskit">
            Qiskit documentation <Icon name="external" />
          </a>
          <a href="/runs/manifest.json">
            Website replay manifest and source hashes ↓
          </a>
        </div>
      </section>
      <section className="science-section faq">
        <p className="eyebrow">QUESTIONS, ANSWERED</p>
        <h2>Before you press play.</h2>
        <details>
          <summary>Is this running on a quantum computer?</summary>
          <p>
            No. Website playback displays recordings produced by local NumPy
            evaluation. Qiskit circuits are a separate implementation and
            verification path.
          </p>
        </details>
        <details>
          <summary>Do these results prove the quantum model is better?</summary>
          <p>
            No. These are fixed illustrative cases. Predicting human behavior or
            claiming an advantage needs separate, controlled validation.
          </p>
        </details>
        <details>
          <summary>Can I inspect the data?</summary>
          <p>
            Yes. Open recording provenance in the replay lab to download each
            complete JSON and its manifest, including SHA-256 and source
            revision.
          </p>
        </details>
        <details>
          <summary>
            Why can a selected action differ from the probability bars?
          </summary>
          <p>
            An urgent reflex can override the probability-selected action. A
            lethal arriving flow can also prevent an action from being executed.
            The recording retains those distinctions.
          </p>
        </details>
      </section>
    </div>
  );
}
