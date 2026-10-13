import type { ResolvedPlay } from '../../baseball/scenarioResolver';
import type { TeachingPoint } from '../../baseball/scenarioTypes';
import { DEFENSIVE_POSITIONS, type DefensivePosition } from '../../baseball/types';

interface Props {
  resolved: ResolvedPlay;
  names: Record<DefensivePosition, string>;
  selected: DefensivePosition | null;
  onSelect: (p: DefensivePosition | null) => void;
  teachingPoints: TeachingPoint[];
  showJobs: boolean;
}

/** "Who does what" list + the big teaching points. */
export function TeachingPanel({ resolved, names, selected, onSelect, teachingPoints, showJobs }: Props) {
  const sel = selected ? resolved.assignments[selected] : null;
  return (
    <div className="teach">
      {sel && selected && (
        <div className="explain-card" onClick={() => onSelect(null)}>
          <div className="explain-name">
            {names[selected].toUpperCase()} <span className="pos-tag">{selected}</span>
          </div>
          <div className="explain-job">{sel.label}</div>
          <div className="explain-why">{sel.explanation}</div>
        </div>
      )}
      {showJobs && (
        <>
          <h3 className="section-title">Everybody's job <span className="muted small">— tap a player</span></h3>
          <ul className="jobs">
            {DEFENSIVE_POSITIONS.map((pos) => {
              const a = resolved.assignments[pos];
              return (
                <li key={pos}>
                  <button className={`job ${pos === selected ? 'job-on' : ''} ${a.action === 'CHASE_BALL' ? 'job-bad' : ''}`} onClick={() => onSelect(pos === selected ? null : pos)}>
                    <span className="job-name">{names[pos].toUpperCase()}</span>
                    <span className="pos-tag">{pos}</span>
                    <span className="job-label">{a.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
      <div className="points">
        {teachingPoints.map((tp, i) => (
          <p key={i} className={tp.big ? 'point-big' : 'point'}>
            {tp.text}
          </p>
        ))}
      </div>
    </div>
  );
}
