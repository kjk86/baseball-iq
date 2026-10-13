import type { Frame, Timeline } from '../../animation/animationTypes';
import { destinationFor } from '../../animation/animationEngine';
import { START_POSITIONS } from '../../baseball/coordinates';
import type { ResolvedPlay } from '../../baseball/scenarioResolver';
import { DEFENSIVE_POSITIONS, type Coordinate, type DefensivePosition } from '../../baseball/types';

interface Props {
  resolved: ResolvedPlay;
  timeline: Timeline;
  frame: Frame;
  names: Record<DefensivePosition, string>;
  clicked: Coordinate | null;
  selected: DefensivePosition | null;
  scenarioId: string;
  variant: string;
}

const f = (c: Coordinate) => `{ x: ${c.x.toFixed(1)}, y: ${c.y.toFixed(1)} }`;

/** Developer panel: coordinates, state, resolved assignments, destinations. */
export function DebugPanel({ resolved, timeline, frame, names, clicked, selected, scenarioId, variant }: Props) {
  const sel = selected ? resolved.assignments[selected] : null;
  return (
    <div className="debug">
      <div className="debug-row">
        <b>DEBUG</b> scenario=<code>{scenarioId}</code> variant=<code>{variant}</code>
      </div>
      <div className="debug-row">
        event=<code>{resolved.event}</code> runners=<code>[{resolved.gameState.runners.join(', ')}]</code> outs=
        <code>{resolved.gameState.outs}</code> ballHolder=<code>{resolved.ballHolder ?? '—'}</code>
      </div>
      <div className="debug-row">
        t=<code>{frame.t.toFixed(2)}</code>/<code>{timeline.duration.toFixed(2)}</code> phase=<code>{frame.phase}</code>{' '}
        pauses=<code>{timeline.pauses.map((p) => `${p.kind}@${p.t.toFixed(1)}`).join(', ') || '—'}</code>
      </div>
      {resolved.notes.length > 0 && <div className="debug-row">variants: {resolved.notes.join(' · ')}</div>}
      <div className="debug-row">
        clicked: <code>{clicked ? f(clicked) : 'tap the field'}</code>
      </div>
      {sel && selected && (
        <pre className="debug-sel">
          {`${selected} (${names[selected]})
START:       ${f(START_POSITIONS[selected])}
DESTINATION: ${f(destinationFor(resolved, selected))}  [${sel.destination ?? 'stay'}]
ACTION:      ${sel.action}
ARRIVES:     t=${timeline.arrivals[selected].toFixed(2)}${sel.todo ? `\nTODO:        ${sel.todo}` : ''}`}
        </pre>
      )}
      <table className="debug-table">
        <thead>
          <tr>
            <th>Pos</th>
            <th>Player</th>
            <th>Action</th>
            <th>Dest</th>
            <th>x,y</th>
            <th>TODO</th>
          </tr>
        </thead>
        <tbody>
          {DEFENSIVE_POSITIONS.map((p) => {
            const a = resolved.assignments[p];
            const d = destinationFor(resolved, p);
            return (
              <tr key={p} className={p === selected ? 'dbg-on' : ''}>
                <td>{p}</td>
                <td>{names[p]}</td>
                <td>{a.action}</td>
                <td>{a.destination ?? 'stay'}</td>
                <td>
                  {d.x.toFixed(1)},{d.y.toFixed(1)}
                </td>
                <td title={a.todo}>{a.todo ? '⚠' : ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
