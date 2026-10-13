import { useCallback, useEffect, useRef, useState } from 'react';
import type { Pause, PauseKind, Timeline } from './animationTypes';

export interface PlayerOptions {
  speed: number;
  /** Stop here and wait (quiz freeze). */
  stopAt?: number;
  /** Pause kinds that play straight through (e.g. FREEZE during quizzes). */
  skipPauses?: PauseKind[];
  /** Start at this time (e.g. the quiz freeze point). */
  startAt?: number;
  autoPlay?: boolean;
}

export interface TimelinePlayer {
  t: number;
  playing: boolean;
  done: boolean;
  activePause: Pause | null;
  stopped: boolean;
  play: () => void;
  pause: () => void;
  reset: () => void;
  replay: () => void;
  resume: () => void;
  seek: (t: number) => void;
}

/** Plays a Timeline with requestAnimationFrame, honoring pause points. */
export function useTimelinePlayer(timeline: Timeline, opts: PlayerOptions): TimelinePlayer {
  const { speed, stopAt, skipPauses, startAt = 0, autoPlay = false } = opts;
  const [t, setT] = useState(startAt);
  const [playing, setPlaying] = useState(autoPlay);
  const [activePause, setActivePause] = useState<Pause | null>(null);
  const [stopped, setStopped] = useState(false);
  const tRef = useRef(startAt);
  const consumed = useRef(new Set<number>());
  const stopConsumed = useRef(false);
  const skipKey = (skipPauses ?? []).join(',');

  // New timeline → start over.
  useEffect(() => {
    tRef.current = startAt;
    consumed.current = new Set();
    stopConsumed.current = false;
    setT(startAt);
    setActivePause(null);
    setStopped(false);
    setPlaying(autoPlay);
  }, [timeline, startAt, autoPlay, stopAt]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const skip = skipKey ? skipKey.split(',') : [];
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000) * speed;
      last = now;
      const prev = tRef.current;
      let next = prev + dt;

      if (stopAt !== undefined && !stopConsumed.current && prev <= stopAt && next >= stopAt) {
        stopConsumed.current = true;
        tRef.current = stopAt;
        setT(stopAt);
        setStopped(true);
        setPlaying(false);
        return;
      }
      const hit = timeline.pauses.find(
        (p) => !consumed.current.has(p.id) && !skip.includes(p.kind) && prev <= p.t && next >= p.t,
      );
      if (hit) {
        consumed.current.add(hit.id);
        tRef.current = hit.t;
        setT(hit.t);
        setActivePause(hit);
        setPlaying(false);
        return;
      }
      if (next >= timeline.duration) {
        next = timeline.duration;
        tRef.current = next;
        setT(next);
        setPlaying(false);
        return;
      }
      tRef.current = next;
      setT(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, timeline, stopAt, skipKey]);

  const play = useCallback(() => {
    if (tRef.current >= timeline.duration) {
      tRef.current = 0;
      consumed.current = new Set();
      stopConsumed.current = false;
      setT(0);
    }
    setActivePause(null);
    setStopped(false);
    setPlaying(true);
  }, [timeline]);

  const pause = useCallback(() => setPlaying(false), []);

  const reset = useCallback(() => {
    tRef.current = startAt;
    consumed.current = new Set();
    stopConsumed.current = false;
    setT(startAt);
    setActivePause(null);
    setStopped(false);
    setPlaying(false);
  }, [startAt]);

  const replay = useCallback(() => {
    tRef.current = 0;
    consumed.current = new Set();
    stopConsumed.current = false;
    setT(0);
    setActivePause(null);
    setStopped(false);
    setPlaying(true);
  }, []);

  const resume = useCallback(() => {
    setActivePause(null);
    setStopped(false);
    setPlaying(true);
  }, []);

  const seek = useCallback((nt: number) => {
    tRef.current = nt;
    setT(nt);
  }, []);

  return {
    t,
    playing,
    done: t >= timeline.duration - 0.001,
    activePause,
    stopped,
    play,
    pause,
    reset,
    replay,
    resume,
    seek,
  };
}
