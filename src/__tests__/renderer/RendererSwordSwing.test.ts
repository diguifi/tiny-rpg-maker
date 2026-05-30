import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RendererSwordSwing } from '../../runtime/adapters/renderer/RendererSwordSwing';

type SwingRendererApi = ConstructorParameters<typeof RendererSwordSwing>[0];

type Sprite = (string | null)[][];
const swordSprite: Sprite = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => '#FFFFFF'));

function makeRenderer(playerPos: { x: number; y: number } | null = { x: 5, y: 5 }) {
  return {
    canvas: document.createElement('canvas'),
    ctx: null,
    gameState: {
      getPlayer: playerPos ? vi.fn(() => ({ ...playerPos })) : undefined,
    },
    gameEngine: {},
    tileManager: {},
    paletteManager: {},
    spriteFactory: {
      getObjectSprites: vi.fn((): Record<string, Sprite> => ({ sword: swordSprite })),
    },
    canvasHelper: {
      getTilePixelSize: vi.fn(() => 16),
      drawSprite: vi.fn(),
    },
    entityRenderer: {},
    draw: vi.fn(),
  };
}

function makeCtx() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    stroke: vi.fn(),
    globalAlpha: 1,
    strokeStyle: '',
    lineWidth: 0,
    lineCap: '',
  } as unknown as CanvasRenderingContext2D;
}

function asApi(renderer: ReturnType<typeof makeRenderer>): SwingRendererApi {
  return renderer as unknown as SwingRendererApi;
}

describe('RendererSwordSwing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(() => 1);
    vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('is inactive by default', () => {
    const swing = new RendererSwordSwing(asApi(makeRenderer()));
    expect(swing.isActive()).toBe(false);
  });

  it('becomes active when started', () => {
    const swing = new RendererSwordSwing(asApi(makeRenderer()));
    swing.start('sword', { x: 1, y: 0 });
    expect(swing.isActive()).toBe(true);
  });

  it('draws the sword sprite while a swing is active', () => {
    const renderer = makeRenderer();
    const swing = new RendererSwordSwing(asApi(renderer));
    const ctx = makeCtx();

    swing.start('sword', { x: 1, y: 0 });
    swing.draw(ctx);

    // Main sword + trail ghosts all routed through canvasHelper.drawSprite
    expect(renderer.canvasHelper.drawSprite).toHaveBeenCalled();
    // Rotated around a pivot for each draw
    expect(ctx.rotate).toHaveBeenCalled();
    expect(ctx.translate).toHaveBeenCalled();
    // Trail arc stroked
    expect(ctx.arc).toHaveBeenCalled();
  });

  it('draws nothing when no swing is active', () => {
    const renderer = makeRenderer();
    const swing = new RendererSwordSwing(asApi(renderer));
    const ctx = makeCtx();

    swing.draw(ctx);

    expect(renderer.canvasHelper.drawSprite).not.toHaveBeenCalled();
  });

  it('does not draw and deactivates once the swing duration elapses', () => {
    const renderer = makeRenderer();
    const swing = new RendererSwordSwing(asApi(renderer));
    const ctx = makeCtx();
    const nowSpy = vi.spyOn(performance, 'now');

    nowSpy.mockReturnValue(0);
    swing.start('sword', { x: 1, y: 0 });
    // Jump well past the swing duration.
    nowSpy.mockReturnValue(100000);
    swing.draw(ctx);

    expect(swing.isActive()).toBe(false);
    expect(renderer.canvasHelper.drawSprite).not.toHaveBeenCalled();
  });

  it('skips drawing when the sword sprite is missing', () => {
    const renderer = makeRenderer();
    renderer.spriteFactory.getObjectSprites = vi.fn((): Record<string, Sprite> => ({}));
    const swing = new RendererSwordSwing(asApi(renderer));
    const ctx = makeCtx();

    swing.start('sword', { x: 1, y: 0 });
    swing.draw(ctx);

    expect(renderer.canvasHelper.drawSprite).not.toHaveBeenCalled();
  });

  it('cancel deactivates an active swing', () => {
    const swing = new RendererSwordSwing(asApi(makeRenderer()));
    swing.start('sword', { x: 1, y: 0 });
    swing.cancel();
    expect(swing.isActive()).toBe(false);
  });
});
