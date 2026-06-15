/**
 * tiny-rpg-studio-sdk — Logic Puzzle
 *
 * Run:  node logic-puzzle.mjs
 *
 * A single-room logic puzzle that shows off the SDK's variable + logic features:
 *   - Two switches (levers) the player toggles, each wired to its own variable.
 *   - An AND logic gate that combines both switch variables into an output.
 *   - An LED that lights up only while the output variable is ON.
 *   - A variable-door (locked until the output is ON) sealing a goal chamber.
 *   - The game-ending tile waiting behind that door.
 *
 * To win the player must flip BOTH levers; the AND gate then opens the door.
 *
 * Open the printed URL in the browser to play it instantly.
 */

import { TinyRPG } from 'tiny-rpg-studio-sdk';

// ─── World layout ───────────────────────────────────────────────────────────
// 8x8 ground tile matrix. 0 = grass (walkable), 10 = stone wall (collision).
// The right-most interior column (x = 6) is a sealed goal chamber: the only way
// in is through the variable-door placed at the single gap in the divider wall
// at (5, 4). Player roams the open left area to reach both levers.
const PUZZLE_GROUND = [
  [10, 10, 10, 10, 10, 10, 10, 10],
  [10,  0,  0,  0,  0,  0, 10, 10],
  [10,  0,  0,  0,  0,  0, 10, 10],
  [10,  0,  0,  0,  0,  0, 10, 10],
  [10,  0,  0,  0,  0,  0,  0, 10], // (5,4) door gap → chamber tile (6,4)
  [10,  0,  0,  0,  0,  0, 10, 10],
  [10,  0,  0,  0,  0,  0, 10, 10],
  [10, 10, 10, 10, 10, 10, 10, 10],
];

// ─── Build the game ─────────────────────────────────────────────────────────
const game = new TinyRPG()
  .setTitle('Logic Gate Puzzle')
  .setAuthor('SDK Example')
  .setPlayerStart({ x: 1, y: 1, room: 0 });

// Allocate the boolean variables that wire the puzzle together.
const leverA = game.variable('leverA');     // var-1 — set by the first switch
const leverB = game.variable('leverB');     // var-2 — set by the second switch
const gateOut = game.variable('gateOut');   // var-3 — AND(leverA, leverB)

// Room 0 — the puzzle room
game.room(0)
  .ground(PUZZLE_GROUND)
  // A guide NPC explains the puzzle.
  .addNPC({
    type: 'old-mage',
    x: 1,
    y: 5,
    text: 'Flip BOTH levers. The AND gate will light the lamp and open the door.',
  })
  // Two levers, each wired to its own variable.
  .addSwitch({ x: 2, y: 2, variable: leverA })
  .addSwitch({ x: 4, y: 2, variable: leverB })
  // AND gate: output (var-3) turns ON only when BOTH levers are ON.
  .addLogicGate({ type: 'and', x: 3, y: 4, inputA: leverA, inputB: leverB, output: gateOut })
  // LED indicator wired to the gate output — lights up when the puzzle is solved.
  .addLed({ x: 4, y: 4, variable: gateOut })
  // Variable-door sealing the goal chamber; opens once gateOut is ON.
  .addVariableDoor({ x: 5, y: 4, variable: gateOut })
  // The goal, safely behind the door inside the chamber column (x = 6).
  .addEnd({ x: 6, y: 4, message: 'Logic solved! Both levers ON → AND gate opened the door.' });

// ─── Output ─────────────────────────────────────────────────────────────────
const url = game.buildURL();

console.log('\n🎮 tiny-rpg-studio-sdk — Logic Puzzle\n');
console.log('Open the URL below in a browser to play:\n');
console.log(url);
console.log('\n');

// Also print a short payload summary
const payload = game.toSharePayload();
console.log('── Payload summary ──────────────────────────────────────');
console.log(`Title    : ${payload.title}`);
console.log(`Author   : ${payload.author}`);
console.log(`Variables: ${payload.variables?.map(v => `${v.name ?? v.id}=${v.value}`).join(', ')}`);
const nonEmptyRooms = payload.tileset?.maps.filter(m => Object.keys(m).length > 0).length ?? 0;
console.log(`Rooms    : ${payload.tileset?.maps.length} total, ${nonEmptyRooms} with content`);
console.log(`NPCs     : ${payload.sprites?.length}`);
console.log(`Objects  : ${payload.objects?.length} (${payload.objects?.map(o => o.type).join(', ')})`);
console.log('─────────────────────────────────────────────────────────\n');
