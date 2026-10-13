import type { BaseName, RunnerBase, RunnerId } from './types';
import { RUNNER_START_BASE } from './types';

/** The coaching philosophy, shown throughout the app. */
export const PRINCIPLES = {
  mentalModel: 'BALL → BASE → BACKUP',
  oneKid: 'The ball only needs one player. The play needs all nine.',
  nextPlay: 'Know where the next play is — before the pitch.',
  coverBase: 'Cover your base.',
  backUp: 'Back up every throw.',
  getItIn: 'Get it in. Hit the cutoff.',
  shareSecond: 'SS and 2B share second base.',
  sideRule: 'Ball to the left side → 2B covers 2nd. Ball to the right side → SS covers 2nd.',
  closestSide: 'Get the lead runner if you can. If not, take the sure out at first.',
  pitcherFirst: 'Ball hit to the pitcher’s left? The pitcher ALWAYS breaks to first.',
  catcherFirst: 'Nobody on 2nd or 3rd? The catcher backs up first. Runner in scoring position? Catcher stays home.',
  overthrow: 'Overthrows are a LIVE ball — runners keep going. That’s why we back up every throw.',
  cutoffs: 'Throw to 2nd: SS (left) or 2B (right) cuts. Throw to 3rd: SS cuts. Throw home: 3B cuts from left, 1B from center & right.',
  pitcherBackup: "The pitcher doesn't watch the play. The pitcher backs up the base the throw is going to.",
  cfCaptain: 'Center fielder is the outfield captain — if he calls it, it’s his.',
  catcher: 'Catcher protects home and talks.',
  dontThrow: "Don't throw it just because you have it.",
  holdIt: 'No play? Run it in and HOLD THE BALL. ✋',
  extraBases: 'Backing up a throw prevents extra bases.',
  forceTag: 'Force = touch the base. Tag = tag the runner.',
} as const;

export const BALL_BASE_BACKUP = [
  { step: 'BALL', question: 'Where is the ball?' },
  { step: 'BASE', question: 'What base is mine?' },
  { step: 'BACKUP', question: 'Who am I backing up?' },
] as const;

/**
 * FORCE vs TAG
 *
 * A runner is FORCED to run when every base behind him is occupied
 * (the batter always forces the runner on first, and so on).
 *
 * `runner` is the runner we're asking about. `occupied` are the bases
 * that had runners when the ball was hit.
 */
export function isForced(runner: RunnerId, occupied: RunnerBase[]): boolean {
  const start = RUNNER_START_BASE[runner];
  if (start === 'HOME') return true; // batter must run to first
  const chain: BaseName[] = ['FIRST', 'SECOND', 'THIRD'];
  const idx = chain.indexOf(start);
  // All bases behind this runner must be occupied.
  for (let i = 0; i < idx; i++) {
    if (!occupied.includes(chain[i] as RunnerBase)) return false;
  }
  return true;
}

export type PlayType = 'FORCE' | 'TAG';

export const playTypeFor = (runner: RunnerId, occupied: RunnerBase[]): PlayType =>
  isForced(runner, occupied) ? 'FORCE' : 'TAG';

export const PLAY_TYPE_TEXT: Record<PlayType, { title: string; text: string }> = {
  FORCE: {
    title: 'FORCE PLAY',
    text: 'The runner HAS to run. Touch the base with the ball before he gets there!',
  },
  TAG: {
    title: 'TAG PLAY',
    text: "The runner doesn't have to go. You must TAG the runner!",
  },
};
