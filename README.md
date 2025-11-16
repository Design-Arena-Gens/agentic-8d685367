# Cricket Bowling Hawk-Eye Visualizer

Web application that ingests a cricket bowling clip, tracks the ball trajectory in-browser, and renders a Hawk-Eye inspired projection for instant tactical review.

## Features

- Client-side colour-threshold ball tracking with adjustable detection controls
- Real-time trajectory smoothing with derived metrics (velocity, length category, impact prediction)
- Hawk-Eye style top-down canvas renderer highlighting the delivery path
- No-server processing: all computation happens locally in the browser
- Tailwind-driven responsive UI ready to deploy on Vercel

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and upload a short (4–8s) broadcast-angle clip with a clearly visible red ball for best results.

## Build & Deploy

```bash
npm run build
npm start
```

The project is configured for Vercel. Deploy with:

```bash
vercel deploy --prod --yes --token $VERCEL_TOKEN --name agentic-8d685367
```

## Project Structure

```
src/
  app/
    page.tsx          # Landing page + analyzer surface
    layout.tsx        # App shell and metadata
  components/
    VideoAnalyzer.tsx # Upload + processing workflow
    HawkEyeView.tsx   # Canvas renderer for Hawk-Eye projection
    MetricsPanel.tsx  # Delivery insight cards
  lib/
    ballDetection.ts  # Pixel sampling + centroid detection
    trajectory.ts     # Physics heuristics + derived metrics
```

## Notes

- Detection heuristics assume a red ball against contrasting background; tweak thresholds via the control panel.
- For longer videos, trim to focus on the run-up and release to keep processing fast.
- All values are heuristic approximations for coaching/analysis visualization, not official DRS outputs.
