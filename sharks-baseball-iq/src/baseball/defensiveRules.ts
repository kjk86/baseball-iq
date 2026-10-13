import type { LocationKey } from './coordinates';
import type {
  AssignmentAction,
  BallEvent,
  BallType,
  DefensivePosition,
  RunnerBase,
} from './types';

/**
 * SHARKS 10U DEFENSIVE SYSTEM — traditional 9-player baseball
 *
 * One rule per BallEvent. Each rule says what every position does.
 * To change a responsibility, edit the line for that position — no
 * component or animation code needs to change.
 *
 * The big ones:
 *  • Ball hit to the pitcher's LEFT (1B side): pitcher breaks to cover 1st.
 *  • SS and 2B share 2nd: ball to the left side → 2B covers, right side → SS covers.
 *  • Nobody on 2nd or 3rd: the catcher runs down the line to back up 1st.
 *    Runner in scoring position: the catcher stays home.
 *  • Cutoffs: SS (left side) / 2B (right side) on throws to 2nd.
 *    SS on throws to 3rd. 3B cuts throws home from left, 1B from center/right.
 *  • Pitcher backs up the base the throw is going to (2nd, 3rd or home).
 *  • Center fielder is the outfield captain — his ball if he calls it.
 */

export interface RuleAssignment {
  action: AssignmentAction;
  /** Override the catalog's default destination. */
  destination?: LocationKey | 'BALL' | null;
  /** Kid-friendly "why" for this position in this play. */
  explanation: string;
  /** Flag for coach review. Shown in Debug mode. */
  todo?: string;
}

export type PositionRules = Record<DefensivePosition, RuleAssignment>;

export interface RuleVariant {
  /** Applies when ALL of these bases have a runner. */
  whenRunnersOn: RunnerBase[];
  note: string;
  assignments: Partial<PositionRules>;
}

export interface DefensiveRule {
  event: BallEvent;
  description: string;
  ballLocation: LocationKey | null;
  ballType: BallType;
  /** Who fields the ball (null = someone already has it). */
  primaryFielder: DefensivePosition | null;
  assignments: PositionRules;
  variants?: RuleVariant[];
  /**
   * "Closest player calls it and it's his ball."
   * The resolver gives FIELD_BALL to whichever of these starts closest to
   * the ball. The others keep their normal assignment (usually a backup).
   */
  closestOf?: DefensivePosition[];
  closestExplanation?: string;
}

const a = (
  action: AssignmentAction,
  explanation: string,
  extra: Partial<RuleAssignment> = {},
): RuleAssignment => ({ action, explanation, ...extra });


// Shared lines
const C_BACKS_UP_FIRST = a('BACKUP_FIRST', 'Nobody on 2nd or 3rd — run down the line and back up first!');
const C_STAY_HOME = a('COVER_HOME', 'Runner in scoring position — stay home and tell everyone where to throw!');
const P_STAY_READY = a(
  'HOLD_POSITION',
  "Ball's on the left side. Get off the mound, stay out of the throwing lane and be ready.",
);
const CF_BACKUP_SECOND = a('BACKUP_SECOND', 'Charge in behind second in case a throw gets away!', {
  destination: 'BACKUP_SECOND_CF',
});

/** Catcher stays home (and pitcher helps) once a runner is in scoring position. */
const scoringPosition = (pOn2nd?: RuleAssignment, pOn3rd?: RuleAssignment): RuleVariant[] => [
  {
    whenRunnersOn: ['SECOND'],
    note: 'Runner on second: catcher stays home.',
    assignments: { C: C_STAY_HOME, ...(pOn2nd ? { P: pOn2nd } : {}) },
  },
  {
    whenRunnersOn: ['THIRD'],
    note: 'Runner on third: catcher stays home.',
    assignments: { C: C_STAY_HOME, ...(pOn3rd ? { P: pOn3rd } : {}) },
  },
];

// ─────────────────────────────────────────────────────────────
// GROUND BALLS
// ─────────────────────────────────────────────────────────────

