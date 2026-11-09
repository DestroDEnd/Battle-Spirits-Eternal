/**
 * tests/terra_dragon_and_keywords.test.js
 * 
 * Verifies Terra Dragon card suite, Soul Core requirements, End Step retrieval,
 * and comprehensive keyword badge highlighting (English & Japanese brackets).
 * 
 * Target Cards:
 * 1. BS22-X01: The PrimitiveKing Gigano-Rex (Clash, Rush: Green, Lv2 BP boost)
 * 2. BS40-078: Dyna Power (Main: all Terra Dragons +3000 BP & target attack; End Step trash retrieval)
 * 3. BS22-005 / BATTLE-SPIRITS-A7121: Ovirapt (When Summoned: all Terra Dragons +1000 BP; When Attacks +2000 BP)
 * 4. SD29-CP01: Ashigaru Raptor (When Attacks: strictly requires Soul Core on card to draw)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { PerCardRegistry } from '../engine/cards/registry.js';
import '../engine/cards/sets/standard_and_custom_decks.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function createMockContext(opts = {}) {
  const playerField = opts.playerField || [];
  const playerHand = opts.playerHand || [];
  const playerDeck = opts.playerDeck || [];
  const playerTrash = opts.playerTrash || [];
  const playerNexus = opts.playerNexus || [];

  const duelState = {
    turn: opts.turn || 1,
    activePlayer: 'player',
    player: {
      field: playerField,
      hand: playerHand,
      deck: playerDeck,
      trashCards: playerTrash,
      trash: playerTrash.length,
      nexus: playerNexus,
      reserve: opts.playerReserve || 5,
      soulCoreLocation: opts.soulCoreLocation || 'reserve',
      soulCoreSpiritUid: opts.soulCoreSpiritUid || null
    },
    opponent: {
      field: opts.opponentField || [],
      hand: [],
      deck: [],
      trashCards: [],
      trash: 0,
      nexus: [],
      reserve: 5
    }
  };

  const arenaApi = {
    recalculateSpiritBp: (s) => {
      s.currentBp = (s.bp || 3000) + (s.turnBpBoost || 0);
    },
    getFriendlySymbols: (side) => {
      return opts.friendlySymbols || { byColor: { red: 2, green: 1 }, rainbow: 0, total: 3 };
    },
    addLog: () => {},
    AudioFX: {
      bpBoost: () => {},
      refresh: () => {},
      drawCard: () => {},
      magic: () => {}
    },
    renderDuelTable: () => {},
    renderPlayerHand: () => {}
  };

  return {
    card: opts.card,
    side: 'player',
    duelState,
    arenaApi
  };
}

// ────────────────────────────────────────────────────────────
// 1. BS22-X01: The PrimitiveKing Gigano-Rex
// ────────────────────────────────────────────────────────────
test('BS22-X01 Gigano-Rex: registers in PerCardRegistry', () => {
  assert.ok(PerCardRegistry.has('BS22-X01', 'WHEN_ATTACKS'), 'BS22-X01 must have WHEN_ATTACKS handler');
});

test('BS22-X01 Gigano-Rex: Clash forces block & Rush (Green) refreshes all Terra Dragons', () => {
  const rex = {
    card_number: 'BS22-X01',
    name: 'The PrimitiveKing Gigano-Rex',
    type: 'Spirit',
    family: 'Terra Dragon',
    currentLevel: 1,
    bp: 7000,
    currentBp: 7000,
    turnBpBoost: 0,
    isExhausted: true
  };

  const ashigaru = {
    card_number: 'SD29-CP01',
    name: 'Ashigaru Raptor',
    type: 'Spirit',
    family: 'Terra Dragon',
    currentLevel: 1,
    bp: 3000,
    isExhausted: true
  };

  const nonTd = {
    card_number: 'BS01-001',
    name: 'Blade Dragon',
    type: 'Spirit',
    family: 'Astral Dragon',
    currentLevel: 1,
    bp: 1000,
    isExhausted: true
  };

  const ctx = createMockContext({
    card: rex,
    playerField: [rex, ashigaru, nonTd],
    friendlySymbols: { byColor: { green: 1, red: 2 }, rainbow: 0 }
  });

  PerCardRegistry.execute('BS22-X01', 'WHEN_ATTACKS', ctx);

  assert.strictEqual(rex.hasClash, true, 'Gigano-Rex must gain hasClash = true');
  assert.strictEqual(rex.isExhausted, false, 'Gigano-Rex (Terra Dragon) must be refreshed by Rush (Green)');
  assert.strictEqual(ashigaru.isExhausted, false, 'Ashigaru Raptor (Terra Dragon) must be refreshed by Rush (Green)');
  assert.strictEqual(nonTd.isExhausted, true, 'Non-Terra Dragon spirit must remain exhausted');
});

test('BS22-X01 Gigano-Rex: Lv2 (When Attacks) boosts BP by +5000 per Terra Dragon', () => {
  const rex = {
    card_number: 'BS22-X01',
    name: 'The PrimitiveKing Gigano-Rex',
    type: 'Spirit',
    family: 'Terra Dragon',
    currentLevel: 2,
    bp: 12000,
    currentBp: 12000,
    turnBpBoost: 0
  };

  const td2 = {
    card_number: 'BS22-005',
    name: 'Ovirapt',
    type: 'Spirit',
    family: 'Terra Dragon',
    currentLevel: 1,
    bp: 2000
  };

  const td3 = {
    card_number: 'SD29-CP01',
    name: 'Ashigaru Raptor',
    type: 'Spirit',
    family: 'Terra Dragon',
    currentLevel: 1,
    bp: 3000
  };

  const ctx = createMockContext({
    card: rex,
    playerField: [rex, td2, td3],
    friendlySymbols: { byColor: { red: 2 }, rainbow: 0 } // No green symbol
  });

  PerCardRegistry.execute('BS22-X01', 'WHEN_ATTACKS', ctx);

  // 3 Terra Dragons on field * 5000 = +15,000 BP
  assert.strictEqual(rex.turnBpBoost, 15000, 'Lv2 Gigano-Rex must gain +15,000 BP for 3 Terra Dragons');
  assert.strictEqual(rex.currentBp, 27000, 'Total BP must be 12,000 + 15,000 = 27,000');
});

// ────────────────────────────────────────────────────────────
// 2. BS40-078: Dyna Power
// ────────────────────────────────────────────────────────────
test('BS40-078 Dyna Power: registers MAIN, FLASH, and END_STEP in PerCardRegistry', () => {
  assert.ok(PerCardRegistry.has('BS40-078', 'MAIN'), 'BS40-078 must have MAIN trigger');
  assert.ok(PerCardRegistry.has('BS40-078', 'FLASH'), 'BS40-078 must have FLASH trigger');
  assert.ok(PerCardRegistry.has('BS40-078', 'END_STEP'), 'BS40-078 must have END_STEP trigger');
});

test('BS40-078 Dyna Power: MAIN boosts ALL friendly Terra Dragons by +3000 BP & grants target attack', () => {
  const td1 = {
    card_number: 'BS22-X01',
    name: 'Gigano-Rex',
    type: 'Spirit',
    family: 'Terra Dragon',
    bp: 7000,
    currentBp: 7000,
    turnBpBoost: 0
  };

  const td2 = {
    card_number: 'SD29-CP01',
    name: 'Ashigaru Raptor',
    type: 'Spirit',
    family: 'Terra Dragon',
    bp: 3000,
    currentBp: 3000,
    turnBpBoost: 0
  };

  const nonTd = {
    card_number: 'BS01-001',
    name: 'Blade Dragon',
    type: 'Spirit',
    family: 'Astral Dragon',
    bp: 2000,
    currentBp: 2000,
    turnBpBoost: 0
  };

  const dynaPower = {
    card_number: 'BS40-078',
    name: 'Dyna Power',
    type: 'Magic'
  };

  const ctx = createMockContext({
    card: dynaPower,
    playerField: [td1, td2, nonTd]
  });

  PerCardRegistry.execute('BS40-078', 'MAIN', ctx);

  assert.strictEqual(td1.turnBpBoost, 3000, 'Terra Dragon 1 must gain +3000 BP');
  assert.strictEqual(td1.canTargetAttack, true, 'Terra Dragon 1 must gain canTargetAttack');
  assert.strictEqual(td2.turnBpBoost, 3000, 'Terra Dragon 2 must gain +3000 BP');
  assert.strictEqual(td2.canTargetAttack, true, 'Terra Dragon 2 must gain canTargetAttack');
  assert.strictEqual(nonTd.turnBpBoost, 0, 'Non-Terra Dragon spirit must not gain BP buff');
  assert.strictEqual(nonTd.canTargetAttack, undefined, 'Non-Terra Dragon spirit must not gain target attack');
});

test('BS40-078 Dyna Power: END_STEP returns from Trash to Hand when controlling a Terra Dragon', () => {
  const dynaPower = {
    card_number: 'BS40-078',
    name: 'Dyna Power',
    type: 'Magic'
  };

  const td = {
    card_number: 'BS22-005',
    name: 'Ovirapt',
    type: 'Spirit',
    family: 'Terra Dragon'
  };

  const ctx = createMockContext({
    card: dynaPower,
    playerField: [td],
    playerTrash: [dynaPower],
    playerHand: []
  });

  PerCardRegistry.execute('BS40-078', 'END_STEP', ctx);

  assert.strictEqual(ctx.duelState.player.hand.length, 1, 'Dyna Power must be returned to Hand');
  assert.strictEqual(ctx.duelState.player.hand[0].card_number, 'BS40-078');
  assert.strictEqual(ctx.duelState.player.trashCards.length, 0, 'Trash must no longer contain Dyna Power');
});

// ────────────────────────────────────────────────────────────
// 3. BS22-005 / BATTLE-SPIRITS-A7121: Ovirapt
// ────────────────────────────────────────────────────────────
test('BS22-005 Ovirapt: WHEN_SUMMONED grants +1000 BP to ALL friendly Terra Dragons', () => {
  const ovirapt = {
    card_number: 'BS22-005',
    name: 'Ovirapt',
    type: 'Spirit',
    family: 'Terra Dragon',
    bp: 2000,
    currentBp: 2000,
    turnBpBoost: 0
  };

  const allyTd = {
    card_number: 'SD29-CP01',
    name: 'Ashigaru Raptor',
    type: 'Spirit',
    family: 'Terra Dragon',
    bp: 3000,
    currentBp: 3000,
    turnBpBoost: 0
  };

  const nonTd = {
    card_number: 'BS01-001',
    name: 'Blade Dragon',
    type: 'Spirit',
    family: 'Astral Dragon',
    bp: 1000,
    currentBp: 1000,
    turnBpBoost: 0
  };

  const ctx = createMockContext({
    card: ovirapt,
    playerField: [ovirapt, allyTd, nonTd]
  });

  PerCardRegistry.execute('BS22-005', 'WHEN_SUMMONED', ctx);

  assert.strictEqual(ovirapt.turnBpBoost, 1000, 'Ovirapt must gain +1000 BP');
  assert.strictEqual(allyTd.turnBpBoost, 1000, 'Ally Terra Dragon must gain +1000 BP');
  assert.strictEqual(nonTd.turnBpBoost, 0, 'Non-Terra Dragon spirit must not gain BP');
});

// ────────────────────────────────────────────────────────────
// 4. SD29-CP01: Ashigaru Raptor
// ────────────────────────────────────────────────────────────
test('SD29-CP01 Ashigaru Raptor: strictly requires Soul Core on card to draw', () => {
  const raptor = {
    card_number: 'SD29-CP01',
    uid: 'raptor_01',
    name: 'Ashigaru Raptor',
    type: 'Spirit',
    hasSoulCore: false,
    cores: { normal: 1, soul: 0 }
  };

  const deckCard = { name: 'Dyna Power', card_number: 'BS40-078' };

  // Case A: Soul Core is NOT on raptor
  const ctxWithoutSoul = createMockContext({
    card: raptor,
    playerField: [raptor],
    playerDeck: [deckCard],
    playerHand: [],
    soulCoreLocation: 'reserve'
  });

  PerCardRegistry.execute('SD29-CP01', 'WHEN_ATTACKS', ctxWithoutSoul);
  assert.strictEqual(ctxWithoutSoul.duelState.player.hand.length, 0, 'Must NOT draw card when Soul Core is not on spirit');
  assert.strictEqual(ctxWithoutSoul.duelState.player.deck.length, 1, 'Deck remains untouched');

  // Case B: Soul Core IS on raptor
  raptor.hasSoulCore = true;
  raptor.cores.soul = 1;
  const ctxWithSoul = createMockContext({
    card: raptor,
    playerField: [raptor],
    playerDeck: [deckCard],
    playerHand: [],
    soulCoreLocation: 'field',
    soulCoreSpiritUid: 'raptor_01'
  });

  PerCardRegistry.execute('SD29-CP01', 'WHEN_ATTACKS', ctxWithSoul);
  assert.strictEqual(ctxWithSoul.duelState.player.hand.length, 1, 'Must draw 1 card when Soul Core is placed on spirit');
  assert.strictEqual(ctxWithSoul.duelState.player.hand[0].card_number, 'BS40-078');
});

// ────────────────────────────────────────────────────────────
// 5. Keyword Formatting Regex & Badges
// ────────────────────────────────────────────────────────────
test('Keyword Highlighting: formats [Rush: Green] and Japanese brackets 【連鎖】 & 【激突】', () => {
  const appJsSrc = fs.readFileSync(path.join(rootDir, 'app.js'), 'utf8');

  // Regex must support parameterized Rush: Rush(?::[^\]]+)?
  assert.match(appJsSrc, /Rush\(\?::\[\^\\\]\]\+\)\?/);

  // Must match Japanese bracket 【連鎖...】 and 【激突】
  assert.match(appJsSrc, /【\(連鎖/);
  assert.match(appJsSrc, /激突/);
});

// ────────────────────────────────────────────────────────────
// 6. Keywords Route & HTML Page
// ────────────────────────────────────────────────────────────
test('Keywords Route: /keywords exists in server.js ROUTE_MAP and keywords.html is present', () => {
  const serverJsSrc = fs.readFileSync(path.join(rootDir, 'server.js'), 'utf8');
  assert.ok(serverJsSrc.includes("'/keywords': '/keywords.html'"), 'ROUTE_MAP must contain /keywords');

  const keywordsHtmlPath = path.join(rootDir, 'keywords.html');
  assert.ok(fs.existsSync(keywordsHtmlPath), 'keywords.html must exist');
});
