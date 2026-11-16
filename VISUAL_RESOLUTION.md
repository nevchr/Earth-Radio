# Visualization resolution

Every visualization has a detailed asset and a smaller standard copy. The
upgrade uses NASA originals, preserves the existing regional excerpts and source
periods, and does not generate scientific detail.

| Visualization | Detailed asset | Source |
| --- | --- | --- |
| Ocean currents and temperature | 2048 × 1024 video | [SVS 3912](https://svs.gsfc.nasa.gov/3912/) |
| Perpetual Ocean 2 | 2048 × 1024 video | [SVS 5505](https://svs.gsfc.nasa.gov/5505/) |
| EIC night lights | 4096 × 1152 video; globe uses the left panel | [SVS 5313](https://svs.gsfc.nasa.gov/5313/) |
| Black Marble night map | 4096 × 2048 video | [SVS 5475](https://svs.gsfc.nasa.gov/5475/) |
| Historical lightning | 4096 × 2048 video | [SVS 5011](https://svs.gsfc.nasa.gov/5011/) |
| PM2.5 model | 4096 × 2048 video | [SVS 5518](https://svs.gsfc.nasa.gov/5518/) |
| Aerosol still | 7680 × 4320 image | [SVS 5669](https://svs.gsfc.nasa.gov/5669/) |
| GEDI West Coast forest height | 3840 × 2160 video | [SVS 4950](https://svs.gsfc.nasa.gov/4950/) |
| Global CO₂ camera view | 3840 × 2160 video | [SVS 5196](https://svs.gsfc.nasa.gov/5196/) |
| Atmospheric river camera view | 1920 × 1080 video | [SVS 4960](https://svs.gsfc.nasa.gov/4960/) |
| Gulf Stream close-up | 1920 × 1080 video | [SVS 5425](https://svs.gsfc.nasa.gov/5425/) |
| Kuroshio close-up | 1920 × 1080 video | [SVS 5425](https://svs.gsfc.nasa.gov/5425/) |
| Agulhas close-up | 1920 × 1080 video | [SVS 5425](https://svs.gsfc.nasa.gov/5425/) |

Detailed paused posters use the same upgraded material. The source preview
canvases match their displayed size and device pixel ratio, within a 1920 × 1080
budget. Small source-selection thumbnails retain their lighter images.

Sound analysis always uses the same smaller copy on every device. This avoids
resolution-dependent motion aliasing and multiple simultaneous HD decoders.
The optional **Detailed view** button loads one display-only asset for the
selected source. It follows the analysis video's normalized timeline and
play/pause state; switching views releases it. Failure returns to the standard
view without interrupting the music. GEDI remains sound-only.

Detailed static posters are chosen at widths of at least 900 pixels, with
data-saving off and more than 4 GB RAM / 4 CPU cores when reported. This policy
and the globe tier are refreshed on resize; it never changes sound inputs.

Map overlays retain the existing 4096-pixel sampling cap and 2048-pixel desktop
sphere cap. Camera-moving films stay in the source window. Globe draping remains
approximate where documented; sharper imagery adds no calibrated measurements.
Video frame rates and compression are optimized for delivery. Frame difference
is normalized to a 0.2-second interval; ocean motion uses a soft response rather
than a hard ceiling. Browser decoding and timing can still introduce small
differences. Native phone performance still requires physical-device profiling.

Asset provenance, dimensions, checksums and scene checks are recorded in
`visual-resolution.json`.
