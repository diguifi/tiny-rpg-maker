/**
 * Thin, typed wrapper around Google Analytics (gtag) for custom GA4 events.
 *
 * Why this module exists:
 * - `index.html` defines the synchronous `gtag()` stub and queues events until
 *   the real `gtag.js` is injected on idle (see `loadAnalytics.ts`). Calling
 *   `track()` early is therefore safe — the event is flushed once the network
 *   script arrives.
 * - The game frequently runs embedded inside a cross-origin iframe (e.g. itch.io).
 *   There, GA's third-party cookies are blocked by Safari/Firefox, so the
 *   automatic `client_id` never persists and every reload looks like a new user.
 *   We mitigate that by persisting our own `client_id` in `localStorage` — which
 *   is first-party to the iframe's own origin and so is NOT blocked the way a
 *   cross-site cookie is. The id is generated and applied to the first
 *   `gtag('config', ...)` call inline in `index.html`; the same storage key is
 *   re-exported here as {@link CLIENT_ID_STORAGE_KEY} so the two stay in sync.
 *
 * Analytics must never break the app: every function here degrades to a no-op
 * when `gtag` is missing (ad-blocker, SSR, tests) or when storage throws.
 */

/** localStorage key for the persisted client id. MUST match the inline script in `index.html`. */
export const CLIENT_ID_STORAGE_KEY = 'trpg_cid';

type GtagFn = (
  command: 'event' | 'config' | 'set' | 'js',
  targetOrName: string | Date,
  params?: Record<string, unknown>,
) => void;

type AnalyticsGlobal = typeof globalThis & {
  gtag?: GtagFn;
};

const analyticsGlobal = globalThis as AnalyticsGlobal;

/**
 * Fires a custom GA4 event. No-op when `gtag` is unavailable, so callers never
 * need to guard. Event/param names should be GA4-friendly (snake_case, ≤40 chars).
 *
 * @example track('tab_switch', { tab: 'editor' })
 */
export function track(event: string, params: Record<string, unknown> = {}): void {
  const gtag = analyticsGlobal.gtag;
  if (typeof gtag !== 'function') return;
  try {
    gtag('event', event, params);
  } catch {
    /* analytics must never throw into the app */
  }
}
