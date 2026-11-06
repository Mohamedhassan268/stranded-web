## Install

You need Python 3.11 or newer.

```bash
git clone https://github.com/Muammal/Qiskit-Fest-Qognition.git
cd Qiskit-Fest-Qognition
python -m pip install -r requirements.txt -r requirements-physics.txt
python main.py
```

The gallery sims and the builder's starting points run straight away. Scenarios built on real records also need the 230 MB data pack: `python tools/fetch_artifacts.py`.


## Quickstart & Launch Commands

### 1. Interactive Graphical Visualizer (Recommended)
Launch the full 1600×900 desktop application:
```bash
python main.py
```

### 2. Headless, Physics Pack & CLI Execution Modes
```bash
# Launch GUI directly into a specific scenario and seed
python main.py --seed 42 --mind quantum --scenario volcano

# ASCII terminal live survival run (Legacy Engine or T1 St. Vincent Physics Pack)
python main.py --demo --seed 101 --mind quantum --scenario volcano --engine legacy
python main.py --demo --seed 101 --mind quantum --engine physics

# Multi-seed batch comparison (Quantum vs Classical Mixture vs Classical Rational)
python main.py --batch

# Regenerate curated demo-pack/ timelines
python main.py --curate

# Open Product D Web Replay & Quantum Inspector in browser
start site/index.html
```
