import { CONCEPT_LABELS, type Concept } from './assignments';
import { LOCATIONS, START_POSITIONS, coord, distance, type QuizTarget } from './coordinates';
import { resolveScenario, type ResolvedPlay } from './scenarioResolver';
import type { ChoiceOption, Scenario } from './scenarioTypes';
import { PLAY_TYPE_TEXT, playTypeFor } from './teachingRules';
import type { Coordinate, DefensivePosition } from './types';

/**
 * QUIZ QUESTION BUILDER
 *
 * "Where should NAME go?" answers are NOT hand-written. They come from the
 * rule engine, so a quiz can never disagree with the animation.
 */

export interface TargetPin extends Coordinate {
  id: QuizTarget | 'STAY';
  label: string;
}

export interface DestinationQuestion {
  kind: 'DESTINATION';
  id: string;
  scenarioId: string;
  position: DefensivePosition;
  customPrompt?: string;
  correctId: TargetPin['id'];
  targets: TargetPin[];
  concept: Concept;
  cheer: string;
  explanation: string;
  hint: string;
  /** Asked before the pitch (field frozen at the start). */
  beforePitch?: boolean;
}

export interface ChoiceQuestion {
  kind: 'CHOICE';
  id: string;
  scenarioId: string;
  position?: DefensivePosition;
  prompt: string;
  choices: ChoiceOption[];
  correctId: string;
  correctTitle: string;
  explanation: string;
  concept: Concept;
  /** Where in the play the question appears. */
  pauseAt: 'HIT' | 'DECISION' | 'HIGHLIGHT' | 'START' | 'FIELDED';
  hint: string;
  beforePitch?: boolean;
}

export type Question = DestinationQuestion | ChoiceQuestion;

const BASE_PINS: TargetPin[] = [
  { id: 'FIRST', label: '1st', ...coord('FIRST_BASE') },
  { id: 'SECOND', label: '2nd', ...coord('SECOND_BASE') },
  { id: 'THIRD', label: '3rd', ...coord('THIRD_BASE') },
  { id: 'HOME', label: 'Home', ...coord('HOME') },
];
const EXTRA_PINS: TargetPin[] = [
  { id: 'BEHIND_FIRST', label: 'Behind 1st', ...coord('BACKUP_FIRST') },
  { id: 'BEHIND_THIRD', label: 'Behind 3rd', ...coord('BACKUP_THIRD') },
  { id: 'BEHIND_HOME', label: 'Behind home', ...coord('BACKUP_HOME') },
  { id: 'BEHIND_SECOND', label: 'Behind 2nd', ...coord('BACKUP_SECOND_RIGHT') },
];

function pinFor(resolved: ResolvedPlay, pos: DefensivePosition): TargetPin {
  const a = resolved.assignments[pos];
  if (a.destination === null) return { id: 'STAY', label: 'Stay here', ...START_POSITIONS[pos] };
  if (a.destination === 'BALL') {
    return { id: 'BALL', label: 'The ball', ...coord(resolved.ballLocation ?? 'MOUND') };
  }
  const l = LOCATIONS[a.destination];
  return { id: l.target, label: l.label, x: l.x, y: l.y };
}

/** Correct pin + 3 believable wrong pins that don't overlap on screen. */
export function buildTargets(resolved: ResolvedPlay, pos: DefensivePosition): TargetPin[] {
  const correct = pinFor(resolved, pos);
  const chosen: TargetPin[] = [correct];
  const pool: TargetPin[] = [];
  if (resolved.ballLocation && correct.id !== 'BALL') {
    pool.push({ id: 'BALL', label: 'The ball', ...coord(resolved.ballLocation) });
  }
  const start = START_POSITIONS[pos];
  const rest = [...BASE_PINS, ...EXTRA_PINS].sort((a, b) => distance(a, start) - distance(b, start));
  pool.push(...rest);
  for (const p of pool) {
    if (chosen.length >= 4) break;
    if (chosen.some((c) => c.id === p.id || distance(c, p) < 7.5)) continue;
    chosen.push(p);
  }
  // Stable, position-based order so the answer isn't always first.
  return chosen.sort((a, b) => a.x - b.x || a.y - b.y);
}

export function destinationQuestion(scenario: Scenario, pos: DefensivePosition): DestinationQuestion {
  const resolved = resolveScenario({ event: scenario.event, ...scenario.gameState, overrides: scenario.overrides });
  const a = resolved.assignments[pos];
  const targets = buildTargets(resolved, pos);
  return {
    kind: 'DESTINATION',
    id: `${scenario.id}:${pos}`,
    scenarioId: scenario.id,
    position: pos,
    customPrompt: scenario.prompts?.[pos],
    correctId: pinFor(resolved, pos).id,
    targets,
    concept: a.concept,
    cheer: a.cheer,
    explanation: a.explanation,
    hint: a.hint,
  };
}

