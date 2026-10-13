/**
 * LESSONS — each is an ordered list of scenario ids (see scenarios.ts).
 * To create a lesson: add an entry here. It appears on the home screen automatically.
 */
export interface Lesson {
  id: string;
  number: number;
  title: string;
  emoji: string;
  tagline: string;
  focus: string[];
  scenarioIds: string[];
}

export const LESSONS: Lesson[] = [
  {
    id: 'cover-your-base',
    number: 1,
    title: 'Cover Your Base',
    emoji: '🧱',
    tagline: 'Ball to short — I cover second.',
    focus: ['SS & 2B share second', 'Pitcher covers first', 'Covering third', 'Protecting home'],
    scenarioIds: ['gb-ss-r1', 'gb-2b-r1', 'gb-3b-r2', 'gb-1b-off', 'no-chase-ss'],
  },
  {
    id: 'back-it-up',
    number: 2,
    title: 'Back It Up',
    emoji: '🛡️',
    tagline: 'Throw to first — I back it up.',
    focus: ['Catcher & RF back up first', 'LF backs up third', 'P backs up home', 'OF backs up OF'],
    scenarioIds: ['backup-first', 'backup-third', 'backup-home', 'single-lf-r1'],
  },
  {
    id: 'get-it-in',
    number: 3,
    title: 'Get It In',
    emoji: '🎯',
    tagline: 'Know who the cutoff is — and hit him.',
    focus: ['Who is the cutoff?', 'Throws to 2nd, 3rd and home', 'Relays', 'No huge throws'],
    scenarioIds: ['single-rf-r1', 'single-lf-r2', 'deep-lf', 'no-chase-lf', 'bases-loaded-fly-lf'],
  },
  {
    id: 'hold-the-ball',
    number: 4,
    title: 'Hold the Ball',
    emoji: '✋',
    tagline: "There's no play — HOLD IT.",
    focus: ['Is there a play?', 'Stop the runners', 'No extra throws', 'No free bases'],
    scenarioIds: ['hold-no-play', 'hold-after-mistake', 'hold-cutoff'],
  },
  {
    id: 'force-or-tag',
    number: 5,
    title: 'Force or Tag?',
    emoji: '🤔',
    tagline: 'Touch the base or tag the runner?',
    focus: ['Force plays', 'Tag plays'],
    scenarioIds: ['force-first', 'force-second', 'tag-third', 'force-third'],
  },
  {
    id: 'call-it',
    number: 6,
    title: 'Call It!',
    emoji: '📣',
    tagline: '"I GOT IT!" — CF is the captain.',
    focus: ['CF is the outfield captain', 'Back up the player who called it', 'Infielders take pop-ups'],
    scenarioIds: ['gap-left', 'gap-right', 'popup'],
  },
  {
    id: 'runner-on-third',
    number: 7,
    title: 'Runner on Third',
    emoji: '🏠',
    tagline: 'Look him back — then get the out.',
    focus: ['Look the runner back', 'Take the sure out at first', 'Passed ball: pitcher covers home'],
    scenarioIds: ['r3-gb-3b', 'r3-gb-2b', 'passed-ball-r3'],
  },
  {
    id: 'hit-to-me',
    number: 8,
    title: "It's Hit to Me!",
    emoji: '🧤',
    tagline: 'Pitcher, catcher, corners — know your play.',
    focus: ['Comebacker to the pitcher', 'Catcher on a slow roller', 'Grounders to 3B and 1B'],
    scenarioIds: ['gb-p', 'gb-c', 'gb-3b', 'gb-1b-near'],
  },
  {
    id: 'pitcher-never-watches',
    number: 9,
    title: 'Pitcher Never Watches',
    emoji: '⚾',
    tagline: 'Ball to my left — I break to first.',
    focus: ['Cover first', 'Back up 2nd, 3rd or home', 'Cover home on a passed ball'],
    scenarioIds: ['gb-1b-off', 'gb-2b-empty', 'single-lf-empty', 'single-rf-r1', 'backup-home', 'passed-ball-r3'],
  },
];

export const lessonById = (id: string) => LESSONS.find((l) => l.id === id);
