import { useMemo, useState } from 'react';
import { TopBar } from '../components/Layout/TopBar';
import { PlayerSelector } from '../components/PlayerSelector/PlayerSelector';
import { QuizRunner, type QuizItem } from '../components/QuizRunner/QuizRunner';
import { ScorePanel, type QuestionResult } from '../components/ScorePanel/ScorePanel';
import { buildBeforePitchSession, buildNowWhatSession, buildPracticeSession } from '../baseball/practice';
import { DEFENSIVE_POSITIONS, POSITION_NAMES, type DefensivePosition } from '../baseball/types';
import { INNING_ORD, THIS_WEEK, hasLineup, positionOf, practiceLineups } from '../data/lineups';
import type { Player } from '../data/players';
import { go } from '../router';
import { useApp } from '../state/AppContext';


export function Practice({ mode = 'practice' }: { mode?: 'practice' | 'pitch' | 'now' }) {
  const pitch = mode === 'pitch';
  const now = mode === 'now';
  const { lineups: posted, namesFor: postedNames, present: postedPresent } = useApp();
  const noLineup = !hasLineup(posted);
  const [player, setPlayer] = useState<Player | null>(null);
  const [picked, setPicked] = useState<DefensivePosition[]>([]);
  const [stage, setStage] = useState<'pick' | 'positions' | 'preview' | 'quiz' | 'done'>('pick');
  // No lineup posted yet? Practice the positions the player picks instead.
  const lineups = useMemo(
    () => (noLineup && player ? practiceLineups(player.id, picked) : posted),
    [noLineup, player, picked, posted],
  );
  const present = useMemo(
    () => (noLineup ? (player ? [player.id] : []) : postedPresent),
    [noLineup, player, postedPresent],
  );
  const namesFor = useMemo(
    () =>
      noLineup
        ? (inn: number) => {
            const out = {} as Record<DefensivePosition, string>;
            for (const pos of DEFENSIVE_POSITIONS) out[pos] = pos;
            const pos = picked[inn - 1];
            if (pos && player) out[pos] = player.firstName;
            return out;
          }
        : postedNames,
    [noLineup, picked, player, postedNames],
  );
  const [seed, setSeed] = useState(() => Date.now());
  const [results, setResults] = useState<QuestionResult[]>([]);

  const session = useMemo(
    () =>
      player
        ? (now ? buildNowWhatSession : pitch ? buildBeforePitchSession : buildPracticeSession)(player.id, lineups, seed)
        : null,
    [player, lineups, seed, pitch, now],
  );

  const items: QuizItem[] = useMemo(() => {
    if (!session) return [];
    return session.rounds.flatMap((r, ri) =>
      r.questions.map((q) => ({
        question: q,
        names: namesFor(r.inning),
        roundLabel:
          now && ri === session.rounds.length - 1 && r.questions.some((q) => q.position !== r.position)
            ? `ROUND ${ri + 1} — YOUR TEAMMATES`
            : `ROUND ${ri + 1} — ${POSITION_NAMES[r.position].toUpperCase()}`,
      })),
    );
  }, [session, namesFor, now]);

  return (
    <div className="page">
      <TopBar back="/" title={now ? 'Now What?' : pitch ? 'Before the Pitch' : 'Practice My Game'} />
      {stage === 'pick' && (
        <>
          <h2 className="section-title center">Who's playing?</h2>
          {noLineup && <p className="muted center small">This week's lineup isn't posted yet — pick your name, then the positions you want to work on.</p>}
          <PlayerSelector
            present={present}
            noLineup={noLineup}
            onPick={(p) => {
              setPlayer(p);
              setStage(noLineup ? 'positions' : 'preview');
            }}
          />
        </>
      )}
      {stage === 'positions' && player && (
        <div className="card preview">
          <div className="preview-name">{player.firstName}'s positions</div>
          <p className="muted">Pick up to 3 positions to practice.</p>
          <div className="pos-picks">
            {DEFENSIVE_POSITIONS.map((pos) => {
              const on = picked.includes(pos);
              return (
                <button
                  key={pos}
                  className={`chip pos-chip ${on ? 'chip-on' : ''}`}
                  aria-pressed={on}
                  onClick={() =>
                    setPicked((cur) => (on ? cur.filter((x) => x !== pos) : cur.length >= 3 ? cur : [...cur, pos]))
                  }
                >
                  <b>{pos}</b> <span>{POSITION_NAMES[pos]}</span>
                </button>
              );
            })}
          </div>
          <button className="btn btn-red btn-big btn-wide" disabled={!picked.length} onClick={() => setStage('preview')}>
            Next ›
          </button>
          <button className="btn btn-ghost btn-wide" onClick={() => setStage('pick')}>
            Pick someone else
          </button>
        </div>
      )}
      {stage === 'preview' && player && session && (
        <div className="card preview">
          <div className="preview-name">{player.firstName}'s game</div>
          {noLineup ? (
            <div className="preview-game">Practicing by position (no lineup posted yet)</div>
          ) : (
            <div className="preview-game">
              vs {THIS_WEEK.game.opponent} · {THIS_WEEK.game.when}
              <br />
              {THIS_WEEK.game.where}
            </div>
          )}
          <ul className="innings">
            {lineups.map((l) => {
              const pos = positionOf(l, player.id);
              return (
                <li key={l.inning}>
                  <span className="muted">{noLineup ? `Round ${l.inning}` : `${INNING_ORD[l.inning - 1]} inning`}</span>
                  <span className={`pos-tag ${pos === 'BENCH' ? 'pos-bench' : ''}`}>{pos === 'BENCH' ? (present.includes(player.id) ? 'BENCH' : 'OUT') : pos}</span>
                  <span>{pos === 'BENCH' ? (present.includes(player.id) ? 'Bench — cheer on the team!' : 'Not playing') : POSITION_NAMES[pos]}</span>
                </li>
              );
            })}
          </ul>
          {session.total > 0 ? (
            <>
              <p className="muted">
                {now
                  ? `${session.total} plays. The ball is fielded — where does it go?`
                  : pitch
                  ? `${session.total} situations. Before each pitch: what's YOUR job?`
                  : `${session.total} questions about YOUR positions.`}
              </p>
              <button className="btn btn-red btn-big btn-wide" onClick={() => setStage('quiz')}>
                Let's practice! ⚾
              </button>
            </>
          ) : (
            <p>{player.firstName} isn't in this week's lineup. You can still practice any lesson from the home screen!</p>
          )}
          <button className="btn btn-ghost btn-wide" onClick={() => setStage(noLineup ? 'positions' : 'pick')}>
            {noLineup ? 'Change positions' : 'Pick someone else'}
          </button>
        </div>
      )}
      {stage === 'quiz' && (
        <QuizRunner
          items={items}
          onFinish={(r) => {
            setResults(r);
            setStage('done');
          }}
        />
      )}
      {stage === 'done' && player && (
        <ScorePanel results={results} title={`GREAT WORK, ${player.firstName.toUpperCase()}! ⚾`}>
          <button
            className="btn btn-primary"
            onClick={() => {
              setSeed(Date.now());
              setStage('quiz');
            }}
          >
            Practice again
          </button>
          <button className="btn btn-ghost" onClick={() => go('/')}>Home</button>
        </ScorePanel>
      )}
    </div>
  );
}
