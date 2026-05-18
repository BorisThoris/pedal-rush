# Pedal Rush

Pedal Rush is a responsive 2D traffic-dodging game built with React 18 and Vite. Hold gas to accelerate, brake to scrub speed, switch lanes, and thread through traffic to build score and combo.

## Controls

- Gas button, `ArrowUp`, or `Space` accelerates.
- Brake button or `ArrowDown` slows the car.
- Lane buttons, `ArrowLeft`, or `ArrowRight` switch lanes.
- Releasing both pedals lets the car coast down.
- Clean passes award points and build combo. Collisions cost health, trigger a short recovery, and an empty health bar causes a spinout recovery penalty.

## Tech Stack

- React 18
- Vite
- Vitest + Testing Library
- CSS animation and `requestAnimationFrame` for the 2D game loop

## Run Locally

```bash
npm install
npm start
```

Build and test:

```bash
npm run build
npm test
```

The production build is emitted to `build/`.

## Cloudflare Pages

- Pages project name: `pedal-rush`
- GitHub repository: `BorisThoris/pedal-rush`
- Production branch: `master`
- Root directory: `.`
- Node version: `20`
- Build command: `npm run build`
- Build output directory: `build`
- Public URL target: `https://pedal-rush.pages.dev/`

Do not enable Cloudflare Access for the demo deployment. Leave frame-blocking headers unset so the portfolio can iframe the public build.
