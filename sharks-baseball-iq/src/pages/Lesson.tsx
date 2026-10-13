import { useMemo, useState } from 'react';
import { TopBar } from '../components/Layout/TopBar';
import { QuizRunner } from '../components/QuizRunner/QuizRunner';
import { ScenarioLearn } from '../components/ScenarioLearn/ScenarioLearn';
import { ScorePanel, type QuestionResult } from '../components/ScorePanel/ScorePanel';
import { lessonQuestions } from '../baseball/questions';
import { lessonById } from '../data/lessons';
import { scenarioById } from '../data/scenarios';
import { go } from '../router';
import { useApp } from '../state/AppContext';

/** A lesson = for each play: watch it (Learn), then answer 1–3 questions (Quiz). */
export function Lesson({ id }: { id: string }) {
  const lesson = lessonById(id);
  const { namesFor, inning } = useApp();
  const [step, setStep] = useState(0);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const steps = useMemo(
    () => (lesson ? lesson.scenarioIds.flatMap((sid) => [{ sid, kind: 'learn' as const }, { sid, kind: 'quiz' as const }]) : []),
    [lesson],
  );
  if (!lesson) return <div className="page"><TopBar back="/" /><p>Lesson not found.</p></div>;
  const names = namesFor(inning);
  const cur = steps[step];
  const playNum = Math.floor(step / 2) + 1;

  return (
    <div className="page">
      <TopBar back="/" title={`Lesson ${lesson.number}`} />
      <div className="lesson-head">
        <div className="lesson-head-title">
          {lesson.emoji} {lesson.title}
        </div>
        {cur && (
          <div className="dots">
            {lesson.scenarioIds.map((sid, i) => (
              <span key={sid} className={`dot ${i + 1 < playNum ? 'dot-done' : i + 1 === playNum ? 'dot-on' : ''}`} />
            ))}
            <span className="muted small">
              Play {playNum} of {lesson.scenarioIds.length} · {cur.kind === 'learn' ? 'Watch' : 'Quiz'}
            </span>
          </div>
        )}
      </div>
      {cur?.kind === 'learn' && (
        <ScenarioLearn
          key={cur.sid}
          scenario={scenarioById(cur.sid)}
          footer={
            <button className="btn btn-red btn-big btn-wide sticky-cta" onClick={() => setStep(step + 1)}>
              Quiz me! →
            </button>
          }
        />
      )}
      {cur?.kind === 'quiz' && (
        <QuizRunner
          key={cur.sid}
          items={lessonQuestions(scenarioById(cur.sid)).map((q) => ({ question: q, names }))}
          finishLabel={step + 1 >= steps.length ? 'Finish lesson ▶' : 'Next play ▶'}
          onFinish={(r) => {
            setResults((all) => [...all, ...r]);
            setStep(step + 1);
          }}
        />
      )}
      {!cur && (
        <ScorePanel results={results} title={`${lesson.title.toUpperCase()} — DONE! ⚾`}>
          <button className="btn btn-primary" onClick={() => { setResults([]); setStep(0); }}>
            Do it again
          </button>
          <button className="btn btn-ghost" onClick={() => go('/')}>Home</button>
        </ScorePanel>
      )}
    </div>
  );
}
