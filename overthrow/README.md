# 1st Base Overthrow Rule Visualizer

How the PVAA Rookie Division 1st base overthrow rule (Rule 10d) is called, shown on an animated diamond. Linked from the rulebook visualizer at `/rules/`.
Live at https://kjk86.github.io/bsaeball-iq/overthrow/ (link to one play with `#s1`–`#s7`).

- Everything is in `index.html`: no build step and no dependencies (Google Fonts only).
- **Rule text:** edit the `.rule` section near the top of the HTML.
- **Scenarios:** the `SCENARIOS` array in the script. Each one has `title`, `desc`, `runners` (`B`, `R1`, `R2`), `teach`, `result` and `steps`. Optional `variants` give A/B endings.
- **Steps:** a step has a `label`, `text`, an optional `banner`, and `acts`: `run` (move a runner to a base index, where 0 = home, 1 = 1B … 4 = home), `f` (move a fielder), `ball` (`toF` a fielder or `to` x,y), `max` (show the MAX tags) and `flag` (`out` / `returned`).
- **New scenario:** copy one entry, start it with `opening([...runners], 'hit text')`, then add your steps.
- **Deploy:** commit and push. GitHub Pages serves this folder at `/overthrow/`.
