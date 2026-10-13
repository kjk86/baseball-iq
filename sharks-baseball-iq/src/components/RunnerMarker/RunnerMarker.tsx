interface Props {
  x: number;
  y: number;
  out: boolean;
  opacity: number;
}

/** Other team's runner: gray helmet. Shows OUT when retired. */
export function RunnerMarker({ x, y, out, opacity }: Props) {
  return (
    <g transform={`translate(${x} ${y})`} opacity={opacity} className="rm">
      <circle r={1.75} className="rm-body" />
      <path d="M -1.3 -0.2 A 1.3 1.3 0 0 1 1.3 -0.2 L 1.9 -0.2 L 1.9 0.25 L -1.3 0.25 Z" className="rm-helmet" />
      {out && (
        <g transform="translate(0 -3.6)">
          <rect x={-3.2} y={-1.4} width={6.4} height={2.8} rx={1.4} className="rm-out-bg" />
          <text y={0.62} className="rm-out">OUT</text>
        </g>
      )}
    </g>
  );
}
