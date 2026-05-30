import { RendererModuleBase } from './RendererModuleBase';

type Sprite = (string | null)[][];

type SwingState = {
    active: boolean;
    swordType?: string;
    /** Direction from player to the enemy being struck (tile delta). */
    direction?: { x: number; y: number };
    startTime?: number;
    duration?: number;
    rafId?: number | null;
};

type PlayerLike = { x: number; y: number };

/**
 * RendererSwordSwing draws an actual sword-swing animation while the player
 * attacks an enemy.
 *
 * The sword is gripped near the player's body (the handle stays on the player)
 * and the blade sweeps through an arc toward the enemy, leaving a motion trail.
 * It is only rendered for the brief duration of a player-initiated strike and
 * only when the player is carrying a sword.
 */
class RendererSwordSwing extends RendererModuleBase {
    private swing: SwingState;

    // Where the grip sits inside the 8x8 sword sprite (handle cell).
    private static readonly HANDLE_CELL = { x: 4.5, y: 6 };
    // Direction the blade points in the unrotated sprite (handle -> tip).
    private static readonly SPRITE_BLADE_ANGLE = Math.atan2(
        1 - RendererSwordSwing.HANDLE_CELL.y,
        0.5 - RendererSwordSwing.HANDLE_CELL.x,
    );
    // How long the blade takes to whip through its arc (ms). Kept short and
    // decoupled from the lunge so the strike feels snappy.
    private static readonly SWING_DURATION = 200;
    // Arc the blade sweeps through, in radians (overhead chop to follow-through).
    private static readonly SWING_BACK = 1.3;
    private static readonly SWING_FORWARD = 1.0;
    // Motion-trail ghost copies drawn behind the blade.
    private static readonly TRAIL_STEPS = 5;
    private static readonly TRAIL_GAP = 0.16;

    constructor(renderer: ConstructorParameters<typeof RendererModuleBase>[0]) {
        super(renderer);
        this.swing = { active: false };
    }

    isActive(): boolean {
        return Boolean(this.swing.active);
    }

    /**
     * Begin a sword-swing animation toward an enemy.
     * @param swordType Item type of the equipped sword (e.g. 'sword-bronze')
     * @param direction Tile-space vector from the player toward the enemy
     */
    start(swordType: string, direction: { x: number; y: number }): void {
        if (this.swing.rafId != null) {
            globalThis.cancelAnimationFrame(this.swing.rafId);
        }
        this.swing = {
            active: true,
            swordType,
            direction: { ...direction },
            startTime: this.now(),
            duration: RendererSwordSwing.SWING_DURATION,
            rafId: null,
        };
        this.scheduleTick();
    }

    cancel(): void {
        if (this.swing.rafId != null) {
            globalThis.cancelAnimationFrame(this.swing.rafId);
        }
        this.swing = { active: false };
    }

    /**
     * Draw the current swing frame. No-op when no swing is active.
     * Must be called inside the gameplay transform (after the player is drawn).
     */
    draw(ctx: CanvasRenderingContext2D): void {
        if (!this.swing.active || !this.swing.swordType || !this.swing.direction) return;

        const progress = this.getProgress();
        if (progress >= 1) {
            this.cancel();
            return;
        }

        const sprite = this.getSwordSprite(this.swing.swordType);
        if (!sprite) return;

        const player = this.getPlayer();
        if (!player) return;

        const tileSize = this.getTileSize();
        const step = tileSize / 8;

        // Pivot: grip the sword at the player's body center.
        const pivotX = player.x * tileSize + tileSize * 0.5;
        const pivotY = player.y * tileSize + tileSize * 0.5;

        const baseAngle = Math.atan2(this.swing.direction.y, this.swing.direction.x);
        const eased = this.easeOutCubic(progress);
        const swept = -RendererSwordSwing.SWING_BACK +
            eased * (RendererSwordSwing.SWING_BACK + RendererSwordSwing.SWING_FORWARD);
        const bladeAngle = baseAngle + swept;

        // Trail wedge swept by the blade tip so far.
        this.drawTrailArc(ctx, pivotX, pivotY, tileSize, baseAngle, swept);

        // Motion-blur ghosts trailing behind the current blade angle.
        for (let i = RendererSwordSwing.TRAIL_STEPS; i >= 1; i--) {
            const ghostAngle = bladeAngle - i * RendererSwordSwing.TRAIL_GAP;
            const alpha = 0.12 * (1 - i / (RendererSwordSwing.TRAIL_STEPS + 1));
            this.drawSwordAt(ctx, sprite, pivotX, pivotY, step, ghostAngle, alpha);
        }

        // The sword itself, fully opaque, leading the swing.
        this.drawSwordAt(ctx, sprite, pivotX, pivotY, step, bladeAngle, 1);
    }

