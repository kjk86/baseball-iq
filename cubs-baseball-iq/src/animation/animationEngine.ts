import {
  BASE_ORDER,
  LOCATIONS,
  PITCH_RELEASE,
  RUNNER_BASE_SPOTS,
  START_POSITIONS,
  coord,
  distance,
} from '../baseball/coordinates';
import { resolveScenario, type ResolvedPlay } from '../baseball/scenarioResolver';
import { isForced } from '../baseball/teachingRules';
import type { RunnerMove, Scenario, ScenarioPhase } from '../baseball/scenarioTypes';
import {
  DEFENSIVE_POSITIONS,
  RUNNER_START_BASE,
  runnerIdForBase,
  type BaseName,
  type Coordinate,
  type DefensivePosition,
  type RunnerId,
} from '../baseball/types';
import type {
  Caption,
  Ease,
  Frame,
  Highlight,
  Keyframe,
  Pause,
  PhaseMarker,
  Timeline,
  Track,
  Trail,
} from './animationTypes';

/**
 * ANIMATION ENGINE
 *
 * Turns (resolved assignments + scenario phases) into a Timeline of keyframes,
 * then samples that Timeline at any time `t`. It never decides WHY anyone
 * moves — destinations come straight from the rule engine.
 */

// Speeds in field-units per second. Deliberately slow so kids can follow.
export const SPEED = {
  player: 8,
  runner: 4.6,
  ground: 15,
  line: 20,
  throw: 24,
  roll: 11,
};

// ───────────────────────── track helpers ─────────────────────────

const easeFn = (e: Ease | undefined, u: number) => {
  if (e === 'out') return 1 - (1 - u) * (1 - u);
  if (e === 'inOut') return u * u * (3 - 2 * u);
  return u;
};

export function sampleTrack(track: Track, t: number): Coordinate & { h: number } {
  const k = track.keys;
  if (t <= k[0].t) return { x: k[0].x, y: k[0].y, h: 0 };
  for (let i = 1; i < k.length; i++) {
    if (t < k[i].t) {
      const a = k[i - 1];
      const b = k[i];
      const span = b.t - a.t;
      const u = span > 0 ? (t - a.t) / span : 1;
      const e = easeFn(b.ease, u);
      return {
        x: a.x + (b.x - a.x) * e,
        y: a.y + (b.y - a.y) * e,
        h: b.h ? 4 * b.h * u * (1 - u) : 0,
      };
    }
  }
  const last = k[k.length - 1];
  return { x: last.x, y: last.y, h: 0 };
}

const lastKey = (tr: Track) => tr.keys[tr.keys.length - 1];

/** Append a move. Starts no earlier than the track's last key. Returns arrival time. */
function moveTo(
  tr: Track,
  t0: number,
  to: Coordinate,
  duration: number,
  opts: { h?: number; ease?: Ease } = {},
): number {
  const last = lastKey(tr);
  const start = Math.max(t0, last.t);
  if (start > last.t) tr.keys.push({ t: start, x: last.x, y: last.y });
  const k: Keyframe = { t: start + duration, x: to.x, y: to.y, ease: opts.ease ?? 'inOut' };
  if (opts.h) k.h = opts.h;
  tr.keys.push(k);
  return start + duration;
}

const trackEnd = (tr: Track) => lastKey(tr).t;
const endPos = (tr: Track): Coordinate => ({ x: lastKey(tr).x, y: lastKey(tr).y });

// Chasers are spread around the ball so their markers don't stack exactly.
const CHASE_OFFSETS: Coordinate[] = [
  { x: 3, y: 2 },
  { x: -3, y: 2 },
  { x: 0, y: 4 },
  { x: 3.5, y: -1.5 },
  { x: -3.5, y: -1.5 },
];

// ───────────────────────── build ─────────────────────────

export type DemoVariant = 'main' | 'alternate' | 'wrong';

export interface BuiltScenario {
  resolved: ResolvedPlay;
  timeline: Timeline;
  variant: DemoVariant;
}

