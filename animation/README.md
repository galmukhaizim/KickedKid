# Emergency Landing — 3D fan re-animation

A ~104 second, fully procedural 3D animation of the "pregnant woman attacked on
a plane / mother forces an emergency landing at LAX" scene, followed by an
original cranky-old-man character who shows up on the tarmac.

Output: `emergency_landing.mp4` (1280x720, 24 fps, H.264).

## How it is made

* `scene.html` — the whole film. Three.js builds every asset procedurally
  (low-poly rigged characters, cabin, cockpit, jet, clouds, LA at night,
  LAX runway/terminal/Theme Building, tarmac with airstairs and police car).
  `window.renderFrame(t)` poses everything for time `t` (seconds), drives the
  camera, subtitles, chyrons, impact flashes and fades, then renders.
* `render.js` — drives headless Chromium (Playwright, SwiftShader WebGL),
  steps `t` frame by frame and pipes PNG screenshots straight into ffmpeg.
* `tile.py` — builds a contact sheet from preview frames.

## Reproduce

```bash
cd animation
npm install
npx playwright install chromium   # unless a Chromium is already configured
npm run serve &                    # static server on 127.0.0.1:8765
npm run preview                    # contact sheet -> sheet.png
npm run render                     # full movie -> emergency_landing.mp4
```

`node render.js movie <w> <h> <fps> <out.mp4> [start] [end]` renders a time range.

## Notes

Fan-made, stylized original characters. Not affiliated with ReelShort or any
creator. The "old man" is an original archetype (flat cap, big glasses,
cardigan, suspenders, cane, loud and rambling).
