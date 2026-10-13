import type { LocationKey } from './coordinates';
import type { RuleAssignment } from './defensiveRules';
import type {
  BallEvent,
  BaseName,
  Category,
  DefensivePosition,
  GameState,
  RunnerId,
} from './types';

/**
 * DECLARATIVE SCENARIOS
 *
 * A scenario = game state + event (→ rule engine decides who goes where)
 *            + a short script of what the BALL and RUNNERS do (phases).
 * Phases never say where a fielder goes — that comes from the rule engine.
 */

export interface RunnerMove {
  runner: RunnerId;
  to: BaseName;
  /** Seconds after the phase starts. */
  delay?: number;
  /** Stop this fraction of the way to the last base (e.g. 0.35 = a lead-off / turn). */
  partial?: number;
  /** Return to the base he came from after a partial move. */
  thenReturn?: boolean;
}

interface PhaseBase {
  /** Banner text shown when this phase starts. */
  caption?: string;
  runners?: RunnerMove[];
  /** Start at the same time as the previous phase (+delay) instead of after it. */
  withPrevious?: boolean;
  delay?: number;
}

export type ScenarioPhase =
  | (PhaseBase & { kind: 'PITCH' })
  /** Ball goes from home to the rule's ball location; the FIELD_BALL player goes to get it. */
  | (PhaseBase & { kind: 'HIT' })
  /** Everyone else moves to their assignment. */
  | (PhaseBase & { kind: 'REACT' })
  | (PhaseBase & { kind: 'THROW'; to: DefensivePosition; outs?: RunnerId[] })
  /** Throw gets past the receiver. A backup (stopper) stops it, or it rolls to `looseTo`. */
  | (PhaseBase & {
      kind: 'OVERTHROW';
      to: DefensivePosition;
      stopper?: DefensivePosition;
      looseTo?: LocationKey;
    })
  /** A bad throw toward a spot where nobody is. */
  | (PhaseBase & { kind: 'WILD_THROW'; toward: LocationKey })
  /** Fielder bobbles; ball squirts to `to`; fielder picks it up. */
  | (PhaseBase & { kind: 'BOBBLE'; to: LocationKey })
  /** Ball holder runs the ball somewhere (e.g. 1B steps on the bag). */
  | (PhaseBase & { kind: 'CARRY'; to: LocationKey; outs?: RunnerId[] })
  /** Extra player movement. 'BALL' = run to the loose ball and pick it up. */
  | (PhaseBase & {
      kind: 'MOVE';
      moves: Partial<Record<DefensivePosition, LocationKey | 'BALL'>>;
    })
  /** Only runners move. */
  | (PhaseBase & { kind: 'RUNNERS' })
  /** Mark runners out now (e.g. fly ball caught). */
  | (PhaseBase & { kind: 'OUT'; outs: RunnerId[] })
  | (PhaseBase & { kind: 'WAIT'; seconds: number })
  /** Pause with a big message; Continue to resume. */
  | (PhaseBase & { kind: 'FREEZE'; title: string; text?: string })
  /** Pause and highlight a base (force / tag). */
  | (PhaseBase & {
      kind: 'HIGHLIGHT';
      location: LocationKey;
      title: string;
      text?: string;
      tone: 'force' | 'tag' | 'info';
    })
  /** Pause for scenario.decision. Phases after this = the CORRECT branch. */
  | (PhaseBase & { kind: 'DECISION' });

export interface TeachingPoint {
  text: string;
  big?: boolean;
}

export interface ChoiceOption {
  id: string;
  label: string;
}

export interface DecisionDef {
  position: DefensivePosition;
  prompt: string;
  choices: ChoiceOption[];
  correctId: string;
  correctTitle: string;
  explanation: string;
  /** Hint after a wrong answer (defaults to the hold-the-ball hint). */
  hint?: string;
  /** Replaces phases after DECISION for the "what if you throw it?" demo. */
  wrongPhases: ScenarioPhase[];
  wrongLesson: string;
}

export interface ChoiceQuestionDef {
  id: string;
  position?: DefensivePosition;
  prompt: string;
  choices: ChoiceOption[];
  correctId: string;
  correctTitle: string;
  explanation: string;
  concept: 'DONT_CHASE' | 'FORCE_VS_TAG' | 'HOLD_THE_BALL' | 'CALL_IT';
}

export interface ForceTagDef {
  runner: RunnerId;
  base: BaseName;
}

export interface AlternateDemo {
  label: string;
  overrides?: Partial<Record<DefensivePosition, RuleAssignment>>;
  phases: ScenarioPhase[];
  lesson: string;
}

export interface Scenario {
  id: string;
  title: string;
  /** Two short banner lines, e.g. ["RUNNER ON FIRST", "GROUND BALL TO SHORTSTOP"] */
  situation: [string, string];
  category: Category;
  difficulty: 1 | 2 | 3;
  gameState: GameState;
  event: BallEvent;
  overrides?: Partial<Record<DefensivePosition, RuleAssignment>>;
  phases: ScenarioPhase[];
  teachingPoints: TeachingPoint[];
  /** Positions with an interesting job — used by Practice My Game. */
  relevantPositions: DefensivePosition[];
  /** Custom quiz prompts for "Where should NAME go?" questions. */
  prompts?: Partial<Record<DefensivePosition, string>>;
  /** Extra multiple-choice questions (chase / force-tag). */
  choiceQuestions?: ChoiceQuestionDef[];
  forceTag?: ForceTagDef;
  decision?: DecisionDef;
  alternate?: AlternateDemo;
}
