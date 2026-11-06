```
QWC/
├── contracts.py                  # Frozen interfaces, opt-in Grover explore_step & rule-based classical baseline
├── data/priors.json              # ATUS reference hours, loaded but not used in decisions, & hand-set urgency boosts
├── requirements.txt              # Core dependencies (pygame-ce, qiskit, qiskit-aer, numpy, pytest)
├── requirements-physics.txt      # Physics track dependencies (pint, numpy, pytest)
├── main.py                       # Unified entrypoint (GUI, CLI demo, batch benchmark, physics engine)
├── test_contracts_and_engine.py  # Tech C + integration test suite (66 tests)
├── mind/                         # Tech A: 2-Qubit Quantum Cognitive Architecture
│   ├── model.py                  # Deliberation unitary U(q_S, q_D, eta) & Tversky-Shafir calibration
│   ├── cognition_models.py       # 6 quantum cognition models adapted from published papers from GitHub
│   ├── belief.py                 # Density-matrix belief state, Ry and Rx event gates & collapse
│   ├── decoherence.py            # Stress -> Kraus phase-damping & GKSL Lindblad master equation
│   ├── quantum_mind.py           # quantum_decide (with selectable cognition_model) & classical_mixture
│   ├── circuits.py               # Gate-level Qiskit circuits (with mid-circuit collapse & Lüders)
│   ├── experiments/              # Validation scripts (with 6-paper library_cross_check) & figures
│   └── tests/                    # Tech A unit, Qiskit & published model test suite (48 tests)
├── stranded_physics/             # Tech B: Verification-First 14-Domain Physics Framework
│   ├── scenarios.py              # 9 concrete T1 domain solvers for April 2021 La Soufrière eruption
│   ├── core/                     # Pint unit registry, FieldStore, Parameter, verdicts & 44 tests
│   ├── domains/                  # 14 self-contained physical hazard domains (terrain, pdc, tephra, etc.)
│   ├── packs/                    # Topological ScenarioPack (.npz) builder & SHA-256 verification
│   ├── runtime/                  # Causal perceive(), AgentBody & PackSimulation
│   ├── catalog.py                # Automated parameter & provenance catalog builder
│   └── gates.py                  # Pre-registered verification & validation gate runner
├── disaster_data/                # Tech B: 49 Curated Real-World Volcano & Weather Datasets
│   ├── REPORT.md                 # Empirical calibration report (2021 La Soufrière St. Vincent, etc.)
│   └── manifest.json             # SHA-256 dataset provenance manifest
├── engine/                       # Tech C: World, Volcano, Agent, Loop & Interactive Visualizer
│   ├── world.py                  # Dual-scenario DEM, priority-flood drainage & Tobler Dijkstra paths
│   ├── volcano.py                # Seeded wind, ash grid, active PDC/lahar, surge & lava model
│   ├── agent.py                  # Physiology, Tobler walking budget, ration eating & fatal checks
│   ├── events.py                 # Markov weather, activity events & scripted_events counterfactuals
│   ├── simulation.py             # Turn-based simulation loop emitting timeline.json
│   ├── batch_runner.py           # 3-model batch comparison & demo curation
│   ├── gui.py                    # 1600x900 interactive Pygame Research & Tactical Visualizer
│   ├── gui_map.py                # Auxiliary relief & hazard map renderer
│   └── gui_panels.py             # Auxiliary panel & modal helpers
├── site/                         # Product D: Client-Side Web Replay & Quantum Cognition Inspector
│   └── index.html                # HTML5 40x40 replay canvas, Bloch circle & 6-model live inspector
├── docs/                         # Architecture guides, theoretical models & screenshots
│   ├── NEW_IMPLEMENTATIONS_REPORT.md # Comprehensive report of all new implementations & 6 models
│   ├── TECH_A_B_C_INTEGRATION.md # How Tech A, Tech B, Tech C & Product D work together & separately
│   ├── TECH_A_QUANTUM_MIND.md    # Tech A standalone & mathematical documentation
│   ├── TECH_B_PHYSICS_AND_PRIORS.md # Tech B empirical data, priors & physics documentation
│   ├── TECH_C_ENGINE_WORLD_AND_GUI.md # Tech C world, volcano, agent & GUI documentation
│   ├── VOLCANO_MODEL.md          # Volcanic hazard assumptions, constants & JSON schema
│   ├── tech-a/                   # Detailed Stage 1-9 Tech A derivation notes & figures
│   └── images/                   # High-resolution screenshots of the UI and simulation
└── demo-pack/                    # Curated signature runs & Tech A validation JSONs
```
