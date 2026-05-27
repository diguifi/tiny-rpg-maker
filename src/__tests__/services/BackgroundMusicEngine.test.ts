import { beforeEach, describe, expect, it } from 'vitest';
import { BackgroundMusicEngine } from '../../runtime/services/BackgroundMusicEngine';

describe('BackgroundMusicEngine', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('creates a hidden looping YouTube iframe when playback starts', () => {
    const engine = new BackgroundMusicEngine();

    engine.setVideoId('t0ihNLLZNi0');
    engine.play();

    const iframe = document.querySelector('iframe[src*="youtube.com/embed/t0ihNLLZNi0"]');
    expect(iframe).toBeInstanceOf(HTMLIFrameElement);
    expect(iframe?.getAttribute('src')).toContain('playlist=t0ihNLLZNi0');
    expect(iframe?.getAttribute('src')).toContain('loop=1');
  });

  it('removes playback when the configured video id is cleared', () => {
    const engine = new BackgroundMusicEngine();

    engine.setVideoId('t0ihNLLZNi0');
    engine.play();
    expect(document.querySelector('iframe[src*="youtube.com/embed/t0ihNLLZNi0"]')).toBeInstanceOf(HTMLIFrameElement);
    engine.setVideoId('');

    expect(document.querySelector('iframe[src*="youtube.com/embed/t0ihNLLZNi0"]')).toBeNull();
  });

  it('syncs from game data and destroys the iframe on teardown', () => {
    const engine = new BackgroundMusicEngine();

    engine.syncFromGame({ backgroundMusicVideoId: 't0ihNLLZNi0' });
    engine.play();
    expect(document.querySelector('iframe[src*="youtube.com/embed/t0ihNLLZNi0"]')).toBeInstanceOf(HTMLIFrameElement);
    engine.destroy();

    expect(document.querySelector('iframe[src*="youtube.com/embed/t0ihNLLZNi0"]')).toBeNull();
  });

  it('does not restart playback when play is called again with the same video id', () => {
    const engine = new BackgroundMusicEngine();

    engine.setVideoId('t0ihNLLZNi0');
    engine.play();

    const iframe = document.querySelector('iframe[src*="youtube.com/embed/t0ihNLLZNi0"]') as HTMLIFrameElement | null;
    const firstSrc = iframe?.getAttribute('src');

    engine.play();

    const iframeAfterSecondPlay = document.querySelector('iframe[src*="youtube.com/embed/t0ihNLLZNi0"]') as HTMLIFrameElement | null;
    expect(iframeAfterSecondPlay).toBe(iframe);
    expect(iframeAfterSecondPlay?.getAttribute('src')).toBe(firstSrc);
  });
});
