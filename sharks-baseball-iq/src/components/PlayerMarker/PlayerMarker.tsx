import type { DefensivePosition } from '../../baseball/types';

interface Props {
  position: DefensivePosition;
  name: string;
  x: number;
  y: number;
  selected?: boolean;
  dimmed?: boolean;
  bad?: boolean;
  onTap?: (p: DefensivePosition) => void;
}

/** Navy jersey token with the position, and the player's first name underneath. */
export function PlayerMarker({ position, name, x, y, selected, dimmed, bad, onTap }: Props) {
  const label = name.toUpperCase();
  const w = Math.max(6, label.length * 1.5 + 1.8);
  return (
    <g
      className={`pm ${selected ? 'pm-selected' : ''} ${dimmed ? 'pm-dim' : ''} ${bad ? 'pm-bad' : ''}`}
      transform={`translate(${x} ${y})`}
      onClick={onTap ? (e) => { e.stopPropagation(); onTap(position); } : undefined}
      style={{ cursor: onTap ? 'pointer' : undefined }}
    >
      {selected && <circle r={4.4} className="pm-halo" />}
      <circle r={2.6} className="pm-token" />
      <text y={0.68} className="pm-pos" fontSize={position.length > 2 ? 1.5 : 1.85}>
        {position}
      </text>
      {name !== position && (
        <>
          <rect x={-w / 2} y={2.9} width={w} height={2.9} rx={1.45} className="pm-pill" />
          <text y={4.95} className="pm-name">
            {label}
          </text>
        </>
      )}
    </g>
  );
}
