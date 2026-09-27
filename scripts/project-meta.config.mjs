// Metadata inputs for this repository - unique to my-hooks-demo.
//
// Everything here is curated by hand: identity, commands, the screenshot recipe
// (capture), the recorded trailer (trailers.items, kind: capture) and where the
// card, icons and trailers are published. scripts/generate-project-meta.mjs
// derives the rest into project.meta.json; scripts/project-media.test.mjs
// checks that everything here was actually produced.
//   npm run meta:refresh   trailers -> shots -> social -> icons -> meta
//   npm run test:media     the media contract

import path from 'node:path';

const portfolioRoot = process.env.PORTFOLIO_ROOT ?? String.raw`C:\Users\Gaming PC\Desktop\Repos\portfolio`;

export default {
  "slug": "pedal-rush",
  "classification": "web-app",
  "curated": {
    "title": "Pedal Rush",
    "subtitle": "Hold the gas, thread the traffic",
    "description": "A 2D traffic-dodging game in React: hold gas to accelerate, brake to scrub speed, switch lanes and thread through traffic for score and combo, with collisions costing health and a spinout when it runs out. A requestAnimationFrame game loop with CSS animation, built on Vite.",
    "tags": [
      "Game",
      "React",
      "Vite",
      "Arcade"
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
  "capture": {
    "route": "/",
    "actions": [
      {
        "type": "waitFor",
        "target": {
          "role": "button",
          "name": "Gas"
        },
        "state": "visible",
        "label": "wait for the pedals"
      },
      {
        "type": "key",
        "key": "ArrowUp",
        "holdMs": 3000,
        "label": "hold the gas"
      },
      {
        "type": "press",
        "key": "ArrowLeft",
        "label": "switch lane"
      },
      {
        "type": "key",
        "key": "ArrowUp",
        "holdMs": 800,
        "label": "keep the speed"
      }
    ],
    "waitAfterReadyMs": 300
  },
  "scores": {
    "priorityScore": 52,
    "demoabilityScore": 66,
    "depthScore": 50,
    "polishScore": 50,
    "uniquenessScore": 50,
    "maintenanceScore": 44
  },
  "analysisNotes": "Early hooks animation/demo project; kept visible as archive material with limited visual emphasis.",
  "social": {
    "htmlFile": "index.html",
    "pageTitle": "Pedal Rush",
    "staticDir": "public",
    "imageName": "og-image.jpg",
    "imageUrlPath": "/og-image.jpg"
  },
  "icons": {
    "background": "#1a2e05",
    "themeColor": "#1a2e05",
    "shortName": "Pedal Rush"
  },
  "media": {
    "sourceDir": path.join(portfolioRoot, "public", "project-shots", "pedal-rush", "latest"),
    "publicPathPrefix": "/project-shots/pedal-rush/latest",
    "primaryProfile": "card"
  },
  "trailers": {
    "items": [
      {
        "id": "tour",
        "title": "Pedal Rush: hold the gas, thread the traffic",
        "kind": "capture",
        "inputs": [
          "src",
          "index.html",
          "public"
        ],
        "source": "deployment",
        "music": "project-media/music/tour.m4a",
        "posterAt": 0.5,
        "recipe": {
          "route": "/",
          "viewport": {
            "width": 1280,
            "height": 720
          },
          "durationMs": 22000,
          "setup": {
            "actions": [
              {
                "type": "waitFor",
                "target": {
                  "role": "button",
                  "name": "Gas"
                },
                "state": "visible",
                "label": "wait for the pedals"
              }
            ],
            "waitAfterReadyMs": 600
          },
          "timeline": [
            {
              "type": "key",
              "key": "ArrowUp",
              "holdMs": 4000,
              "label": "gas"
            },
            {
              "type": "press",
              "key": "ArrowLeft",
              "label": "lane left"
            },
            {
              "type": "key",
              "key": "ArrowUp",
              "holdMs": 2500,
              "label": "gas"
            },
            {
              "type": "press",
              "key": "ArrowRight",
              "label": "lane right"
            },
            {
              "type": "key",
              "key": "ArrowUp",
              "holdMs": 3000,
              "label": "gas"
            },
            {
              "type": "press",
              "key": "ArrowRight",
              "label": "lane right"
            },
            {
              "type": "key",
              "key": "ArrowDown",
              "holdMs": 900,
              "label": "brake"
            },
            {
              "type": "press",
              "key": "ArrowLeft",
              "label": "lane left"
            },
            {
              "type": "key",
              "key": "ArrowUp",
              "holdMs": 5000,
              "label": "gas"
            }
          ]
        }
      }
    ]
  }
};
