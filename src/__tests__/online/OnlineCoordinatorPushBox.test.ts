import { describe, expect, it, vi } from 'vitest';
import { OnlineCoordinator } from '../../runtime/services/OnlineCoordinator';

function makeFakeEngine() {
    const gameState = { resetPushBoxesForRoom: vi.fn() };
    const interactionManager = { guestMode: false };
    const movementManager = { guestMode: false };
    // setMode re-evaluates the enemy loop (host/guest split); stub it out.
    const startEnemyLoop = vi.fn();
    return { gameState, interactionManager, movementManager, startEnemyLoop } as never;
}

describe('OnlineCoordinator — push-box host authority', () => {
    it('setMode(online-guest) flags both interaction and movement managers as guest', () => {
        const engine = makeFakeEngine() as unknown as {
            interactionManager: { guestMode: boolean };
            movementManager: { guestMode: boolean };
            startEnemyLoop: ReturnType<typeof vi.fn>;
        };
        const coord = new OnlineCoordinator(engine as never);

        coord.setMode('online-guest');
        expect(engine.interactionManager.guestMode).toBe(true);
        expect(engine.movementManager.guestMode).toBe(true);
        // Must re-evaluate the enemy loop so a guest stops simulating enemies locally.
        expect(engine.startEnemyLoop).toHaveBeenCalled();

        coord.setMode('online-host');
        expect(engine.interactionManager.guestMode).toBe(false);
        expect(engine.movementManager.guestMode).toBe(false);
    });

    it('resetPushBoxesForRoom resets the room and notifies state change (so it broadcasts)', () => {
        const engine = makeFakeEngine() as unknown as { gameState: { resetPushBoxesForRoom: ReturnType<typeof vi.fn> } };
        const coord = new OnlineCoordinator(engine as never);
        const onStateChanged = vi.fn();
        coord.onStateChanged = onStateChanged;

        coord.resetPushBoxesForRoom(2);

        expect(engine.gameState.resetPushBoxesForRoom).toHaveBeenCalledWith(2);
        expect(onStateChanged).toHaveBeenCalledTimes(1);
    });
});
