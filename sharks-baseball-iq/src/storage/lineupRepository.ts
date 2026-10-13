import { DEFAULT_LINEUPS, THIS_WEEK_KEY, type DefensiveLineup } from '../data/lineups';

/**
 * Storage abstraction. v1 uses the browser's localStorage.
 * Edits are tied to the current built-in week, so when a new week's lineup
 * is published, old edits on a phone are ignored automatically.
 * Swap in an API-backed implementation later without touching the UI.
 */
export interface LineupRepository {
  load(): { lineups: DefensiveLineup[]; edited: boolean };
  save(lineups: DefensiveLineup[]): void;
  clear(): void;
}

const KEY = 'sharks-baseball-iq:lineups:v1';

export const localLineupRepository: LineupRepository = {
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { lineups: DEFAULT_LINEUPS, edited: false };
      const parsed = JSON.parse(raw) as { week: string; lineups: DefensiveLineup[] };
      if (parsed.week !== THIS_WEEK_KEY || !Array.isArray(parsed.lineups) || parsed.lineups.length < 1) {
        return { lineups: DEFAULT_LINEUPS, edited: false };
      }
      return { lineups: parsed.lineups, edited: true };
    } catch {
      return { lineups: DEFAULT_LINEUPS, edited: false };
    }
  },
  save(lineups) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ week: THIS_WEEK_KEY, lineups }));
    } catch {
      /* storage unavailable — keep in memory only */
    }
  },
  clear() {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  },
};
