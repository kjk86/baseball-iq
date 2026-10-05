# Cubs Baseball IQ

An interactive defensive "whiteboard" for our 8U coach-pitch team. Kids watch animated plays, then answer "Where should *you* go?" questions for the positions they actually play.

**BALL → BASE → BACKUP**

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # static site in dist/
npm run build:single # ONE self-contained file: dist-single/index.html
```

Add `?debug=1` to the URL (or flip the switch in Coach Mode ⚙) to see coordinates, resolved assignments and animation phases. Tap anywhere on the field to read an x/y coordinate.

## Deploy

It's a static site - no backend. Any of these work:

- **Netlify Drop** – drag the `dist/` folder onto app.netlify.com/drop, get a URL.
- **Vercel / Cloudflare Pages / GitHub Pages** – build command `npm run build`, output `dist`.
- Or just host `dist-single/index.html` anywhere (it's everything in one file).

## Where to change things

| I want to…                         | Edit                                  |
| ---------------------------------- | ------------------------------------- |
| Update this week's lineup for everyone | Paste the table into `THIS_WEEK` in `src/data/lineups.ts`, then redeploy |
| Try a lineup on my phone only      | Coach Mode ⚙ → paste the table (saved on that device) |
| Add / rename a player              | `src/data/players.ts`                 |
| Change who does what on a play     | `src/baseball/defensiveRules.ts`      |
| Move where a spot is on the field  | `src/baseball/coordinates.ts`         |
| Add a play                         | `src/data/scenarios.ts`               |
| Change a lesson's plays            | `src/data/lessons.ts`                 |
| Update stats                       | GameChanger → export season stats → save over `gamechanger/stats.csv` |
| Update schedule / add a result     | `gamechanger/schedule.csv` (e.g. `W 7-2` in the result column) |
| Add a practice plan                | Drop the PDF into `practice-plans/` (optional: link it to a date in `schedule.csv`) |

The Team page reads `gamechanger/*.csv` and lists `practice-plans/` straight from the GitHub repo when the site loads, so those three need **no rebuild** — just commit and push.

### Lineups (weekly)
The lineup is a plain table you can paste straight from your lineup sheet:

```
Batting	Player	1st	2nd	3rd	4th
1	Joshua	2B	LF	SS	1B
8	Dawson	RF	P	C	-
```

- `-` means bench that inning. Anyone left off the table is "not at the game".
- Nicknames work (`Leo`, `Kam`) — add more in `players.ts`.
- Tabs, spaces or commas all work, and the batting-order number is optional.
- When you publish a new week, any old Coach Mode edits on people's phones are ignored automatically.

### Changing an assignment
Plays are driven by positions, not kids. For example, to make the pitcher back up home instead of third on a single to left, change one line in `SINGLE_LF`:

```ts
P: a('BACKUP_HOME', 'Get behind the catcher!'),
```

Every scenario, animation and quiz answer that uses that rule updates automatically — quiz answers are computed from the rules, never typed in by hand.

Spots where the spec wasn't specific are marked `TODO(coach)` in `defensiveRules.ts` (and flagged ⚠ in debug mode). Review those.

### Adding a play
Copy a scenario in `scenarios.ts`. You give it the situation (runners, which ball event) and a short script of what the ball and runners do (`PITCH`, `HIT`, `REACT`, `THROW`, `OVERTHROW`, `FREEZE`, `DECISION`…). You never say where fielders go — the rules do that. Then add its id to a lesson if you want.

## How it's put together

```
game state + event → defensiveRules → assignments per POSITION
                  → lineup (who's at that position this inning)
                  → animationEngine (keyframes) → SVG field
```

- `src/baseball/` – pure baseball logic (rules, resolver, force/tag, quiz + Practice My Game question pickers)
- `src/animation/` – builds a timeline from the resolved play and samples it each frame
- `src/components/`, `src/pages/` – React UI; the field renderer knows nothing about baseball rules

**Practice My Game** looks up the player's position each inning (skipping bench innings), pulls plays where that position has a job, and picks ~10 questions with varied answers. Missed concepts show up on the end screen.
