# Pedal Rush — The Coastline

A complete 3D endless traffic driver. Take an orange sports coupe down a four-lane coastal highway at golden hour, find a line through traffic, and chase your personal best. There is no finish line: speed and traffic density build with distance, and one collision ends the run.

## Play

- **Enter** starts a run or retries after a crash.
- **Left / Right** or **A / D** changes one lane. The on-screen arrows do the same.
- **Up / W / Space** or hold **Gas** for a speed burst, up to 223 km/h. The reserve recharges when released; release the pedal after exhausting it to re-arm.
- **Down / S** or hold **Brake** to create space. The car cruises automatically when neither pedal is held.
- **P / Escape** pauses and resumes. Losing focus automatically pauses and releases all held controls.
- **Sound off/on** enables an optional synthesized engine sound. It starts only after a user gesture.

Overtakes award points; close passes above 108 km/h build a bonus multiplier. The result screen shows distance, overtakes and close calls. The best score is saved locally when a run ends; blocked browser storage does not prevent play.

Touch and mouse controls use pointer capture, including release outside the pedal, pointer cancellation and focus loss. The interface supports portrait and desktop viewports. Reduced-motion preference suppresses the changing speed FOV.

## Run locally

```sh
npm install
npm start
```

```sh
npm test -- --maxWorkers=1 --minWorkers=1
npm run build
npm run preview
```

The production output is `build/`. WebGL is required; renderer/context failures show a recovery message. All gameplay assets and fonts are local, so gameplay needs no external service after the build is loaded. Node 20 is the repository's declared runtime; the current verification also passed with Node 26.3.1.

## Implementation

- React handles the interface; Three.js renders a chase camera, authored vehicle models, shadows, reflective bodywork, coastline, palms, rock formations, lane markings and road furniture.
- `src/game/scene.js` builds the original coupe, sedan and van meshes from shaped body profiles, glass cabins, wheel assemblies, lights, mirrors and trim. No third-party vehicle asset or runtime model download is used. Barlow fonts are bundled under their included SIL Open Font Licenses in `public/fonts/`.
- `src/game/simulation.js` is a renderer-independent, seeded simulation. Endless waves preserve at least one safe lane; the reserved exit moves no more than one lane between waves spaced at least 64 metres apart. Shared traffic speed prevents later rows compressing into an unavoidable wall. Swept collision checks cover forward travel and lateral lane changes.
- Tests check 10,000 generated waves, a 20-minute simulated full-difficulty drive, deterministic replay, collision, score/boost behaviour and pause/restart/input handling. Browser interaction evidence is recorded separately from simulation tests.
- Previous sprite assets and the historical reducer remain available in the source tree; the active game uses the 3D renderer and simulation above.

## Deployment

Cloudflare Pages project: `pedal-rush`; repository: `BorisThoris/pedal-rush`; production branch: `master`; root: `.`; build command: `npm run build`; output: `build`; Node: `20`.

Target URL: `https://pedal-rush.pages.dev/`. The current local refinement has not been pushed or deployed. Do not enable Cloudflare Access for the demo deployment; leave frame-blocking headers unset if embedding it in the portfolio.
