import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileCard } from '../compiler/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const detailedPath = path.join(__dirname, '..', 'data', 'cards_detailed.json');
const cardsData = JSON.parse(fs.readFileSync(detailedPath, 'utf8'));

test('Phase 2 Compiler - Chakrambat (BS01-010)', () => {
  const card = cardsData['BS01-010'];
  assert.ok(card, 'Card BS01-010 exists');

  const ir = compileCard(card);
  assert.equal(ir.cardNumber, 'BS01-010');
  assert.equal(ir.abilities.length, 1);

  const ab = ir.abilities[0];
  assert.deepEqual(ab.header.levels, [1, 2]);
  assert.equal(ab.header.timing, 'WHEN_ATTACKS');
  assert.equal(ab.clauses.length, 1);
  assert.equal(ab.clauses[0].op.op, 'BP_BUFF');
  assert.equal(ab.clauses[0].op.amount, 4000);
});

test('Phase 2 Compiler - Birgoyle (BATTLE-SPIRITS-A27: Or connector)', () => {
  const card = cardsData['BATTLE-SPIRITS-A27'];
  assert.ok(card, 'Birgoyle exists');

  const ir = compileCard(card);
  assert.equal(ir.abilities.length, 2); // summon condition + LV3/4 ability

  const ab = ir.abilities[1];
  assert.deepEqual(ab.header.levels, [3, 4]);
  assert.equal(ab.header.timing, 'WHEN_SUMMONED');
  assert.ok(ab.clauses.length >= 2, 'Has at least 2 clauses connected by Or');

  const clause1 = ab.clauses[0];
  const clause2 = ab.clauses[1];
  assert.equal(clause1.op.op, 'DESTROY');
  assert.equal(clause1.op.target.filters.bpLte, 5000);
  assert.equal(clause2.link, 'or');
  assert.equal(clause2.op.op, 'MOVE_CORE');
  assert.equal(clause2.op.from.zone, 'void');
});

test('Phase 2 Compiler - Evil Flame (BS38-067: Burst + Flash)', () => {
  const card = cardsData['BS38-067'];
  assert.ok(card, 'Evil Flame exists');

  const ir = compileCard(card);
  assert.ok(ir.abilities.length >= 2, 'Has Burst and Flash abilities');

  // Burst ability
  const burstAb = ir.abilities.find(a => a.header.timing === 'BURST');
  assert.ok(burstAb, 'Found Burst ability');
  assert.equal(burstAb.header.burstCondition, 'AFTER_YOUR_LIFE_REDUCED');
  assert.ok(burstAb.clauses.some(c => c.op && c.op.op === 'DESTROY'), 'Burst has DESTROY op');
  assert.ok(burstAb.clauses.some(c => c.link === 'then' && c.op && c.op.op === 'ACTIVATE_FLASH'), 'Then activate flash');

  // Flash ability
  const flashAb = ir.abilities.find(a => a.header.isFlash);
  assert.ok(flashAb, 'Found Flash ability');
  const destroy5k = flashAb.clauses.find(c => c.op && c.op.maxTotalBp === 5000);
  assert.ok(destroy5k, 'Has destroy total 5000 BP');
  const instead10k = flashAb.clauses.find(c => c.link === 'instead' && c.op && c.op.maxTotalBp === 10000);
  assert.ok(instead10k, 'Has instead destroy total 10000 BP');
});

test('Phase 2 Compiler - The Makai Holy Grail (BATTLE-SPIRITS-A2302)', () => {
  const card = cardsData['BATTLE-SPIRITS-A2302'];
  assert.ok(card, 'The Makai Holy Grail exists');

  const ir = compileCard(card);
  const deployedAb = ir.abilities.find(a => a.header.timing === 'WHEN_DEPLOYED');
  assert.ok(deployedAb, 'Found When Deployed ability');
  assert.ok(deployedAb.clauses.some(c => c.op && c.op.op === 'DISCARD_HAND'), 'Has DISCARD_HAND op');
  assert.ok(deployedAb.clauses.some(c => c.op && c.op.op === 'DRAW'), 'Has DRAW op');

  const mainAb = ir.abilities.find(a => a.header.timingLabel.includes('Main Step'));
  assert.ok(mainAb, 'Found Main Step ability');
  assert.ok(mainAb.clauses.some(c => c.op && c.op.op === 'SET_SYMBOL'), 'Has SET_SYMBOL op');
});

test('Phase 2 Compiler - The SacredEmperor Siegfrieden XV (BS66-XV02)', () => {
  const card = cardsData['BS66-XV02'];
  assert.ok(card, 'Siegfrieden XV exists');

  const ir = compileCard(card);
  const burstAb = ir.abilities.find(a => a.header.timing === 'BURST');
  assert.ok(burstAb, 'Found Burst ability');
  assert.equal(burstAb.header.burstCondition, 'AFTER_YOUR_SPIRIT_DESTROYED_BY_OPPONENT');
  assert.ok(burstAb.clauses.some(c => c.op && c.op.op === 'DRAW' && c.op.count === 2), 'Draws 2 cards');
  assert.ok(burstAb.clauses.some(c => c.link === 'afterResolves' && c.op && c.op.op === 'SUMMON_FREE'), 'Free summon after resolves');

  const mainAb = ir.abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
  assert.ok(mainAb, 'Found LV1-3 ability');
  assert.ok(mainAb.clauses.some(c => c.op && c.op.mode === 'TOTAL_COST_LTE' && c.op.maxTotalCost === 9), 'Destroy up to cost 9');
});

