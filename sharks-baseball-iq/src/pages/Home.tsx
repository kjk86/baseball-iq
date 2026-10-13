import { TopBar } from '../components/Layout/TopBar';
import { LESSONS } from '../data/lessons';
import { go } from '../router';
import logo from '../assets/pv-logo.png?inline';
import { THIS_WEEK, hasLineup } from '../data/lineups';
import { useApp } from '../state/AppContext';
import { recordFrom } from '../data/team';
import { useTeamData } from './Team';
import { BALL_BASE_BACKUP, PRINCIPLES } from '../baseball/teachingRules';

export function Home() {
  const team = useTeamData();
  const rec = recordFrom(team.schedule);
  const { lineups } = useApp();
  const posted = hasLineup(lineups);
  return (
    <div className="page">
      <TopBar />
      <div className="game-card" aria-label="Next game">
        <div className="game-kicker">{posted ? "This week's lineup is for" : 'Next up'}</div>
        <div className="game-vs">
          Sharks <span>vs</span> {THIS_WEEK.game.opponent}
        </div>
        <div className="game-meta">{THIS_WEEK.game.when}</div>
        {THIS_WEEK.game.where && <div className="game-meta">📍 {THIS_WEEK.game.where}</div>}
        {posted ? (
          <div className="game-updated">Lineup updated {THIS_WEEK.updated}</div>
        ) : (
          <div className="game-tbd">Lineup coming soon — practice any position for now</div>
        )}
        <button className="team-link" onClick={() => go('/team')}>
          <span className="team-rec">
            {rec.wins}–{rec.losses}
            {rec.ties ? `–${rec.ties}` : ''}
          </span>
          <span>Schedule · Stats · Plans</span>
          <span aria-hidden>›</span>
        </button>
      </div>
      <section className="hero">
        <img src={logo} alt="PV Sharks" className="hero-logo" />
        <div className="hero-kicker">Defense Trainer</div>
        <h1 className="hero-title">
          <span>SHARKS</span> Baseball IQ
        </h1>
        <div className="hero-team">PVAA Sharks 10U · Coach Green</div>
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
        <button className="btn btn-outline btn-big btn-wide btn-pitch btn-now" onClick={() => go('/now-what')}>
          🧤 NOW WHAT?
          <span className="btn-sub">I fielded it — where does the ball go?</span>
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
      <footer className="foot muted small">For our PVAA Sharks 10U families.</footer>
    </div>
  );
}
