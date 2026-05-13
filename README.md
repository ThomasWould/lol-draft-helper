# LoL Draft Helper (MVP) trigger vercel deploy

A simple League of Legends draft helper web app built with React + TypeScript.
Currently supports quick draft recommendations for:
- Master Yi (Jungle)
- Volibear (Top)

## Features
- Enter enemy team comp quickly
- Get rune + build recommendations
- Designed for fast in-game use

## Tech Stack
- React
- TypeScript
- Vite

## Local Development
```bash
npm install
npm run dev
```

## QA Automation
```bash
npm run test:e2e
```

Run the interactive Playwright runner with:
```bash
npm run test:e2e:ui
```

The Playwright suite uses `playwright.config.ts` and launches the app against the local Vite server at `http://127.0.0.1:5173`.

The tests cover homepage rendering, champion selection, enemy team detection, chip removal, top-lane matchup guidance, and a mobile viewport smoke test.