const GROUND_BALL_SS: DefensiveRule = {
  event: 'GROUND_BALL_SS',
  description: 'Ground ball to the shortstop',
  ballLocation: 'GROUNDER_SS',
  ballType: 'GROUND',
  primaryFielder: 'SS',
  assignments: {
    SS: a('FIELD_BALL', "It's hit to you! Field it, set your feet, and make a good throw."),
    '2B': a('COVER_SECOND', 'Ball is on the left side. You cover second!'),
    '1B': a('COVER_FIRST', 'Get to the bag and give a target!'),
    '3B': a('COVER_THIRD', 'Shortstop has it. Get back to third!'),
    LF: a('BACKUP_INFIELDER', 'Charge in behind the shortstop in case it gets through!', {
      destination: 'BACKUP_LEFT_SIDE',
    }),
    CF: CF_BACKUP_SECOND,
    RF: a('BACKUP_FIRST', 'Throw is going to first. Get behind first from the outfield side!', {
      destination: 'BACKUP_FIRST_DEEP',
    }),
    P: P_STAY_READY,
    C: C_BACKS_UP_FIRST,
  },
  variants: [
    {
      whenRunnersOn: ['FIRST'],
      note: 'Runner on first: 2B covers second for the force.',
      assignments: {
        '2B': a('COVER_SECOND', 'Runner on first! Get to second — the shortstop feeds you for the force.'),
      },
    },
    ...scoringPosition(
      a('BACKUP_THIRD', 'Runner on second might try for third. Back up third!'),
      a('BACKUP_HOME', 'Runner on third! Get behind home in case there is a throw there.'),
    ),
  ],
};

const GROUND_BALL_2B: DefensiveRule = {
  event: 'GROUND_BALL_2B',
  description: 'Ground ball to the second baseman',
  ballLocation: 'GROUNDER_2B',
  ballType: 'GROUND',
  primaryFielder: '2B',
  assignments: {
    '2B': a('FIELD_BALL', "It's hit to you! Field it and make the throw to first."),
    SS: a('COVER_SECOND', 'Ball is on the right side. You cover second!'),
    '1B': a('COVER_FIRST', 'Get to the bag and give a target!'),
    '3B': a('COVER_THIRD', 'Protect third base!'),
    P: a('BACKUP_PLAY', 'Ball hit to your left — break toward first! If 1B went for the ball, the bag is yours.', {
      destination: 'P_TOWARD_FIRST',
    }),
    RF: a('BACKUP_INFIELDER', 'Charge in behind the second baseman in case it gets through!', {
      destination: 'BACKUP_RIGHT_SIDE',
    }),
    CF: CF_BACKUP_SECOND,
    LF: a('BACKUP_THIRD', 'Ball is on the other side. Come in and back up third!'),
    C: C_BACKS_UP_FIRST,
  },
  variants: [
    {
      whenRunnersOn: ['FIRST'],
      note: 'Runner on first: SS covers second for the force.',
      assignments: {
        SS: a('COVER_SECOND', 'Runner on first! Second baseman has the ball — you cover second for the force.'),
      },
    },
    ...scoringPosition(),
  ],
};