const BASE_WORD: Record<string, string> = { FIRST: 'first', SECOND: 'second', THIRD: 'third', HOME: 'home' };

export function forceTagQuestion(scenario: Scenario): ChoiceQuestion | null {
  const ft = scenario.forceTag;
  if (!ft) return null;
  const type = playTypeFor(ft.runner, scenario.gameState.runners);
  return {
    kind: 'CHOICE',
    id: `${scenario.id}:force-tag`,
    scenarioId: scenario.id,
    prompt: `Is the play at ${BASE_WORD[ft.base]} a FORCE or a TAG?`,
    choices: [
      { id: 'FORCE', label: 'FORCE 👟 touch the base' },
      { id: 'TAG', label: 'TAG 🧤 tag the runner' },
    ],
    correctId: type,
    correctTitle: `YES! ${PLAY_TYPE_TEXT[type].title}!`,
    explanation: PLAY_TYPE_TEXT[type].text,
    concept: 'FORCE_VS_TAG',
    pauseAt: 'HIGHLIGHT',
    hint: 'Does the runner HAVE to run? Look at the bases behind him.',
  };
}

export function decisionQuestion(scenario: Scenario): ChoiceQuestion | null {
  const d = scenario.decision;
  if (!d) return null;
  return {
    kind: 'CHOICE',
    id: `${scenario.id}:decision`,
    scenarioId: scenario.id,
    position: d.position,
    prompt: d.prompt,
    choices: d.choices,
    correctId: d.correctId,
    correctTitle: d.correctTitle,
    explanation: d.explanation,
    concept: 'HOLD_THE_BALL',
    pauseAt: 'DECISION',
    hint: 'The runners stopped. Is there really a play?',
  };
}

export function choiceQuestions(scenario: Scenario): ChoiceQuestion[] {
  return (scenario.choiceQuestions ?? []).map((c) => ({
    kind: 'CHOICE',
    id: `${scenario.id}:${c.id}`,
    scenarioId: scenario.id,
    position: c.position,
    prompt: c.prompt,
    choices: c.choices,
    correctId: c.correctId,
    correctTitle: c.correctTitle,
    explanation: c.explanation,
    concept: c.concept,
    pauseAt: 'HIT',
    hint: c.concept === 'CALL_IT' ? 'Who is closest to the ball?' : 'Remember: the ball only needs one kid.',
  }));
}

/** The short quiz shown after watching a scenario inside a lesson. */
export function lessonQuestions(scenario: Scenario): Question[] {
  const out: Question[] = [];
  const ft = forceTagQuestion(scenario);
  const dec = decisionQuestion(scenario);
  if (dec) return [dec];
  const now = nowWhatQuestion(scenario);
  if (now) out.push(now);
  out.push(...choiceQuestions(scenario));
  if (ft) out.push(ft);

  const positions: DefensivePosition[] = [];
  for (const p of Object.keys(scenario.prompts ?? {}) as DefensivePosition[]) positions.push(p);
  for (const c of scenario.choiceQuestions ?? []) if (c.position && !positions.includes(c.position)) positions.push(c.position);
  for (const p of scenario.relevantPositions) {
    if (positions.length >= (ft || now ? 1 : 2)) break;
    if (!positions.includes(p)) positions.push(p);
  }
  for (const p of positions) out.push(destinationQuestion(scenario, p));
  return out;
}

export const conceptLabel = (c: Concept) => CONCEPT_LABELS[c];

// ─────────────────────────────────────────────────────────────
// BEFORE THE PITCH
// "If it's hit to YOU, what's the play?" — the answer comes from the
// scenario script (who the fielder throws to) plus the rule engine
// (what that receiver is doing: covering 1st, cutoff, …).
// ─────────────────────────────────────────────────────────────

const PLAY_LABELS: Record<string, string> = {
  FIRST: 'THROW TO 1ST',
  SECOND: 'THROW TO 2ND',
  THIRD: 'THROW TO 3RD',
  HOME: 'THROW HOME',
  CUTOFF: 'THROW TO THE CUTOFF',
  STEP: 'STEP ON 1ST',
  HOLD: 'HOLD IT ✋',
  CATCH: 'CALL IT & CATCH IT',
  WAIT: 'WAIT FOR SOMEONE ELSE',
};
const PLAY_ORDER = ['CATCH', 'STEP', 'FIRST', 'SECOND', 'THIRD', 'HOME', 'CUTOFF', 'HOLD', 'WAIT'];

const RECEIVER_PLAY: Partial<Record<string, string>> = {
  COVER_FIRST: 'FIRST',
  COVER_SECOND: 'SECOND',
  COVER_THIRD: 'THIRD',
  COVER_HOME: 'HOME',
  CUTOFF: 'CUTOFF',
  RELAY: 'CUTOFF',
};

