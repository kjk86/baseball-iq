import type { TimelinePlayer } from '../../animation/useTimelinePlayer';

interface Props {
  player: TimelinePlayer;
  speed: number;
  onSpeed: (s: number) => void;
}

const SPEEDS = [0.5, 1, 1.5];

export function ScenarioControls({ player, speed, onSpeed }: Props) {
  const { playing, done, activePause } = player;
  return (
    <div className="controls">
      <div className="controls-main">
        {playing ? (
          <button className="btn btn-primary btn-play" onClick={player.pause}>
            ⏸ Pause
          </button>
        ) : done ? (
          <button className="btn btn-primary btn-play" onClick={player.replay}>
            ↻ Replay
          </button>
        ) : (
          <button className="btn btn-primary btn-play" onClick={activePause ? player.resume : player.play} disabled={!!activePause}>
            ▶ Play
          </button>
        )}
        <button className="btn btn-ghost" onClick={player.replay} aria-label="Replay from start">
          ↻
        </button>
        <button className="btn btn-ghost" onClick={player.reset} aria-label="Reset">
          ⟲ Reset
        </button>
      </div>
      <div className="speed" role="group" aria-label="Speed">
        {SPEEDS.map((s) => (
          <button key={s} className={`chip ${s === speed ? 'chip-on' : ''}`} onClick={() => onSpeed(s)}>
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
}
