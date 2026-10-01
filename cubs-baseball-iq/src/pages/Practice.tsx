import { useMemo, useState } from 'react';
import { TopBar } from '../components/Layout/TopBar';
import { PlayerSelector } from '../components/PlayerSelector/PlayerSelector';
import { QuizRunner, type QuizItem } from '../components/QuizRunner/QuizRunner';
import { ScorePanel, type QuestionResult } from '../components/ScorePanel/ScorePanel';
import { buildBeforePitchSession, buildNowWhatSession, buildPracticeSession } from '../baseball/practice';
import { POSITION_NAMES } from '../baseball/types';
import { THIS_WEEK, positionOf } from '../data/lineups';
import type { Player } from '../data/players';
import { go } from '../router';
import { useApp } from '../state/AppContext';

const ORD = ['1st', '2nd', '3rd', '4th'];

export function Practice({ mode = 'practice' }: { mode?: 'practice' | 'pitch' | 'now' }) {
  const pitch = mode === 'pitch';
  const now = mode === 'now';
  const { lineups, namesFor, present } = useApp();
  const [player, setPlayer] = useState<Player | null>(null);
  const [stage, setStage] = useState<'pick' | 'preview' | 'quiz' | 'done'>('pick');
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
          <PlayerSelector
            present={present}
            onPick={(p) => {
              setPlayer(p);
              setStage('preview');
            }}
          />
        </>
      )}
      {stage === 'preview' && player && session && (
        <div className="card preview">
          <div className="preview-name">{player.firstName}'s game</div>
          <div className="preview-game">
            vs {THIS_WEEK.game.opponent} · {THIS_WEEK.game.when}
            <br />
            {THIS_WEEK.game.where}
          </div>
          <ul className="innings">
            {lineups.map((l) => {
              const pos = positionOf(l, player.id);
              return (
                <li key={l.inning}>
                  <span className="muted">{ORD[l.inning - 1]} inning</span>
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
          <button className="btn btn-ghost btn-wide" onClick={() => setStage('pick')}>
            Pick someone else
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
