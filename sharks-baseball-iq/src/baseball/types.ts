/**
 * Core baseball domain types.
 *
 * Nothing in this folder knows about React, SVG, or animation. It is pure,
 * deterministic baseball logic that can be unit tested and audited.
 */

/** The 9 traditional defensive positions (3 outfielders). */
export const DEFENSIVE_POSITIONS = ['C', 'P', '1B', '2B', 'SS', '3B', 'LF', 'CF', 'RF'] as const;

export type DefensivePosition = (typeof DEFENSIVE_POSITIONS)[number];

export const POSITION_NAMES: Record<DefensivePosition, string> = {
  C: 'Catcher',
  P: 'Pitcher',
  '1B': 'First Base',
  '2B': 'Second Base',
  SS: 'Shortstop',
  '3B': 'Third Base',
  LF: 'Left Field',
  CF: 'Center Field',
  RF: 'Right Field',
};

/** Bases a runner can occupy. (Named to avoid confusion with the 1B/2B/3B positions.) */
export type RunnerBase = 'FIRST' | 'SECOND' | 'THIRD';
export type BaseName = RunnerBase | 'HOME';

/** Runners are identified by where they STARTED the play. */
export type RunnerId = 'BATTER' | 'R1' | 'R2' | 'R3';

export const RUNNER_START_BASE: Record<RunnerId, BaseName> = {
  BATTER: 'HOME',
  R1: 'FIRST',
  R2: 'SECOND',
  R3: 'THIRD',
};

export const runnerIdForBase = (base: RunnerBase): RunnerId =>
  base === 'FIRST' ? 'R1' : base === 'SECOND' ? 'R2' : 'R3';

/** What happened on the play. Each event has exactly one rule in defensiveRules.ts. */
export type BallEvent =
  | 'GROUND_BALL_SS'
  | 'GROUND_BALL_2B'
  | 'GROUND_BALL_3B'
  | 'GROUND_BALL_1B'
  | 'GROUND_BALL_1B_OFF_BAG'
  | 'SINGLE_LF'
  | 'SINGLE_RF'
  | 'FLY_BALL_LF'
  | 'FLY_BALL_RF'
  | 'THROW_FIRST'
  | 'THROW_THIRD'
  | 'THROW_HOME'
  | 'NO_PLAY_RUNNERS_STOPPED'
  | 'GROUND_BALL_P'
  | 'GROUND_BALL_C'
  | 'GAP_LEFT'
  | 'GAP_RIGHT'
  | 'POPUP_SS'
  | 'DEEP_LF'
  | 'PASSED_BALL';

export type BallType = 'GROUND' | 'LINE' | 'FLY' | 'NONE';

export type AssignmentAction =
  | 'FIELD_BALL'
  | 'COVER_FIRST'
  | 'COVER_SECOND'
  | 'COVER_THIRD'
  | 'COVER_HOME'
  | 'BACKUP_FIRST'
  | 'BACKUP_SECOND'
  | 'BACKUP_THIRD'
  | 'BACKUP_HOME'
  | 'BACKUP_INFIELDER'
  | 'BACKUP_FIELDER'
  | 'BACKUP_PLAY'
  | 'CUTOFF'
  | 'RELAY'
  | 'READY'
  | 'HOLD_POSITION'
  | 'HOLD_BALL'
  | 'WATCH_RUNNER'
  | 'CHASE_BALL'; // only used in "what NOT to do" demos

export interface GameState {
  runners: RunnerBase[];
  outs: 0 | 1 | 2;
  /** Who has the ball when the play starts (used by NO_PLAY_RUNNERS_STOPPED). */
  ballHolder?: DefensivePosition;
}

export interface Coordinate {
  x: number;
  y: number;
}

export type Category = 'COVERAGE' | 'BACKUP' | 'OUTFIELD' | 'DECISION' | 'FORCE_TAG' | 'CALL_IT';