test('Phase 2 Compiler - The EarthDeitySword Gaianohoko (SD28-X02: Burst lock)', () => {
  const card = cardsData['SD28-X02'];
  assert.ok(card, 'Gaianohoko exists');

  const ir = compileCard(card);
  const burstLockAb = ir.abilities.find(a => a.clauses.some(c => c.op && c.op.op === 'BURST_LOCK'));
  assert.ok(burstLockAb, 'Found Burst Lock ability');
  assert.ok(burstLockAb.header.prefixes.includes('During Brave'), 'Prefix is During Brave');
});

test('Phase 2 Compiler - The PartnerDemonLord Javad (SD65-CX01)', () => {
  const card = cardsData['SD65-CX01'];
  assert.ok(card, 'PartnerDemonLord Javad exists');

  const ir = compileCard(card);
  assert.ok(ir.keywords.some(k => k.name === 'Soul State' || k.name === 'Contract Pre-Advent'), 'Has Soul State / Contract keywords');
  
  const counterAb = ir.abilities.find(a => a.clauses.some(c => c.op && c.op.op === 'ADD_COUNTER'));
  assert.ok(counterAb, 'Found Counter increment ability');
  const counterClause = counterAb.clauses.find(c => c.op && c.op.op === 'ADD_COUNTER');
  assert.equal(counterClause.op.count, 2, 'Counters +2');
});

test('Phase 2 Compiler - Evil Draw (BATTLE-SPIRITS-A4233)', () => {
  const card = cardsData['BATTLE-SPIRITS-A4233'];
  assert.ok(card, 'Evil Draw exists');

  const ir = compileCard(card);
  const mainAb = ir.abilities.find(a => a.header.isMain);
  assert.ok(mainAb, 'Has Main ability');
  assert.ok(mainAb.clauses.some(c => c.op && c.op.op === 'DRAW' && c.op.count === 2), 'Draws 2 cards');
  assert.ok(mainAb.clauses.some(c => c.op && c.op.op === 'DESTROY'), 'Has conditional destroy');

  const flashAb = ir.abilities.find(a => a.header.isFlash);
  assert.ok(flashAb, 'Has Flash ability');
  assert.ok(flashAb.clauses.some(c => c.op && c.op.op === 'BP_BUFF' && c.op.amount === 2000), 'Gives +2000 BP');
});

test('Phase 2 Compiler - The TwinkleDragonEmperor New-Siegfried (BS40-X01)', () => {
  const card = cardsData['BS40-X01'];
  assert.ok(card, 'New-Siegfried exists');

  const ir = compileCard(card);
  assert.ok(ir.keywords.some(k => k.name === 'Advent'), 'Has Advent keyword');
  assert.ok(ir.keywords.some(k => k.name === 'Twinkle Awaken'), 'Has Twinkle Awaken keyword');

  const adventAb = ir.abilities.find(a => a.clauses.some(c => c.op && c.op.op === 'ADVENT_STACK'));
  assert.ok(adventAb, 'Has Advent stacking op');

  const atkAb = ir.abilities.find(a => a.header.timing === 'WHEN_ATTACKS');
  assert.ok(atkAb, 'Has When Attacks ability');
  assert.ok(atkAb.clauses.some(c => c.op && c.op.op === 'DISCARD_PRE_ADVENT'), 'Discards pre-Advent card');
  assert.ok(atkAb.clauses.some(c => c.op && c.op.op === 'BP_BUFF' && c.op.amount === 10000), '+10000 BP');
  assert.ok(atkAb.clauses.some(c => c.op && c.op.op === 'TARGET_ATTACK'), 'Target attacks');
});

test('Phase 2 Compiler - The MakaiSoldier Curse Swordsman (SD41-004)', () => {
  const card = cardsData['SD41-004'];
  assert.ok(card, 'Curse Swordsman exists');

  const ir = compileCard(card);
  const atkAb = ir.abilities.find(a => a.header.timing === 'WHEN_ATTACKS');
  assert.ok(atkAb, 'Has When Attacks ability');
  const moveCore = atkAb.clauses.find(c => c.op && c.op.op === 'MOVE_CORE');
  assert.ok(moveCore, 'Has MOVE_CORE op');
  assert.equal(moveCore.op.chooser, 'opp', 'Opponent chooses the spirit');
  const drawClause = atkAb.clauses.find(c => c.op && c.op.op === 'DRAW');
  assert.ok(drawClause, 'Has DRAW op');
  assert.equal(drawClause.link, 'byDoing', 'Draw happens only by doing so');
});

test('Phase 2 Compiler - Gran-Dolbalkan (BS01-094)', () => {
  const card = cardsData['BS01-094'];
  assert.ok(card, 'Gran-Dolbalkan exists');

  const ir = compileCard(card);
  const ab = ir.abilities[0];
  assert.ok(ab.clauses.some(c => c.op && c.op.op === 'END_BATTLE'), 'Immediately ends battle');
});

