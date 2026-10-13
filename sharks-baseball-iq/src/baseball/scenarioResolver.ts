import { ASSIGNMENTS, type Concept } from './assignments';
import { START_POSITIONS, coord, distance, type LocationKey } from './coordinates';
import { DEFENSIVE_RULES, HOLD_BALL_RULE, type RuleAssignment } from './defensiveRules';
import {
  DEFENSIVE_POSITIONS,
  type AssignmentAction,
  type BallEvent,
  type BallType,
  type DefensivePosition,
  type GameState,
} from './types';

/**
 * SCENARIO RESOLVER
 *
 *   game state + event  →  defensive rule  →  one assignment per POSITION
 *
 * The output knows nothing about players, pixels, or animation.
 */

export interface ResolveInput extends Partial<GameState> {
  event: BallEvent;
  /** Scenario-specific tweaks (e.g. "what if RF doesn't back up?" demos). */
  overrides?: Partial<Record<DefensivePosition, RuleAssignment>>;
}

export interface ResolvedAssignment {
  position: DefensivePosition;
  action: AssignmentAction;
  /** null = stay where you are; 'BALL' = go to where the ball is fielded. */
  destination: LocationKey | 'BALL' | null;
  label: string;
  cheer: string;
  explanation: string;
  hint: string;
  concept: Concept;
  reactionDelay: number;
  todo?: string;
}

export interface ResolvedPlay {
  event: BallEvent;
  description: string;
  gameState: GameState;
  ballLocation: LocationKey | null;
  ballType: BallType;
  primaryFielder: DefensivePosition | null;
  ballHolder: DefensivePosition | null;
  assignments: Record<DefensivePosition, ResolvedAssignment>;
  notes: string[];
}

export function resolveScenario(input: ResolveInput): ResolvedPlay {
  const rule = DEFENSIVE_RULES[input.event];
  const gameState: GameState = {
    runners: input.runners ?? [],
    outs: input.outs ?? 0,
    ballHolder: input.ballHolder,
  };

  // 1. Base assignments, 2. variants that match the runners, 3. scenario overrides.
  const merged: Record<DefensivePosition, RuleAssignment> = { ...rule.assignments };
  const notes: string[] = [];
  for (const v of rule.variants ?? []) {
    if (v.whenRunnersOn.every((b) => gameState.runners.includes(b))) {
      Object.assign(merged, v.assignments);
      notes.push(v.note);
    }
  }

  // Closest player calls it — and it's his ball.
  let primaryFielder = rule.primaryFielder;
  if (rule.closestOf && rule.ballLocation) {
    const ball = coord(rule.ballLocation);
    primaryFielder = [...rule.closestOf].sort(
      (p, q) => distance(START_POSITIONS[p], ball) - distance(START_POSITIONS[q], ball),
    )[0];
    merged[primaryFielder] = {
      action: 'FIELD_BALL',
      explanation: rule.closestExplanation ?? "You're closest — call it!",
    };
  }

  const ballHolder = gameState.ballHolder ?? primaryFielder;
  if (input.event === 'NO_PLAY_RUNNERS_STOPPED' && ballHolder) {
    merged[ballHolder] = HOLD_BALL_RULE;
  }
  if (input.overrides) Object.assign(merged, input.overrides);

  const assignments = {} as Record<DefensivePosition, ResolvedAssignment>;
  for (const position of DEFENSIVE_POSITIONS) {
    const r = merged[position];
    const d = ASSIGNMENTS[r.action];
    assignments[position] = {
      position,
      action: r.action,
      destination: r.destination !== undefined ? r.destination : d.destination,
      label: d.label,
      cheer: d.cheer,
      explanation: r.explanation || d.explanation,
      hint: d.hint,
      concept: d.concept,
      reactionDelay: d.reactionDelay,
      todo: r.todo,
    };
  }

  return {
    event: input.event,
    description: rule.description,
    gameState,
    ballLocation: rule.ballLocation,
    ballType: rule.ballType,
    primaryFielder,
    ballHolder,
    assignments,
    notes,
  };
}
