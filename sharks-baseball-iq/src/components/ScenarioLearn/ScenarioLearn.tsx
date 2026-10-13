import { useMemo, useState } from 'react';
import { buildScenario, sampleTimeline, type DemoVariant } from '../../animation/animationEngine';
import { useTimelinePlayer } from '../../animation/useTimelinePlayer';
import type { Scenario } from '../../baseball/scenarioTypes';
import { DEFENSIVE_POSITIONS, type Coordinate, type DefensivePosition } from '../../baseball/types';
import { useApp } from '../../state/AppContext';
import { BaseballField } from '../BaseballField/BaseballField';
import { DebugPanel } from '../DebugPanel/DebugPanel';
import { InningSelector } from '../InningSelector/InningSelector';
import { Situation } from '../Layout/TopBar';
import { QuizOverlay } from '../QuizOverlay/QuizOverlay';
import { ScenarioControls } from '../ScenarioControls/ScenarioControls';
import { TeachingPanel } from '../TeachingPanel/TeachingPanel';

interface Props {
  scenario: Scenario;
  footer?: React.ReactNode;
}

type DecisionState = 'none' | 'correct' | 'correctPlaying' | 'wrongDemo';

/** LEARN MODE: watch the play, tap players to see their job. */
export function ScenarioLearn({ scenario, footer }: Props) {
  const { speed, setSpeed, inning, setInning, namesFor, debug } = useApp();
  const names = namesFor(inning);
  const [variant, setVariant] = useState<DemoVariant>('main');
  const [startAt, setStartAt] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [decision, setDecision] = useState<DecisionState>('none');
  const [selected, setSelected] = useState<DefensivePosition | null>(null);
  const [clicked, setClicked] = useState<Coordinate | null>(null);

  const built = useMemo(() => buildScenario(scenario, variant), [scenario, variant]);
  const { timeline, resolved } = built;
  const player = useTimelinePlayer(timeline, {
    speed,
    startAt,
    autoPlay,
    skipPauses: decision === 'correct' || decision === 'correctPlaying' ? ['DECISION'] : variant === 'wrong' ? ['DECISION', 'FREEZE', 'HIGHLIGHT'] : [],
  });
  const frame = sampleTimeline(timeline, player.t);
  const pause = player.activePause;
  const bad = DEFENSIVE_POSITIONS.filter((p) => resolved.assignments[p].action === 'CHASE_BALL');

  const switchTo = (v: DemoVariant, at = 0, auto = true, d: DecisionState = 'none') => {
    setVariant(v);
    setStartAt(at);
    setAutoPlay(auto);
    setDecision(d);
  };

  const dec = scenario.decision;
  const decider = dec ? names[dec.position] : '';

  let overlay: React.ReactNode = null;
  if (pause && pause.kind !== 'DECISION' && variant !== 'wrong') {
    overlay = (
      <QuizOverlay tone={pause.tone === 'force' ? 'force' : pause.tone === 'tag' ? 'tag' : 'info'} title={pause.title ?? ''} text={pause.text}>
        <button className="btn btn-primary" onClick={player.resume}>
          Continue ▶
        </button>
      </QuizOverlay>
    );
  } else if (pause?.kind === 'DECISION' && dec && decision === 'none') {
    overlay = (
      <QuizOverlay tone="info" title={dec.prompt} text={`${decider.toUpperCase()} (${dec.position}) has the ball. The runner stopped.`}>
        <div className="choices">
          {dec.choices.map((c) => (
            <button
              key={c.id}
              className={`btn btn-choice ${c.id === 'HOLD' ? 'btn-hold' : ''}`}
              onClick={() => {
                if (c.id === dec.correctId) setDecision('correct');
                else switchTo('wrong', timeline.decisionTime ?? 0, true, 'wrongDemo');
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </QuizOverlay>
    );
  } else if (decision === 'correct' && dec) {
    overlay = (
      <QuizOverlay tone="good" title={dec.correctTitle} text={dec.explanation}>
        <button
          className="btn btn-primary"
          onClick={() => {
            setDecision('correctPlaying');
            player.resume();
          }}
        >
          Continue ▶
        </button>
      </QuizOverlay>
    );
  } else if (variant === 'wrong' && dec && player.done) {
    overlay = (
      <QuizOverlay tone="show" title="Uh oh!" text={dec.wrongLesson}>
        <button
          className="btn btn-primary"
          onClick={() => switchTo('main', timeline.decisionTime ?? 0, false, 'correct')}
        >
          Show me the right way ▶
        </button>
      </QuizOverlay>
    );
  } else if (variant === 'alternate' && scenario.alternate && player.done) {
    overlay = (
      <QuizOverlay tone="show" title="Uh oh!" text={scenario.alternate.lesson}>
        <button className="btn btn-primary" onClick={() => switchTo('main')}>
          Show me the right way ▶
        </button>
      </QuizOverlay>
    );
  }

  const showJobs = player.done || (!player.playing && player.t === 0);

  return (
    <div className="learn">
      <Situation lines={scenario.situation} />
      <div className="field-wrap">
        {frame.caption && !overlay && <div className="caption">{frame.caption}</div>}
        {variant === 'alternate' && <div className="variant-tag">What NOT to do</div>}
        {variant === 'wrong' && <div className="variant-tag">What NOT to do</div>}
        <BaseballField
          frame={frame}
          names={names}
          selected={selected}
          badPositions={bad}
          onPlayer={(p) => setSelected(p === selected ? null : p)}
          onFieldClick={debug ? setClicked : undefined}
          debugPoint={debug ? clicked : null}
        />
      </div>
      {overlay}
      <ScenarioControls
        player={{
          ...player,
          replay: () => {
            if (variant === 'wrong') switchTo('main');
            else {
              setDecision('none');
              setStartAt(0);
              player.replay();
            }
          },
          reset: () => {
            setDecision('none');
            if (variant !== 'main') switchTo('main', 0, false);
            else player.reset();
          },
        }}
        speed={speed}
        onSpeed={setSpeed}
      />
      <InningSelector inning={inning} onChange={setInning} />
      {player.done && variant === 'main' && scenario.alternate && (
        <button className="btn btn-outline btn-wide" onClick={() => switchTo('alternate')}>
          🤔 {scenario.alternate.label}
        </button>
      )}
      <TeachingPanel
        resolved={resolved}
        names={names}
        selected={selected}
        onSelect={setSelected}
        teachingPoints={scenario.teachingPoints}
        showJobs={showJobs}
      />
      {footer}
      {debug && (
        <DebugPanel
          resolved={resolved}
          timeline={timeline}
          frame={frame}
          names={names}
          clicked={clicked}
          selected={selected}
          scenarioId={scenario.id}
          variant={variant}
        />
      )}
    </div>
  );
}
