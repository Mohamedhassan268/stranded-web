# Stranded website

A cinematic, static Next.js showcase and data-driven replay lab for the current Stranded quantum-cognition research project. Original source: https://github.com/Muammal/Qiskit-Fest-Qognition . The website repository and its cleared generated recordings are public. Live site: https://stranded-qognition-268.vercel.app .

## Run

Node 24. Install with `npm ci`, start with `npm run dev` (port 3107), check with `npm run typecheck`, build with `npm run build`. Static output is `out/`. `npm run test:data` checks recording identity and paired inputs. `npm test` runs browser tests against the running local server using Microsoft Edge Dev when available, otherwise Microsoft Edge. Browser output is ignored by Git.

## Recordings

`public/runs/manifest.json` pins source revision, source hashes, callable policies, dependency versions, seeds and recording hashes. Six complete JSON files cover volcano seeds 42/91 and island seed 42 under quantum and classical-mixture conditions. These are fixed demonstration cases, not a benchmark. Every export is regenerated twice and checked for equality. The legacy terrain is generated, and no restricted raw geographic data is included.

To regenerate: run `python scripts/export_replays.py --source /absolute/path/to/qognition` using an environment containing the upstream simulator dependencies. This imports the upstream engine but does not copy or modify its source. The optional recording sidecar captures real post-step snapshots, actual shelter additions and arrival-blocked actions. Original timeline fields are retained.

## Routes and boundaries

- `/`: seven scroll-triggered 3D shots: fall, impact, waking, discovery, touch, tree evasion and storm shelter; clickable quantum-mind inspection and static reduced-motion shots.
- `/demo/`: validated replay loading, integrity checks, transport, scrubbing, run/model selection, matched comparison, provenance and downloads.
- `/science/`: current implementation, rule-based prior, separate Qiskit role, source references and material negative results.
- `/privacy/`: no application tracking or user accounts; hosting logs described.

There is no live Python server, quantum job, API credential, invented team photo or unverified result. Original blueprint files and engine files are preserved outside this independent checkout. See `docs/REVIEW.md` for pre-implementation review, `docs/DESIGN.md` for decisions and `docs/VERIFICATION.md` for actual checks and publication state.

## Approved cinematic opening

The approved 3D opening is served at `/`; `/cinematic/` remains an alternate preview path. The first informational homepage is archived in `docs/archive/original-home.tsx.txt`. The replay lab, science and data contracts remain intact. User approved Vercel publication on 6 November 2026 after reviewing the motion sample.