export function buildScenario(
  scenario: Scenario,
  variant: DemoVariant = 'main',
  opts: { thinkBeforePlay?: number } = {},
): BuiltScenario {
  let overrides = scenario.overrides;
  let phases = scenario.phases;
  if (variant === 'alternate' && scenario.alternate) {
    overrides = { ...overrides, ...scenario.alternate.overrides };
    phases = scenario.alternate.phases;
  }
  if (variant === 'wrong' && scenario.decision) {
    const i = phases.findIndex((p) => p.kind === 'DECISION');
    phases = [...phases.slice(0, i + 1), ...scenario.decision.wrongPhases];
  }
  // "Now what?" quizzes: give the defense a beat to get into place before the fielder throws.
  if (opts.thinkBeforePlay) {
    const hitIdx = phases.findIndex((p) => p.kind === 'HIT');
    const i = phases.findIndex(
      (p, k) => k > hitIdx && ['THROW', 'OVERTHROW', 'CARRY', 'WILD_THROW'].includes(p.kind),
    );
    if (i > 0) {
      phases = [...phases.slice(0, i), { kind: 'WAIT', seconds: opts.thinkBeforePlay }, ...phases.slice(i)];
    }
  }
  const resolved = resolveScenario({
    event: scenario.event,
    ...scenario.gameState,
    overrides,
  });
  return { resolved, timeline: buildTimeline(resolved, phases), variant };
}

/** Where a position ends up given its resolved assignment. */
export function destinationFor(
  resolved: ResolvedPlay,
  pos: DefensivePosition,
  chaseIndex = 0,
): Coordinate {
  const a = resolved.assignments[pos];
  if (a.destination === null) return START_POSITIONS[pos];
  if (a.destination === 'BALL') {
    const ball = resolved.ballLocation ? coord(resolved.ballLocation) : START_POSITIONS[pos];
    if (a.action === 'CHASE_BALL') {
      const o = CHASE_OFFSETS[chaseIndex % CHASE_OFFSETS.length];
      return { x: ball.x + o.x, y: ball.y + o.y };
    }
    return ball;
  }
  return coord(a.destination);
}

