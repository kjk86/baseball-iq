import type { LocationKey } from './coordinates';
import type { AssignmentAction } from './types';

/**
 * ASSIGNMENT CATALOG
 *
 * Every reusable defensive assignment. A rule in defensiveRules.ts picks an
 * action for each position; this catalog supplies the default destination,
 * labels, kid-friendly text, and animation timing.
 */

export type Concept =
  | 'FIELDING_YOUR_BALL'
  | 'COVERING_FIRST'
  | 'COVERING_SECOND'
  | 'COVERING_THIRD'
  | 'PROTECTING_HOME'
  | 'BACKING_UP_FIRST'
  | 'BACKING_UP_SECOND'
  | 'BACKING_UP_THIRD'
  | 'BACKING_UP_HOME'
  | 'BACKING_UP_INFIELDERS'
  | 'BACKING_UP_OUTFIELDERS'
  | 'PITCHER_BACKUP'
  | 'CUTOFF_AND_RELAY'
  | 'BE_READY'
  | 'HOLD_THE_BALL'
  | 'FORCE_VS_TAG'
  | 'DONT_CHASE'
  | 'CALL_IT';

export const CONCEPT_LABELS: Record<Concept, string> = {
  FIELDING_YOUR_BALL: 'Fielding your ball',
  COVERING_FIRST: 'Covering first',
  COVERING_SECOND: 'Covering second',
  COVERING_THIRD: 'Covering third',
  PROTECTING_HOME: 'Protecting home',
  BACKING_UP_FIRST: 'Backing up first',
  BACKING_UP_SECOND: 'Backing up second',
  BACKING_UP_THIRD: 'Backing up third',
  BACKING_UP_HOME: 'Backing up home',
  BACKING_UP_INFIELDERS: 'Backing up infielders',
  BACKING_UP_OUTFIELDERS: 'Backing up outfielders',
  PITCHER_BACKUP: 'Pitcher backup',
  CUTOFF_AND_RELAY: 'Cutoff & relay',
  BE_READY: 'Be ready',
  HOLD_THE_BALL: 'Hold the ball',
  FORCE_VS_TAG: 'Force vs tag',
  DONT_CHASE: "Don't chase the ball",
  CALL_IT: 'Calling the ball',
};

export interface AssignmentDefinition {
  action: AssignmentAction;
  /** Default destination. `null` = stay where you are. `'BALL'` = go to the ball. */
  destination: LocationKey | 'BALL' | null;
  /** Short label for the field / responsibility list. */
  label: string;
  /** Celebration text for a correct quiz answer: "YES! COVER SECOND!" */
  cheer: string;
  /** Default kid-friendly explanation (rules usually override with something specific). */
  explanation: string;
  /** Encouraging hint after a wrong quiz answer. */
  hint: string;
  concept: Concept;
  /** Animation timing: seconds to wait after the defense starts reacting. */
  reactionDelay: number;
}

const def = (d: AssignmentDefinition) => d;