const GROUND_BALL_3B: DefensiveRule = {
  event: 'GROUND_BALL_3B',
  description: 'Ground ball to the third baseman',
  ballLocation: 'GROUNDER_3B',
  ballType: 'GROUND',
  primaryFielder: '3B',
  assignments: {
    '3B': a('FIELD_BALL', "It's hit to you! Charge it, field it, and make a strong throw to first."),
    SS: a('BACKUP_INFIELDER', 'Cut behind the third baseman in case it gets past him!', {
      destination: 'BACKUP_3B_FIELDER',
    }),
    '2B': a('COVER_SECOND', 'Ball is on the left side. You cover second!'),
    '1B': a('COVER_FIRST', 'Long throw coming — get to the bag and stretch!'),
    LF: a('BACKUP_THIRD', 'Come in behind third in case it gets past!'),
    CF: CF_BACKUP_SECOND,
    RF: a('BACKUP_FIRST', 'Long throw coming to first! Get behind first!', { destination: 'BACKUP_FIRST_DEEP' }),
    P: P_STAY_READY,
    C: C_BACKS_UP_FIRST,
  },
  variants: [
    {
      whenRunnersOn: ['SECOND'],
      note: 'Runner on second: SS covers third because the third baseman left the bag.',
      assignments: {
        SS: a('COVER_THIRD', 'Third baseman left the bag and a runner could go to third. You cover third!'),
        C: C_STAY_HOME,
        P: a('BACKUP_THIRD', 'Runner on second might try for third. Back up third!'),
        LF: a('BACKUP_THIRD', 'Pitcher is behind third too — you stay deep behind him!', { destination: 'BACKUP_THIRD_DEEP' }),
      },
    },
    {
      whenRunnersOn: ['THIRD'],
      note: 'Runner on third: 3B looks the runner back, then throws to first. SS covers third.',
      assignments: {
        '3B': a('FIELD_BALL', 'Field it, LOOK the runner back to third, then throw to first!'),
        SS: a('COVER_THIRD', 'Third baseman left the bag. You cover third so the runner stays put!'),
        C: C_STAY_HOME,
        P: a('BACKUP_HOME', 'Runner on third! Get behind home in case there is a throw there.'),
      },
    },
  ],
};

const GROUND_BALL_1B: DefensiveRule = {
  event: 'GROUND_BALL_1B',
  description: 'Ground ball to the first baseman — near the bag',
  ballLocation: 'GROUNDER_1B_NEAR',
  ballType: 'GROUND',
  primaryFielder: '1B',
  assignments: {
    '1B': a('FIELD_BALL', "It's hit to you near the bag. Field it and step on first yourself!"),
    P: a('BACKUP_PLAY', 'Ball hit to your left — ALWAYS break toward first, just in case!', {
      destination: 'P_TOWARD_FIRST',
    }),
    '2B': a('BACKUP_INFIELDER', 'Get behind the first baseman in case it gets past him!', {
      destination: 'BACKUP_1B_FIELDER',
    }),
    SS: a('COVER_SECOND', 'Ball is on the right side. You cover second!'),
    '3B': a('COVER_THIRD', 'Protect third base!'),
    RF: a('BACKUP_FIRST', 'Charge in behind first in case it gets away!', { destination: 'BACKUP_FIRST_DEEP' }),
    CF: CF_BACKUP_SECOND,
    LF: a('BACKUP_THIRD', 'Ball is on the other side. Come in and back up third!'),
    C: C_BACKS_UP_FIRST,
  },
  variants: scoringPosition(),
};

const GROUND_BALL_1B_OFF_BAG: DefensiveRule = {
  ...GROUND_BALL_1B,
  event: 'GROUND_BALL_1B_OFF_BAG',
  description: 'Ground ball pulls the first baseman AWAY from the bag',
  ballLocation: 'GROUNDER_1B_AWAY',
  assignments: {
    ...GROUND_BALL_1B.assignments,
    '1B': a('FIELD_BALL', 'You had to leave the bag. Field it and give the pitcher an easy underhand toss at first!'),
    P: a('COVER_FIRST', 'Ball hit to your left — sprint to the line, run up it, and take the toss at first!'),
  },
};

// ─────────────────────────────────────────────────────────────
// OUTFIELD
// Bases empty → throw to 2nd. Runner on 1st → throw to 3rd.
// Runner on 2nd → throw home.
// ─────────────────────────────────────────────────────────────