export function buildTimeline(resolved: ResolvedPlay, phases: ScenarioPhase[]): Timeline {
  const players = {} as Record<DefensivePosition, Track>;
  const arrivals = {} as Record<DefensivePosition, number>;
  for (const pos of DEFENSIVE_POSITIONS) {
    players[pos] = { keys: [{ t: 0, ...START_POSITIONS[pos] }] };
    arrivals[pos] = 0;
  }

  // Runners: batter + anyone on base.
  const runners: Partial<Record<RunnerId, Track>> = {};
  const runnerAt: Partial<Record<RunnerId, BaseName>> = {};
  const runnerIds: RunnerId[] = ['BATTER', ...resolved.gameState.runners.map(runnerIdForBase)];
  for (const id of runnerIds) {
    const base = RUNNER_START_BASE[id];
    runners[id] = { keys: [{ t: 0, ...RUNNER_BASE_SPOTS[base] }] };
    runnerAt[id] = base;
  }
  const runnerOuts: Partial<Record<RunnerId, number>> = {};

  let holder: DefensivePosition | null = resolved.gameState.ballHolder ?? null;
  const ball: Track = {
    keys: [{ t: 0, ...(holder ? START_POSITIONS[holder] : PITCH_RELEASE) }],
  };

  const pauses: Pause[] = [];
  const captions: Caption[] = [];
  const highlights: Highlight[] = [];
  const trails: Trail[] = [];
  const markers: PhaseMarker[] = [];
  let pitchEnd = 0;
  let hitEnd = 0;
  let reactStart = -1;
  let decisionTime: number | undefined;
  let firstPlay: number | undefined;
  const moved = new Set<DefensivePosition>();

  let now = 0;
  let prevStart = 0;

  const movePlayer = (pos: DefensivePosition, t0: number, to: Coordinate, bad = false) => {
    const tr = players[pos];
    const from = endPos(tr);
    const d = distance(from, to);
    if (d < 0.3) {
      arrivals[pos] = Math.max(t0, trackEnd(tr));
      return arrivals[pos];
    }
    const start = Math.max(t0, trackEnd(tr));
    const arrive = moveTo(tr, start, to, Math.max(0.4, d / SPEED.player));
    trails.push({ position: pos, from, to, t0: start, t1: arrive, bad });
    arrivals[pos] = arrive;
    return arrive;
  };

  const markOut = (id: RunnerId, t: number) => {
    const tr = runners[id];
    if (!tr || runnerOuts[id] !== undefined) return;
    // FORCE: out the moment the ball beats him to the base — he stops there.
    // TAG: he is tagged just as he reaches the base.
    const forced = isForced(id, resolved.gameState.runners);
    const outT = forced ? t : Math.max(t, trackEnd(tr) - 0.35);
    const at = sampleTrack(tr, outT);
    tr.keys = tr.keys.filter((k) => k.t < outT);
    tr.keys.push({ t: outT, x: at.x, y: at.y, ease: 'linear' });
    runnerOuts[id] = outT;
  };

  const moveRunner = (m: RunnerMove, t0: number) => {
    const tr = runners[m.runner];
    if (!tr || runnerOuts[m.runner] !== undefined) return;
    let at = runnerAt[m.runner]!;
    let t = Math.max(t0 + (m.delay ?? 0), trackEnd(tr));
    // Walk base to base along the base paths.
    let idx = BASE_ORDER.indexOf(at);
    if (at === 'HOME' && m.runner !== 'BATTER') return;
    const targetIdx = m.to === 'HOME' ? 4 : BASE_ORDER.indexOf(m.to);
    while (idx < targetIdx) {
      const next = BASE_ORDER[idx + 1];
      const from = endPos(tr);
      let to = RUNNER_BASE_SPOTS[next];
      const isLast = idx + 1 === targetIdx;
      if (isLast && m.partial) {
        to = { x: from.x + (to.x - from.x) * m.partial, y: from.y + (to.y - from.y) * m.partial };
      }
      t = moveTo(tr, t, to, distance(from, to) / SPEED.runner, { ease: 'linear' });
      if (!(isLast && m.partial)) at = next;
      idx++;
    }
    // Runner took a few steps off the bag and gets "looked back": return to the base.
    if (idx === targetIdx && at === m.to) {
      const spot = RUNNER_BASE_SPOTS[at];
      const from = endPos(tr);
      if (distance(from, spot) > 0.3) moveTo(tr, t, spot, distance(from, spot) / SPEED.runner, { ease: 'linear' });
    }
    runnerAt[m.runner] = at;
  };

  const ballFrom = (t: number): Coordinate => {
    // Where the ball is at time t: with the holder if someone has it.
    if (holder) {
      const p = sampleTrack(players[holder], t);
      return { x: p.x, y: p.y };
    }
    return endPos(ball);
  };

  const throwBall = (t: number, to: Coordinate, speed = SPEED.throw, arc = 0.06) => {
    const from = ballFrom(t);
    const d = distance(from, to);
    const last = lastKey(ball);
    const start = Math.max(t, last.t);
    if (firstPlay === undefined && hitEnd > 0) firstPlay = start;
    ball.keys.push({ t: start, ...from });
    return moveTo(ball, start, to, 0.2 + d / speed, { ease: 'linear', h: d * arc });
  };

  phases.forEach((phase, index) => {
    const t0 = phase.withPrevious ? prevStart + (phase.delay ?? 0) : now + (phase.delay ?? 0);
    let end = t0;

    switch (phase.kind) {
      case 'PITCH': {
        const home = { x: 50, y: 88.6 };
        end = moveTo(ball, t0, home, 0.8, { ease: 'linear', h: 1.5 }) + 0.25;
        pitchEnd = end - 0.25;
        break;
      }

      case 'HIT': {
        if (!resolved.ballLocation) break;
        const bl = coord(resolved.ballLocation);
        const fielder = resolved.primaryFielder;
        const from = endPos(ball);
        const d = distance(from, bl);
        const type = resolved.ballType;
        const natural =
          type === 'FLY' ? Math.max(2.4, d / 15) : type === 'LINE' ? d / SPEED.line : d / SPEED.ground;
        let arrive = t0 + natural;
        if (fielder) {
          const fTr = players[fielder];
          const fd = distance(endPos(fTr), bl);
          const fArrive = t0 + 0.15 + Math.max(0.3, fd / SPEED.player);
          arrive = Math.max(arrive, fArrive + 0.05);
          movePlayer(fielder, t0 + 0.15, bl);
          moved.add(fielder);
        }
        moveTo(ball, t0, bl, arrive - t0, {
          ease: type === 'GROUND' ? 'out' : 'linear',
          h: type === 'FLY' ? 24 : type === 'LINE' ? 3 : 0,
        });
        holder = fielder;
        end = arrive;
        hitEnd = arrive;
        break;
      }

      case 'REACT': {
        if (reactStart < 0) reactStart = t0;
        let chaseIndex = 0;
        for (const pos of DEFENSIVE_POSITIONS) {
          if (moved.has(pos)) continue;
          const a = resolved.assignments[pos];
          const dest = destinationFor(resolved, pos, a.action === 'CHASE_BALL' ? chaseIndex++ : 0);
          movePlayer(pos, t0 + a.reactionDelay, dest, a.action === 'CHASE_BALL');
          moved.add(pos);
        }
        end = t0 + 1.0;
        break;
      }

      case 'THROW': {
        const from = holder;
        const recvTr = players[phase.to];
        const target = endPos(recvTr);
        const d = distance(ballFrom(Math.max(t0, from ? arrivals[from] : 0)), target);
        const dur = 0.2 + d / SPEED.throw;
        const start = Math.max(t0, arrivals[phase.to] - dur + 0.15, from ? arrivals[from] : 0);
        const arrive = throwBall(start, target);
        holder = phase.to;
        for (const id of phase.outs ?? []) markOut(id, arrive);
        end = arrive;
        break;
      }

      case 'OVERTHROW': {
        const target = endPos(players[phase.to]);
        const from = holder;
        const d1 = distance(ballFrom(Math.max(t0, from ? arrivals[from] : 0)), target);
        const dur1 = 0.2 + d1 / SPEED.throw;
        const stopPos = phase.stopper
          ? endPos(players[phase.stopper])
          : phase.looseTo
            ? coord(phase.looseTo)
            : target;
        const dur2 = distance(target, stopPos) / SPEED.roll;
        let start = Math.max(t0, arrivals[phase.to] - dur1 + 0.15, from ? arrivals[from] : 0);
        if (phase.stopper) start = Math.max(start, arrivals[phase.stopper] - dur1 - dur2 + 0.3);
        // Sails just past the receiver…
        const past = { x: target.x + (stopPos.x - target.x) * 0.08, y: target.y + (stopPos.y - target.y) * 0.08 };
        const mid = throwBall(start, past, SPEED.throw, 0.09);
        // …then rolls to the backup (or away).
        end = moveTo(ball, mid, stopPos, dur2 + 0.1, { ease: 'out' });
        holder = phase.stopper ?? null;
        break;
      }

      case 'WILD_THROW': {
        const start = Math.max(t0, holder ? arrivals[holder] : 0);
        const mid = throwBall(start, coord(phase.toward), SPEED.throw * 0.9, 0.05);
        end = mid;
        holder = null;
        break;
      }

      case 'BOBBLE': {
        const spot = coord(phase.to);
        const start = Math.max(t0, lastKey(ball).t);
        const fielder = holder;
        const rolled = moveTo(ball, start, spot, 0.7, { ease: 'out' });
        if (fielder) {
          const got = movePlayer(fielder, rolled - 0.2, spot);
          end = got + 0.35;
          ball.keys.push({ t: got, ...spot });
        } else end = rolled;
        break;
      }

      case 'CARRY': {
        if (!holder) break;
        const to = coord(phase.to);
        const tr = players[holder];
        const start = Math.max(t0, trackEnd(tr));
        const d = distance(endPos(tr), to);
        const dur = Math.max(0.4, d / SPEED.player);
        if (firstPlay === undefined) firstPlay = start;
        moveTo(tr, start, to, dur);
        ball.keys.push({ t: Math.max(start, lastKey(ball).t), ...endPos(ball) });
        moveTo(ball, start, to, dur);
        arrivals[holder] = start + dur;
        for (const id of phase.outs ?? []) markOut(id, start + dur);
        end = start + dur;
        break;
      }

      case 'MOVE': {
        let latest = t0;
        for (const [pos, where] of Object.entries(phase.moves) as [DefensivePosition, string][]) {
          const dest = where === 'BALL' ? endPos(ball) : coord(where as keyof typeof LOCATIONS);
          const arrive = movePlayer(pos, t0, dest, false);
          if (where === 'BALL' && !holder) holder = pos;
          latest = Math.max(latest, arrive);
        }
        end = latest;
        break;
      }

      case 'RUNNERS':
        end = t0 + 0.3;
        break;

      case 'OUT':
        for (const id of phase.outs) markOut(id, t0);
        end = t0 + 0.6;
        break;

      case 'WAIT':
        end = t0 + phase.seconds;
        break;

      case 'FREEZE':
        pauses.push({ id: pauses.length, t: t0, kind: 'FREEZE', title: phase.title, text: phase.text });
        end = t0 + 0.05;
        break;

      case 'HIGHLIGHT':
        pauses.push({
          id: pauses.length,
          t: t0,
          kind: 'HIGHLIGHT',
          title: phase.title,
          text: phase.text,
          tone: phase.tone,
        });
        highlights.push({ t: t0, location: phase.location, title: phase.title, tone: phase.tone });
        end = t0 + 0.05;
        break;

      case 'DECISION': {
        // Wait until everyone (runners and fielders) has stopped moving.
        let t = t0;
        for (const tr of Object.values(runners)) t = Math.max(t, trackEnd(tr!));
        for (const pos of DEFENSIVE_POSITIONS) t = Math.max(t, trackEnd(players[pos]));
        t = Math.max(t, lastKey(ball).t) + 0.3;
        pauses.push({ id: pauses.length, t, kind: 'DECISION' });
        decisionTime = t;
        if (firstPlay === undefined) firstPlay = t;
        end = t + 0.05;
        break;
      }
    }

    for (const m of phase.runners ?? []) moveRunner(m, t0 + (phase.kind === 'HIT' ? 0.15 : 0));
    if (phase.caption) captions.push({ t: t0, until: t0 + 2.4, text: phase.caption });
    markers.push({ t: t0, end, kind: phase.kind, index });
    prevStart = t0;
    now = Math.max(now, end);
  });

  // Keep the ball glued to its final holder if they are still moving.
  if (holder) {
    const tr = players[holder];
    if (trackEnd(tr) > lastKey(ball).t) {
      ball.keys.push({ t: lastKey(ball).t, ...endPos(ball) });
      moveTo(ball, lastKey(ball).t, endPos(tr), trackEnd(tr) - lastKey(ball).t);
    }
  }

  // Captions end when the next one starts.
  captions.sort((a, b) => a.t - b.t);
  for (let i = 0; i < captions.length - 1; i++) {
    captions[i].until = Math.min(captions[i].until, captions[i + 1].t);
  }

  let duration = now;
  for (const pos of DEFENSIVE_POSITIONS) duration = Math.max(duration, trackEnd(players[pos]));
  for (const tr of Object.values(runners)) duration = Math.max(duration, trackEnd(tr!));
  for (const o of Object.values(runnerOuts)) duration = Math.max(duration, (o ?? 0) + 0.9);
  duration = Math.max(duration, lastKey(ball).t) + 0.4;

  return {
    duration,
    players,
    ball,
    runners,
    runnerOuts,
    pauses,
    captions,
    highlights,
    trails,
    phases: markers,
    arrivals,
    pitchEnd,
    hitEnd,
    reactStart: reactStart < 0 ? hitEnd : reactStart,
    decisionTime,
    firstPlay,
  };
}

