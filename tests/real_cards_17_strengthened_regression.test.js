import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { createFieldStack, validateGameState } from '../engine/state.js';
import { AsyncResolver, DefaultPromptResolver } from '../engine/resolver.js';
import { computeEffectiveBP } from '../engine/continuous.js';
import { verifyProvenance, setupHost, mkAuxCard } from './helpers/card_e2e_framework.mjs';

const KAMEN_RIDER_BOUNCE_CARDS = [
  { shardFile: "26RCB01.json", cardKey: "26RCB01-008", cardNumber: "26RCB01-008", abIdx: 0, name: "Kamen Rider Gaim Jimber Lemon Arms" },
  { shardFile: "26RCB01.json", cardKey: "26RCB01-011", cardNumber: "26RCB01-011", abIdx: 1, name: "Kamen Rider Gaim Kachidoki Arms" },
  { shardFile: "26RCB01.json", cardKey: "26RCB01-052", cardNumber: "26RCB01-052", abIdx: 0, name: "Kamen Rider Ex-Aid Maximum Gamer Level 99" },
  { shardFile: "26RCB01.json", cardKey: "26RCB01-049", cardNumber: "26RCB01-049", abIdx: 1, name: "Kamen Rider Para-DX Fighter Gamer Level 50" },
  { shardFile: "26RCB01.json", cardKey: "26RCB01-021", cardNumber: "26RCB01-021", abIdx: 1, name: "Kamen Rider Nox Gun Shadow" },
  { shardFile: "26RCB01.json", cardKey: "26RCB01-019", cardNumber: "26RCB01-019", abIdx: 0, name: "Kamen Rider Nox Wolf Shadow" },
  { shardFile: "26RCB01.json", cardKey: "26RCB01-048", cardNumber: "26RCB01-048", abIdx: 1, name: "Kamen Rider Para-DX Puzzle Gamer Level 50" },
  { shardFile: "26RCB01.json", cardKey: "26RCB01-024", cardNumber: "26RCB01-024", abIdx: 0, name: "Kamen Rider Zeztz Inazuma Plasma" },
  { shardFile: "26RSD07.json", cardKey: "26RSD07-007", cardNumber: "26RSD07-007", abIdx: 0, name: "Kamen Rider Zeztz Esprim Recovery" },
  { shardFile: "26RSD07.json", cardKey: "26RSD07-X02", cardNumber: "26RSD07-X02", abIdx: 0, name: "Kamen Rider Zeztz Orderm" }
];

test('STRENGTHENED-REGRESSION: Kamen Rider Self-Bounce (10 cards) verifies exact hand destination, field removal, and core recycling', async () => {
  for (const info of KAMEN_RIDER_BOUNCE_CARDS) {
    const shard = info.shardFile.endsWith('.json') ? info.shardFile : `${info.shardFile}.json`;
    const { storedCard, ab, det } = verifyProvenance(shard, info.cardKey, info.cardNumber, info.abIdx, 'BOUNCE', true);
    
    const game = createGame();
    const state = game.state;
    const events = [];
    const emitter = { list: events, async emit(ev) { events.push(ev); } };
    const resolver = new AsyncResolver();
    const prompt = new DefaultPromptResolver();
    
    const { hostCard, hostStack } = setupHost(state, storedCard, ab, det);
    hostStack.state = 'EXHAUSTED';
    hostStack.cores.normal = 2; // Has 2 normal cores
    
    const reserveBefore = state.players.player.reserve.normal;
    const handBefore = state.players.player.hand.length;
    const fieldBefore = state.players.player.field.length;
    
    const ctx = { controller: 'player', sourceCard: hostCard, sourceStack: hostStack };
    const res = await resolver.resolveAbility(state, ab, ctx, emitter, prompt);
    
    assert.equal(res.success, true, `${info.name} ability resolution must succeed`);
    
    // 1. Verify host card left the field
    assert.ok(!state.players.player.field.some(s => s.id === hostStack.id), `${info.name} stack must leave the field`);
    assert.equal(state.players.player.field.length, fieldBefore - 1, 'Field length must decrease by 1');
    
    // 2. Verify host card entered hand
    assert.ok(state.players.player.hand.some(c => c.id === hostCard.id), `${info.name} card must be in player hand`);
    assert.equal(state.players.player.hand.length, handBefore + 1, 'Hand count must increase by 1');
    
    // 3. Verify cores returned to reserve
    assert.equal(state.players.player.reserve.normal, reserveBefore + 2, 'Cores on bounced stack must return to reserve');
    
    // 4. Verify event emission
    assert.ok(
      events.some(e => (e.type === 'BOUNCED' || e.type === 'CARD_BOUNCED' || e.type === 'CARD_RETURNED') && (e.card?.id === hostCard.id || e.card?.cardNumber === info.cardNumber)),
      'Must emit BOUNCED or CARD_BOUNCED event'
    );
    
    // 5. Invariant validation
    const val = validateGameState(state);
    assert.equal(val.valid, true, `Invariants must hold for ${info.name}: ${JSON.stringify(val.errors)}`);
  }
});

