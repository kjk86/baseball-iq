import { CONCEPT_LABELS, type Concept } from '../../baseball/assignments';

export interface QuestionResult {
  id: string;
  concept: Concept;
  firstTry: boolean;
}

interface Props {
  results: QuestionResult[];
  title?: string;
  children?: React.ReactNode;
}

export function ScorePanel({ results, title = 'GREAT WORK! ⚾', children }: Props) {
  const right = results.filter((r) => r.firstTry).length;
  const missed = [...new Set(results.filter((r) => !r.firstTry).map((r) => r.concept))];
  return (
    <div className="score card">
      <div className="score-title">{title}</div>
      <div className="score-num">
        {right} <span>/ {results.length}</span>
      </div>
      <div className="muted">right on the first try</div>
      {missed.length > 0 ? (
        <div className="score-missed">
          <div className="section-title">Let's practice:</div>
          <ul>
            {missed.map((c) => (
              <li key={c}>{CONCEPT_LABELS[c].toUpperCase()}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="point-big">Perfect! You know your jobs! 🏆</p>
      )}
      {children && <div className="score-actions">{children}</div>}
    </div>
  );
}