// ───────────────────────── sample ─────────────────────────

export function sampleTimeline(tl: Timeline, t: number): Frame {
  const players = {} as Record<DefensivePosition, Coordinate>;
  for (const pos of DEFENSIVE_POSITIONS) {
    const s = sampleTrack(tl.players[pos], t);
    players[pos] = { x: s.x, y: s.y };
  }
  const ball = sampleTrack(tl.ball, t);
  const runners = (Object.entries(tl.runners) as [RunnerId, Track][]).map(([id, tr]) => {
    const s = sampleTrack(tr, t);
    const outT = tl.runnerOuts[id];
    const out = outT !== undefined && t >= outT;
    const opacity = out ? Math.max(0.3, 1 - (t - outT!) / 0.8) : 1;
    return { id, x: s.x, y: s.y, out, opacity };
  });
  let phase = 'READY';
  for (const m of tl.phases) if (t >= m.t) phase = m.kind;
  if (t >= tl.duration - 0.01) phase = 'DONE';
  const cap = tl.captions.find((c) => t >= c.t && t < c.until);
  return {
    t,
    players,
    ball,
    runners,
    phase,
    caption: cap?.text ?? null,
    highlights: tl.highlights.filter((h) => t >= h.t),
    trails: tl.trails
      .filter((tr) => t >= tr.t0)
      .map((tr) => ({
        ...tr,
        progress: Math.min(1, (t - tr.t0) / Math.max(0.01, tr.t1 - tr.t0)),
        opacity: 1,
      })),
  };
}