const SINGLE_LF: DefensiveRule = {
  event: 'SINGLE_LF',
  description: 'Base hit to left field',
  ballLocation: 'LEFT_FIELD_BALL',
  ballType: 'LINE',
  primaryFielder: 'LF',
  assignments: {
    LF: a('FIELD_BALL', 'Charge the ball, field it, and throw to the cutoff!'),
    CF: a('BACKUP_FIELDER', 'Run behind the left fielder in case it gets past him!', { destination: 'BACKUP_LF' }),
    SS: a('CUTOFF', 'Go out toward left. Arms up! You are the cutoff, lined up to second.', {
      destination: 'SS_CUTOFF_LEFT',
    }),
    '3B': a('COVER_THIRD', 'Protect third base!'),
    '2B': a('COVER_SECOND', 'Shortstop went out for the cutoff. You cover second!'),
    '1B': a('COVER_FIRST', 'Make sure the runner touches first, then watch him — he might round too far!'),
    C: a('COVER_HOME', 'Protect home and tell everyone where to throw!'),
    P: a('BACKUP_SECOND', 'Throw is coming to second. Back up second from the infield side!', {
      destination: 'BACKUP_SECOND_INFIELD',
    }),
    RF: a('BACKUP_SECOND', 'Ball is on the far side. Come in behind second!', { destination: 'BACKUP_SECOND_RIGHT' }),
  },
  variants: [
    {
      whenRunnersOn: ['FIRST'],
      note: 'Runner on first may go to third: SS lines up to third, pitcher backs up third.',
      assignments: {
        SS: a('CUTOFF', 'Runner from first is going to third! Line up between the left fielder and third.', {
          destination: 'SS_CUTOFF_LEFT',
        }),
        P: a('BACKUP_THIRD', 'Throw might go to third. Get behind third!'),
      },
    },
    {
      whenRunnersOn: ['SECOND'],
      note: 'Runner on second may try to score: 3B is the cutoff to home, SS covers third, P backs up home.',
      assignments: {
        '3B': a('CUTOFF', 'Runner is trying to score! You are the cutoff for the throw home.', {
          destination: 'CUTOFF_HOME_LEFT',
        }),
        SS: a('COVER_THIRD', 'Third baseman went to be the cutoff. You cover third!'),
        P: a('BACKUP_HOME', 'Runner might go home! Get behind the catcher.'),
      },
    },
  ],
};

const SINGLE_RF: DefensiveRule = {
  event: 'SINGLE_RF',
  description: 'Base hit to right field',
  ballLocation: 'RIGHT_FIELD_BALL',
  ballType: 'LINE',
  primaryFielder: 'RF',
  assignments: {
    RF: a('FIELD_BALL', 'Charge the ball, field it, and throw to the cutoff!'),
    CF: a('BACKUP_FIELDER', 'Run behind the right fielder in case it gets past him!', { destination: 'BACKUP_RF' }),
    '2B': a('CUTOFF', 'Go out toward right. Arms up! You are the cutoff, lined up to second.', {
      destination: 'SECOND_BASE_CUTOFF_RIGHT',
    }),
    SS: a('COVER_SECOND', 'Second baseman went out for the cutoff. You cover second!'),
    '1B': a('COVER_FIRST', 'Make sure the runner touches first, then watch him — he might round too far!'),
    '3B': a('COVER_THIRD', 'Protect third base!'),
    C: a('COVER_HOME', 'Protect home and tell everyone where to throw!'),
    P: a('BACKUP_SECOND', 'Throw is coming to second. Back up second from the infield side!', {
      destination: 'BACKUP_SECOND_INFIELD',
    }),
    LF: a('BACKUP_SECOND', 'Ball is on the far side. Come in behind second!', { destination: 'BACKUP_SECOND_LEFT' }),
  },
  variants: [
    {
      whenRunnersOn: ['FIRST'],
      note: 'Runner on first may go to third: SS is the cutoff to third, 2B covers second, P and LF back up third.',
      assignments: {
        SS: a('CUTOFF', 'Runner from first is going to third. You are the cutoff — line up between RF and third!', {
          destination: 'SS_CUTOFF_THIRD',
        }),
        '2B': a('COVER_SECOND', 'Shortstop is the cutoff to third. You cover second!'),
        P: a('BACKUP_THIRD', 'Throw is going to third. Get behind third!'),
        LF: a('BACKUP_THIRD', 'Throw might come to third. Back it up — stay deep!', { destination: 'BACKUP_THIRD_DEEP' }),
      },
    },
    {
      whenRunnersOn: ['SECOND'],
      note: 'Runner on second may try to score: 1B is the cutoff to home, 2B covers first, P backs up home.',
      assignments: {
        '1B': a('CUTOFF', 'Runner is trying to score! You are the cutoff for the throw home.', {
          destination: 'CUTOFF_HOME_RIGHT',
        }),
        '2B': a('COVER_FIRST', 'First baseman went to be the cutoff. You cover first!'),
        SS: a('COVER_SECOND', 'You cover second!'),
        P: a('BACKUP_HOME', 'Runner might go home! Get behind the catcher.'),
        LF: a('BACKUP_THIRD', 'Ball is on the far side. Back up third — stay deep!', { destination: 'BACKUP_THIRD_DEEP' }),
      },
    },
  ],
};

