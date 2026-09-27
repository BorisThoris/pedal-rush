# Pedal Rush

Drive the original blue MX-5 through an endless side-view road. The assembled body and spinning wheels, illustrated scenery and photographic gas/brake pedals preserve the original game's design. Three lanes, fair traffic, health, pause, retry and a saved best make it a complete browser game.

## Play

- Hold **Space / W** or **Gas** to accelerate from rest. Release to coast; hold **S / Brake** to slow down faster.
- **Up / Down** or **A / D** changes lanes. Touch players can hold a pedal while pressing a lane arrow.
- **Escape / P** pauses or resumes. Losing focus pauses and releases all held controls.
- Avoid traffic and earn points for distance, overtakes and close passes. Collisions reduce health and briefly grant recovery time; after a crash, choose **Try again** or press **Enter**.
- Best scores are saved on this device. Blocked storage does not prevent play.

The car, wheels and scenery stop when speed reaches zero. Controls support pointer cancellation and keyboard operation. The layout fits desktop, portrait phones and landscape phones.

## Run locally

```sh
npm install
npm start
npm test -- --maxWorkers=1 --minWorkers=1
npm run build
npm run preview
```

Production output is `build/`. Node 20 is the declared runtime. All game artwork is bundled locally; the game needs no account or external service. React renders the original layered artwork, while `src/game/simulation.js` owns seeded traffic, swept collisions, acceleration, scoring and recovery. Simulation tests check 10,000 fair traffic waves and a 20-minute viable route, alongside input and restart behavior.

## Demo and media

Play at https://pedal-rush-git.pages.dev/ . Source: https://github.com/BorisThoris/pedal-rush . The Cloudflare Pages project is `pedal-rush-git`, production branch `master`, build command `npm run build`, output `build`.

The portfolio uses screenshots and a silent recording of actual play. Capture recipes live in `scripts/project-meta.config.mjs`; `npm run meta:refresh -- --source=local` refreshes the media, and the strict media checks verify it against the current inputs. MP4 delivery supports real byte ranges for playback and seeking.
