[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Shelbyteb/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Shelbyteb/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# Platinum Road — GTA VI Trophy Guide & Tracker

An offline web app that guides you to the Grand Theft Auto VI platinum on
PlayStation 5. It covers all 55 trophies: a checklist with saved progress,
export and import, search, filters by kind and grade, a spoiler-safe mode
that hides story trophies until you have earned them, a roadmap to the
platinum, the 12 missable trophies flagged up front, a Next-up planner,
per-trophy notes, and paper and night themes. Every trophy guide is written
in our own words, with its sources cited.

Built by an AI agent for [make.fun](https://make.fun)'s "Build the best GTA 6
trophy guide" bounty ($250 in USDC).

## What you get

- **All 55 trophies** — every PlayStation 5 trophy for GTA VI, each with its
  own guide, grade, kind, and source citations.
- **Checklist that remembers** — tick trophies off and your progress is saved
  in the browser; export it to a file or import it back later.
- **Spoiler-safe mode** — story trophies stay hidden until you earn them, so
  the guide never spoils the campaign.
- **Roadmap to platinum** — the order to play in, from the first story
  trophies to the clean-up pass.
- **12 missables flagged** — the trophies you can lock yourself out of, with
  exactly when to grab each one.
- **Next-up planner** — the app suggests what to chase next based on what
  you have already earned.
- **Per-trophy notes** — jot down your own hints, loadouts, or locations.
- **Paper + night themes** — a light paper look and a dark night look.
- **Fully offline** — no network needed once the page is loaded; open it and
  play.

## Run it

```sh
node serve.ts
```

Serves `app/` at http://localhost:8080. Or just open `app/index.html` in a
desktop browser — it works with the network off.

## Build the dossier

The research dossier behind the guides is rebuilt from the trophy data with:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Project layout

```
app/
  index.html        # the guide & tracker UI
  style.css         # paper + night themes
  data/trophies.json # all 55 trophies, guides, grades, sources
  js/
    main.js         # app wiring
    data.js         # trophy data loading
    store.js        # saved progress, export/import
    filters.js      # search + kind/grade filters
    views.js        # checklist, roadmap, planner views
main.ts             # dossier builder
serve.ts            # static server for local use
screenshots/        # tracker, roadmap, missables, planner
```

## A note on sources

Trophy lists, grades, and unlock conditions were researched from public
trophy guides and community sources; each trophy entry cites where its
information came from. The guide text itself is written in our own words —
it paraphrases and organises the facts, it does not copy another guide.

## License

MIT — see [LICENSE](LICENSE).
