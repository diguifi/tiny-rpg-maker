import { beforeAll, describe, expect, it } from 'vitest';
import { setupShareGlobals, ShareConstants, ShareDecoder, ShareTextCodec } from './shareTestUtils';

describe('ShareDecoder background music compatibility', () => {
  beforeAll(() => {
    setupShareGlobals({
      objectTypes: {
        DOOR: 'door',
        KEY: 'key',
        LIFE_POTION: 'life-potion',
        XP_SCROLL: 'xp-scroll',
        SWORD: 'sword',
        SWORD_BRONZE: 'sword-bronze',
        SWORD_WOOD: 'sword-wood',
        PLAYER_END: 'player-end',
        SWITCH: 'switch',
        DOOR_VARIABLE: 'door-variable'
      },
      enemyNormalize: (type) => (typeof type === 'string' && type ? type : 'slime')
    });
  });

  it('decodes the M segment into backgroundMusicVideoId', () => {
    const version = (ShareConstants.VERSION + 1).toString(36);
    const code = `v${version}.M${ShareTextCodec.encodeText('t0ihNLLZNi0')}`;
    const decoded = ShareDecoder.decodeShareCode(code) as ({ backgroundMusicVideoId?: string } | null);

    expect(decoded?.backgroundMusicVideoId).toBe('t0ihNLLZNi0');
  });
});
