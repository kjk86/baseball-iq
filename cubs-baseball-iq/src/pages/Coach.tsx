import { CoachLineupEditor } from '../components/CoachLineupEditor/CoachLineupEditor';
import { TopBar } from '../components/Layout/TopBar';
import { THIS_WEEK } from '../data/lineups';
import { useApp } from '../state/AppContext';

export function Coach() {
  const { lineups, saveLineups, resetLineups, edited, debug, setDebug } = useApp();
  return (
    <div className="page">
      <TopBar back="/" title="Coach Mode" />
      <h2 className="section-title">Lineup · vs {THIS_WEEK.game.opponent}</h2>
      <p className="small">
        <b>{THIS_WEEK.game.when}</b> · {THIS_WEEK.game.where} · updated {THIS_WEEK.updated}
      </p>
      <p className="muted small">
        {edited
          ? 'This phone is using your Coach Mode edits.'
          : 'Everyone sees the published lineup.'}{' '}
        Edits here only change this phone. To change it for every family, send the new table to Claude (or paste it
        into <code>src/data/lineups.ts</code>) and republish.
      </p>
      <CoachLineupEditor key={JSON.stringify(lineups)} lineups={lineups} onSave={saveLineups} onReset={resetLineups} />
      <div className="card">
        <label className="toggle" htmlFor="debug-toggle">
          <input id="debug-toggle" type="checkbox" checked={debug} onChange={(e) => setDebug(e.target.checked)} />
          <span>Debug mode (coordinates, assignments, animation phase)</span>
        </label>
      </div>
    </div>
  );
}