const FLY_BALL_LF: DefensiveRule = {
  ...SINGLE_LF,
  event: 'FLY_BALL_LF',
  description: 'Fly ball to left field',
  ballLocation: 'FLY_LF',
  ballType: 'FLY',
  assignments: {
    ...SINGLE_LF.assignments,
    LF: a('FIELD_BALL', 'Call it! Catch it, then throw to the cutoff!'),
  },
};

const FLY_BALL_RF: DefensiveRule = {
  ...SINGLE_RF,
  event: 'FLY_BALL_RF',
  description: 'Fly ball to right field',
  ballLocation: 'FLY_RF',
  ballType: 'FLY',
  assignments: {
    ...SINGLE_RF.assignments,
    RF: a('FIELD_BALL', 'Call it! Catch it, then throw to the cutoff!'),
  },
};

// ─────────────────────────────────────────────────────────────
// THROWS (backup lessons)
// ─────────────────────────────────────────────────────────────

/** Grounder to SS, throw across to first. Catcher and RF back it up. */
const THROW_FIRST: DefensiveRule = {
  ...GROUND_BALL_SS,
  event: 'THROW_FIRST',
  description: 'Throw to first base',
  assignments: {
    ...GROUND_BALL_SS.assignments,
    C: a('BACKUP_FIRST', 'Throw is going to first. Catcher — sprint down the line and get behind first!'),
    RF: a('BACKUP_FIRST', 'Throw is going to first. Get behind first from the outfield side!', {
      destination: 'BACKUP_FIRST_DEEP',
    }),
  },
  variants: [],
};

/** Runner on second, grounder to SS, throw to third. LF backs it up. */
const THROW_THIRD: DefensiveRule = {
  ...GROUND_BALL_SS,
  event: 'THROW_THIRD',
  description: 'Throw to third base',
  assignments: {
    ...GROUND_BALL_SS.assignments,
    '3B': a('COVER_THIRD', 'Get to third and catch the throw!'),
    LF: a('BACKUP_THIRD', 'Throw is coming to third. Get behind third in case it gets away!'),
    C: C_STAY_HOME,
    P: a('BACKUP_HOME', 'If that throw gets away the runner heads home. Get behind the catcher!'),
  },
  variants: [],
};

/** Runner on second, hit to left, runner heading home. Pitcher backs up the catcher. */
const THROW_HOME: DefensiveRule = {
  ...SINGLE_LF,
  event: 'THROW_HOME',
  description: 'Throw to home plate',
  assignments: {
    ...SINGLE_LF.assignments,
    '3B': a('CUTOFF', 'Runner is trying to score! You are the cutoff for the throw home.', {
      destination: 'CUTOFF_HOME_LEFT',
    }),
    SS: a('COVER_THIRD', 'Third baseman went to be the cutoff. You cover third!'),
    C: a('COVER_HOME', 'Throw is coming home! Catch it and protect the plate!'),
    P: a('BACKUP_HOME', "Don't watch the play — get behind the catcher in case the throw gets past!"),
  },
  variants: [],
};

