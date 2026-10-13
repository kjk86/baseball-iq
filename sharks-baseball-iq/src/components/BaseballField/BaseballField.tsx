import { useRef, type MouseEvent } from 'react';
import type { Frame } from '../../animation/animationTypes';
import { LOCATIONS } from '../../baseball/coordinates';
import type { TargetPin } from '../../baseball/questions';
import { DEFENSIVE_POSITIONS, type Coordinate, type DefensivePosition } from '../../baseball/types';
import { Baseball } from '../Baseball/Baseball';
import { PlayerMarker } from '../PlayerMarker/PlayerMarker';
import { RunnerMarker } from '../RunnerMarker/RunnerMarker';
import { FieldBackground } from './FieldBackground';

export type PinState = 'idle' | 'wrong' | 'right' | 'reveal';

interface Props {
  frame: Frame;
  names: Record<DefensivePosition, string>;
  selected?: DefensivePosition | null;
  /** Dim everyone except `selected`. */
  spotlight?: boolean;
  badPositions?: DefensivePosition[];
  showTrails?: boolean;
  hideHighlights?: boolean;
  targets?: TargetPin[];
  pinStates?: Record<string, PinState>;
  onTarget?: (id: TargetPin['id']) => void;
  onPlayer?: (pos: DefensivePosition) => void;
  onFieldClick?: (c: Coordinate) => void;
  debugPoint?: Coordinate | null;
}

/**
 * Pure renderer. Receives a sampled Frame and draws it.
 * It knows nothing about baseball rules.
 */
export function BaseballField({
  frame,
  names,
  selected,
  spotlight,
  badPositions = [],
  showTrails = true,
  hideHighlights,
  targets,
  pinStates = {},
  onTarget,
  onPlayer,
  onFieldClick,
  debugPoint,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  const handleClick = (e: MouseEvent<SVGSVGElement>) => {
    if (!onFieldClick || !svgRef.current) return;
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return;
    const p = pt.matrixTransform(ctm.inverse());
    onFieldClick({ x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 });
  };

  // Draw the selected player last so they sit on top.
  const order = [...DEFENSIVE_POSITIONS].sort((a, b) => (a === selected ? 1 : b === selected ? -1 : 0));

  return (
    <svg
      ref={svgRef}
      className="field-svg"
      viewBox="0 14 100 88"
      role="img"
      aria-label="Baseball field"
      onClick={handleClick}
    >
      <FieldBackground />

      {!hideHighlights &&
        frame.highlights.map((h) => {
          const l = LOCATIONS[h.location];
          return (
            <g key={h.location + h.t} className={`hl hl-${h.tone}`}>
              <circle cx={l.x} cy={l.y} r={3.4} className="hl-ring" />
              <rect x={l.x - 8} y={l.y - 8.6} width={16} height={3.6} rx={1.8} className="hl-pill" />
              <text x={l.x} y={l.y - 6.1} className="hl-text">
                {h.title}
              </text>
            </g>
          );
        })}

      {showTrails &&
        frame.trails.map((tr, i) => {
          const x2 = tr.from.x + (tr.to.x - tr.from.x) * tr.progress;
          const y2 = tr.from.y + (tr.to.y - tr.from.y) * tr.progress;
          const faded = tr.progress >= 1;
          const dim = spotlight && selected && tr.position !== selected;
          return (
            <line
              key={i}
              x1={tr.from.x}
              y1={tr.from.y}
              x2={x2}
              y2={y2}
              className={`trail ${tr.bad ? 'trail-bad' : ''} ${faded ? 'trail-done' : ''} ${dim ? 'trail-dim' : ''}`}
            />
          );
        })}

      {order.map((pos) => (
        <PlayerMarker
          key={pos}
          position={pos}
          name={names[pos]}
          x={frame.players[pos].x}
          y={frame.players[pos].y}
          selected={pos === selected}
          dimmed={!!(spotlight && selected && pos !== selected)}
          bad={badPositions.includes(pos)}
          onTap={onPlayer}
        />
      ))}

      {frame.runners.map((r) => (
        <RunnerMarker key={r.id} x={r.x} y={r.y} out={r.out} opacity={r.opacity} />
      ))}


      {targets?.map((p) => {
        const st = pinStates[p.id] ?? 'idle';
        return (
          <g
            key={p.id}
            className={`pin pin-${st}`}
            transform={`translate(${p.x} ${p.y})`}
            onClick={(e) => {
              e.stopPropagation();
              if (st === 'idle') onTarget?.(p.id);
            }}
          >
            <circle r={5.5} className="pin-hit" />
            <circle r={2.9} className="pin-ring" />
            <circle r={1} className="pin-dot" />
            <rect x={-p.label.length * 0.72 - 1.2} y={-7.1} width={p.label.length * 1.44 + 2.4} height={3.2} rx={1.6} className="pin-pill" />
            <text y={-4.85} className="pin-label">
              {st === 'wrong' ? '✗ ' : st === 'right' || st === 'reveal' ? '✓ ' : ''}
              {p.label}
            </text>
          </g>
        );
      })}

      <Baseball x={frame.ball.x} y={frame.ball.y} h={frame.ball.h} />

      {debugPoint && (
        <g className="dbg-pt" pointerEvents="none">
          <line x1={debugPoint.x - 2} y1={debugPoint.y} x2={debugPoint.x + 2} y2={debugPoint.y} />
          <line x1={debugPoint.x} y1={debugPoint.y - 2} x2={debugPoint.x} y2={debugPoint.y + 2} />
          <text x={debugPoint.x + 1.2} y={debugPoint.y - 1.2}>
            {debugPoint.x}, {debugPoint.y}
          </text>
        </g>
      )}
    </svg>
  );
}
