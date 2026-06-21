import { afterEach, describe, expect, it, vi } from 'vitest';
import { track } from '../../analytics/track';

type GtagGlobal = typeof globalThis & { gtag?: (...args: unknown[]) => void };

const gtagGlobal = globalThis as GtagGlobal;

describe('track', () => {
  afterEach(() => {
    delete gtagGlobal.gtag;
    vi.restoreAllMocks();
  });

  it('forwards the event name and params to gtag', () => {
    const gtag = vi.fn();
    gtagGlobal.gtag = gtag;

    track('tab_switch', { tab: 'editor' });

    expect(gtag).toHaveBeenCalledWith('event', 'tab_switch', { tab: 'editor' });
  });

  it('defaults params to an empty object', () => {
    const gtag = vi.fn();
    gtagGlobal.gtag = gtag;

    track('reset_clicked');

    expect(gtag).toHaveBeenCalledWith('event', 'reset_clicked', {});
  });

  it('is a no-op when gtag is unavailable', () => {
    delete gtagGlobal.gtag;
    expect(() => track('explore_opened')).not.toThrow();
  });

  it('swallows errors thrown by gtag so analytics never breaks the app', () => {
    gtagGlobal.gtag = () => {
      throw new Error('blocked');
    };

    expect(() => track('share_url_generated')).not.toThrow();
  });
});
