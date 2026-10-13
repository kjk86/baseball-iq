import { TopBar } from '../components/Layout/TopBar';
import { SCENARIOS } from '../data/scenarios';
import { go } from '../router';
import type { Category } from '../baseball/types';

const GROUPS: { cat: Category; title: string }[] = [
  { cat: 'COVERAGE', title: 'Cover Your Base' },
  { cat: 'BACKUP', title: 'Back It Up' },
  { cat: 'OUTFIELD', title: 'Outfield & Cutoffs' },
  { cat: 'DECISION', title: 'Hold the Ball' },
  { cat: 'FORCE_TAG', title: 'Force or Tag' },
  { cat: 'CALL_IT', title: 'Call It!' },
];

export function Plays() {
  return (
    <div className="page">
      <TopBar back="/" title="All Plays" />
      {GROUPS.map((g) => (
        <section key={g.cat}>
          <h2 className="section-title">{g.title}</h2>
          <div className="play-list">
            {SCENARIOS.filter((s) => s.category === g.cat).map((s) => (
              <button key={s.id} className="play-item" onClick={() => go(`/play/${s.id}`)}>
                <span className="play-1">{s.situation[0]}</span>
                <span className="play-2">{s.situation[1]}</span>
                <span className="stars">{'●'.repeat(s.difficulty)}{'○'.repeat(3 - s.difficulty)}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
