import { useEffect, useMemo, useState } from 'react';
import { TopBar } from '../components/Layout/TopBar';
import {
  BUNDLED,
  formatDate,
  loadTeamData,
  planUrl,
  recordFrom,
  todayISO,
  type PlayerStats,
  type ScheduleEvent,
  type TeamData,
} from '../data/team';

// eslint-disable-next-line react-refresh/only-export-components
export function useTeamData(): TeamData {
  const [data, setData] = useState<TeamData>(BUNDLED);
  useEffect(() => {
    let alive = true;
    loadTeamData().then((d) => alive && setData(d));
    return () => {
      alive = false;
    };
  }, []);
  return data;
}

type Tab = 'schedule' | 'stats' | 'plans';

export function Team({ tab: initialTab = 'schedule' }: { tab?: Tab }) {
  const data = useTeamData();
  const [tab, setTab] = useState<Tab>(initialTab);
  const rec = recordFrom(data.schedule);

  return (
    <div className="page">
      <TopBar back="/" title="Team" />
      <div className="record-card">
        <div className="record-label">Fall 2026 record</div>
        <div className="record-big">
          {rec.wins}–{rec.losses}
          {rec.ties ? `–${rec.ties}` : ''}
        </div>
        <div className="record-sub">
          Runs scored {rec.runsFor} · Runs allowed {rec.runsAgainst}
        </div>
      </div>
      <div className="tabs" role="tablist">
        {(
          [
            ['schedule', 'Schedule'],
            ['stats', 'Stats'],
            ['plans', 'Practice Plans'],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            className={`tab ${tab === id ? 'tab-on' : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'schedule' && <Schedule events={data.schedule} />}
      {tab === 'stats' && <Stats data={data} />}
      {tab === 'plans' && <Plans data={data} />}
    </div>
  );
}

function Schedule({ events }: { events: ScheduleEvent[] }) {
  const today = todayISO();
  const [showPast, setShowPast] = useState(false);
  const upcoming = events.filter((e) => e.date >= today);
  const past = events.filter((e) => e.date < today).reverse();
  const nextGame = upcoming.find((e) => e.type === 'Game');
  const list = showPast ? past : upcoming;

  return (
    <div>
      <div className="seg">
        <button className={`chip ${!showPast ? 'chip-on' : ''}`} onClick={() => setShowPast(false)}>
          Upcoming
        </button>
        <button className={`chip ${showPast ? 'chip-on' : ''}`} onClick={() => setShowPast(true)}>
          Results & past
        </button>
      </div>
      <ul className="sched">
        {list.map((e) => {
          const isNext = e === nextGame;
          const win = e.result.startsWith('W');
          const loss = e.result.startsWith('L');
          return (
            <li key={e.date + e.type} className={`sched-row ${e.type === 'Game' ? 'sched-game' : ''} ${isNext ? 'sched-next' : ''}`}>
              <div className="sched-date">
                <span className="sched-dow">{formatDate(e.date, { weekday: 'short' })}</span>
                <span className="sched-day">{formatDate(e.date, { day: 'numeric' })}</span>
                <span className="sched-mon">{formatDate(e.date, { month: 'short' })}</span>
              </div>
              <div className="sched-main">
                {isNext && <span className="next-pill">Next game</span>}
                <div className="sched-title">
                  {e.type === 'Game' ? `${e.homeAway === 'away' ? '@' : 'vs'} ${e.opponent}` : 'Practice'}
                </div>
                <div className="sched-meta">
                  {[e.time, e.location].filter(Boolean).join(' · ')}
                </div>
                {e.plan && (
                  <a className="plan-link" href={planUrl(e.plan)} target="_blank" rel="noreferrer">
                    📄 Practice plan
                  </a>
                )}
              </div>
              {e.result ? (
                <div className={`sched-result ${win ? 'res-w' : loss ? 'res-l' : ''}`}>{e.result}</div>
              ) : null}
            </li>
          );
        })}
        {!list.length && <li className="muted">Nothing here yet.</li>}
      </ul>
    </div>
  );
}

const COLS: { key: keyof PlayerStats; label: string; title: string }[] = [
  { key: 'GP', label: 'G', title: 'Games played' },
  { key: 'PA', label: 'PA', title: 'Times up to bat' },
  { key: 'H', label: 'H', title: 'Hits' },
  { key: '2B', label: '2B', title: 'Doubles' },
  { key: 'HR', label: 'HR', title: 'Home runs' },
  { key: 'R', label: 'R', title: 'Runs scored' },
  { key: 'RBI', label: 'RBI', title: 'Runs batted in' },
  { key: 'AVG', label: 'AVG', title: 'Batting average' },
];

function Stats({ data }: { data: TeamData }) {
  const { players, totals, fielding } = data.stats;
  const [sort, setSort] = useState<keyof PlayerStats>('first');
  const sorted = useMemo(() => {
    const list = [...players];
    if (sort === 'first') return list.sort((a, b) => a.first.localeCompare(b.first));
    return list.sort((a, b) => {
      const av = Number(a[sort]) || 0;
      const bv = Number(b[sort]) || 0;
      return bv - av || a.first.localeCompare(b.first);
    });
  }, [players, sort]);

  return (
    <div>
      {totals && (
        <div className="stat-tiles">
          <div className="stat-tile">
            <div className="stat-num">{totals.H}</div>
            <div className="stat-lbl">Team hits</div>
          </div>
          <div className="stat-tile">
            <div className="stat-num">{totals.R}</div>
            <div className="stat-lbl">Runs scored</div>
          </div>
          {fielding && (
            <div className="stat-tile">
              <div className="stat-num">{fielding.fpct}</div>
              <div className="stat-lbl">
                Fielding % ({fielding.errors} error{fielding.errors === 1 ? '' : 's'})
              </div>
            </div>
          )}
        </div>
      )}
      <div className="table-wrap">
        <table className="stats">
          <thead>
            <tr>
              <th className="th-name">
                <button onClick={() => setSort('first')} className={sort === 'first' ? 'th-on' : ''}>
                  Player
                </button>
              </th>
              {COLS.map((c) => (
                <th key={c.key} title={c.title}>
                  <button onClick={() => setSort(c.key)} className={sort === c.key ? 'th-on' : ''}>
                    {c.label}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr key={p.number + p.first}>
                <td className="td-name">
                  <span className="jersey">#{p.number}</span> {p.first}
                </td>
                {COLS.map((c) => (
                  <td key={c.key}>{p[c.key]}</td>
                ))}
              </tr>
            ))}
            {totals && (
              <tr className="tr-total">
                <td className="td-name">Team</td>
                {COLS.map((c) => (
                  <td key={c.key}>{totals[c.key]}</td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="muted small">
        From GameChanger ({totals?.GP ?? 0} games tracked). Tap a column to sort. G = games, PA = times up to bat.
      </p>
    </div>
  );
}

function Plans({ data }: { data: TeamData }) {
  const plans = [...data.plans].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || a.title.localeCompare(b.title));
  return (
    <ul className="plans">
      {plans.map((p) => (
        <li key={p.file}>
          <a className="plan-card" href={planUrl(p.file)} target="_blank" rel="noreferrer">
            <div className="plan-date">{p.date ? formatDate(p.date) : 'Practice plan'}</div>
            <div className="plan-title">{p.title}</div>
            {p.focus && <div className="plan-focus">{p.focus}</div>}
            <div className="plan-open">Open PDF ›</div>
          </a>
        </li>
      ))}
    </ul>
  );
}
