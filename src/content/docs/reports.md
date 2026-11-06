Every run ends in one debrief with the crucial details: survivors against deaths, key events, the paired run on the same seed, and the assumptions used. **Export Report** (or `K` in the debrief) writes an Excel workbook and a folder of CSVs to `exports/reports/`, with these tables:

| Table | Contents |
|---|---|
| Summary | Scenario, seed, mind, cue translation, totals and survival rate |
| Key events | First sign, first decision to evacuate, hazard onset, margin, seats used, causes of death, exposure |
| Timeline | Every step, end to end: event, action, needs, stress, P(danger), P(protect), λ, coherence, reason |
| Crowd over time | Everyone's status at every step (Titanic, Pompeii, Waterloo) |
| Groups | Outcomes by class or role, with history where a source gives it |
| Decisions | How often each action was chosen |
| Paired run | The other mind on the same seed |
| Assumptions | Cue translation, decision rule, dephasing and scope |

Without the GUI:

```bash
python main.py --report --scenario titanic --seed 42 --mind quantum
```

Reports are model output, not predictions.
