import { useState } from 'react';
import { TopBar } from '../components/Layout/TopBar';
import { QuizRunner } from '../components/QuizRunner/QuizRunner';
import { ScenarioLearn } from '../components/ScenarioLearn/ScenarioLearn';
import { ScorePanel, type QuestionResult } from '../components/ScorePanel/ScorePanel';
import { lessonQuestions } from '../baseball/questions';
import { SCENARIOS } from '../data/scenarios';
import { useApp } from '../state/AppContext';
import { go } from '../router';

/** One scenario from the library: Learn, then an optional quiz. */
export function Play({ id }: { id: string }) {
  const scenario = SCENARIOS.find((s) => s.id === id);
  const { namesFor, inning } = useApp();
  const [mode, setMode] = useState<'learn' | 'quiz' | 'done'>('learn');
  const [results, setResults] = useState<QuestionResult[]>([]);
  if (!scenario) return <div className="page"><TopBar back="/plays" /><p>Play not found.</p></div>;
  const names = namesFor(inning);

  return (
    <div className="page">
      <TopBar back="/plays" title={scenario.title} />
      {mode === 'learn' && (
        <ScenarioLearn
          key={scenario.id}
          scenario={scenario}
          footer={
            <button className="btn btn-red btn-big btn-wide sticky-cta" onClick={() => setMode('quiz')}>
              Quiz me! →
            </button>
          }
        />
      )}
      {mode === 'quiz' && (
        <QuizRunner
          items={lessonQuestions(scenario).map((q) => ({ question: q, names }))}
          onFinish={(r) => {
            setResults(r);
            setMode('done');
          }}
        />
      )}
      {mode === 'done' && (
        <ScorePanel results={results}>
          <button className="btn btn-primary" onClick={() => setMode('learn')}>Watch again</button>
          <button className="btn btn-ghost" onClick={() => go('/plays')}>All plays</button>
        </ScorePanel>
      )}
    </div>
  );
}