// ─────────────────────────────────────────────────────────────
// MORE INFIELD
// ─────────────────────────────────────────────────────────────

/** Comebacker to the pitcher. */
const GROUND_BALL_P: DefensiveRule = {
  event: 'GROUND_BALL_P',
  description: 'Ground ball back to the pitcher',
  ballLocation: 'GROUNDER_P',
  ballType: 'GROUND',
  primaryFielder: 'P',
  assignments: {
    P: a('FIELD_BALL', "It's hit to you! Field it, set your feet, and throw to first."),
    '1B': a('COVER_FIRST', 'Get to the bag and give a target!'),
    SS: a('COVER_SECOND', 'Ball is back to the pitcher. Shortstop takes second!'),
    '2B': a('BACKUP_INFIELDER', 'Shortstop has second. Slide behind the bag from your side in case it gets through!', {
      destination: 'BACKUP_RIGHT_SIDE',
    }),
    '3B': a('COVER_THIRD', 'Protect third base!'),
    C: C_BACKS_UP_FIRST,
    RF: a('BACKUP_FIRST', 'Throw is coming to first. Get behind first!', { destination: 'BACKUP_FIRST_DEEP' }),
    LF: a('BACKUP_THIRD', 'Come in and back up third — always be moving!'),
    CF: CF_BACKUP_SECOND,
  },
  variants: scoringPosition(),
};

/** Slow roller in front of home plate. Catcher fields it; pitcher covers home. */
const GROUND_BALL_C: DefensiveRule = {
  event: 'GROUND_BALL_C',
  description: 'Slow roller in front of home plate',
  ballLocation: 'DRIBBLER_C',
  ballType: 'GROUND',
  primaryFielder: 'C',
  assignments: {
    C: a('FIELD_BALL', "It's in front of the plate — it's yours! Pounce on it and throw to first."),
    P: a('COVER_HOME', 'Catcher left home. Pitcher — cover home!'),
    '1B': a('COVER_FIRST', 'Get to the bag and give the catcher an inside target!'),
    '2B': a('BACKUP_INFIELDER', 'Get behind first in case the throw gets away!', {
      destination: 'BACKUP_1B_FIELDER',
    }),
    SS: a('COVER_SECOND', 'Ball is on the right side. You cover second!'),
    '3B': a('COVER_THIRD', 'Protect third base!'),
    RF: a('BACKUP_FIRST', 'Throw is coming to first. Get behind first!', { destination: 'BACKUP_FIRST_DEEP' }),
    LF: a('BACKUP_THIRD', 'Come in and back up third — always be moving!'),
    CF: CF_BACKUP_SECOND,
  },
};

/** Infield pop-up. Infielders have priority over the pitcher and catcher. */
const POPUP_SS: DefensiveRule = {
  event: 'POPUP_SS',
  description: 'Pop-up on the left side of the infield',
  ballLocation: 'POPUP_SS_SPOT',
  ballType: 'FLY',
  primaryFielder: 'SS',
  closestOf: ['SS', '3B'],
  closestExplanation: 'You\'re closest — yell "I GOT IT! I GOT IT!" and catch it.',
  assignments: {
    SS: a('COVER_SECOND', 'Someone closer called it. Back away and cover second.'),
    '3B': a('COVER_THIRD', 'Someone closer called it. Back away and cover third!'),
    P: a('HOLD_POSITION', 'Infielders take pop-ups. Point at the ball and yell the name of who has it!'),
    '2B': a('COVER_SECOND', 'Pop-up on the other side. You cover second!'),
    '1B': a('COVER_FIRST', 'Stay at first.'),
    C: a('COVER_HOME', 'Protect home!'),
    LF: a('BACKUP_INFIELDER', 'Come in behind the shortstop in case he drops it!', { destination: 'BACKUP_LEFT_SIDE' }),
    CF: CF_BACKUP_SECOND,
    RF: a('BACKUP_FIRST', 'Get behind first — always be moving!', { destination: 'BACKUP_FIRST_DEEP' }),
  },
};

