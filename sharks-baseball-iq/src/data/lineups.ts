import { DEFENSIVE_POSITIONS, type DefensivePosition } from '../baseball/types';
import { PLAYERS, findPlayer } from './players';

export type PlayerId = string;

export interface DefensiveLineup {
  inning: number;
  positions: Record<DefensivePosition, PlayerId>;
  /** Players who are here but sitting this inning. */
  bench: PlayerId[];
}

/** Innings in a Sharks 10U game. */
export const INNINGS = 6;
export const INNING_ORD = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th'];

/**
 * ─────────────────────────────────────────────────────────────
 *  THIS WEEK'S LINEUP  ← update this each week
 * ─────────────────────────────────────────────────────────────
 * Paste the table straight from your lineup sheet. One row per player:
 *   batting#  name  1st  2nd  3rd  4th  5th  6th
 * Use "-" for an inning on the bench. Leave a player off the table if
 * they're not at the game. "Camden", "Camden G", "Cam" or "#10" all work.
 * Leave `table` empty until the lineup is ready — the app then lets
 * players practice by picking a position instead.
 * (Coaches can also paste this same table into Coach Mode ⚙.)
 */
export const THIS_WEEK = {
  /** Shown at the top of the app. Update these with the table each week. */
  game: {
    opponent: 'CBC Williams 10U',
    when: 'Sat, Nov 7 · 9:00 AM & 11:00 AM',
    where: 'Doubleheader',
  },
  updated: 'Oct 13',
  label: 'vs CBC Williams, Nov 7 (lineup coming)',
  table: `
`,
};

// ─────────────────────────────────────────────────────────────

const BENCH_WORDS = new Set(['-', '—', 'B', 'BN', 'BENCH', 'OUT', 'X', 'SIT']);
const POS_ALIASES: Record<string, DefensivePosition> = {
  CATCHER: 'C',
  PITCHER: 'P',
  CENTER: 'CF',
  LEFT: 'LF',
  RIGHT: 'RF',
  SHORT: 'SS',
};

const normPos = (t: string): DefensivePosition | 'BENCH' | null => {
  const u = t.toUpperCase().replace(/[^A-Z0-9—-]/g, '');
  if (BENCH_WORDS.has(u)) return 'BENCH';
  if ((DEFENSIVE_POSITIONS as readonly string[]).includes(u)) return u as DefensivePosition;
  return POS_ALIASES[u] ?? null;
};

export interface ParsedLineup {
  lineups: DefensiveLineup[];
  /** Players on the roster who aren't in the table (not at the game). */
  absent: PlayerId[];
  problems: string[];
}

const emptyInnings = (n: number): DefensiveLineup[] =>
  Array.from({ length: n }, (_, i) => ({
    inning: i + 1,
    positions: {} as Record<DefensivePosition, PlayerId>,
    bench: [],
  }));

/** How many innings the table has: count "1st 2nd 3rd…" in the header row, else INNINGS. */
function inningCount(text: string): number {
  for (const raw of text.split(/\r?\n/)) {
    const ords = raw.split(/[\t,]+|\s+/).filter((t) => /^(\d+(st|nd|rd|th)|inn?\d+|i\d+)$/i.test(t.trim()));
    if (ords.length >= 2) return Math.min(ords.length, INNING_ORD.length);
  }
  return INNINGS;
}

/** Turn a pasted lineup table into innings. Forgiving about spacing, tabs and commas. */
export function parseLineupTable(text: string): ParsedLineup {
  const problems: string[] = [];
  const n = inningCount(text);
  const lineups = emptyInnings(n);
  const seen = new Set<PlayerId>();

  for (const raw of text.split(/\r?\n/)) {
    const tokens = raw.split(/[\t,]+|\s+/).map((t) => t.trim()).filter(Boolean);
    if (!tokens.length || /player|batting|inning/i.test(raw)) continue;
    if (tokens.length < n + 1) {
      problems.push(`Couldn't read: "${raw.trim()}" (need a name + ${n} innings)`);
      continue;
    }
    const slots = tokens.slice(-n);
    const parsed = slots.map(normPos);
    if (parsed.some((x) => x === null)) {
      problems.push(`Couldn't read: "${raw.trim()}"`);
      continue;
    }
    let nameTokens = tokens.slice(0, -n);
    if (/^\d+$/.test(nameTokens[0] ?? '') && nameTokens.length > 1) nameTokens = nameTokens.slice(1);
    const name = nameTokens.join(' ');
    const player = findPlayer(name) ?? findPlayer(nameTokens[0] ?? '');
    if (!player) {
      problems.push(`No player named "${name}" on the roster.`);
      continue;
    }
    if (seen.has(player.id)) problems.push(`${player.firstName} is listed twice.`);
    seen.add(player.id);
    parsed.forEach((pos, i) => {
      if (pos === 'BENCH') lineups[i].bench.push(player.id);
      else if (pos) {
        const already = lineups[i].positions[pos];
        if (already) {
          const other = PLAYERS.find((p) => p.id === already)?.firstName;
          problems.push(`Inning ${i + 1}: ${other} and ${player.firstName} are both at ${pos}.`);
        }
        lineups[i].positions[pos] = player.id;
      }
    });
  }

  if (seen.size) {
    lineups.forEach((l) => {
      const empty = DEFENSIVE_POSITIONS.filter((p) => !l.positions[p]);
      if (empty.length) problems.push(`Inning ${l.inning}: nobody at ${empty.join(', ')}.`);
    });
  }
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
  const head = lineups.map((l) => INNING_ORD[l.inning - 1]).join('\t');
  return [`Batting\tPlayer\t${head}`, ...rows].join('\n');
}

const built = parseLineupTable(THIS_WEEK.table);
export const DEFAULT_LINEUPS: DefensiveLineup[] = built.lineups;
export const DEFAULT_ABSENT: PlayerId[] = built.absent;
if (built.problems.length) console.warn('Lineup table problems:', built.problems);

/** True once someone is actually placed in a lineup. */
export const hasLineup = (lineups: DefensiveLineup[]) =>
  lineups.some((l) => DEFENSIVE_POSITIONS.some((p) => l.positions[p]));

/** Practice without a lineup: put one player at the picked positions, one "inning" each. */
export function practiceLineups(playerId: PlayerId, positions: DefensivePosition[]): DefensiveLineup[] {
  return positions.map((pos, i) => ({
    inning: i + 1,
    positions: { [pos]: playerId } as Record<DefensivePosition, PlayerId>,
    bench: [],
  }));
}

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

/** Validate one inning: all 9 positions filled, nobody in two spots. */
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