    // --- private helpers ---

    private drawSwordAt(
        ctx: CanvasRenderingContext2D,
        sprite: Sprite,
        pivotX: number,
        pivotY: number,
        step: number,
        bladeAngle: number,
        alpha: number,
    ): void {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(pivotX, pivotY);
        ctx.rotate(bladeAngle - RendererSwordSwing.SPRITE_BLADE_ANGLE);
        // Offset so the handle cell sits exactly on the pivot.
        const offsetX = -RendererSwordSwing.HANDLE_CELL.x * step;
        const offsetY = -RendererSwordSwing.HANDLE_CELL.y * step;
        this.drawSprite(ctx, sprite, offsetX, offsetY, step);
        ctx.restore();
    }

    private drawTrailArc(
        ctx: CanvasRenderingContext2D,
        pivotX: number,
        pivotY: number,
        tileSize: number,
        baseAngle: number,
        swept: number,
    ): void {
        const radius = tileSize * 0.7;
        const startAngle = baseAngle - RendererSwordSwing.SWING_BACK;
        const endAngle = baseAngle + swept;
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = '#FFF1E8';
        ctx.lineWidth = Math.max(1, tileSize * 0.22);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(pivotX, pivotY, radius, startAngle, endAngle, false);
        ctx.stroke();
        ctx.restore();
    }

    private scheduleTick(): void {
        const tick = () => {
            if (!this.swing.active) return;
            if (this.getProgress() >= 1) {
                this.cancel();
                (this.renderer as { draw?: () => void }).draw?.();
                return;
            }
            (this.renderer as { draw?: () => void }).draw?.();
            this.swing.rafId = globalThis.requestAnimationFrame(tick);
        };
        this.swing.rafId = globalThis.requestAnimationFrame(tick);
    }

    private getProgress(): number {
        if (!this.swing.active ||
            typeof this.swing.startTime !== 'number' ||
            !this.swing.duration) {
            return 1;
        }
        const elapsed = this.now() - this.swing.startTime;
        return Math.max(0, Math.min(1, elapsed / this.swing.duration));
    }

    private easeOutCubic(t: number): number {
        const clamped = Math.max(0, Math.min(1, t));
        return 1 - Math.pow(1 - clamped, 3);
    }

    private now(): number {
        const perf = (globalThis as Partial<typeof globalThis>).performance;
        return perf ? perf.now() : Date.now();
    }

    private getSwordSprite(swordType: string): Sprite | null {
        const factory = this.spriteFactory as { getObjectSprites?: () => Record<string, Sprite | undefined> };
        const sprites = factory.getObjectSprites?.();
        return sprites?.[swordType] ?? null;
    }

    private getPlayer(): PlayerLike | null {
        const state = this.gameState as { getPlayer?: () => PlayerLike };
        return state.getPlayer?.() ?? null;
    }

    private getTileSize(): number {
        const helper = this.canvasHelper as { getTilePixelSize?: () => number };
        return helper.getTilePixelSize?.() ?? 16;
    }

    private drawSprite(ctx: CanvasRenderingContext2D, sprite: Sprite, px: number, py: number, step: number): void {
        const helper = this.canvasHelper as {
            drawSprite?: (ctx: CanvasRenderingContext2D, sprite: Sprite, px: number, py: number, step: number) => void;
        };
        helper.drawSprite?.(ctx, sprite, px, py, step);
    }
}

export { RendererSwordSwing };
