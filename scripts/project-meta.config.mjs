// Metadata inputs for this repository - unique to my-hooks-demo.
//
// Everything here is curated by hand. Derived facts (stack, metrics, git,
// screenshots) are computed by scripts/generate-project-meta.mjs, which writes
// project.meta.json. Run it with:
//   npm run meta          regenerate project.meta.json
//   npm run meta:check    fail if project.meta.json is stale

import path from 'node:path';

// Screenshots are captured by the portfolio (npm run capture there). Point
// PORTFOLIO_ROOT elsewhere, or drop images in ./project-media, to override.
const portfolioRoot = process.env.PORTFOLIO_ROOT ?? String.raw`C:\Users\Gaming PC\Desktop\Repos\portfolio`;

export default {
  slug: "pedal-rush",
  classification: "web-app",

  curated: {
    "title": "Pedal Rush",
    "subtitle": "React Hooks animation demo",
    "description": "An early React Hooks project focused on reducer-driven interaction and animated UI state.",
    "tags": [
      "React",
      "Hooks",
      "Archive"
    ],
    "accent": "#84cc16",
    "deploymentUrl": "https://pedal-rush-git.pages.dev/",
    "localUrl": "http://127.0.0.1:4111/",
    "buildCommand": "npm run build",
    "buildOutput": "build",
    "runCommand": "npm start",
    "devPort": 4111,
    "showcaseTier": "more"
  },

  // How the portfolio screenshot pipeline photographs this project.
  capture: {
    "route": "/"
  },

  scores: {
    "priorityScore": 52,
    "demoabilityScore": 66,
    "depthScore": 50,
    "polishScore": 50,
    "uniquenessScore": 50,
    "maintenanceScore": 44
  },

  analysisNotes:
    "Early hooks animation/demo project; kept visible as archive material with limited visual emphasis.",

  // Where the link-preview card lives: the page head that carries the Open
  // Graph tags, and the static directory the image is published from.
  social: {
    "htmlFile": "index.html",
    "staticDir": "public",
    "imageName": "og-image.jpg",
    "imageUrlPath": "/og-image.jpg"
  },

  media: {
    sourceDir: path.join(portfolioRoot, "public", "project-shots", "pedal-rush", "latest"),
    publicPathPrefix: "/project-shots/pedal-rush/latest",
    primaryProfile: "card"
  }
};
