// Curated identity and reproducible captures from the real game.
import path from 'node:path';
const portfolioRoot = process.env.PORTFOLIO_ROOT ?? String.raw`C:\Users\Gaming PC\Desktop\Repos\portfolio`;
export default {
  "slug": "pedal-rush",
  "classification": "web-app",
  "curated": {
    "title": "Pedal Rush",
    "subtitle": "A multilane endless traffic run",
    "description": "An endless four-lane driving game with modeled cars and a coastal road. Steer through fair traffic waves, hold gas for a burst, brake to make space and build a score from overtakes and close calls. Includes keyboard and touch controls, pause, collision results, retry and a saved personal best.",
    "tags": [
      "Game",
      "Three.js",
      "React",
      "Endless Driving"
    ],
    "accent": "#398cd1",
    "deploymentUrl": "https://pedal-rush-git.pages.dev/",
    "localUrl": "http://127.0.0.1:4111/",
    "buildCommand": "npm run build",
    "buildOutput": "build",
    "runCommand": "npm start -- --host 127.0.0.1 --port 4111",
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
          "name": "START RUN"
        },
        "state": "visible"
      },
      {
        "type": "click",
        "target": {
          "role": "button",
          "name": "START RUN"
        },
        "label": "start a real traffic run"
      },
      {
        "type": "key",
        "key": "ArrowUp",
        "holdMs": 2600
      }
    ],
    "waitAfterReadyMs": 100
  },
  "scores": {
    "priorityScore": 52,
    "demoabilityScore": 66,
    "depthScore": 50,
    "polishScore": 50,
    "uniquenessScore": 50,
    "maintenanceScore": 44
  },
  "analysisNotes": "Playable modeled traffic runner, preserving the original blue car, navy dashboard, gas/brake and lane-control identity. Verified real keyboard/touch runs, collision/retry and persisted best.",
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
        "title": "Pedal Rush: a real four-lane traffic run",
        "kind": "capture",
        "inputs": [
          "src",
          "index.html",
          "public"
        ],
        "source": "local",
        "music": "project-media/music/tour.m4a",
        "posterAt": 0.5,
        "recipe": {
          "route": "/",
          "viewport": {
            "width": 1280,
            "height": 720
          },
          "durationMs": 14000,
          "setup": {
            "actions": [
              {
                "type": "waitFor",
                "target": {
                  "role": "button",
                  "name": "START RUN"
                },
                "state": "visible"
              },
              {
                "type": "click",
                "target": {
                  "role": "button",
                  "name": "START RUN"
                },
                "label": "start a real traffic run"
              }
            ],
            "waitAfterReadyMs": 200
          },
          "timeline": [
            {
              "type": "key",
              "key": "ArrowUp",
              "holdMs": 3000
            },
            {
              "type": "press",
              "key": "ArrowLeft"
            },
            {
              "type": "key",
              "key": "ArrowUp",
              "holdMs": 2200
            },
            {
              "type": "press",
              "key": "ArrowRight"
            },
            {
              "type": "key",
              "key": "ArrowDown",
              "holdMs": 900
            },
            {
              "type": "press",
              "key": "ArrowRight"
            },
            {
              "type": "key",
              "key": "ArrowUp",
              "holdMs": 2200
            }
          ]
        }
      }
    ]
  }
};
