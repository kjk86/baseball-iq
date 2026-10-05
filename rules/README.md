# Rookie Rules, Visualized

Every PVAA Rookie Division Fall 2026 rule (updated 8/15/26), shown on the field, with gray areas flagged and suggested calls.
Live at https://kjk86.github.io/bsaeball-iq/rules/ once committed and pushed.

- Everything is in `index.html`: no build step, no dependencies (Google Fonts only).
- **Gray areas:** the `GRAY` array. Each has `id`, `rule`, `kind` (`gray` = ambiguous wording, `silent` = not covered), `aud` (`plate` = plate meeting, `league` = ask the league), `title`, `q`, `call`. Ids in `CONFIRMED` show as Confirmed rulings (green); the rest are suggested calls. Containers with `data-g="G1,G7"` render them inline; the checklist and count update automatically.
- **Rule index:** the `RULES` array (plain English + official wording). Update both if the league reissues the rulebook.
- **Plays:** the `PLAYS` array uses the same step/act format as the overthrow visualizer (`run`, `f`, `ball`, `flag`, plus `time` to show who called time).
- Suggested calls are proposals, not league rules. The PDF rulebook governs.
- **Share links:** every section, gray-area card, rule and play has a "Copy link" button. Links point at the GitHub Pages URL, e.g. `/rules/#mound`, `/rules/#g-G5`, `/rules/#r12`, `/rules/#p2` (plays p1–p6 open that play).
