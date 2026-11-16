# Finishing pass against Claude's current-snapshot audit

The external report audited the earlier 81-file snapshot. This pass preserves
the newer local guided-listen, disclosure and sound-only GEDI work. URLs,
publication and access changes were excluded as requested.

| Finding | Result in the local app |
| --- | --- |
| F1 / P1: HD-driven motion saturation and concurrent heavy decoding | All sound layers use the same standard media on desktop and mobile. Differences are normalized to 0.2 seconds, and ocean motion uses a soft response without the old hard ceiling. Optional Detailed view loads one synchronized display-only asset. View changes release it; failure returns to standard display. |
| F2: stacked sheets and wrong Explore state after resize | Narrow layouts retain one open station/player sheet. Both Explore buttons share the same expanded state. |
| F3 / F4: covered title and hidden globe on short screens | Expanded desktop panels start below the brand. Short narrow layouts place the player beside the globe. Portrait geometry uses the area left above the current sheet; the idle globe uses the space available when no sheet is open. |
| F5: raw metrics disguise the mapped effect | Ocean meters show mapped pulse strength with the raw image difference alongside it. Both are labeled as an artistic mapping of image properties. |
| F6 / F15: host replay while muted and inaccessible compact host controls | Replay is disabled when main or host audio is muted. Its handler also reports mute truthfully. Host controls are available in the compact scrollable player. |
| F7 / F8: Guide shortcut escape and stale instructions | Already fixed by the preceding local iteration; rechecked in the UI journey. The background is inert and `/` cannot open Explore behind the Guide. |
| F9 / F10 / F14: skip link, counts and initial player focus | The skip link opens Explore and focuses search. Sound announcements exclude silent context films and respect isolation. Listen focuses Play. |
| F11 / F17 / F19: collisions, instructions, small Guide target and wording | The narrow header fits at 320px. Guide has a 44px target and reserved space beside metadata. Hidden instructions no longer sit beneath controls. Search uses singular/plural correctly. Selected phone pins have a label; neighbouring desktop labels avoid one another. |
| F12 / F13: stale resize tier/zoom and empty idle phone layout | Globe quality and default zoom update on layout changes. Poster quality updates on resize. Sound inputs stay unchanged. Globe geometry responds to sheet visibility. |
| F16: no exact focus reset | Reset image focus restores the original fractional coordinates, not the rounded slider values. |
| F18: no error in the source window | Both expanded and compact source captions show unavailable state; the source-window explanation identifies the saved preview. |
| R1 / R3 / R4 / R5 / R6 | The source frame allows vertical touch panning; hidden preview canvas work was removed; the large aerosol image is optional display-only; tab-return copy says to press Play; only completed or deliberately skipped intros count as heard. |

## Verification

- Syntax checks, `tests/playlist.cjs`, `tests/verify-host-provenance.cjs`, and `git diff --check` passed.
- `tests/motion.cjs` processes real standard and detailed ocean clips at 5 Hz
  through the implemented image measurement and sound mapping. All 12 curated
  ocean focus areas varied over the sampled first eight seconds, with no hard
  motion ceiling. FFmpeg scaling is an offline check; it is supplemented by
  the browser check rather than assumed identical to browser resampling.
- `tests/finishing.cjs` passed in local Chrome at 844×390, 667×375, 720×450,
  320×568 and 768×1024, and through desktop→phone→desktop transitions. It checked
  title/header overlap, a usable unobstructed globe area, dock states, Play
  focus, skip-link behavior, detailed-view lifecycle and failure, source errors,
  muted replay, and exact focus reset. Screenshots were visually inspected.
- In one six-second live Chrome sample, California ocean motion varied from
  about 0.37 to 0.58. Standard listening requested no HD video. The complete
  file sizes of its five requested standard clips total 21,453,694 bytes,
  including the metadata-only context film. This is an asset budget, not a
  measured transfer or a CPU/frame-rate benchmark. Optional detailed viewing
  adds one higher-resolution display stream.
- `tests/journey.cjs` passed the full station→isolation→guided comparison→return
  journey, transport/seek/host controls, keyboard focus and announcements,
  simulated media states, and reduced-motion narrow layouts. Axe reported no
  violations in the Guide and receiver during that run.

## Limits

No physical phone/touch session, Safari/Firefox run, screen-reader session,
subjective listening, educational evaluation, or reliable frame-rate/power
benchmark was performed. The 720×450 test covers the CSS viewport associated
with a 1440×900 window at 200% zoom; actual browser zoom was not driven. NASA
registration and interpretation limits remain as documented in the README.
System fallback icon rendering and the accumulated stylesheet still merit
cross-platform review. No URLs or hosting settings were changed.
