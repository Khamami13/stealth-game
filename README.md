# Whisper Vault

[![make.fun](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/c/best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/c/best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/c/best-stealth-game-20261121-1759)

A top-down stealth game that runs offline in a desktop browser from static
files. You are Wisp, a night thief slipping through three lamplit halls:
steal every lumen shard, then reach the teal exit — unseen.

Lantern-wardens patrol with visible vision cones. Their alarm fills as they
see you: calm, then suspicious (they come to look), then a full chase. Bushes
hide you, crates block their sight, and breaking line of sight lets the
alarm drain so a near miss is a scare, not a sentence. Sneak with Shift to
move slower and quieter; footsteps — yours and theirs — are positional, so
you can hear a warden coming through the dark.

## How to play

- **Move:** WASD or arrow keys, or click anywhere to walk there
- **Sneak:** hold Shift (slower, harder to spot, silent)
- **Goal:** collect all shards to unlock the exit, then reach it
- **Lives:** 3 — caught by an alerted warden costs one and sends you back
  to the hall's door
- **Win:** clear all three halls; a "ghost" bonus rewards a hall finished
  without ever raising the alarm

## Play it

Serve `game/` with any static server, for example `node serve.ts`, then open
http://localhost:8080. No build step, no network request, no external files:
every sound is synthesised with WebAudio.

Built for the make.fun bounty "Make the best stealth game".