// ─────────────────────────────────────────────────────────────
// MORE OUTFIELD
// ─────────────────────────────────────────────────────────────

/** Ball in the left-center gap. Center fielder is the captain. */
const GAP_LEFT: DefensiveRule = {
  event: 'GAP_LEFT',
  description: 'Ball in the gap between LF and CF',
  ballLocation: 'GAP_LEFT_BALL',
  ballType: 'LINE',
  primaryFielder: 'CF',
  closestOf: ['LF', 'CF'],
  closestExplanation: 'Your ball — call it LOUD: "I GOT IT!" Then hit the cutoff.',
  assignments: {
    LF: a('BACKUP_FIELDER', 'Center fielder called it! Get behind him in case it gets past.', { destination: 'BACKUP_GAP_LEFT' }),
    CF: a('BACKUP_FIELDER', 'Left fielder called it! Get behind him in case it gets past.', { destination: 'BACKUP_GAP_LEFT' }),
    SS: a('CUTOFF', 'Go out toward the ball. Arms up! You are the cutoff.', { destination: 'SS_CUTOFF_LEFT' }),
    '2B': a('COVER_SECOND', 'Shortstop went out for the cutoff. You cover second!'),
    '3B': a('COVER_THIRD', 'Protect third base!'),
    '1B': a('COVER_FIRST', 'Make sure the runner touches first, then watch him!'),
    C: a('COVER_HOME', 'Protect home and tell everyone where to throw!'),
    P: a('BACKUP_SECOND', 'Throw is coming to second. Back up second from the infield side!', {
      destination: 'BACKUP_SECOND_INFIELD',
    }),
    RF: a('BACKUP_SECOND', 'Ball is on the other side. Come in behind second!', { destination: 'BACKUP_SECOND_RIGHT' }),
  },
};

/** Ball in the right-center gap. Center fielder is the captain. */
const GAP_RIGHT: DefensiveRule = {
  event: 'GAP_RIGHT',
  description: 'Ball in the gap between CF and RF',
  ballLocation: 'GAP_RIGHT_BALL',
  ballType: 'LINE',
  primaryFielder: 'CF',
  closestOf: ['CF', 'RF'],
  closestExplanation: 'Your ball — call it LOUD: "I GOT IT!" Then hit the cutoff.',
  assignments: {
    CF: a('BACKUP_FIELDER', 'Right fielder called it! Get behind him in case it gets past.', { destination: 'BACKUP_GAP_RIGHT' }),
    RF: a('BACKUP_FIELDER', 'Center fielder called it! Get behind him in case it gets past.', { destination: 'BACKUP_GAP_RIGHT' }),
    '2B': a('CUTOFF', 'Go out toward the ball. Arms up! You are the cutoff.', { destination: 'SECOND_BASE_CUTOFF_RIGHT' }),
    SS: a('COVER_SECOND', 'Second baseman went out for the cutoff. You cover second!'),
    '1B': a('COVER_FIRST', 'Make sure the runner touches first, then watch him!'),
    '3B': a('COVER_THIRD', 'Protect third base!'),
    C: a('COVER_HOME', 'Protect home and tell everyone where to throw!'),
    P: a('BACKUP_SECOND', 'Throw is coming to second. Back up second from the infield side!', {
      destination: 'BACKUP_SECOND_INFIELD',
    }),
    LF: a('BACKUP_SECOND', 'Ball is on the other side. Come in behind second!', { destination: 'BACKUP_SECOND_LEFT' }),
  },
};

