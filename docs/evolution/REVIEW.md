# Cinematic follow-up — 6 November 2026

## Requested and implemented

- Shared Barlow Condensed / acid-yellow / cyan / dark-green theme across the cinematic, replay, science and privacy routes. “Replay lab” replaces “Skip to replay”.
- Freefall camera derives its position and target from sampled character-body centers, rather than an independent falling-height approximation. Finite shots continue to finish after scroll triggers.
- Seven shots: freefall, impact, awaken, contact, connect, evade, shelter. The survivor raises a hand into the signal, changes course around a falling tree, then crouches under a canopy as rain/fog arrive.
- Clicking the signal opens an incomplete 3D sphere around the survivor and six model explanations. The story pauses during inspection. Escape, focus trapping, focus restoration and reduced-motion inspection are supported.
- Model text checked against upstream belief.py, decoherence.py, quantum_mind.py and config.py. Animated hazards are illustrative; recorded engine decisions remain in the replay lab.
- Website repository made public at the user's explicit request. A credential-pattern scan of the two pre-update history commits / 59 unique blobs found no matches. This is a bounded pattern check, not a comprehensive security audit.

## Verification

- TypeScript, both recording identity / paired-input checks, and all six Edge browser tests pass. Browser checks include desktop/mobile inspection, keyboard navigation, axe, replay playback and corrupt-recording recovery.
- Firefox Developer Edition completed all added chapters, opened/closed the mind panel and reached the replay lab with no page errors. Visual review captured touch, partial sphere, fallen tree, shelter and replay theme. Gesture foot alignment was corrected after the shelter review.
- Same machine, Firefox 160 headless, 1280×800, 6.5-second RAF window: baseline deployed opening 28.895 FPS; updated local development opening 32.138 FPS. Median 33.32 ms for both; p95 50.00 ms versus 49.98 ms. Average throughput improves about 11%; long-frame improvement is not established. Development/production serving and machine variance limit attribution.
- Character meshes reduced from 192 to 84 by merging siblings on each articulated joint. Terrain triangles reduced from 131,072 to 51,200; palm-leaf tessellation reduced. Static island shadows are cached; GPU bloom and full-screen SVG grain are replaced by a local signal halo and the existing film shader. Rendering is capped at device pixel ratio 1.
- During sampled freefall, the projected tracked-body center remains at screen center (reported maximum normalized deviation 0). This checks the tracked center, not every visible vertex or every hardware configuration.

Physical phones, a 60 FPS guarantee and production-quality character/cloth animation are not established. This remains a stylized procedural cinematic prototype. Source artifacts, original homepage archive and simulation recordings are preserved.

Deployment: prepared for the existing Vercel production project; live verification follows deployment.
