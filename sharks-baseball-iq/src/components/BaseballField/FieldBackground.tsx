import { memo } from 'react';
import { FIELD, LOCATIONS } from '../../baseball/coordinates';

/** Static field art. Everything is drawn in the same 0–100 coordinate space. */
const H = FIELD.home;
const R = FIELD.fenceRadius;
const d = R / Math.SQRT2;
const LEFT = { x: H.x - d, y: H.y - d };
const RIGHT = { x: H.x + d, y: H.y - d };
const wedge = (r: number) => {
  const k = r / Math.SQRT2;
  return `M ${H.x} ${H.y} L ${H.x - k} ${H.y - k} A ${r} ${r} 0 0 1 ${H.x + k} ${H.y - k} Z`;
};
const base = (x: number, y: number, key: string) => (
  <rect key={key} x={x - 0.9} y={y - 0.9} width={1.8} height={1.8} transform={`rotate(45 ${x} ${y})`} className="fb-base" />
);

function FieldBackgroundImpl() {
  const m = LOCATIONS.MOUND;
  const b1 = LOCATIONS.FIRST_BASE;
  const b2 = LOCATIONS.SECOND_BASE;
  const b3 = LOCATIONS.THIRD_BASE;
  return (
    <g className="field-bg">
      <defs>
        <clipPath id="fair">
          <path d={wedge(R + 4)} />
        </clipPath>
        <pattern id="mow" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="3.5" height="7" className="fb-mow" />
        </pattern>
      </defs>
      <rect x="-10" y="0" width="120" height="110" className="fb-foul" />
      {/* warning track + outfield grass */}
      <path d={wedge(R)} className="fb-track" />
      <path d={wedge(R - 3.2)} className="fb-grass" />
      <path d={wedge(R - 3.2)} fill="url(#mow)" />
      <text x="50" y={H.y - R + 12} className="fb-watermark">SHARKS</text>
      {/* infield dirt */}
      <g clipPath="url(#fair)">
        <circle cx={m.x} cy={m.y} r={FIELD.infieldArcRadius} className="fb-dirt" />
      </g>
      <polygon
        points={`${H.x},${H.y - 3.5} ${b1.x - 3.4},${b1.y} ${b2.x},${b2.y + 3.4} ${b3.x + 3.4},${b3.y}`}
        className="fb-grass fb-infield-grass"
      />
      <circle cx={H.x} cy={H.y} r={5} className="fb-dirt" />
      <circle cx={m.x} cy={m.y} r={2.6} className="fb-dirt fb-mound" />
      <rect x={m.x - 0.9} y={m.y - 0.2} width={1.8} height={0.4} className="fb-line-fill" />
      {/* foul lines */}
      <line x1={H.x} y1={H.y} x2={LEFT.x} y2={LEFT.y} className="fb-line" />
      <line x1={H.x} y1={H.y} x2={RIGHT.x} y2={RIGHT.y} className="fb-line" />
      {/* batter's boxes */}
      <rect x={H.x - 4.2} y={H.y - 2} width={2.6} height={4} className="fb-box" />
      <rect x={H.x + 1.6} y={H.y - 2} width={2.6} height={4} className="fb-box" />
      {/* fence */}
      <path d={`M ${LEFT.x} ${LEFT.y} A ${R} ${R} 0 0 1 ${RIGHT.x} ${RIGHT.y}`} className="fb-fence" />
      {/* backstop */}
      <path d={`M ${H.x - 12} ${H.y + 6} Q ${H.x} ${H.y + 13} ${H.x + 12} ${H.y + 6}`} className="fb-backstop" />
      {base(b1.x, b1.y, 'b1')}
      {base(b2.x, b2.y, 'b2')}
      {base(b3.x, b3.y, 'b3')}
      <path
        d={`M ${H.x - 0.9} ${H.y - 0.6} h 1.8 v 0.8 l -0.9 0.8 l -0.9 -0.8 Z`}
        className="fb-base"
      />
    </g>
  );
}

export const FieldBackground = memo(FieldBackgroundImpl);
