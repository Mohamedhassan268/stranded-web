"use client";
import { useState } from "react";
import Link from "next/link";
import { sourceFile } from "@/data/site";
const sections = [
  {
    name: "BELIEF",
    title: "A state of possibility.",
    text: "The mind represents uncertainty with a density matrix, ρ. Safety and recent events prepare a belief about danger before the next action is considered.",
    formula: "ρ → event update → ρ′",
    source: "mind/belief.py",
  },
  {
    name: "ORDER",
    title: "The order changes the state.",
    text: "A tremor followed by a gas plume can leave a different belief from the reverse sequence. The event updates need not commute. This is a model of context-sensitive decisions, not a claim about a quantum brain.",
    formula: "U₂ U₁ ρ ≠ U₁ U₂ ρ",
    source: "mind/belief.py",
  },
  {
    name: "STRESS",
    title: "Pressure changes the balance.",
    text: "Stress raises the model’s dephasing parameter, λ. At λ = 1, the classical-mixture control removes coherence while retaining the same decision machinery.",
    formula: "λ = clamp((stress − 0.2) / 0.7, 0, 1)",
    source: "mind/decoherence.py",
  },
  {
    name: "CHOICE",
    title: "From belief to a next move.",
    text: "The model calculates a probability of protection, then distributes probabilities over seven actions using a rule-based urgency prior. Reflex rules may override the largest-probability action.",
    formula: "belief + prior → P(action) → choice",
    source: "mind/quantum_mind.py",
  },
  {
    name: "QISKIT",
    title: "The circuit behind the model.",
    text: "Gameplay evaluates the model locally with NumPy. Separate Qiskit circuits express and test the gate-level decision model, including simulator experiments. This website does not run on quantum hardware.",
    formula: "prepare → events → deliberation → measure",
    source: "mind/circuits.py",
  },
  {
    name: "LIMITS",
    title: "A model. An open question.",
    text: "The animated hazards illustrate the idea. Recorded decisions and controls are available in the replay lab. No human-survival benefit, quantum advantage or validated disaster forecast is established.",
    formula: "illustration ≠ validation",
    source: "workboard/ENGINE_STATUS.md",
  },
];
export default function QuantumPanel({ close }: { close: () => void }) {
  const [index, setIndex] = useState(0),
    s = sections[index];
  return (
    <div
      className="q-card quantum-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quantum-title"
    >
      <header>
        <span className="q-badge" style={{ "--tone": "var(--purple)" } as React.CSSProperties}>
          QUANTUM MIND
        </span>
        <button className="q-btn" style={{ width: 38, padding: 0 }} onClick={close} aria-label="Close quantum mind">
          X
        </button>
      </header>
      <p className="quantum-kicker">
        {String(index + 1).padStart(2, "0")} / MODEL LAYER
      </p>
      <h2 id="quantum-title">{s.title}</h2>
      <p className="quantum-body">{s.text}</p>
      <div className="q-sub quantum-formula">{s.formula}</div>
      <nav aria-label="Quantum mind topics">
        {sections.map((section, i) => (
          <button
            className="q-btn q-btn--sand"
            key={section.name}
            aria-pressed={i === index}
            onClick={() => setIndex(i)}
          >
            {section.name}
          </button>
        ))}
      </nav>
      <div className="quantum-links">
        <a href={sourceFile(s.source)} target="_blank" rel="noreferrer">
          Read the source
        </a>
        <Link href="/science/">Full methods</Link>
      </div>
      <button className="q-btn q-btn--vivid q-btn--green q-btn--wide quantum-continue" onClick={close}>
        RETURN TO THE ISLAND
      </button>
    </div>
  );
}
