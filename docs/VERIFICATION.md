# Verification record

## Website redesign, November 2026

Checked locally in Microsoft Edge, against a production build:

- Browser tests: 14 pass, covering the home page, blog, replay, Public Repo posting and reviews, documentation, team, the 3D story, phone widths, reduced motion, recovery from bad recordings, and axe accessibility checks on most pages.
- Node tests: 26 pass, covering recordings, `.qsim` checks and both stores.
- TypeScript passes, and the dependency audit of production packages found nothing.

Not checked:

- The Redis store has only run against a stand-in for Upstash, not the real service.
- Nothing has been deployed, so Vercel behaviour is unverified, including read-only mode.
- `src/lib/qsim.ts` was compared with `simfile.py` by reading it. A file accepted here was not run through the Python checker.
- Physical phones and browsers other than Edge.

The record below is from the earlier site.

6 November 2026. This record distinguishes local interface evidence from scientific validation.

## Review

Three fresh-context, read-only reviewers used the codebase-details and design personas from Google EGM. The initial audit found stale ML/new-terrain narration, heuristic-stub exports and unsafe viewer fallbacks. The design audit clarified before/after action, shelter chronology and failure handling. Final implementation review verified all six output hashes, the generator hash, both manifest copies and every recorded source hash. Its remaining documentation contradiction about the initial versus recording revision was corrected. This was bounded EGM-persona review, not the complete five-stage protocol.

## Actual local checks

- Next.js 16.4.5 production static build: pass; Home, Demo, Science, Privacy, custom 404, robots and sitemap generated.
- TypeScript: pass.
- Recording checks: 2 pass, verifying SHA-256, identities, complete frames, valid probabilities, lambda=1 controls, sidecar positions and matched initial inputs.
- Exporter: six recordings, 36 steps each, each regenerated twice with exact equality; 40 source-file hashes unchanged during export. All six fixed examples survived; no survival-rate advantage is inferred.
- Dependency audit: zero reported vulnerabilities in the production dependency graph.
- Security source scan: 18 application files, no findings. A static heuristic scan is not a full penetration test.
- Microsoft Edge 156.0.4314.58 browser evidence: homepage CTA/navigation/metadata/404; playback/pause/reset/keyboard slider/speed/case/comparison/provenance; mobile/reduced-motion/text alternatives/axe checks; corrupt and missing recording recovery. The first two runs found label-content-name mismatch, then the final focused mobile/axe case passed after preserving the actual word boundary. Recovery test initially selected both the app error and Next route announcer; its locator was corrected, and recovery passed. Final complete production browser pass is pending below.
- Additional viewport inspection at 320, 390, 768 and 1440 px: Home, Demo and Science have no horizontal page overflow.
- Desktop, mobile and comparison screenshots inspected. Edge Dev was not located; installed Microsoft Edge was used without reusing a personal profile.
- The upstream recording revision is accessible at https://github.com/Muammal/Qiskit-Fest-Qognition/commit/27c367c5f32f571a7df33b95fe675abdcfc6e7af .

## Boundaries

The original supplied blueprint and qognition source were not edited by this implementation. The original source moved from the initial inspected revision during preparation; exports explicitly pin the clean 27c367c5f32f571a7df33b95fe675abdcfc6e7af snapshot. Browser checks do not establish native phone behavior, scientific validation, physical-model validity, or hardware execution. No raw restricted datasets, credentials, tracking, personal photos, fabricated team roles or invented benchmark metrics are shipped.

## Publication

Pending: new private GitHub repository and verified remote commit; new Vercel production deployment; deployed route/image/manifest checks and full browser suite. Do not read this pending section as completed publication.
