// The Paper page reads this file. When a new version of the paper comes out, replace
// public/media/qognition-paper.pdf, then update the abstract, numbers and page numbers here.
export const paper = {
  title: "Quantum Cognition: Order Effects and Stress-Dependent Dephasing in a Quantum-Probability Evacuation Model",
  venue: "Qiskit Fall Fest Waterloo, November 2026",
  authors: "Muammal A. Fadhil, Mohammed Hassan, Bernard Kim and Brodin Vance",
  pdf: "/media/qognition-paper.pdf",
  abstract:
    "Human judgments can depend on cue order and uncertainty, but reproducing a judgment effect does not establish its consequences for action. Quantum Cognition embeds a two-qubit quantum-probability model in an evacuation simulator. Ambiguous cues rotate a density-matrix belief; direct danger observations reset it; stress controls dephasing. A deliberation unitary maps belief to protection. Calibration fixes a normalized overlap fraction; the resulting overlap coefficient changes from κ = −0.439 at the gambling conditionals to −0.785 in the volcano runs. At the gambling-calibration conditionals, reversing two cues in a specified window gives a signed protection gap of +0.140; the sign reverses (−0.190) under the simulator’s initial priors. Maximal dephasing removes the specified calibration-window gap. Under deterministic action selection, 200 paired volcano seeds give a 0.55-step (66-minute) mean delay against a fully dephased control on 140 eligible pairs. A direct interference ablation gives a 0.689-step delay on 135 eligible pairs. Classical hesitation controls also produce delay. In that cue window, protection increases overall, but not monotonically for both orders, as dephasing reaches its maximum. Additional scenarios and archived sensitivity experiments show strong dependence on cue mapping and configuration. Qiskit circuit checks and simulated device noise support the implementation. These results characterize a modeling mechanism; they establish neither human behavioral validity nor a quantum computational advantage.",
  findings: [
    {
      id: "C1",
      title: "Cue order changes the answer",
      detail: "Reversing two cues gives a protection gap of +0.140 at the gambling-calibration conditionals and −0.190 under the simulator’s initial priors.",
    },
    {
      id: "C2",
      title: "Stress acts as dephasing",
      detail: "In that window, the order effect falls monotonically from 0.140 at zero dephasing to zero at maximal dephasing.",
    },
    {
      id: "C3",
      title: "Uncertainty causes a dip",
      detail: "Calibrated to a published disjunction effect, the uncertain-case protect probability is 0.36, below the certain-case 0.69 and 0.59 and the classical prediction of 0.64. This is a calibration result.",
    },
    {
      id: "C4",
      title: "Hesitation appears, under conditions",
      detail: "Across 200 volcano seeds, the quantum agent acts 0.55 steps (66 minutes) later than the fully dephased control on 140 eligible pairs. Classical hesitation controls also delay, so delay isn’t unique to this mechanism.",
    },
    {
      id: "C5",
      title: "The effect survives simulated noise",
      detail: "The order effect persists under a simulated IBM device noise model, with all three circuit estimates within 2.01 standard errors of their exact values.",
    },
    {
      id: "C6",
      title: "Scenarios depend on cue mapping",
      detail: "In Pompeii, one mapping gives about 1,063 deaths for the quantum mind and fewer than one for its control. Another gives fewer than one for both.",
    },
  ],
  limits: [
    "No new human participants. Comparisons use published studies.",
    "No quantum hardware. The noisy results are simulated, and the circuits haven’t run on a real device.",
    "Event angles, the stress map and the cue mappings are hand-set, and they can decide the outcome.",
    "Paired statistical tests cover only the volcano. The other scenarios use ten seeds and many unsourced assumptions.",
  ],
  contents: [
    { title: "Introduction", page: 1 },
    { title: "Related work", page: 2 },
    { title: "System model and method", page: 3 },
    { title: "Validation", page: 6 },
    { title: "Evaluation", page: 6 },
    { title: "Discussion", page: 9 },
    { title: "Limitations", page: 10 },
    { title: "Conclusion", page: 11 },
    { title: "References", page: 11 },
  ],
};
