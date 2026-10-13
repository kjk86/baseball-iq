# Sharks Baseball IQ

Defense trainer for the **PVAA Sharks 10U** (Coach Green). Same app as Cubs Baseball IQ, but set up for traditional 9-player baseball: catcher, 3 outfielders, pitcher covers 1st, real cutoffs, 6-inning lineups.

Live page: `/sharks/` on the GitHub Pages site (one self-contained file at `../sharks/index.html`).

## Build & publish

```bash
npm install
npm run build:single          # → dist-single/index.html
cp dist-single/index.html ../sharks/index.html
```
Then commit + push.

## Where to change things

| I want to…                        | Edit |
| --------------------------------- | ---- |
| Post this week's lineup           | Paste the table into `THIS_WEEK.table` in `src/data/lineups.ts` (name + 1st–6th, `-` = bench), update `game`, rebuild |
| Try a lineup on one phone only    | Coach Mode ⚙ → paste the table |
| Roster / jersey numbers           | `src/data/players.ts` |
| Who does what on a play           | `src/baseball/defensiveRules.ts` |
| Add a play / lesson               | `src/data/scenarios.ts`, `src/data/lessons.ts` |
| Schedule & results (no rebuild)   | `gamechanger/schedule.csv` |
| Stats (no rebuild)                | GameChanger season-stats export → save over `gamechanger/stats.csv` |
| Practice plans (no rebuild)       | Drop PDFs in `practice-plans/` |

Until a lineup is posted, Practice My Game lets each player pick up to 3 positions to practice.

Lineup names can be `Camden`, `Camden G`, `Cam` or `#10`.

## Defensive system (summary)

- Ball to the pitcher's left (1B side): pitcher breaks to 1st. 1B pulled off the bag → pitcher covers and takes the toss.
- SS & 2B share 2nd: ball to the left side → 2B covers, right side → SS covers.
- Nobody on 2nd/3rd: catcher backs up 1st on infield grounders. Runner in scoring position: catcher stays home.
- Cutoffs: to 2nd — SS (left) / 2B (right); to 3rd — SS; home — 3B from left, 1B from right.
- Pitcher backs up the base the throw goes to (2nd, 3rd or home); covers home on a passed ball.
- CF is the outfield captain; infielders take pop-ups over P/C.
