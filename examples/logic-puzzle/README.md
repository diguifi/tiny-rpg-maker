# tiny-rpg-studio-sdk — Logic Puzzle

A self-contained example that uses the SDK's variable + logic features
(variables, switches, logic gates, LEDs and variable-doors) to build a tiny
puzzle game and print a playable URL.

## Setup

```bash
cd examples/logic-puzzle
npm install
```

> **Note:** `npm install` uses `file:../..` pointing to the local package.
> Make sure to build the SDK first:
>
> ```bash
> # From the repository root
> npm run build:sdk
> ```

---

## Run

```bash
node logic-puzzle.mjs
```

It prints a playable URL such as:

```
https://andredarcie.github.io/tiny-rpg-studio/#v25.g...
```

Open it in a browser to play.

---

## The puzzle

A single room with two levers, an AND gate, an indicator lamp and a locked door:

```
Tiles: 0 = grass (walkable), 10 = stone wall (collision)

 x:  0   1   2   3   4   5   6   7
y0  ##  ##  ##  ##  ##  ##  ##  ##
y1  ##  P    .   .   .   .  ##  ##     P = player start (1,1)
y2  ##  .   L1   .  L2   .  ##  ##     L1/L2 = levers (switches)
y3  ##  .    .   .   .   .  ##  ##
y4  ##  .    .  AND LED  D   E  ##     AND gate, LED, Door, End goal
y5  ##  M    .   .   .   .  ##  ##     M = guide NPC (mage)
y6  ##  .    .   .   .   .  ##  ##
y7  ##  ##  ##  ##  ##  ##  ##  ##
```

- **Two switches (`addSwitch`)** at `(2,2)` and `(4,2)` each flip their own
  boolean variable (`leverA` / `leverB`).
- **An AND gate (`addLogicGate({ type: 'and' })`)** at `(3,4)` reads both lever
  variables and writes its result into a third variable (`gateOut`).
- **An LED (`addLed`)** at `(4,4)` lights up while `gateOut` is ON, giving the
  player visual feedback.
- **A variable-door (`addVariableDoor`)** at `(5,4)` stays locked until
  `gateOut` is ON. It is the only gap in the wall that seals the goal chamber
  (column `x = 6`).
- **The goal (`addEnd`)** sits at `(6,4)` behind that door.

### How to win

Flip **both** levers. Each lever turns its variable ON; the AND gate then sets
`gateOut` ON, the lamp lights up, the variable-door unlocks, and the player can
step through to the end tile. Flipping only one lever is not enough — that is the
whole point of the AND gate.

---

## SDK features demonstrated

| Feature | API |
|---|---|
| Allocate boolean variables | `game.variable('leverA')` |
| Ground walls (8×8 matrix) | `room.ground(matrix)` with `0` floor / `10` wall |
| Toggleable levers | `room.addSwitch({ x, y, variable })` |
| Logic gate (AND) | `room.addLogicGate({ type: 'and', inputA, inputB, output })` |
| Indicator lamp | `room.addLed({ x, y, variable })` |
| Variable-gated door | `room.addVariableDoor({ x, y, variable })` |
| Game-ending tile | `room.addEnd({ x, y, message })` |
| Playable URL | `game.buildURL()` |
