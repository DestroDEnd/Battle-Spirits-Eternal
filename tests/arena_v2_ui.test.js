/**
 * tests/arena_v2_ui.test.js
 * 
 * Regression & verification test suite for Arena V2:
 * Modern table UI matching digital TCG layout, circular moving phase nodes,
 * cyan diamond cores, and interactive priority passing.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

test('Arena V2: arena_v2.html markup integrity', () => {
  const htmlPath = path.join(rootDir, 'arena_v2.html');
  assert.ok(fs.existsSync(htmlPath), 'arena_v2.html must exist');
  const html = fs.readFileSync(htmlPath, 'utf8');

  // Verify critical elements requested by the user
  assert.ok(html.includes('id="v2PhaseTrack"'), 'Must have circular moving phase track container');
  assert.ok(html.includes('id="v2CenterPill"'), 'Must have center control pill');
  assert.ok(html.includes('id="v2BtnPassPriority"'), 'Must have Pass Priority button for user interactions');
  assert.ok(html.includes('id="v2BtnOpponentPass"'), 'Must have Opponent Pass button');
  assert.ok(html.includes('id="v2OppLifeCluster"'), 'Must have Opponent Life diamond gem cluster');
  assert.ok(html.includes('id="v2PlayerLifeCluster"'), 'Must have Player Life diamond gem cluster');
  assert.ok(html.includes('id="v2OppFieldSpirits"'), 'Must have Opponent field spirits zone');
  assert.ok(html.includes('id="v2PlayerFieldSpirits"'), 'Must have Player field spirits zone');
  assert.ok(html.includes('href="/arena"'), 'Must link back to classic arena');
});

test('Arena V2: server.js routes mapping', () => {
  const serverPath = path.join(rootDir, 'server.js');
  const content = fs.readFileSync(serverPath, 'utf8');

  assert.ok(content.includes("'/arena-v2': '/arena_v2.html'"), "server.js must route '/arena-v2' to '/arena_v2.html'");
  assert.ok(content.includes("'/arena2': '/arena_v2.html'"), "server.js must route '/arena2' to '/arena_v2.html'");
});

test('Arena V2: arena_v2.css styling rules', () => {
  const cssPath = path.join(rootDir, 'arena_v2.css');
  assert.ok(fs.existsSync(cssPath), 'arena_v2.css must exist');
  const css = fs.readFileSync(cssPath, 'utf8');

  // Circular phase track styles
  assert.ok(css.includes('.v2-phase-track'), 'Must define .v2-phase-track');
  assert.ok(css.includes('.v2-phase-circle'), 'Must define .v2-phase-circle');
  assert.ok(css.includes('.v2-phase-node.active'), 'Must define active glowing circular phase node');

  // Cyan diamond gemstones
  assert.ok(css.includes('.v2-gem-diamond'), 'Must define .v2-gem-diamond');
  assert.ok(css.includes('--v2-cyan-gem'), 'Must define cyan gem color variable');

  // Spirit aura effects
  assert.ok(css.includes('.v2-aura-water'), 'Must define water/electric blue aura');
  assert.ok(css.includes('.v2-aura-purple'), 'Must define purple flame aura');
  assert.ok(css.includes('.v2-aura-gold'), 'Must define golden aura');

  // Exhausted rotation & metallic corner frame
  assert.ok(css.includes('rotate(90deg)'), 'Must rotate exhausted spirits 90 degrees');
  assert.ok(css.includes('.v2-corner-bracket'), 'Must define corner frame brackets');
});

test('Arena V2: battle_arena_v2.js logic and priority passing', () => {
  const jsPath = path.join(rootDir, 'battle_arena_v2.js');
  assert.ok(fs.existsSync(jsPath), 'battle_arena_v2.js must exist');
  const js = fs.readFileSync(jsPath, 'utf8');

  // Verify priority functions and phase steps
  assert.ok(js.includes('passPriorityToOpponent'), 'Must implement passPriorityToOpponent');
  assert.ok(js.includes('passPriorityToPlayer'), 'Must implement passPriorityToPlayer');
  assert.ok(js.includes('handleOpponentPass'), 'Must implement handleOpponentPass');
  assert.ok(js.includes('handlePlayerPass'), 'Must implement handlePlayerPass');
  assert.ok(js.includes("'START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'FLASH', 'END'"), 'Must track the complete 8-step phase sequence');
});
