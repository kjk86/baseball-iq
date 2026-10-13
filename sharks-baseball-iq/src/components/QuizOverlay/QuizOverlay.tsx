import type { ReactNode } from 'react';

export type FeedbackTone = 'good' | 'try' | 'show' | 'info' | 'force' | 'tag';

interface Props {
  tone: FeedbackTone;
  title: string;
  text?: string;
  children?: ReactNode;
}

/** Card that floats over the bottom of the field. Friendly — never harsh red. */
export function QuizOverlay({ tone, title, text, children }: Props) {
  return (
    <div className={`overlay overlay-${tone}`} role="status" aria-live="polite">
      {tone === 'good' && <div className="sparkle" aria-hidden />}
      <div className="overlay-title">{title}</div>
      {text && <div className="overlay-text">{text}</div>}
      {children && <div className="overlay-actions">{children}</div>}
    </div>
  );
}
