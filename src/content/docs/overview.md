> **"Can quantum probability explain why humans make counterintuitive evacuation and survival decisions under extreme environmental stress — and how can we use it to improve real-life evacuation survival rates?"**

> **Start here:** the project notebook, [`notebooks/stranded_quantum_cognition.ipynb`](https://github.com/Muammal/Qiskit-Fest-Qognition/blob/22c424c5e7909bee4b8aae44f8d25f19a8681883/notebooks/stranded_quantum_cognition.ipynb), explains the model, its evidence, and next steps. Engine results are in [`workboard/ENGINE_STATUS.md`](https://github.com/Muammal/Qiskit-Fest-Qognition/blob/22c424c5e7909bee4b8aae44f8d25f19a8681883/workboard/ENGINE_STATUS.md).

**Qognition** is an interactive multi-scenario cognitive modeling, crowd evacuation, and physical hazard platform. The system simulates human decision-making under existential pressure across **five evacuation and survival scenarios** (**Island Wilderness**, **Volcano Eruption**, **RMS Titanic 1912**, **Pompeii AD 79**, and **Waterloo Pool Chlorine Leak**) plus an **Interactive Scenario Builder**. It contrasts a **2-qubit quantum cognition architecture**—alongside **6 quantum cognition models adapted from published papers and open-source code** (exhibiting non-commuting order effects, Tversky–Shafir disjunction interference, Belief Entropy QLBN, Busemeyer dynamic Hamiltonians, and Lindblad open-system decoherence)—against a **zero-coherence classical mixture control ($\lambda=1$)** and a **classical rational baseline**.

## Five Evacuation & Survival Scenarios + Custom Scenario Builder

Results are in the generated table [`docs/results/SCENARIO_NUMBERS.md`](/docs/scenario-numbers/), written by `python tools/make_readme_numbers.py`. Numbers are kept there rather than typed here so they cannot go stale. They are model runs, not predictions.

| # | Scenario | Scale & Horizon | Physical Hazard Engine | Real-Life Evacuation & Cognitive Insight |
|---|---|---|---|---|
| **1** | **Island Wilderness (`island`)** | 1 agent, 36 steps (72 h) | 40×40 DEM, Markov storms, exposure & dehydration | Shelter timing before storm hypothermia (a Grover walk for `explore` is available but off by default; default runs use a random walk) |
| **2** | **Volcano Evacuation (`volcano`)** | 1 agent (or multi-agent builder), 36 steps | Caldera DEM, active PDCs, surges, lahars, downwind ash & Tobler Dijkstra paths | Cue order effects: `Tremor → Gas` and `Gas → Tremor` give different $P(\text{protect})$ |
| **3** | **RMS Titanic 1912 (`titanic`)** | **2,208 agents** across 10 decks, 44 steps (5 min/step) | Progressive compartment flooding (`engine/flood.py`) & 20 lifeboats (`1,178` seats, Wormstedt schedule) | Models below-deck normalcy bias, and how the result moves with the cue translation |
| **4** | **Pompeii AD 79 (`pompeii`)** | **11,500 citizens** across households, 128 steps (15 min/step) | Plinian column, pumice accumulation, roof collapses & pyroclastic surges (`engine/eruption.py`) | Deaths depend strongly on the cue translation, so all four are reported |
| **5** | **Waterloo Pool Chlorine Leak (`waterloo`)** | **100 swimmers & staff**, 721 steps (10 sec/step) | 2D chlorine gas advection-diffusion plume (`engine/chlorine.py`) & EPA AEGL-1/2/3 thresholds | Compares exposure with and without a staff alarm, under each cue translation |
| **6** | **Scenario Builder (`stranded_physics/builder_screen.py`)** | Custom multi-person packs | Interactive terrain, hazard, and multi-agent placement editor | Build, save, and replay custom evacuation packs directly in the GUI (`[B]`) |


## Results and changes

- **[What changed and what came out (`docs/CHANGES_AND_RESULTS.md`)](/blog/changes-and-results/)**, including results that go against the paper, and suggested paper edits.
- [Human data, every row](/blog/human-data/), [lead-time sweep](/blog/lead-time/), [sensitivity](/docs/sensitivity/), [pre-registered protocols](https://github.com/Muammal/Qiskit-Fest-Qognition/blob/22c424c5e7909bee4b8aae44f8d25f19a8681883/docs/protocols/README.md).
