import { PLAYERS, type Player } from '../../data/players';

interface Props {
  onPick: (p: Player) => void;
  /** Player ids in this week's lineup. Others show as "not playing". */
  present: string[];
  /** No lineup posted yet — everyone can pick their name. */
  noLineup?: boolean;
}

export function PlayerSelector({ onPick, present, noLineup }: Props) {
  return (
    <div className="player-grid">
      {PLAYERS.map((p) => {
        const out = !noLineup && !present.includes(p.id);
        return (
          <button key={p.id} className={`player-btn ${out ? 'player-out' : ''}`} onClick={() => onPick(p)}>
            <span className="player-first">
              {p.firstName} <span className="player-num">#{p.number}</span>
            </span>
            <span className="player-last">{out ? 'Not in this week’s lineup' : `${p.firstName} ${p.lastName}.`}</span>
          </button>
        );
      })}
    </div>
  );
}
