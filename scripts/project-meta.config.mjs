// Curated identity and reproducible captures from the original game.
import path from 'node:path';
const portfolioRoot = process.env.PORTFOLIO_ROOT ?? String.raw`C:\Users\Gaming PC\Desktop\Repos\portfolio`;
export default {
  "slug": "pedal-rush",
  "classification": "web-app",
  "curated": {
    "title": "Pedal Rush",
    "subtitle": "The original blue MX-5, with an endless road ahead",
    "description": "A side-view endless driving game with the original blue MX-5, spinning wheels, illustrated scenery and gas/brake pedals. Accelerate from rest, coast or brake, change between three lanes, avoid traffic and chase a saved personal best. Includes keyboard and touch controls, health, pause and retry.",
    "tags": [
      "Game",
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
          "name": "Gas",
          "exact": true
        },
        "state": "visible"
      },
      {
        "type": "key",
        "key": "Space",
        "holdMs": 6000
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
  "analysisNotes": "Original side-view MX-5 and scenery restored from authored assets. Three lanes, real acceleration/coasting/braking, fair traffic, health and retry. Keyboard, simultaneous touch controls, pause and saved best verified in a real browser.",
  "social": {
    "htmlFile": "index.html",
    "pageTitle": "Pedal Rush",
    "staticDir": "public",
    "imageName": "og-image.jpg",
    "imageUrlPath": "/og-image.jpg"
  },
  "icons": {
    "background": "#10283e",
    "themeColor": "#10283e",
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
        "title": "Pedal Rush: original MX-5, three-lane drive",
        "kind": "capture",
        "inputs": [
          "src",
          "index.html",
          "public"
        ],
        "source": "local",
        "posterAt": 0.5,
        "recipe": {
          "route": "/",
          "viewport": {
            "width": 1440,
            "height": 900
          },
          "durationMs": 20000,
          "setup": {
            "actions": [
              {
                "type": "waitFor",
                "target": {
                  "role": "button",
                  "name": "Gas",
                  "exact": true
                },
                "state": "visible"
              }
            ],
            "waitAfterReadyMs": 100
          },
          "timeline": [
            {
              "type": "key",
              "key": "Space",
              "holdMs": 6500
            },
            {
              "type": "press",
              "key": "ArrowUp"
            },
            {
              "type": "key",
              "key": "Space",
              "holdMs": 3500
            },
            {
              "type": "press",
              "key": "ArrowDown"
            },
            {
              "type": "key",
              "key": "s",
              "holdMs": 1200
            },
            {
              "type": "press",
              "key": "ArrowDown"
            },
            {
              "type": "key",
              "key": "Space",
              "holdMs": 4000
            }
          ]
        }
      }
    ]
  }
};
