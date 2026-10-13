import { useApp } from '../../state/AppContext';

interface Props {
  inning: number;
  onChange: (n: number) => void;
}

export function InningSelector({ inning, onChange }: Props) {
  const { lineups } = useApp();
  return (
    <div className="inning-select" role="group" aria-label="Lineup inning">
      <span className="muted">Names from inning</span>
      {lineups.map((l) => l.inning).map((n) => (
        <button key={n} className={`chip ${n === inning ? 'chip-on' : ''}`} onClick={() => onChange(n)}>
          {n}
        </button>
      ))}
    </div>
  );
}
