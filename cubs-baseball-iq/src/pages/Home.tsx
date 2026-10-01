import { TopBar } from '../components/Layout/TopBar';
import { LESSONS } from '../data/lessons';
import { go } from '../router';
import { THIS_WEEK } from '../data/lineups';
import { recordFrom } from '../data/team';
import { useTeamData } from './Team';
import { BALL_BASE_BACKUP, PRINCIPLES } from '../baseball/teachingRules';

export function Home() {
  const team = useTeamData();
  const rec = recordFrom(team.schedule);
  return (
    <div className="page">
      <TopBar />
      <div className="game-card" aria-label="Next game">
        <div className="game-kicker">This week's lineup is for</div>
        <div className="game-vs">
          Cubs <span>vs</span> {THIS_WEEK.game.opponent}
        </div>
        <div className="game-meta">{THIS_WEEK.game.when}</div>
        <div className="game-meta">📍 {THIS_WEEK.game.where}</div>
        <div className="game-updated">Lineup updated {THIS_WEEK.updated}</div>
        <button className="team-link" onClick={() => go('/team')}>
          <span className="team-rec">
            {rec.wins}–{rec.losses}
          </span>
          <span>Schedule · Stats · Plans</span>
          <span aria-hidden>›</span>
        </button>
      </div>
      <section className="hero">
        <div className="hero-kicker">Defense Trainer</div>
        <h1 className="hero-title">
          <span>CUBS</span> Baseball IQ
        </h1>
        <div className="bbb">
          {BALL_BASE_BACKUP.map((s, i) => (
            <div key={s.step} className="bbb-step">
              <div className="bbb-word">{s.step}</div>
              <div className="bbb-q">{s.question}</div>
              {i < 2 && <div className="bbb-arrow">→</div>}
            </div>
          ))}
        </div>
        <button className="btn btn-red btn-big btn-wide" onClick={() => go('/practice')}>
          ⚾ PRACTICE MY GAME
        </button>
        <button className="btn btn-outline btn-big btn-wide btn-pitch" onClick={() => go('/before-pitch')}>
          ⏸ BEFORE THE PITCH
          <span className="btn-sub">What's my job if it's hit to me?</span>
        </button>
        <p className="hero-sub">{PRINCIPLES.oneKid}</p>
      </section>

      <h2 className="section-title">Lessons</h2>
      <div className="lessons">
        {LESSONS.map((l) => (
          <button key={l.id} className="lesson-card" onClick={() => go(`/lesson/${l.id}`)}>
            <div className="lesson-num">{l.number}</div>
            <div className="lesson-body">
              <div className="lesson-title">
                {l.title} <span aria-hidden>{l.emoji}</span>
              </div>
              <div className="lesson-tag">“{l.tagline}”</div>
              <div className="lesson-meta">{l.scenarioIds.length} plays</div>
            </div>
            <div className="lesson-go">›</div>
          </button>
        ))}
      </div>
      <button className="btn btn-outline btn-wide" onClick={() => go('/plays')}>
        📋 All plays
      </button>
      <footer className="foot muted small">For our Cubs 8U families. Not affiliated with MLB or the Chicago Cubs.</footer>
    </div>
  );
}
