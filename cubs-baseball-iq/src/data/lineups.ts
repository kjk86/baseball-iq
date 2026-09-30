import { DEFENSIVE_POSITIONS, type DefensivePosition } from '../baseball/types';
import { PLAYERS, findPlayer } from './players';

export type PlayerId = string;

export interface DefensiveLineup {
  inning: number;
  positions: Record<DefensivePosition, PlayerId>;
  /** Players who are here but sitting this inning. */
  bench: PlayerId[];
}

/**
 * ─────────────────────────────────────────────────────────────
 *  THIS WEEK'S LINEUP  ← update this each week
 * ─────────────────────────────────────────────────────────────
 * Paste the table straight from your lineup sheet. One row per kid:
 *   batting#  name  1st  2nd  3rd  4th
 * Use "-" for an inning on the bench. Leave a kid off the table if
 * they're not at the game. Nicknames like "Leo" work.
 * (Coaches can also paste this same table into Coach Mode ⚙.)
 */
export const THIS_WEEK = {
  /** Shown at the top of the app. Update these with the table each week. */
  game: {
    opponent: 'Dodgers',
    when: 'Sat, Oct 3 · 11:20 AM',
    where: 'Cornerstone Park',
  },
  updated: 'Sep 30',
  label: 'vs Dodgers, Oct 3 (Everett & Kam out)',
  table: `
Batting	Player	1st	2nd	3rd	4th
1	Joshua	2B	LF	SS	1B
2	Sebastian	SS	LCF	1B	P
3	Braxton	P	3B	LCF	2B
4	Nico	3B	2B	P	RCF
5	Lucas	LCF	1B	3B	LF
6	Leif	1B	RCF	2B	SS
7	Dawson	RF	P	C	3B
8	Luke	LF	SS	RF	LCF
9	Leo	RCF	C	LF	RF
10	Jackson	C	RF	RCF	C
`,
};

// ─────────────────────────────────────────────────────────────

const BENCH_WORDS = new Set(['-', '—', 'B', 'BN', 'BENCH', 'OUT', 'X', 'SIT']);
const POS_ALIASES: Record<string, DefensivePosition> = { LC: 'LCF', RC: 'RCF', CATCHER: 'C', PITCHER: 'P' };

const normPos = (t: string): DefensivePosition | 'BENCH' | null => {
  const u = t.toUpperCase().replace(/[^A-Z0-9—-]/g, '');
  if (BENCH_WORDS.has(u)) return 'BENCH';
  if ((DEFENSIVE_POSITIONS as readonly string[]).includes(u)) return u as DefensivePosition;
  return POS_ALIASES[u] ?? null;
};

export interface ParsedLineup {
  lineups: DefensiveLineup[];
  /** Kids on the roster who aren't in the table (not at the game). */
  absent: PlayerId[];
  problems: string[];
}

/** Turn a pasted lineup table into four innings. Forgiving about spacing, tabs and commas. */
export function parseLineupTable(text: string): ParsedLineup {
  const problems: string[] = [];
  const positions: Record<DefensivePosition, PlayerId>[] = [0, 1, 2, 3].map(
    () => ({}) as Record<DefensivePosition, PlayerId>,
  );
  const sitting: PlayerId[][] = [[], [], [], []];
  const seen = new Set<PlayerId>();

  for (const raw of text.split(/\r?\n/)) {
    const tokens = raw.split(/[\t,]+|\s+/).map((t) => t.trim()).filter(Boolean);
    if (tokens.length < 5) continue;
    const slots = tokens.slice(-4);
    const parsed = slots.map(normPos);
    if (parsed.some((x) => x === null)) {
      if (!/player|batting|inning/i.test(raw)) problems.push(`Couldn't read: "${raw.trim()}"`);
      continue;
    }
    let nameTokens = tokens.slice(0, -4);
    if (/^\d+$/.test(nameTokens[0] ?? '')) nameTokens = nameTokens.slice(1);
    const name = nameTokens.join(' ');
    const player = findPlayer(name) ?? findPlayer(nameTokens[0] ?? '');
    if (!player) {
      problems.push(`No player named "${name}" on the roster.`);
      continue;
    }
    if (seen.has(player.id)) problems.push(`${player.firstName} is listed twice.`);
    seen.add(player.id);
    parsed.forEach((pos, i) => {
      if (pos === 'BENCH') sitting[i].push(player.id);
      else if (pos) {
        const already = positions[i][pos];
        if (already) {
          const other = PLAYERS.find((p) => p.id === already)?.firstName;
          problems.push(`Inning ${i + 1}: ${other} and ${player.firstName} are both at ${pos}.`);
        }
        positions[i][pos] = player.id;
      }
    });
  }

  const lineups = positions.map((pos, i) => ({ inning: i + 1, positions: pos, bench: sitting[i] }));
  lineups.forEach((l) => {
    const empty = DEFENSIVE_POSITIONS.filter((p) => !l.positions[p]);
    if (empty.length) problems.push(`Inning ${l.inning}: nobody at ${empty.join(', ')}.`);
  });
  const absent = PLAYERS.filter((p) => !seen.has(p.id)).map((p) => p.id);
  return { lineups, absent, problems };
}

