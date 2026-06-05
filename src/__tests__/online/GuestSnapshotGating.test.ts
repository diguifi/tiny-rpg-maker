import { describe, expect, it } from 'vitest';
import { GameState } from '../../runtime/domain/GameState';
import { OnlineStateSync } from '../../online/client/OnlineStateSync';

/**
 * Regression: in a fresh 2-player game the host must broadcast a full-state
 * snapshot at game-start (OnlineModeApplication onGameStart host branch).
 *
 * The server only emits `snapshot-request` for LATE joins and reconnects, never
 * for the initial 2-player start. OnlineStateSync gates every `world-state-diff`
 * behind a snapshot (`_snapshotApplied`); without one, all diffs are buffered
 * forever, so the guest never sees host-driven world changes — e.g. the host
 * stepping on a pressure plate (which sets a variable that drives plates, doors,
 * traps, LEDs). This test pins the buffering contract that made the snapshot
 * mandatory.
 */
describe('online guest snapshot gating', () => {
    it('buffers diffs until a snapshot arrives, then flushes them', () => {
        const guest = new GameState();
        guest.game.variables = [{ id: 'var-1', value: false }];
        guest.game.objects = [
            { id: 'plate-0', type: 'pressure-plate', x: 3, y: 3, roomIndex: 0, variableId: 'var-1' },
        ];

        const sync = new OnlineStateSync(guest as never);

        // A diff that arrives before any snapshot must NOT be lost — it is buffered.
        sync.applyDiff({ tick: 1, variables: { 0: 1 } });
        expect(guest.isVariableOn('var-1')).toBe(false);

        // Once the (now mandatory) snapshot arrives, buffered diffs flush and the
        // plate-driving variable becomes correct.
        sync.applySnapshot({ enemies: {}, variables: {}, objects: {}, items: {}, players: [] });
        expect(guest.isVariableOn('var-1')).toBe(true);
    });
});
