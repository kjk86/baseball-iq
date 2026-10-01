/**
 * TEAM HUB DATA — schedule, record, stats, practice plans.
 *
 * Weekly update, no rebuild needed:
 *   • Stats:     export from GameChanger → save as  cubs-baseball-iq/gamechanger/stats.csv
 *   • Schedule:  edit                                 cubs-baseball-iq/gamechanger/schedule.csv
 *                (add the result like "W 7-2" after each game)
 *   • Practice:  drop a PDF into                      cubs-baseball-iq/practice-plans/
 * Then commit + push. The live site reads these files when it loads.
 *
 * A snapshot of each file is also bundled into the app at build time, so the
 * app still works offline / in the preview.
 */
import bundledSchedule from '../../gamechanger/schedule.csv?raw';
import bundledStats from '../../gamechanger/stats.csv?raw';

export const DATA_BASE = 'cubs-baseball-iq/';

// ───────────────────────── CSV ─────────────────────────

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') {
      row.push(cell);
      cell = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += c;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

// ───────────────────────── schedule ─────────────────────────

export interface ScheduleEvent {
  date: string; // YYYY-MM-DD
  time: string;
  type: 'Game' | 'Practice';
  opponent: string;
  homeAway: 'home' | 'away' | '';
  location: string;
  result: string; // "W 7-2" / "L 8-10" / ""
  plan: string; // practice-plan PDF file name
}