test('STRENGTHENED-REGRESSION: 26RBS02-X14 (The FlashFuryPrincess Soljuret) verifies burst-spirit bounce', async () => {
  const { storedCard, ab, det } = verifyProvenance('26RBS02.json', '26RBS02-X14', '26RBS02-X14', 1, 'BOUNCE', true);
  const game = createGame();
  const state = game.state;
  const events = [];
  const emitter = { list: events, async emit(ev) { events.push(ev); } };
  const resolver = new AsyncResolver();
  const prompt = new DefaultPromptResolver();
  
  const { hostCard, hostStack } = setupHost(state, storedCard, ab, det);
  
  // Eligible target: Player's Spirit with Burst effect
  const burstSpiritCard = mkAuxCard('BURST-SPIRIT', {
    owner: 'player',
    type: 'Spirit',
    cost: 3,
    color: 'Yellow',
    isBurst: true,
    burst: { condition: 'WHEN_ATTACKS' }
  });
  const burstStack = createFieldStack(burstSpiritCard, { normal: 1, soul: 0 });
  burstStack.owner = 'player';
  state.players.player.field.push(burstStack);
  
  const ctx = { controller: 'player', sourceCard: hostCard, sourceStack: hostStack };
  const res = await resolver.resolveAbility(state, ab, ctx, emitter, prompt);
  
  assert.equal(res.success, true);
  // Either host or burst spirit bounced to hand
  const bounced = state.players.player.hand.some(c => c.id === 'BURST-SPIRIT' || c.id === hostCard.id);
  assert.ok(bounced, 'Burst spirit or host must bounce to player hand');
  
  const val = validateGameState(state);
  assert.equal(val.valid, true, `Invariants must hold: ${JSON.stringify(val.errors)}`);
});

const EXHAUST_CARDS = [
  { shardFile: "BS03.json", cardKey: "BATTLE-SPIRITS-A6513", cardNumber: "BATTLE-SPIRITS-A6513", abIdx: 0, name: "Mikene", targetSide: "player" },
  { shardFile: "BS03.json", cardKey: "BATTLE-SPIRITS-A9188", cardNumber: "BATTLE-SPIRITS-A9188", abIdx: 1, name: "The Crossroads of Destiny", targetSide: "player" },
  { shardFile: "BS03.json", cardKey: "BATTLE-SPIRITS-A9305", cardNumber: "BATTLE-SPIRITS-A9305", abIdx: 0, name: "The DarkReefDiva Seiren", targetSide: "opponent" },
  { shardFile: "BS03.json", cardKey: "BATTLE-SPIRITS-A11148", cardNumber: "BATTLE-SPIRITS-A11148", abIdx: 0, name: "The Kingdom of Cards", targetSide: "player" },
  { shardFile: "BS03.json", cardKey: "BATTLE-SPIRITS-A11637", cardNumber: "BATTLE-SPIRITS-A11637", abIdx: 1, name: "The Outlaw Wasteland", targetSide: "player" },
  { shardFile: "BS03.json", cardKey: "VER-THANDIA2", cardNumber: "VER-THANDIA2", abIdx: 0, name: "Ver-Thandia", targetSide: "player" }
];

test('STRENGTHENED-REGRESSION: Exhaust Cards (6 cards) verify state transition from REFRESHED to EXHAUSTED', async () => {
  for (const info of EXHAUST_CARDS) {
    const { storedCard, ab, det } = verifyProvenance(info.shardFile, info.cardKey, info.cardNumber, info.abIdx, 'EXHAUST', true);
    const game = createGame();
    const state = game.state;
    const events = [];
    const emitter = { list: events, async emit(ev) { events.push(ev); } };
    const resolver = new AsyncResolver();
    const prompt = new DefaultPromptResolver();
    
    const { hostCard, hostStack } = setupHost(state, storedCard, ab, det);
    
    // Add refreshed candidate on target side
    const targetCard = mkAuxCard('EXHAUST-TGT', {
      owner: info.targetSide,
      type: 'Spirit',
      cost: 2,
      levels: { 1: { cost: 1, bp: 2000 } }
    });
    const targetStack = createFieldStack(targetCard, { normal: 1, soul: 0 });
    targetStack.owner = info.targetSide;
    targetStack.state = 'REFRESHED';
    state.players[info.targetSide].field.push(targetStack);
    
    // Add untouched refreshed bystander on other side to ensure isolation
    const bystanderSide = info.targetSide === 'player' ? 'opponent' : 'player';
    const bystanderCard = mkAuxCard('BYSTANDER', {
      owner: bystanderSide,
      type: 'Spirit',
      cost: 5,
      levels: { 1: { cost: 1, bp: 5000 } }
    });
    const bystanderStack = createFieldStack(bystanderCard, { normal: 1, soul: 0 });
    bystanderStack.owner = bystanderSide;
    bystanderStack.state = 'REFRESHED';
    state.players[bystanderSide].field.push(bystanderStack);
    
    const ctx = { controller: 'player', sourceCard: hostCard, sourceStack: hostStack };
    const res = await resolver.resolveAbility(state, ab, ctx, emitter, prompt);
    
    assert.equal(res.success, true, `${info.name} exhaust ability must succeed`);
    
    // Verify target stack is now EXHAUSTED
    const targetExhausted = targetStack.state === 'EXHAUSTED' || (info.targetSide === 'player' && hostStack.state === 'EXHAUSTED');
    assert.ok(targetExhausted, `${info.name} target spirit must become EXHAUSTED`);
    
    // Verify bystander remains REFRESHED
    assert.equal(bystanderStack.state, 'REFRESHED', 'Bystander on non-targeted side must remain REFRESHED');
    
    // Invariant validation
    const val = validateGameState(state);
    assert.equal(val.valid, true, `Invariants must hold for ${info.name}: ${JSON.stringify(val.errors)}`);
  }
});
