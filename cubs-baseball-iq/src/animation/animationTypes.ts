import type { LocationKey } from '../baseball/coordinates';
import type { Coordinate, DefensivePosition, RunnerId } from '../baseball/types';

export type Ease = 'linear' | 'out' | 'inOut';

export interface Keyframe extends Coordinate {
  t: number;
  /** Peak height of the arc for the segment that ENDS at this key (fly balls / throws). */
  h?: number;
  ease?: Ease;
}

export interface Track {
  keys: Keyframe[];
}

export type PauseKind = 'FREEZE' | 'HIGHLIGHT' | 'DECISION';

export interface Pause {
  id: number;
  t: number;
  kind: PauseKind;
  title?: string;
  text?: string;
  tone?: 'force' | 'tag' | 'info';
}

export interface Caption {
  t: number;
  until: number;
  text: string;
}

export interface Highlight {
  t: number;
  location: LocationKey;
  title: string;
  tone: 'force' | 'tag' | 'info';
}

export interface Trail {
  position: DefensivePosition;
  from: Coordinate;
  to: Coordinate;
  t0: number;
  t1: number;
  bad?: boolean;
}

export interface PhaseMarker {
  t: number;
  end: number;
  kind: string;
  index: number;
}

export interface Timeline {
  duration: number;
  players: Record<DefensivePosition, Track>;
  ball: Track;
  runners: Partial<Record<RunnerId, Track>>;
  runnerOuts: Partial<Record<RunnerId, number>>;
  pauses: Pause[];
  captions: Caption[];
  highlights: Highlight[];
  trails: Trail[];
  phases: PhaseMarker[];
  /** When each position reaches its destination. */
  arrivals: Record<DefensivePosition, number>;
  pitchEnd: number;
  hitEnd: number;
  /** When the rest of the defense starts moving. */
  reactStart: number;
  decisionTime?: number;
  /** When the fielder first throws / carries / decides (the "now what?" moment). */
  firstPlay?: number;
}

export interface RunnerFrame extends Coordinate {
  id: RunnerId;
  out: boolean;
  opacity: number;
}

export interface Frame {
  t: number;
  players: Record<DefensivePosition, Coordinate>;
  ball: Coordinate & { h: number };
  runners: RunnerFrame[];
  phase: string;
  caption: string | null;
  highlights: Highlight[];
  trails: (Trail & { opacity: number; progress: number })[];
}