/** Write lineups back out as a table (for pasting into lineups.ts or a text to Claude). */
export function lineupsToTable(lineups: DefensiveLineup[]): string {
  const ids = PLAYERS.map((p) => p.id).filter((id) =>
    lineups.some((l) => l.bench.includes(id) || DEFENSIVE_POSITIONS.some((p) => l.positions[p] === id)),
  );
  const rows = ids.map((id, i) => {
    const name = PLAYERS.find((p) => p.id === id)!.firstName;
    const cols = lineups.map((l) => {
      const pos = DEFENSIVE_POSITIONS.find((p) => l.positions[p] === id);
      return pos ?? '-';
    });
    return [i + 1, name, ...cols].join('\t');
  });
  return ['Batting\tPlayer\t1st\t2nd\t3rd\t4th', ...rows].join('\n');
}

const built = parseLineupTable(THIS_WEEK.table);
export const DEFAULT_LINEUPS: DefensiveLineup[] = built.lineups;
export const DEFAULT_ABSENT: PlayerId[] = built.absent;
if (built.problems.length) console.warn('Lineup table problems:', built.problems);

/** Short fingerprint of the built-in table, so a new week's lineup replaces old saved edits. */
export const THIS_WEEK_KEY = (() => {
  let h = 0;
  for (const c of THIS_WEEK.label + THIS_WEEK.table) h = (h * 31 + c.charCodeAt(0)) | 0;
  return String(h);
})();

export interface LineupProblem {
  inning: number;
  message: string;
}

/** Validate one inning: all 10 positions filled, nobody in two spots. */
export function validateLineup(l: DefensiveLineup): LineupProblem[] {
  const problems: LineupProblem[] = [];
  const empty = DEFENSIVE_POSITIONS.filter((pos) => !l.positions[pos]);
  if (empty.length) problems.push({ inning: l.inning, message: `Nobody at ${empty.join(', ')}.` });
  const seen = new Set<string>();
  for (const id of [...DEFENSIVE_POSITIONS.map((p) => l.positions[p]).filter(Boolean), ...l.bench]) {
    if (seen.has(id)) {
      const name = PLAYERS.find((pl) => pl.id === id)?.firstName ?? id;
      problems.push({ inning: l.inning, message: `${name} is in two spots.` });
    }
    seen.add(id);
  }
  return problems;
}

/** Everyone in the lineup in any inning. */
export function presentPlayers(lineups: DefensiveLineup[]): PlayerId[] {
  return PLAYERS.map((p) => p.id).filter((id) =>
    lineups.some((l) => l.bench.includes(id) || DEFENSIVE_POSITIONS.some((pos) => l.positions[pos] === id)),
  );
}

export function positionOf(l: DefensiveLineup, playerId: PlayerId): DefensivePosition | 'BENCH' {
  const pos = DEFENSIVE_POSITIONS.find((p) => l.positions[p] === playerId);
  return pos ?? 'BENCH';
}
