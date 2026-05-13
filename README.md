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
This project uses Playwright for UI automation against the local Vite app.

Install dependencies:
```bash
npm install
```

Run the full Playwright suite:
```bash
npm run test:e2e
```

Open the Playwright UI runner:
```bash
npm run test:e2e:ui
```

The test suite covers:
- homepage smoke test
- champion selection
- enemy team parsing
- detected draft tags
- Master Yi recommendation flow
- enemy chip removal
- Volibear top matchup guidance
- mobile responsiveness

## Playwright report
After running the suite locally, open the HTML report with:
```bash
npx playwright show-report
```

If port `9323` is already in use, open the report on another port:
```bash
npx playwright show-report --port=9324
```

The GitHub Actions workflow also uploads the generated `playwright-report/` artifact so you can review test results from the Actions run.
