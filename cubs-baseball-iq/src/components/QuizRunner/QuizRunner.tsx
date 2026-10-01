import { useMemo, useState } from 'react';
import { buildScenario, sampleTimeline } from '../../animation/animationEngine';
import { useTimelinePlayer } from '../../animation/useTimelinePlayer';
import type { Question } from '../../baseball/questions';
import { POSITION_NAMES, type DefensivePosition } from '../../baseball/types';
import { scenarioById } from '../../data/scenarios';
import { useApp } from '../../state/AppContext';
import { BaseballField, type PinState } from '../BaseballField/BaseballField';
import { Situation } from '../Layout/TopBar';
import { QuizOverlay, type FeedbackTone } from '../QuizOverlay/QuizOverlay';
import type { QuestionResult } from '../ScorePanel/ScorePanel';

const ALL_PAUSES = ['FREEZE', 'HIGHLIGHT', 'DECISION'] as const;

interface QuestionViewProps {
  question: Question;
  names: Record<DefensivePosition, string>;
  onAnswered: (r: QuestionResult) => void;
  onNext: () => void;
  nextLabel: string;
}

/** QUIZ MODE: one question about one player. */
export function QuestionView({ question: q, names, onAnswered, onNext, nextLabel }: QuestionViewProps) {
  const { speed } = useApp();
  const scenario = scenarioById(q.scenarioId);
  const think = q.kind === 'CHOICE' && q.pauseAt === 'FIELDED' ? 1.0 : 0;
  const { timeline, resolved } = useMemo(
    () => buildScenario(scenario, 'main', { thinkBeforePlay: think }),
    [scenario, think],
  );

  // Where to freeze the play and ask.
  const stopAt = useMemo(() => {
    if (q.beforePitch || (q.kind === 'CHOICE' && q.pauseAt === 'START')) return 0.01;
    if (q.kind === 'DESTINATION') {
      if (resolved.primaryFielder === q.position) return timeline.pitchEnd + 0.35;
      return Math.min(timeline.hitEnd, timeline.reactStart);
    }
    if (q.pauseAt === 'DECISION') return timeline.decisionTime ?? timeline.hitEnd;
    if (q.pauseAt === 'FIELDED') return Math.max(timeline.hitEnd, (timeline.firstPlay ?? timeline.hitEnd) - 0.05);
    if (q.pauseAt === 'HIGHLIGHT') return timeline.highlights[0]?.t ?? timeline.hitEnd;
    return timeline.hitEnd;
  }, [q, resolved, timeline]);

  const player = useTimelinePlayer(timeline, {
    speed,
    stopAt,
    autoPlay: true,
    skipPauses: [...ALL_PAUSES],
  });
  const frame = sampleTimeline(timeline, player.t);

  const [tries, setTries] = useState(0);
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: FeedbackTone; title: string; text?: string } | null>(null);
  const [pinStates, setPinStates] = useState<Record<string, PinState>>({});
  const [wrongChoices, setWrongChoices] = useState<string[]>([]);

  const asking = player.stopped && !done;
  const name = q.position ? names[q.position] : '';
  const NAME = name.toUpperCase();
  const fill = (s: string) => s.replaceAll('{name}', name).replaceAll('{NAME}', NAME);

  const finish = (firstTry: boolean) => {
    setDone(true);
    onAnswered({ id: q.id, concept: q.concept, firstTry });
    player.resume();
  };

  const answer = (id: string) => {
    if (!asking) return;
    const correctId = q.correctId;
    if (id === correctId) {
      setPinStates((s) => ({ ...s, [id]: 'right' }));
      const title = q.kind === 'DESTINATION' ? `YES! ${q.cheer} ⚾` : `${q.correctTitle} ⚾`;
      setFeedback({ tone: 'good', title, text: q.kind === 'DESTINATION' ? q.explanation : q.explanation });
      finish(tries === 0);
      return;
    }
    const n = tries + 1;
    setTries(n);
    setPinStates((s) => ({ ...s, [id]: 'wrong' }));
    setWrongChoices((w) => [...w, id]);
    if (n < 2) {
      setFeedback({ tone: 'try', title: 'Good try!', text: q.hint });
    } else {
      setPinStates((s) => ({ ...s, [correctId]: 'reveal' }));
      setFeedback({ tone: 'show', title: "Let's see it!", text: q.explanation });
      finish(false);
    }
  };

  const prompt =
    q.kind === 'DESTINATION'
      ? q.customPrompt
        ? fill(q.customPrompt)
        : `WHERE SHOULD ${NAME} GO?`
      : fill(q.prompt);

  const targets =
    q.kind === 'DESTINATION' && player.stopped
      ? done
        ? q.targets.filter((t) => t.id === q.correctId)
        : q.targets
      : undefined;

  return (
    <div className="quiz">
      <Situation lines={scenario.situation} />
      <div className="quiz-q">
        {q.beforePitch && <div className="pre-tag">⏸ Before the pitch — think it through!</div>}
        <div className={`quiz-prompt ${prompt.length > 40 ? "quiz-prompt-long" : ""}`}>{prompt}</div>
        {q.position && (
          <div className="quiz-sub">
            {name} is playing <b>{POSITION_NAMES[q.position]}</b>
            {q.kind === 'DESTINATION' && asking && ' — tap a spot on the field'}
          </div>
        )}
      </div>
      <div className="field-wrap">
        {!player.stopped && !done && <div className="caption">{frame.caption ?? 'Watch the play…'}</div>}
        <BaseballField
          frame={frame}
          names={names}
          selected={q.position ?? null}
          spotlight={asking}
          hideHighlights={!done}
          targets={targets}
          pinStates={pinStates}
          onTarget={answer}
        />
      </div>
      {feedback && (
        <QuizOverlay tone={feedback.tone} title={feedback.title} text={feedback.text}>
          {done && (
            <button className="btn btn-primary" onClick={onNext}>
              {nextLabel}
            </button>
          )}
        </QuizOverlay>
      )}
      {q.kind === 'CHOICE' && (
        <div className="choices choices-below">
          {q.choices.map((c) => {
            const isWrong = wrongChoices.includes(c.id);
            const isRight = done && c.id === q.correctId;
            return (
              <button
                key={c.id}
                className={`btn btn-choice ${c.id === 'HOLD' ? 'btn-hold' : ''} ${isWrong ? 'btn-wrong' : ''} ${isRight ? 'btn-right' : ''}`}
                disabled={!asking || isWrong}
                onClick={() => answer(c.id)}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      )}
      {done && player.done && (
        <button className="btn btn-outline btn-wide" onClick={player.replay}>
          ↻ Watch again
        </button>
      )}
    </div>
  );
}

export interface QuizItem {
  question: Question;
  names: Record<DefensivePosition, string>;
  roundLabel?: string;
}

interface RunnerProps {
  items: QuizItem[];
  onFinish: (results: QuestionResult[]) => void;
  finishLabel?: string;
}

/** Runs a list of questions, with optional "ROUND 2 — RIGHT CENTER" intros. */
export function QuizRunner({ items, onFinish, finishLabel = 'Finish ▶' }: RunnerProps) {
  const [i, setI] = useState(0);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [intro, setIntro] = useState<string | null>(items[0]?.roundLabel ?? null);
  const item = items[i];
  if (!item) return null;

  const next = () => {
    if (i + 1 >= items.length) {
      onFinish(results);
      return;
    }
    const n = items[i + 1];
    if (n.roundLabel && n.roundLabel !== item.roundLabel) setIntro(n.roundLabel);
    setI(i + 1);
  };

  return (
    <div>
      <div className="progress">
        <div className="progress-bar" style={{ width: `${(i / items.length) * 100}%` }} />
        <span className="progress-text">
          Question {i + 1} of {items.length}
        </span>
      </div>
      {intro ? (
        <div className="round-intro card">
          <div className="round-title">{intro}</div>
          <button className="btn btn-primary btn-big" onClick={() => setIntro(null)}>
            Let's go! ▶
          </button>
        </div>
      ) : (
        <QuestionView
          key={item.question.id + i}
          question={item.question}
          names={item.names}
          onAnswered={(r) => setResults((rs) => [...rs, r])}
          onNext={next}
          nextLabel={i + 1 >= items.length ? finishLabel : 'Next ▶'}
        />
      )}
    </div>
  );
}
