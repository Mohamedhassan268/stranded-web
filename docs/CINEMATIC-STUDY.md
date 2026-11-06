# Cinematic study 01 — review checkpoint

User direction, 6 November 2026: reference igloo.inc for full-screen 3D storytelling, sparse interface and cinematic camera transitions. Use the attached David Martinez character image: yellow oversized jacket, cyan reflective bands, dark baggy trousers, cybernetic temple and swept black hair. Island, not Night City. The user chose scroll-triggered shots that finish playing and has no rigged model.

This is a separate local `/cinematic/` design sample, not a complete redesign or approved release. Existing replay, research logic and original homepage are preserved. Publishing remains stopped until the user reviews the sample.

Opening storyboard: suspended freefall → falling tracking shot → shoreline impact → low wake shot → eye-close transition → glowing quantum mind → short route reveal. The figure is a procedural stylized 3D likeness for reviewing composition and motion, not a finished character asset. The island, acting, hazard markers and route are cinematic staging, not recorded simulator outputs or a new scientific result. No copied igloo assets, source, UI or audio; no autoplay sound.

Technical scope: Three.js actual geometry, lighting, perspective cameras, surface shading and light postprocessing. One persistent scene with native document scroll triggering finite camera/acting clips. A requested new shot waits until the current shot completes. Numbered semantic controls allow direct selection. Reduced motion uses static shot endpoints. WebGL failure retains a clear route to the replay lab. Scene resources and listeners are disposed on navigation.

Reference study: Firefox Developer Edition observed the igloo opening, snow, lighting, fixed sparse corners and floating forms. Its loader took about 30 seconds. Deeper portfolio/footer movements were not successfully captured. Abeto's primary-maker case study was separately read: https://www.awwwards.com/igloo-inc-case-study.html . Detailed captures and limits are under `reference-study/`.

Review gate: the user should judge the character likeness, island realism, camera framing, shot timing and color/type direction before any full-site redesign, repo upload or deployment. Verification results and sample frames will be recorded after actual browser inspection.

## Verified sample checkpoint

- TypeScript and static production build pass, including the separate cinematic route.
- Firefox Developer Edition 160: five shots captured, no page/console errors in the final run, shot replay passed, narrow 390px viewport has no page overflow.
- Main sequence recorded from the real rendered WebGL canvas; UI labels are composited from the actual page text. Final MP4: 28.37 seconds, 8,573,139 bytes. This is browser-rendered footage, not an AI-generated video.
- Captured frames were visually inspected, including opening, impact, quantum contact and a video contact sheet. The waking still happens during the eyelid blackout; the motion clip retains the full transition.
- Edge reduced-motion check: canvas is unchanged by pointer movement; WebGL context-loss fallback works; the replay lab remains reachable. Firefox BiDi media emulation was unsupported, so that check used Edge. Initial integration syntax and display-color issues were corrected before the clean final captures.
- Review caught replay selection, reduced-motion pointer parallax and pass-disposal issues; all were corrected. Full physical-device performance, production character/cloth animation and simulator-driven scene mapping remain outside this sample.

No source upload or deployment. User visual review is the next gate.
