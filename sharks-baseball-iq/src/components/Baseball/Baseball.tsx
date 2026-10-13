interface Props {
  x: number;
  y: number;
  h: number;
}

/** The ball. `h` lifts it off the ground (fly balls) and draws a shadow. */
export function Baseball({ x, y, h }: Props) {
  const lift = h * 0.4;
  return (
    <g className="ball" pointerEvents="none">
      {h > 0.3 && <ellipse cx={x} cy={y} rx={0.9} ry={0.45} className="ball-shadow" />}
      <circle cx={x} cy={y - lift} r={0.95 + h * 0.035} className="ball-body" />
      <path
        d={`M ${x - 0.45} ${y - lift - 0.6} q 0.35 0.6 0 1.2 M ${x + 0.45} ${y - lift - 0.6} q -0.35 0.6 0 1.2`}
        className="ball-stitch"
      />
    </g>
  );
}