const PLAY_WHY: Record<string, string> = {
  FIRST: 'Get the sure out at first!',
  SECOND: 'Short toss to second for the force!',
  THIRD: 'The lead runner is going to third — throw to third!',
  HOME: 'The runner is going home — throw home!',
  CUTOFF: 'Get it in — hit the cutoff!',
  STEP: 'Close to the bag? Step on first yourself!',
  HOLD: 'No good throw here. Hold the ball and keep the runner where he is!',
  CATCH: 'You’re closest — yell "I GOT IT!" and catch it.',
};

/** What the fielder should do with the ball, read from the scenario script. */
export function playForFielder(scenario: Scenario, allowMistakes = false): string | null {
  // Before the pitch, a bobble isn't the plan. After the ball is fielded, it's fair game.
  if (!allowMistakes && scenario.phases.some((p) => p.kind === 'BOBBLE')) return null;
  const resolved = resolveScenario({ event: scenario.event, ...scenario.gameState, overrides: scenario.overrides });
  const fielder = resolved.primaryFielder;
  if (!fielder) return null;
  if (scenario.decision && scenario.decision.position === fielder) {
    return scenario.decision.correctId === 'HOLD' ? 'HOLD' : null;
  }
  const hitIdx = scenario.phases.findIndex((p) => p.kind === 'HIT');
  for (const p of scenario.phases.slice(hitIdx + 1)) {
    if (p.kind === 'THROW' || p.kind === 'OVERTHROW') {
      return RECEIVER_PLAY[resolved.assignments[p.to].action] ?? null;
    }
    if (p.kind === 'CARRY') return 'STEP';
    if (p.kind === 'OUT' && scenario.event === 'POPUP_SS') return 'CATCH';
    if (p.kind === 'DECISION') return null;
  }
  return null;
}

export function prePitchQuestion(scenario: Scenario): ChoiceQuestion | null {
  return fielderPlayQuestion(scenario, 'START');
}

/**
 * NOW WHAT?
 * The ball is hit, the fielder gets it, everybody moves — FREEZE.
 * "{NAME} has the ball. Now what?"
 */
export function nowWhatQuestion(scenario: Scenario): ChoiceQuestion | null {
  return fielderPlayQuestion(scenario, 'FIELDED');
}

function fielderPlayQuestion(scenario: Scenario, when: 'START' | 'FIELDED'): ChoiceQuestion | null {
  const fielded = when === 'FIELDED';
  const play = playForFielder(scenario, fielded);
  if (!play || (fielded && play === 'CATCH')) return null;
  const resolved = resolveScenario({ event: scenario.event, ...scenario.gameState, overrides: scenario.overrides });
  const fielder = resolved.primaryFielder!;
  const outfield = ['LF', 'LCF', 'RCF', 'RF'].includes(fielder);
  const pool: string[] =
    play === 'CATCH'
      ? ['CATCH', 'WAIT', 'FIRST']
      : outfield
        ? ['CUTOFF', 'HOME', 'THIRD', 'SECOND']
        : scenario.gameState.runners.length
          ? ['FIRST', 'SECOND', 'THIRD', 'HOME', 'HOLD']
          : ['FIRST', 'SECOND', 'HOME', 'HOLD'];
  if (fielded && !pool.includes('HOLD')) pool.push('HOLD');
  const picks = [play, ...pool.filter((x) => x !== play)].slice(0, fielded ? 4 : 3);
  const choices = PLAY_ORDER.filter((x) => picks.includes(x)).map((id) => ({ id, label: PLAY_LABELS[id] }));
  return {
    kind: 'CHOICE',
    id: `${scenario.id}:${fielded ? 'now' : 'pre'}`,
    scenarioId: scenario.id,
    position: fielder,
    prompt: fielded ? '{NAME} HAS THE BALL. NOW WHAT?' : "IT'S HIT TO YOU, {NAME}! WHAT'S THE PLAY?",
    choices,
    correctId: play,
    correctTitle: `YES! ${PLAY_LABELS[play].replace(' ✋', '')}!`,
    explanation: fielded ? PLAY_WHY[play] : resolved.assignments[fielder].explanation || PLAY_WHY[play],
    concept: play === 'HOLD' ? 'HOLD_THE_BALL' : play === 'CUTOFF' ? 'CUTOFF_AND_RELAY' : play === 'CATCH' ? 'CALL_IT' : 'FIELDING_YOUR_BALL',
    pauseAt: fielded ? 'FIELDED' : 'START',
    hint: fielded
      ? 'Look at the runners. Where is the closest, easiest out? Is there one at all?'
      : 'Where is the easiest, safest out? Is there a runner?',
    beforePitch: !fielded,
  };
}

/** "Before the pitch: if it's hit THERE, where do you go?" */
export function prePitchDestinationQuestion(scenario: Scenario, pos: DefensivePosition): DestinationQuestion {
  const q = destinationQuestion(scenario, pos);
  return { ...q, id: `${q.id}:pre`, customPrompt: 'WHERE DOES {NAME} GO?', beforePitch: true };
}
