# Stranded website: review and execution

6 November 2026. Scope: new standalone website under `Ui.vercel/stranded-web`, a new private repository owned by Mohamedhassan268, then Vercel production deployment. Original blueprint, simulation, raw files and existing repos stay intact.

## Review before implementation

Sources inspected: supplied website blueprint and design guide; `qognition/engine/simulation.py`, `contracts.py`, `mind/quantum_mind.py`, `mind/circuits.py`, `workboard/ENGINE_STATUS.md`, `benchmark/PRE_REGISTERED.md`, existing demo-pack JSONs and Product D HTML. Initial inspection baseline: `6fc3fb1`. The simulator advanced during preparation; recordings were generated from clean commit `27c367c5f32f571a7df33b95fe675abdcfc6e7af`, whose full SHA and source hashes are in the manifest. EGM codebase-details fresh-context audit is running separately; its actual findings will be retained here. This is a bounded review using EGM personas, not a claim to have executed its complete five-stage protocol.

### Findings and decisions

- Existing curated JSONs contain explicit heuristic-stub reasons and no quantum telemetry. Do not publish these as quantum-model results. Generate new deterministic recordings by injecting the real decision functions, fail if their telemetry is absent, and hash the source and output.
- The current engine has real-island, shipwreck and other scenario work with documented failed checks. Homepage stays within the original island/volcano narrative. Science page describes expanded research and preserves the failures and limits; no survival advantage or human validation claim.
- Replay `state`, needs and position are snapshots before action, after the current event. `pos_after` is the position after action. Display the pre-action state on the map and a labelled position-after-step marker. Preserve the exported numbers without rescaling their meaning.
- Exported `world.tiles` is the final map. Render `initial_tiles` and reconstruct hazards through the current index and actual shelter additions from strictly earlier steps only; no future terrain/hazard leakage.
- No website Python service, IBM job or credentials. Record NumPy/density-matrix gameplay locally; Qiskit is a separate gate-level implementation and verification path. Say so visibly.
- Same-seed comparisons share a source/configuration but policies can take different paths and therefore see different local events. Treat them as a descriptive paired replay, not a controlled causal estimate.
- Raw geography and real-world datasets have unresolved redistribution licences. Ship only locally generated map/replay data; no raw datasets or unapproved photos.

## Implementation

Create a Next.js App Router + React + TypeScript static export. Routes `/`, `/demo`, `/science`, `/privacy` and custom 404. Use supplied dark violet/cyan visual tokens, bundled licensed fonts, an original isometric terrain illustration derived from the recording, and one GSAP scroll-linked drop with reduced-motion fallback. No analytics, contact form, tracking SDK or live-run button.

Create `scripts/export_replays.py` and `public/runs/manifest.json`. Record two seeds with quantum and classical-mixture control under identical engine revision and 36-step horizon. Persist complete original timeline JSON files; the TypeScript adapter validates dimensions, coordinates, needs, action probabilities, telemetry and manifest identity. Provenance states source revision, dirty state, source hashes, generator, seed, model, engine, outcome, replay hash and absence of QPU execution.

Create data-driven replay controls: play/pause, reset, previous/next, scrub, speed, seed, policy and paired comparison. Freeze shorter runs at their last recorded decision state when comparing, label it, and report their outcome separately. Actual shelter additions, arrival-blocked actions and post-step snapshots are captured in a clearly separated recording sidecar. Show terrain, pre-action agent, action destination, six needs (higher means more satisfied), event, weather, stress, probabilities, reflex override, reason and available quantum diagnostics.

Create a source/evidence page with the source revision, exact model/control explanation, relevant upstream file links, downloadable recorded runs and visible limitations. Team section links the original contributors without inventing personal identities, roles or photos. Private website repository is not advertised as public source.

## Completion evidence

Pending: source audit result, exported-recording validation, TypeScript/build/dependency checks, browser cases at desktop/mobile including playback/seed/speed/comparison/404/reduced motion, source hash preservation, private repository visibility, Vercel READY and live route/asset checks. Report only checks that actually ran. Browser tests establish interface behavior, not scientific validity.

## Publication

Use signed-in GitHub CLI and Vercel CLI, as explicitly requested. New repository name `stranded-web`, private; check collisions first. Keep docs/source private while deploying only intended public website content. Use a new Vercel project; preserve existing projects and deployments. Deployment is already authorized by the user; finish verification before publication.

## Independent pre-implementation review

Completed 6 November by a fresh-context EGM codebase-details reviewer, with no parent conversation. All specified source files and the actual persona were read. Read-only; no build was run by this reviewer.

Blockers found and resolved in this implementation direction:

1. Blueprint calls the prior ML: actual `contracts.get_prior` is rule-based and does not consume the loaded ATUS metadata. Website must say rule-based.
2. Blueprint promises new terrain for every run: volcano uses fixed `MAP_SEED`; show map seed separately from event seed.

Major findings accepted into the implementation:

- All existing curated JSONs are labelled heuristic stubs with absent quantum fields. Export new records with explicit real decision callables and reject missing quantum telemetry; preserve originals.
- Retain exact before/after action semantics, recorded clock, actual normalized needs, hazards in `world.volcano.hazard_by_step`, optional values and known action vocabulary.
- Do not reuse existing HTML viewer's invented presets, fallback quantum numbers, radial geometry or different stress formula.
- Use the classical-mixture control (`lambda=1`) and identify it distinctly from the prior-argmax baseline. Display reflex overrides, signed Bloch components and recorded diagnostics directly.
- Same-seed examples are descriptive; do not imply independent controlled evidence or the preregistered benchmark.
- Preserve current negative engine findings and unresolved raw-data licences. No source-code licence is invented.
- Separate NumPy gameplay, Qiskit circuit experiments, and unrun hardware jobs.

The original blueprint is retained unchanged. These corrections govern the new implementation.

## Independent design-review resolution

A second fresh-context EGM design reviewer read the proposal and engine. Five major findings were addressed before publication: shelter chronology, final-decision versus terminal-state semantics, selected versus executed action, keyboard/textual accessibility acceptance, and explicit failure/retry/race behavior. Sidecars capture actual shelter additions and execution blocking rather than guessing from action names. Missing/corrupt assets pause and disable playback while retry/navigation remain available.

## Browser review and verification scope

The requested Edge Dev executable was not present in the standard machine/per-user locations or running browser inventory. Browser checks use the installed Microsoft Edge executable; no browser was installed or user profile reused. Initial checks found a visible/spoken event-number mismatch, which is corrected by preserving zero-padded numbers in accessible labels. The initial recovery test also selected Next's route-announcement alert; its locator was scoped to the application error region. Failures remain in the verification history rather than being counted as passes.