export function parseSchedule(text: string): ScheduleEvent[] {
  const rows = parseCsv(text.trim());
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (r: string[], name: string) => (r[header.indexOf(name)] ?? '').trim();
  return rows
    .slice(1)
    .filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(col(r, 'date')))
    .map((r): ScheduleEvent => ({
      date: col(r, 'date'),
      time: col(r, 'time'),
      type: /game/i.test(col(r, 'type')) ? 'Game' : 'Practice',
      opponent: col(r, 'opponent'),
      homeAway: (col(r, 'home_away').toLowerCase() as ScheduleEvent['homeAway']) || '',
      location: col(r, 'location'),
      result: col(r, 'result').toUpperCase(),
      plan: col(r, 'plan'),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export interface TeamRecord {
  wins: number;
  losses: number;
  ties: number;
  runsFor: number;
  runsAgainst: number;
}

export function recordFrom(events: ScheduleEvent[]): TeamRecord {
  const rec: TeamRecord = { wins: 0, losses: 0, ties: 0, runsFor: 0, runsAgainst: 0 };
  for (const e of events) {
    const m = e.result.match(/^([WLT])\s*(\d+)\s*-\s*(\d+)/);
    if (!m) continue;
    if (m[1] === 'W') rec.wins++;
    else if (m[1] === 'L') rec.losses++;
    else rec.ties++;
    // GameChanger shows our score first.
    rec.runsFor += Number(m[2]);
    rec.runsAgainst += Number(m[3]);
  }
  return rec;
}

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' }) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', opts);
}

// ───────────────────────── stats ─────────────────────────

export interface PlayerStats {
  number: string;
  first: string;
  last: string;
  GP: number;
  PA: number;
  AB: number;
  H: number;
  '2B': number;
  '3B': number;
  HR: number;
  RBI: number;
  R: number;
  BB: number;
  SO: number;
  AVG: string;
  OBP: string;
}

export interface TeamStats {
  players: PlayerStats[];
  totals: PlayerStats | null;
  fielding: { chances: number; errors: number; fpct: string; doublePlays: number } | null;
}

/** Reads a GameChanger season-stats export (two header rows: sections, then column names). */
export function parseGameChanger(text: string): TeamStats {
  const rows = parseCsv(text);
  const headerIdx = rows.findIndex((r) => r[0] === 'Number' && r.includes('AVG'));
  if (headerIdx < 0) return { players: [], totals: null, fielding: null };
  const header = rows[headerIdx];
  // Batting columns come first, so the FIRST occurrence of a name is the batting stat.
  const first = (name: string) => header.indexOf(name);
  const num = (r: string[], name: string) => Number(r[first(name)]) || 0;
  const str = (r: string[], name: string) => r[first(name)] ?? '';
  const toPlayer = (r: string[]): PlayerStats => ({
    number: r[0],
    first: r[2] ?? '',
    last: r[1] ?? '',
    GP: num(r, 'GP'),
    PA: num(r, 'PA'),
    AB: num(r, 'AB'),
    H: num(r, 'H'),
    '2B': num(r, '2B'),
    '3B': num(r, '3B'),
    HR: num(r, 'HR'),
    RBI: num(r, 'RBI'),
    R: num(r, 'R'),
    BB: num(r, 'BB'),
    SO: num(r, 'SO'),
    AVG: str(r, 'AVG'),
    OBP: str(r, 'OBP'),
  });
  const body = rows.slice(headerIdx + 1);
  const players = body.filter((r) => r[0] && /^\d+$/.test(r[0])).map(toPlayer);
  const totalsRow = body.find((r) => r[0] === 'Totals');
  let fielding: TeamStats['fielding'] = null;
  if (totalsRow) {
    const tc = first('TC');
    if (tc >= 0) {
      fielding = {
        chances: Number(totalsRow[tc]) || 0,
        errors: Number(totalsRow[header.indexOf('E', tc)]) || 0,
        fpct: totalsRow[header.indexOf('FPCT', tc)] ?? '',
        doublePlays: Number(totalsRow[header.indexOf('DP', tc)]) || 0,
      };
    }
  }
  return { players, totals: totalsRow ? toPlayer(totalsRow) : null, fielding };
}

// ───────────────────────── practice plans ─────────────────────────

export interface PracticePlan {
  file: string;
  title: string;
  date?: string; // YYYY-MM-DD
  focus?: string;
}

/** Nicer titles for the PDFs we know about. New PDFs still show up (by file name). */
export const PLAN_DETAILS: Record<string, Omit<PracticePlan, 'file'>> = {
  'Cubs Practice 1.pdf': {
    title: 'Practice #1',
    date: '2026-08-18',
    focus: 'Lots of reps • Learn the players • Intro to coach pitch',
  },
  'Cubs Practice #2 — Coaches Quick Sheet - Updated.pdf': { title: 'Practice #2', date: '2026-08-25' },
  'COACHES QUICK SHEET.pdf': {
    title: 'Game Reps & Live Pitching',
    date: '2026-09-01',
    focus: 'Game reps • Live pitching • Baserunning • Defensive awareness',
  },
  'CUBS PRACTICE 3 QUICK SHEET.pdf': {
    title: 'Situational Defense',
    date: '2026-09-08',
    focus: 'Situational defense • Cutoffs • Every player has a job',
  },
  'Cubs Practice 9-15 - Coaches Quick Sheet.pdf': {
    title: 'Hitting & Defensive Reps',
    date: '2026-09-15',
    focus: 'Hitting fundamentals • Defensive reps • Baseball IQ',
  },
  'Cubs Practice Plan — Defensive Decisions & Responsibilities.pdf': {
    title: 'Defensive Decisions & Responsibilities',
    date: '2026-09-22',
    focus: 'Purposeful catch • Defensive decisions',
  },
  'Cubs + Giants Joint Practice-updated.pdf': {
    title: 'Cubs + Giants Joint Practice',
    date: '2026-09-29',
    focus: 'Station rotation with the Giants',
  },
};

export const planUrl = (file: string) =>
  `${DATA_BASE}practice-plans/${encodeURIComponent(file).replace(/%2B/g, "+")}`;

function knownPlans(): PracticePlan[] {
  return Object.entries(PLAN_DETAILS).map(([file, d]) => ({ file, ...d }));
}

/** On GitHub Pages: list the practice-plans folder through GitHub's public API. */
async function listPlansFromGitHub(): Promise<string[] | null> {
  const { hostname, pathname } = window.location;
  if (!hostname.endsWith('.github.io')) return null;
  const owner = hostname.split('.')[0];
  const repo = pathname.split('/').filter(Boolean)[0];
  if (!repo) return null;
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${DATA_BASE}practice-plans`);
  if (!res.ok) return null;
  const items = (await res.json()) as { name: string; type: string }[];
  return items.filter((i) => i.type === 'file' && /\.pdf$/i.test(i.name)).map((i) => i.name);
}

// ───────────────────────── loading ─────────────────────────

export interface TeamData {
  schedule: ScheduleEvent[];
  stats: TeamStats;
  plans: PracticePlan[];
  source: 'live' | 'bundled';
}

async function fetchText(path: string): Promise<string | null> {
  try {
    const res = await fetch(path, { cache: 'no-store' });
    if (!res.ok) return null;
    const t = await res.text();
    return t.trim().startsWith('<') ? null : t; // ignore HTML fallbacks
  } catch {
    return null;
  }
}

export const BUNDLED: TeamData = {
  schedule: parseSchedule(bundledSchedule),
  stats: parseGameChanger(bundledStats),
  plans: knownPlans(),
  source: 'bundled',
};

let cache: Promise<TeamData> | null = null;

export function loadTeamData(): Promise<TeamData> {
  if (cache) return cache;
  cache = (async () => {
    const [sched, stats, planNames] = await Promise.all([
      fetchText(`${DATA_BASE}gamechanger/schedule.csv`),
      fetchText(`${DATA_BASE}gamechanger/stats.csv`),
      listPlansFromGitHub().catch(() => null),
    ]);
    const schedule = sched ? parseSchedule(sched) : BUNDLED.schedule;
    const parsedStats = stats ? parseGameChanger(stats) : null;
    const plans = planNames
      ? planNames.map((file) => ({ file, ...(PLAN_DETAILS[file] ?? { title: file.replace(/\.pdf$/i, '') }) }))
      : BUNDLED.plans;
    return {
      schedule: schedule.length ? schedule : BUNDLED.schedule,
      stats: parsedStats && parsedStats.players.length ? parsedStats : BUNDLED.stats,
      plans,
      source: sched || stats ? 'live' : 'bundled',
    };
  })();
  return cache;
}
