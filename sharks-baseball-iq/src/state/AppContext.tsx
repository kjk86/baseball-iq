import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_LINEUPS, presentPlayers, type DefensiveLineup } from '../data/lineups';
import { localLineupRepository as repo } from '../storage/lineupRepository';
import { PLAYERS } from '../data/players';
import { DEFENSIVE_POSITIONS, type DefensivePosition } from '../baseball/types';

interface AppState {
  lineups: DefensiveLineup[];
  saveLineups: (l: DefensiveLineup[]) => void;
  /** True when this phone is using Coach Mode edits instead of the published lineup. */
  edited: boolean;
  /** Player ids in this week's lineup. */
  present: string[];
  resetLineups: () => void;
  inning: number;
  setInning: (n: number) => void;
  speed: number;
  setSpeed: (n: number) => void;
  debug: boolean;
  setDebug: (b: boolean) => void;
  /** First names on the field for a given inning. */
  namesFor: (inning: number) => Record<DefensivePosition, string>;
}

const Ctx = createContext<AppState | null>(null);

const initialDebug = () => {
  try {
    return new URLSearchParams(window.location.search).has('debug') || localStorage.getItem('sharks-iq:debug') === '1';
  } catch {
    return false;
  }
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(() => repo.load());
  const [lineups, setLineups] = useState<DefensiveLineup[]>(initial.lineups);
  const [edited, setEdited] = useState(initial.edited);
  const [inning, setInning] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [debug, setDebugState] = useState(initialDebug);

  const saveLineups = useCallback((l: DefensiveLineup[]) => {
    setLineups(l);
    setEdited(true);
    repo.save(l);
  }, []);
  const resetLineups = useCallback(() => {
    repo.clear();
    setEdited(false);
    setLineups(DEFAULT_LINEUPS);
  }, []);
  const setDebug = useCallback((b: boolean) => {
    setDebugState(b);
    try {
      localStorage.setItem('sharks-iq:debug', b ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, []);

  const namesFor = useCallback(
    (inn: number) => {
      const l = lineups.find((x) => x.inning === inn) ?? lineups[0];
      const out = {} as Record<DefensivePosition, string>;
      for (const pos of DEFENSIVE_POSITIONS) {
        out[pos] = PLAYERS.find((p) => p.id === l.positions[pos])?.firstName ?? pos;
      }
      return out;
    },
    [lineups],
  );

  const present = useMemo(() => presentPlayers(lineups), [lineups]);
  const value = useMemo(
    () => ({ lineups, saveLineups, edited, present, resetLineups, inning, setInning, speed, setSpeed, debug, setDebug, namesFor }),
    [lineups, saveLineups, edited, present, resetLineups, inning, speed, debug, setDebug, namesFor],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside provider');
  return v;
}
