import { useEffect, useState } from 'react';

/** Tiny hash router so the app works from any static host (and from a single file). */
export type Route =
  | { name: 'home' }
  | { name: 'lesson'; id: string }
  | { name: 'play'; id: string }
  | { name: 'plays' }
  | { name: 'practice' }
  | { name: 'pitch' }
  | { name: 'coach' }
  | { name: 'team' };

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  switch (parts[0]) {
    case 'lesson':
      return parts[1] ? { name: 'lesson', id: parts[1] } : { name: 'home' };
    case 'play':
      return parts[1] ? { name: 'play', id: parts[1] } : { name: 'plays' };
    case 'plays':
      return { name: 'plays' };
    case 'practice':
      return { name: 'practice' };
    case 'before-pitch':
      return { name: 'pitch' };
    case 'coach':
      return { name: 'coach' };
    case 'team':
      return { name: 'team' };
    default:
      return { name: 'home' };
  }
}

// Current path is kept in memory too, so navigation works even where the
// host page doesn't let us change the URL hash (e.g. embedded previews).
let current = (() => {
  try {
    return window.location.hash;
  } catch {
    return '';
  }
})();
const EVT = 'cubs-iq:navigate';

export const go = (path: string) => {
  current = '#' + path;
  try {
    history.pushState(null, '', current);
  } catch {
    /* URL can't change here — in-memory routing still works */
  }
  window.dispatchEvent(new Event(EVT));
  window.scrollTo({ top: 0 });
};

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(current));
  useEffect(() => {
    const onNav = () => setRoute(parseHash(current));
    const onHash = () => {
      current = window.location.hash;
      onNav();
    };
    window.addEventListener(EVT, onNav);
    window.addEventListener('hashchange', onHash);
    window.addEventListener('popstate', onHash);
    return () => {
      window.removeEventListener(EVT, onNav);
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('popstate', onHash);
    };
  }, []);
  return route;
}
