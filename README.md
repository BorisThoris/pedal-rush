# Pedal Rush

Historical React project built to explore hooks-style state sharing, reducer-driven UI state, and animated browser visuals.

This is a React 16 single-page car speed demo. The player toggles gas/brake pedals, the reducer updates speed, and the UI reflects that state through moving layered backgrounds, spinning wheels, flame visuals, and a speed readout. It is kept as a portfolio/archive project that shows early React Hooks practice, custom context state, reducer actions, component composition, and CSS animation work.

## What It Demonstrates

- React function components using hooks.
- Custom `Provider` and `useGlobalState` wrapper around `useReducer` and context.
- Reducer-driven state transitions for gas, brake, speed-up, and slow-down actions.
- Component composition for playing field, car, controls, and background layers.
- CSS animation tied to application state.
- Asset-heavy UI with SVG/PNG car, wheel, pedal, flame, road, mountain, and sky visuals.
- Create React App build workflow.

## Tech Stack

- React 16
- JavaScript
- React Hooks
- Context API
- `useReducer`
- CSS animations
- Create React App / `react-scripts@3.1.1`

## Main Code Areas

- `src/App.js` - reducer, initial state, provider setup, and app shell.
- `src/myHookComponents/useGlobalState.js` - custom context + reducer provider.
- `src/myHookComponents/myPlayingFieldHookComponent/` - speed readout, layered background, and scene composition.
- `src/myHookComponents/myCarHookComponent/` - gas/brake pedal controls and animated car visuals.

## Run Locally

```bash
npm install
npm start
```

Open `http://localhost:3000`. The demo is fully client-side and does not require a backend. This legacy Create React App project is pinned to Node 20 via `.nvmrc` and `package.json` engines; the npm scripts use `cross-env` to apply the required compatibility flags on Windows, macOS, Linux, and Cloudflare Pages.

Useful scripts:

```bash
npm run build
npm test -- --watchAll=false
```

## Status

Archived portfolio project. The goal of this repository is to show early React Hooks and reducer-driven animation work, not to represent current production React practices.

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