export const ASSIGNMENTS: Record<AssignmentAction, AssignmentDefinition> = {
  FIELD_BALL: def({
    action: 'FIELD_BALL',
    destination: 'BALL',
    label: 'Field ball',
    cheer: 'GET THE BALL!',
    explanation: "It's hit to you! Get in front of it and field it.",
    hint: 'Who is closest to the ball?',
    concept: 'FIELDING_YOUR_BALL',
    reactionDelay: 0,
  }),
  COVER_FIRST: def({
    action: 'COVER_FIRST',
    destination: 'COVER_FIRST_SPOT',
    label: 'Cover 1st',
    cheer: 'COVER FIRST!',
    explanation: 'Get to first base and catch the throw!',
    hint: 'Think about which base needs you.',
    concept: 'COVERING_FIRST',
    reactionDelay: 0,
  }),
  COVER_SECOND: def({
    action: 'COVER_SECOND',
    destination: 'COVER_SECOND_SPOT',
    label: 'Cover 2nd',
    cheer: 'COVER SECOND!',
    explanation: 'Get to second base!',
    hint: 'Think about which base needs you.',
    concept: 'COVERING_SECOND',
    reactionDelay: 0,
  }),
  COVER_THIRD: def({
    action: 'COVER_THIRD',
    destination: 'COVER_THIRD_SPOT',
    label: 'Cover 3rd',
    cheer: 'COVER THIRD!',
    explanation: 'Protect third base!',
    hint: 'Think about which base needs you.',
    concept: 'COVERING_THIRD',
    reactionDelay: 0,
  }),
  COVER_HOME: def({
    action: 'COVER_HOME',
    destination: 'COVER_HOME_SPOT',
    label: 'Cover home',
    cheer: 'PROTECT HOME!',
    explanation: 'Stay at home plate and tell everyone where to throw!',
    hint: 'Which base is YOUR base?',
    concept: 'PROTECTING_HOME',
    reactionDelay: 0,
  }),
  BACKUP_FIRST: def({
    action: 'BACKUP_FIRST',
    destination: 'BACKUP_FIRST',
    label: 'Back up 1st',
    cheer: 'BACK UP FIRST!',
    explanation: 'Get behind first in case the throw gets away!',
    hint: 'Where could the ball get away?',
    concept: 'BACKING_UP_FIRST',
    reactionDelay: 0.1,
  }),
  BACKUP_SECOND: def({
    action: 'BACKUP_SECOND',
    destination: 'BACKUP_SECOND_LEFT',
    label: 'Back up 2nd',
    cheer: 'BACK UP SECOND!',
    explanation: 'Get behind second in case the throw gets away!',
    hint: 'Where could the ball get away?',
    concept: 'BACKING_UP_SECOND',
    reactionDelay: 0.1,
  }),
  BACKUP_THIRD: def({
    action: 'BACKUP_THIRD',
    destination: 'BACKUP_THIRD',
    label: 'Back up 3rd',
    cheer: 'BACK UP THIRD!',
    explanation: 'Get behind third in case the throw gets away!',
    hint: 'Where could the ball get away?',
    concept: 'BACKING_UP_THIRD',
    reactionDelay: 0.1,
  }),
  BACKUP_HOME: def({
    action: 'BACKUP_HOME',
    destination: 'BACKUP_HOME',
    label: 'Back up home',
    cheer: 'BACK UP HOME!',
    explanation: "Get behind the catcher in case the throw gets past!",
    hint: 'Where could the ball get away?',
    concept: 'BACKING_UP_HOME',
    reactionDelay: 0.1,
  }),
  BACKUP_INFIELDER: def({
    action: 'BACKUP_INFIELDER',
    destination: 'BACKUP_LEFT_SIDE',
    label: 'Back up infielder',
    cheer: 'BACK HIM UP!',
    explanation: 'Come in behind the infielder in case the ball gets through!',
    hint: 'What if the ball gets past the infielder?',
    concept: 'BACKING_UP_INFIELDERS',
    reactionDelay: 0.1,
  }),
  BACKUP_FIELDER: def({
    action: 'BACKUP_FIELDER',
    destination: 'BACKUP_LF',
    label: 'Back up fielder',
    cheer: 'BACK HIM UP!',
    explanation: 'Run behind your teammate in case the ball gets past him!',
    hint: 'What if the ball gets past your teammate?',
    concept: 'BACKING_UP_OUTFIELDERS',
    reactionDelay: 0.1,
  }),
  BACKUP_PLAY: def({
    action: 'BACKUP_PLAY',
    destination: 'P_TOWARD_FIRST',
    label: 'Back up play',
    cheer: 'MOVE TO HELP!',
    explanation: "Don't stand on the mound. Move to help!",
    hint: 'Pitchers never just watch. Where can you help?',
    concept: 'PITCHER_BACKUP',
    reactionDelay: 0.1,
  }),
  CUTOFF: def({
    action: 'CUTOFF',
    destination: 'SS_CUTOFF_LEFT',
    label: 'Cutoff',
    cheer: 'BE THE CUTOFF!',
    explanation: 'Go out toward the ball. Arms up! Be the target.',
    hint: 'Who does the outfielder throw to?',
    concept: 'CUTOFF_AND_RELAY',
    reactionDelay: 0,
  }),
  RELAY: def({
    action: 'RELAY',
    destination: 'SS_CUTOFF_LEFT',
    label: 'Relay',
    cheer: 'RELAY IT!',
    explanation: 'Catch it and throw it in!',
    hint: 'Who does the outfielder throw to?',
    concept: 'CUTOFF_AND_RELAY',
    reactionDelay: 0,
  }),
  READY: def({
    action: 'READY',
    destination: null,
    label: 'Be ready',
    cheer: 'BE READY!',
    explanation: 'Come in a few steps and be ready to help.',
    hint: 'Is the ball near you? Get ready, but don’t chase.',
    concept: 'BE_READY',
    reactionDelay: 0.2,
  }),
  HOLD_POSITION: def({
    action: 'HOLD_POSITION',
    destination: null,
    label: 'Stay ready',
    cheer: 'STAY READY!',
    explanation: 'Stay where you are and be ready.',
    hint: 'Do you need to go anywhere?',
    concept: 'BE_READY',
    reactionDelay: 0,
  }),
  HOLD_BALL: def({
    action: 'HOLD_BALL',
    destination: null,
    label: 'HOLD the ball ✋',
    cheer: 'HOLD THE BALL!',
    explanation: 'There is no play. Hold the ball and keep the runner there!',
    hint: 'Is there really a play?',
    concept: 'HOLD_THE_BALL',
    reactionDelay: 0,
  }),
  WATCH_RUNNER: def({
    action: 'WATCH_RUNNER',
    destination: null,
    label: 'Watch runner',
    cheer: 'WATCH THE RUNNER!',
    explanation: 'Keep your eyes on the runner.',
    hint: 'Where is the runner going?',
    concept: 'BE_READY',
    reactionDelay: 0,
  }),
  CHASE_BALL: def({
    action: 'CHASE_BALL',
    destination: 'BALL',
    label: 'Chasing ball ✗',
    cheer: '',
    explanation: "Uh oh — chasing the ball leaves your base empty!",
    hint: '',
    concept: 'DONT_CHASE',
    reactionDelay: 0,
  }),
};