/** Ball hit over the left fielder's head. Relay goes out deeper. */
const DEEP_LF: DefensiveRule = {
  ...SINGLE_LF,
  event: 'DEEP_LF',
  description: "Ball hit over the left fielder's head",
  ballLocation: 'OVER_LF',
  assignments: {
    ...SINGLE_LF.assignments,
    LF: a('FIELD_BALL', 'Turn and run! Get the ball and hit the relay man.'),
    CF: a('BACKUP_FIELDER', 'Sprint over and help the left fielder!', { destination: 'BACKUP_DEEP_LF' }),
    SS: a('RELAY', 'Ball is deep! Go out farther. Arms up — you are the relay.', { destination: 'SS_RELAY_DEEP' }),
    P: a('BACKUP_THIRD', 'Ball is deep — the runner might go for third. Back up third!'),
  },
  variants: [],
};

// ─────────────────────────────────────────────────────────────
// BATTERY
// ─────────────────────────────────────────────────────────────

/** Pitch gets by the catcher with a runner on third. Pitcher covers home. */
const PASSED_BALL: DefensiveRule = {
  event: 'PASSED_BALL',
  description: 'Pitch gets past the catcher',
  ballLocation: 'PASSED_BALL_SPOT',
  ballType: 'GROUND',
  primaryFielder: 'C',
  assignments: {
    C: a('FIELD_BALL', 'Ball got by you! Spin, find it fast, and flip it to the pitcher at the plate.'),
    P: a('COVER_HOME', 'Ball got past the catcher — sprint in and cover home! Point and yell where the ball is.'),
    '1B': a('COVER_FIRST', 'Stay on your base.'),
    '2B': a('HOLD_POSITION', 'Stay ready.'),
    SS: a('HOLD_POSITION', 'Stay ready.'),
    '3B': a('COVER_THIRD', 'Get back to third in case the runner has to go back!'),
    LF: a('HOLD_POSITION', 'Stay ready.'),
    CF: a('HOLD_POSITION', 'Stay ready.'),
    RF: a('HOLD_POSITION', 'Stay ready.'),
  },
};

// ─────────────────────────────────────────────────────────────
// DECISIONS
// ─────────────────────────────────────────────────────────────

/**
 * Runners have stopped, someone has the ball, no realistic out.
 * The ball holder HOLDS THE BALL (and runs it in to the infield).
 * (The resolver assigns HOLD_BALL to whoever `gameState.ballHolder` is.)
 */
const NO_PLAY_RUNNERS_STOPPED: DefensiveRule = {
  event: 'NO_PLAY_RUNNERS_STOPPED',
  description: 'Runners stopped — no play',
  ballLocation: null,
  ballType: 'NONE',
  primaryFielder: null,
  assignments: {
    C: a('COVER_HOME', 'Stay at home.'),
    P: a('HOLD_POSITION', 'Stay ready.'),
    '1B': a('HOLD_POSITION', 'Stay at your base.'),
    '2B': a('HOLD_POSITION', 'Stay at your base.'),
    SS: a('HOLD_POSITION', 'Stay ready.'),
    '3B': a('HOLD_POSITION', 'Stay at your base.'),
    LF: a('HOLD_POSITION', 'Stay ready.'),
    CF: a('HOLD_POSITION', 'Stay ready.'),
    RF: a('HOLD_POSITION', 'Stay ready.'),
  },
};

export const HOLD_BALL_RULE: RuleAssignment = a(
  'HOLD_BALL',
  'There is no play. An unnecessary throw can give the runner another base. Run it in and HOLD IT!',
);

export const DEFENSIVE_RULES: Record<BallEvent, DefensiveRule> = {
  GROUND_BALL_SS,
  GROUND_BALL_2B,
  GROUND_BALL_3B,
  GROUND_BALL_1B,
  GROUND_BALL_1B_OFF_BAG,
  SINGLE_LF,
  SINGLE_RF,
  FLY_BALL_LF,
  FLY_BALL_RF,
  THROW_FIRST,
  THROW_THIRD,
  THROW_HOME,
  NO_PLAY_RUNNERS_STOPPED,
  GROUND_BALL_P,
  GROUND_BALL_C,
  POPUP_SS,
  GAP_LEFT,
  GAP_RIGHT,
  DEEP_LF,
  PASSED_BALL,
};
