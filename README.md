# LoL Draft Helper

React + TypeScript draft advice for Master Yi and Bel'Veth jungle, Volibear and Heimerdinger top, Miss Fortune ADC, and Lux support.

## Current review: October 18, 2026

Recommendations target **League patch 26.20**, Summoner's Rift Ranked Solo/Duo, Emerald+, all regions. Riot's corresponding Data Dragon release is **16.20.1**. These version formats are intentionally different.

Sources checked:

- [Riot 26.20 notes](https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-26-20-notes/) for live balance changes. Classic, ARAM and Arena changes are excluded.
- [Riot 26.15 notes](https://www.leagueoflegends.com/en-us/news/game-updates/league-of-legends-patch-26-15-notes/) for Bel'Veth's scaling update.
- [Riot 14.8 notes](https://www.leagueoflegends.com/en-us/news/game-updates/patch-14-8-notes/) for Mordekaiser's QSS interaction.
- Mobalytics' current role-specific [Yi](https://mobalytics.gg/lol/champions/masteryi/build), [Bel'Veth](https://mobalytics.gg/lol/champions/belveth/build), [Volibear](https://mobalytics.gg/lol/champions/volibear/build/top), [Heimerdinger](https://mobalytics.gg/lol/champions/heimerdinger/build/top), [Miss Fortune](https://mobalytics.gg/lol/champions/missfortune/build), and [Lux](https://mobalytics.gg/lol/champions/lux/build/support) build samples. Pages sometimes label the data patch 16.20 internally; their public patch title is 26.20.
- Riot [champion data](https://ddragon.leagueoflegends.com/cdn/16.20.1/data/en_US/champion.json) and [items](https://ddragon.leagueoflegends.com/cdn/16.20.1/data/en_US/item.json) for the bundled roster and item validation fixture.

| Champion | Reviewed baseline |
| --- | --- |
| Master Yi | Hail of Blades, Kraken → Collector → Last Whisper upgrade → Infinity Edge; Lethal Tempo/on-hit alternative into multiple frontliners |
| Bel'Veth | Press the Attack, Kraken → Blade of the Ruined King; scaling and safe stacks after the 26.15 update |
| Volibear | Lethal Tempo, Dusk and Dawn → Navori; Tear/Fimbulwinter is a separate tank option |
| Heimerdinger | Conqueror, Blackfire → Liandry; stasis/kiting and penetration as needed |
| Miss Fortune | First Strike, Hubris → Collector → Infinity Edge; PTA trading alternative into poke |
| Lux support | Comet, Zaz'Zak quest reward, Luden's Echo; account for support income and ward slots |

These are **curated snapshots**, with draft heuristics layered on top. Two frontliners do not prove armor/MR purchases, and damage profiles can change with builds. No live win-rate feed or automatic build scraping is implemented. Ban suggestions are matchup options, not a statistical ban ranking. Actual inventory and the strongest threats should guide in-game purchases.

The app checks the latest Data Dragon roster, validates cached data, and falls back to bundled data when refresh fails. A new Data Dragon patch displays a review warning; it does **not** silently mark old recommendations current. A five-enemy limit and unique champion resolution apply to analysis; lane entries take priority. Inputs beyond that limit are reported.

## Interface

Rune pages show Riot's rune artwork and separate primary, secondary and shard choices. The reviewed Data Dragon rune catalog powers validation of every build branch: four primary runes, two secondary runes, no duplicate rows, and no secondary keystones. Lane matchup buttons let you select known opponents directly without retyping names.

Drafts automatically save on the current device, including the selected champion and optional lane matchups. **Share draft** copies a versioned URL containing the draft; opening it imports the setup and recomputes advice with the app's reviewed patch. Clipboard failures expose a selectable link. **Clear all** can be undone until the next edit.

**Lock-in view** brings the full rune page, skill order, starting items and spells into a compact preparation panel, alongside the build and fight plan. Its three-item checklist tracks preparation for the current draft; leaving the view resets the checklist. Partial drafts show how many opposing picks are still unknown.

The draft workspace uses champion artwork, opponent portraits, item icons with offline fallbacks, and a responsive one-, two-, or three-column layout. Copy the complete build plan, explore a sample draft, or expand rune and wave details. Coach shortcuts prepare a question for review before sending. Keyboard autocomplete, visible focus states and reduced-motion preferences are supported.

## Development

Use Node 22.12+ or Node 24 and npm:

```sh
npm ci
npm run dev
```

The draft helper works in Vite without a server key. The optional `/api/coach` route needs a Node serverless host (such as Vercel) and a server-side `OPENAI_API_KEY`. Plain `vite dev` does not serve this route. Never expose the key through a `VITE_` variable. The coach receives the selected champion, reviewed patch/date, normalized enemy draft, and recommendations; model output is not independently verified live patch data.

## Verification

```sh
npm run lint
npm run build
npx playwright install
npm run test:e2e
```

Playwright covers Chromium, Firefox and WebKit; six champion flows, lane-only analysis, input validation, duplicates/overflow, cache/storage/network failures, patch warnings, coach request validation/errors, mobile layout, suppression handling, and legal six-item builds across recommendation branches. API tests and UI mocks make no paid model requests. The production build also type-checks the serverless handler. CI runs lint, build and the browser suite.

## Updating a later patch

1. Confirm the live PC Summoner's Rift patch and hotfixes in Riot's official notes. Review intervening champion, item, rune and system changes; exclude PBE and other game modes.
2. Check each linked build source for the intended role, patch and sample bracket. Update all six recommendation modules and relevant traits/scout notes. Distinguish sourced baselines from judgment-based draft adjustments.
3. Update `src/recommendations/meta.ts` with the reviewed patch, matching Data Dragon release and actual review date.
4. Run `npm run data:refresh -- 16.20.1` with the newly reviewed Data Dragon version. This refreshes the compact fallback roster, item icon index, rune catalog, and item-name test fixture. Update the fixture import in `tests/recommendations.spec.ts` to match. The script refreshes catalogs; it does not choose builds or runes.
5. Run lint, build and tests. Review representative lane, suppression, healing, tank and mobile scenarios before publishing.
