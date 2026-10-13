import { useState } from 'react';
import { DEFENSIVE_POSITIONS, type DefensivePosition } from '../../baseball/types';
import {
  lineupsToTable,
  parseLineupTable,
  presentPlayers,
  validateLineup,
  type DefensiveLineup,
  type PlayerId,
} from '../../data/lineups';
import { PLAYERS } from '../../data/players';

interface Props {
  lineups: DefensiveLineup[];
  onSave: (l: DefensiveLineup[]) => void;
  onReset: () => void;
}

const ORDER: DefensivePosition[] = ['P', 'C', '1B', '2B', 'SS', '3B', 'LF', 'CF', 'RF'];
const firstName = (id: string) => PLAYERS.find((p) => p.id === id)?.firstName ?? id;

/** Bench = everyone here this week who isn't at a position that inning. */
function withBench(lineups: DefensiveLineup[], here: Set<PlayerId>): DefensiveLineup[] {
  return lineups.map((l) => {
    const placed = new Set(DEFENSIVE_POSITIONS.map((p) => l.positions[p]).filter(Boolean));
    return { ...l, bench: PLAYERS.map((p) => p.id).filter((id) => here.has(id) && !placed.has(id)) };
  });
}

export function CoachLineupEditor({ lineups, onSave, onReset }: Props) {
  const [draft, setDraft] = useState<DefensiveLineup[]>(() => structuredClone(lineups));
  const [here, setHere] = useState<Set<PlayerId>>(() => new Set(presentPlayers(lineups)));
  const [inning, setInning] = useState(1);
  const [saved, setSaved] = useState(false);
  const [paste, setPaste] = useState('');
  const [pasteMsg, setPasteMsg] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);

  const full = withBench(draft, here);
  const problems = full.flatMap((l) => validateLineup(l));
  const cur = full.find((l) => l.inning === inning)!;
  const placedIds = DEFENSIVE_POSITIONS.map((p) => cur.positions[p]).filter(Boolean);

  const touch = () => {
    setSaved(false);
    setCopied(false);
  };
  const setPos = (pos: DefensivePosition, id: string) => {
    touch();
    setDraft((d) =>
      d.map((l) => (l.inning !== inning ? l : { ...l, positions: { ...l.positions, [pos]: id } })),
    );
  };
  const toggleHere = (id: string) => {
    touch();
    const n = new Set(here);
    if (n.has(id)) {
      n.delete(id);
      // Take them out of every position too.
      setDraft((d) =>
        d.map((l) => {
          const positions = { ...l.positions };
          for (const p of DEFENSIVE_POSITIONS) if (positions[p] === id) positions[p] = '';
          return { ...l, positions };
        }),
      );
    } else n.add(id);
    setHere(n);
  };
  const loadPaste = () => {
    const r = parseLineupTable(paste);
    const present = new Set(PLAYERS.map((p) => p.id).filter((id) => !r.absent.includes(id)));
    setDraft(r.lineups);
    setHere(present);
    touch();
    setPasteMsg(
      r.problems.length
        ? r.problems
        : [`Loaded ✓ ${present.size} players. Out this week: ${r.absent.map(firstName).join(', ') || 'nobody'}.`],
    );
  };
  const copyTable = async () => {
    const text = lineupsToTable(full);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setPaste(text);
      setPasteMsg(['Copy not allowed here — the table is in the box above. Select it and copy.']);
    }
  };

  return (
    <div className="coach-editor">
      <div className="card">
        <h3 className="section-title small-title">Paste this week's lineup</h3>
        <p className="muted small">
          Copy the table from your lineup sheet (name + 1st through 6th, “-” for bench) and paste it here.
          Leave off anyone who isn't coming.
        </p>
        <label htmlFor="lineup-paste" className="sr-only">
          Lineup table
        </label>
        <textarea
          id="lineup-paste"
          className="paste"
          rows={6}
          placeholder={'Batting\tPlayer\t1st\t2nd\t3rd\t4th\t5th\t6th\n1\tCamden\tSS\tSS\tP\tP\tSS\t-\n2\tFinn\tC\tC\t-\tC\tC\t1B\n…'}
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
        />
        <div className="row gap">
          <button className="btn btn-primary" disabled={!paste.trim()} onClick={loadPaste}>
            Load table
          </button>
          <button className="btn btn-ghost" onClick={copyTable}>
            {copied ? 'Copied ✓' : 'Copy current lineup'}
          </button>
        </div>
        {pasteMsg && (
          <ul className={pasteMsg[0]?.startsWith('Loaded') ? 'ok-list' : 'problems'}>
            {pasteMsg.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h3 className="section-title small-title">Who's here?</h3>
        <div className="here-grid">
          {PLAYERS.map((p) => (
            <label key={p.id} className={`here ${here.has(p.id) ? 'here-on' : ''}`}>
              <input type="checkbox" id={`here-${p.id}`} checked={here.has(p.id)} onChange={() => toggleHere(p.id)} />
              {p.firstName}
            </label>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="inning-tabs">
          {full.map((l) => {
            const bad = problems.some((p) => p.inning === l.inning);
            return (
              <button
                key={l.inning}
                className={`chip ${l.inning === inning ? 'chip-on' : ''} ${bad ? 'chip-bad' : ''}`}
                onClick={() => setInning(l.inning)}
              >
                Inning {l.inning}
                {bad ? ' ⚠' : ''}
              </button>
            );
          })}
        </div>
        <div className="lineup-grid">
          {ORDER.map((pos) => {
            const value = cur.positions[pos] ?? '';
            const dup = placedIds.filter((id) => id === value).length > 1;
            return (
              <label key={pos} className="lineup-row">
                <span className="pos-tag">{pos}</span>
                <select
                  id={`pos-${inning}-${pos}`}
                  value={value}
                  onChange={(e) => setPos(pos, e.target.value)}
                  className={dup ? 'dup' : ''}
                >
                  <option value="">—</option>
                  {PLAYERS.filter((p) => here.has(p.id) || p.id === value).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName}
                      {placedIds.includes(p.id) && p.id !== value ? ' •' : ''}
                    </option>
                  ))}
                </select>
              </label>
            );
          })}
        </div>
        <p className="bench-line">
          <span className="pos-tag pos-bench">BENCH</span> {cur.bench.map(firstName).join(', ') || 'nobody'}
        </p>
        {problems.length > 0 ? (
          <ul className="problems">
            {problems.map((p, i) => (
              <li key={i}>
                Inning {p.inning}: {p.message}
              </li>
            ))}
          </ul>
        ) : (
          <p className="ok">✓ All {full.length} innings look good.</p>
        )}
        <div className="row gap">
          <button
            className="btn btn-primary"
            disabled={problems.length > 0}
            onClick={() => {
              onSave(full);
              setSaved(true);
            }}
          >
            {saved ? 'Saved on this phone ✓' : 'Save on this phone'}
          </button>
          <button className="btn btn-ghost" onClick={onReset}>
            Use the published lineup
          </button>
        </div>
      </div>
    </div>
  );
}
