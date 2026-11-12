/**
 * tests/sd46_card_effects.test.js
 * 
 * Regression Test Suite for SD46 (Collaboration Starter: Battle Spirits Double Drive - Shunta & Yoku).
 * Verifies 100% deterministic execution of SD46 canonical card effects,
 * Blitz-Tiger-Z, Revol-Tiger-Z, Igridios-Z, and Grandwalker Mogami Shunta mechanics.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getCardOverride, SD46_OVERRIDES } from '../compiler/overrides/index.js';
import { createGameState, createCardInstance, createFieldStack, resetInstanceIdCounter } from '../engine/state.js';
import { AsyncResolver } from '../engine/resolver.js';
import { EventBus } from '../engine/events.js';
import { queryCandidates } from '../engine/selectors.js';
import { canBlock, computeColors, computeEffectiveBP, computeSymbols, isImmune } from '../engine/continuous.js';
import { moveCore } from '../engine/zones.js';
import { createGame } from '../engine/index.js';
import { moveCard } from '../engine/zones.js';
import { executeOp } from '../engine/ops/index.js';

describe('SD46 Card Effects & Mechanics Regression Suite', () => {

  const makeEngineCard = (number, name, type = 'Spirit', extra = {}, owner = 'player') => createCardInstance({
    card_number: number,
    name,
    type,
    color: extra.color || 'Red',
    colors: extra.colors || [extra.color || 'Red'],
    family: extra.family || '',
    families: extra.families || (extra.family ? [extra.family] : []),
    cost: extra.cost ?? 2,
    levels: extra.levels || { 1: { cost: 1, bp: extra.bp || 1000 }, 2: { cost: 3, bp: (extra.bp || 1000) + 2000 } },
    compiledIr: extra.compiledIr || null,
    ...extra
  }, owner);

  const field = (state, owner, card, cores = 1) => {
    const stack = createFieldStack(card, { normal: cores, soul: 0 });
    state.players[owner].field.push(stack);
    return stack;
  };

  describe('0. Runtime resolution (compiled IR through the rules engine)', () => {
    it('LM16-01 Accel prompts for the matching Brave, adds both matches, discards the rest, and opens itself', async () => {
      const game = createGame();
      const source = makeEngineCard('LM16-01', 'The FiftyFirstBeast Revol-Koleon', 'Spirit', {
        family: 'Ten Crown',
        compiledIr: getCardOverride('LM16-01')
      });
      game.state.players.player.hand.push(source);
      const braveA = makeEngineCard('T-IMAGINE-A', 'Imagine Brave A', 'Brave', { family: 'Imagine' });
      const braveB = makeEngineCard('T-IMAGINE-B', 'Imagine Brave B', 'Brave', { family: 'Imagine' });
      const king = makeEngineCard('T-TEN-CROWN', 'Ten Crown Spirit', 'Spirit', { family: 'Ten Crown' });
      const unmatched = makeEngineCard('T-OTHER', 'Other Spirit', 'Spirit', { family: 'Other' });
      game.state.players.player.deck.push(braveA, braveB, king, unmatched);
      const ability = getCardOverride('LM16-01').abilities[0];
      const choices = [];
      const resolver = new AsyncResolver({
        async choose(prompt) {
          if (prompt.type === 'CONFIRM_OPTIONAL') return { accepted: true };
          choices.push(prompt);
          return [prompt.candidates[1] || prompt.candidates[0]];
        }
      });

      await resolver.resolveAbility(game.state, ability, {
        controller: 'player',
        sourceCard: source,
        sourceStack: null
      }, game.events);

      assert.equal(choices.length, 1, 'two eligible Braves should open a card choice prompt');
      assert.deepEqual(game.state.players.player.hand.map(card => card.id).sort(), [braveB.id, king.id].sort());
      assert.deepEqual(game.state.players.player.grave.map(card => card.id), [braveA.id]);
      assert.deepEqual(game.state.players.player.deck.map(card => card.id), [unmatched.id]);
      assert.ok(game.state.players.player.removed.some(card => card.id === source.id), 'Accel should move Revol-Koleon to the Removed Zone');
    });

    it('LM16-01 summoned from the Removed Zone can summon one Imagine Brave for no cost', async () => {
      const game = createGame();
      const source = makeEngineCard('LM16-01', 'The FiftyFirstBeast Revol-Koleon', 'Spirit', {
        family: 'Ten Crown',
        compiledIr: getCardOverride('LM16-01')
      });
      const stack = field(game.state, 'player', source, 1);
      const brave = makeEngineCard('T-IMAGINE-BRAVE', 'Imagine Brave', 'Brave', { family: 'Imagine' });
      game.state.players.player.hand.push(brave);
      game.state.players.player.reserve.normal = 2;
      const ability = getCardOverride('LM16-01').abilities[1];

      await new AsyncResolver({ async choose(prompt) {
        if (prompt.type === 'CONFIRM_OPTIONAL') return { accepted: true };
        return prompt.candidates.slice(0, 1);
      } })
        .resolveAbility(game.state, ability, {
          controller: 'player',
          sourceCard: source,
          sourceStack: stack,
          summonFromRemoved: true
        }, game.events);

      assert.ok(game.state.players.player.field.some(item => item.top.id === brave.id), 'the selected Imagine Brave should be summoned');
      assert.equal(game.state.players.player.hand.some(card => card.id === brave.id), false);
      assert.equal(game.state.players.player.reserve.normal, 1, 'only the normal LV1 core should be allocated; no summon cost should be paid');
    });

    it('Void cores can be moved onto a Grandwalker Nexus and tracked in state', async () => {
      const state = createGameState();
      const nexus = makeEngineCard('SD46-CP01', 'Mogami Shunta', 'Nexus', { family: 'Grandwalker' });
      const stack = field(state, 'player', nexus, 1);
      state.players.player.voidCores.normal = 2;
      const moved = await moveCore(state, 2, { zone: 'void', side: 'player' }, { zone: 'field', side: 'player', stackId: stack.id });
      assert.equal(moved, true);
      assert.equal(stack.cores.normal, 3);
      assert.equal(state.players.player.voidCores.normal, 0);
      assert.equal((await moveCore(state, 1, { zone: 'field', side: 'player', stackId: stack.id }, { zone: 'void', side: 'player' })), true);
      assert.equal(state.players.player.voidCores.normal, 1);
    });

    it('SD46-007 passive immunity blocks opposing Spirit and Nexus effects but not Magic', () => {
      const state = createGameState();
      const target = makeEngineCard('SD46-007', 'Tigrigoreus', 'Spirit', { compiledIr: getCardOverride('SD46-007') });
      const stack = field(state, 'player', target);
      assert.equal(isImmune(state, stack, makeEngineCard('T-SPIRIT', 'source', 'Spirit', {}, 'opponent')), true);
      assert.equal(isImmune(state, stack, makeEngineCard('T-NEXUS', 'source', 'Nexus', {}, 'opponent')), true);
      assert.equal(isImmune(state, stack, makeEngineCard('T-MAGIC', 'source', 'Magic', {}, 'opponent')), false);
    });

    it('SD46-007 can block while exhausted and gains BP during the opponent attack step', () => {
      const state = createGameState();
      const source = makeEngineCard('SD46-007', 'Tigrigoreus', 'Spirit', { compiledIr: getCardOverride('SD46-007') });
      const defender = field(state, 'player', source, 3);
      defender.state = 'EXHAUSTED';
      const attacker = field(state, 'opponent', makeEngineCard('T-ATTACKER', 'Attacker', 'Spirit', {}, 'opponent'));
      state.combat = { attackerStackId: attacker.id, blockerStackId: null };
      assert.equal(computeEffectiveBP(state, defender), 6000);
      assert.equal(canBlock(state, defender), true);
    });

    it('Mogami Shunta protects its Grandwalker Nexus and restricts core movement to explicit targeting', async () => {
      const state = createGameState();
      const nexusCard = makeEngineCard('SD46-CP01', 'Mogami Shunta', 'Nexus', { family: 'Grandwalker', compiledIr: getCardOverride('SD46-CP01') });
      const nexus = field(state, 'player', nexusCard, 1);
      const source = makeEngineCard('T-EFFECT', 'Nexus effect', 'Spirit', {}, 'opponent');
      assert.equal(queryCandidates(state, { side: 'opp', types: ['Nexus'] }, { controller: 'opponent', sourceCard: source }).length, 0);
      assert.equal(queryCandidates(state, { side: 'opp', types: ['Grandwalker Nexus'] }, { controller: 'opponent', sourceCard: source }).length, 1);
      state.players.player.reserve.normal = 2;
      assert.equal(await moveCore(state, 1, { zone: 'reserve', side: 'player' }, { zone: 'field', side: 'player', stackId: nexus.id }), false);
      assert.equal(await moveCore(state, 1, { zone: 'reserve', side: 'player' }, { zone: 'field', side: 'player', stackId: nexus.id }, { targetsGrandwalker: true }), true);
    });

    it('Braves attached to Spirits are found by Brave selectors', () => {
      const state = createGameState();
      const host = makeEngineCard('T-HOST', 'Host', 'Spirit');
      const brave = makeEngineCard('T-BRAVE', 'Attached Brave', 'Brave');
      const stack = field(state, 'opponent', host);
      stack.braves.push(brave);
      const found = queryCandidates(state, { side: 'opp', types: ['Brave'] }, { controller: 'player' });
      assert.deepEqual(found.map(candidate => candidate.card.id), [brave.id]);
    });

    it('SD46-001 adds only the specified two cards from its reveal and discards the rest', async () => {
      const state = createGameState();
      const source = makeEngineCard('SD46-001', 'Thunder-Z-Puma', 'Spirit', { compiledIr: getCardOverride('SD46-001') });
      const shunta = makeEngineCard('SD46-CP01', 'Mogami Shunta', 'Nexus');
      const target = makeEngineCard('T-GODKING', 'Red God King', 'Spirit', { color: 'Red', family: 'God-King' });
      const unrelated = makeEngineCard('T-OTHER', 'Unrelated', 'Spirit', { color: 'Blue', family: 'Beast' });
      state.players.player.deck.push(shunta, target, unrelated);
      const ability = getCardOverride('SD46-001').abilities[0];
      await new AsyncResolver().resolveAbility(state, ability, { controller: 'player', sourceCard: source }, new EventBus());
      assert.deepEqual(state.players.player.hand, [shunta, target]);
      assert.deepEqual(state.players.player.grave, [unrelated]);
    });

    it('SD46-001 is treated as both its printed color and White for color and symbols', () => {
      const card = makeEngineCard('SD46-001', 'Thunder-Z-Puma', 'Spirit', { compiledIr: getCardOverride('SD46-001'), color: 'Red' });
      const stack = createFieldStack(card);
      assert.deepEqual(computeColors(createGameState(), stack), ['Red', 'White']);
      assert.deepEqual(computeSymbols(createGameState(), stack), ['Red', 'White']);
    });

    it('SD46-001 adds three cards to Bombardment reveals during its controller’s attack step', async () => {
      const game = createGame();
      const support = makeEngineCard('SD46-001', 'Thunder-Z-Puma', 'Spirit', { compiledIr: getCardOverride('SD46-001') });
      field(game.state, 'player', support, 3);
      const bombardment = makeEngineCard('SD46-X02', 'Revol-Tiger-Z', 'Spirit', { compiledIr: getCardOverride('SD46-X02') });
      game.state.activePlayer = 'player';
      game.state.step = 'ATTACK';
      game.state.players.player.deck.push(...Array.from({ length: 4 }, (_, i) => makeEngineCard(`T-REVEAL-${i}`, `Reveal ${i}`)));
      const result = await executeOp(game.state, { op: 'REVEAL_DECKTOP', count: 1 }, { controller: 'player', sourceCard: bombardment }, game.resolver.promptResolver, game.events);
      assert.equal(result.count, 4);
    });

    it('Mogami Shunta sends an opponent Life to Reserve when revealed by a Bombardment keyword', async () => {
      const game = createGame();
      const revealed = makeEngineCard('SD46-CP01', 'Mogami Shunta', 'Nexus', { compiledIr: getCardOverride('SD46-CP01') });
      const bombardment = makeEngineCard('SD46-X02', 'Revol-Tiger-Z', 'Spirit', { compiledIr: getCardOverride('SD46-X02') });
      game.state.players.player.deck.push(revealed);
      const before = game.state.players.opponent.life;
      await executeOp(game.state, { op: 'REVEAL_DECKTOP', count: 1 }, { controller: 'player', sourceCard: bombardment }, game.resolver.promptResolver, game.events);
      assert.equal(game.state.players.opponent.life, before - 1);
      assert.equal(game.state.players.opponent.reserve.normal, 4);
    });

    it('SD46-007 Main Accel draws one card, then moves itself to the Removed Zone', async () => {
      resetInstanceIdCounter();
      const state = createGameState();
      const accel = createCardInstance({
        card_number: 'SD46-007', name: 'The SteelThunderKnight Tigrigoreus',
        type: 'Spirit', cost: 3, levels: { 1: { cost: 1, bp: 1000 } }
      }, 'player');
      const topDeckCard = createCardInstance({
        card_number: 'TEST-DRAW-001', name: 'Draw Test', type: 'Spirit', cost: 1
      }, 'player');
      state.players.player.hand.push(accel);
      state.players.player.deck.push(topDeckCard);

      const ability = getCardOverride('SD46-007').abilities[0];
      const result = await new AsyncResolver().resolveAbility(state, ability, {
        controller: 'player', sourceCard: accel
      }, new EventBus());

      assert.equal(result.success, true);
      assert.deepEqual(state.players.player.hand, [topDeckCard]);
      assert.deepEqual(state.players.player.removed, [accel]);
      assert.equal(state.players.player.deck.length, 0);
    });

    it('SD46-X03 Flash Accel returns three opposing Spirits or Ultimates, then removes itself', async () => {
      resetInstanceIdCounter();
      const state = createGameState();
      const source = makeEngineCard('SD46-X03', 'Igridios-Z', 'Spirit', { compiledIr: getCardOverride('SD46-X03') });
      state.players.player.hand.push(source);
      const targets = [
        makeEngineCard('T-SPIRIT-1', 'Target Spirit 1', 'Spirit', {}, 'opponent'),
        makeEngineCard('T-ULTIMATE-1', 'Target Ultimate', 'Ultimate', {}, 'opponent'),
        makeEngineCard('T-SPIRIT-2', 'Target Spirit 2', 'Spirit', {}, 'opponent')
      ];
      targets.forEach(card => field(state, 'opponent', card));
      const ability = getCardOverride('SD46-X03').abilities.find(a => a.header.timing === 'FLASH');

      await new AsyncResolver().resolveAbility(state, ability, { controller: 'player', sourceCard: source }, new EventBus());

      assert.equal(state.players.opponent.field.length, 0);
      assert.equal(state.players.opponent.hand.length, 3);
      assert.deepEqual(state.players.opponent.hand, targets);
      assert.deepEqual(state.players.player.removed, [source]);
    });

    it('SD46-X01 follows the first destroyed Spirit family when choosing its second target', async () => {
      resetInstanceIdCounter();
      const state = createGameState();
      const source = makeEngineCard('SD46-X01', 'Blitz-Tiger-Z', 'Spirit', { compiledIr: getCardOverride('SD46-X01') });
      const first = makeEngineCard('T-WOLF-1', 'Wolf Spirit', 'Spirit', { family: 'Wolf', bp: 8000 }, 'opponent');
      const unrelated = makeEngineCard('T-SNAKE-1', 'Snake Spirit', 'Spirit', { family: 'Snake', bp: 4000 }, 'opponent');
      const relatedUltimate = makeEngineCard('T-WOLF-U', 'Wolf Ultimate', 'Ultimate', { family: 'Wolf', bp: 10000 }, 'opponent');
      field(state, 'opponent', first);
      field(state, 'opponent', unrelated);
      field(state, 'opponent', relatedUltimate);
      const ability = getCardOverride('SD46-X01').abilities.find(a => a.header.timing === 'WHEN_SUMMONED');

      await new AsyncResolver().resolveAbility(state, ability, { controller: 'player', sourceCard: source }, new EventBus());

      assert.deepEqual(state.players.opponent.grave.map(card => card.id), [first.id, relatedUltimate.id]);
      assert.deepEqual(state.players.opponent.field.map(stack => stack.top.id), [unrelated.id]);
    });

    it('SD46-X01 moves only its own Soul Core to Life when it attacks', async () => {
      const game = createGame();
      const source = makeEngineCard('SD46-X01', 'Blitz-Tiger-Z', 'Spirit', { compiledIr: getCardOverride('SD46-X01'), levels: { 1: { cost: 1, bp: 1000 }, 2: { cost: 3, bp: 3000 } } });
      const stack = createFieldStack(source, { normal: 2, soul: 1 });
      game.state.players.player.field.push(stack);
      const before = game.state.players.player.life;
      await game.declareAttack(stack.id, 'player');
      assert.equal(game.state.players.player.life, before + 1);
      assert.equal(stack.cores.soul, 0);
    });

    it('SD46-X02 Bombardment adds cores, moves Life, and returns both revealed cards to hand', async () => {
      const game = createGame();
      const attacker = makeEngineCard('SD46-X02', 'Revol-Tiger-Z', 'Spirit', { compiledIr: getCardOverride('SD46-X02') });
      const attackerStack = field(game.state, 'player', attacker, 1);
      const nexus = makeEngineCard('T-GRANDWALKER', 'Red Grandwalker Nexus', 'Nexus', { family: 'Grandwalker', color: 'Red' });
      const nexusStack = field(game.state, 'player', nexus, 1);
      const hit = makeEngineCard('T-Z', 'Steel-Z', 'Spirit', { family: 'Steel', cost: 3 });
      const other = makeEngineCard('T-NORMAL', 'Normal card', 'Spirit', { family: 'Beast', cost: 2 });
      game.state.players.player.deck.push(hit, other);
      const opponentLife = game.state.players.opponent.life;
      game.state.step = 'ATTACK';
      await game.declareAttack(attackerStack.id, 'player');
      assert.equal(nexusStack.cores.normal, 2);
      assert.equal(game.state.players.opponent.life, opponentLife - 1);
      assert.deepEqual(game.state.players.player.hand.slice(-2), [hit, other]);
    });

    it('SD46-006 gains one Void core per three cards in the opposing hand', async () => {
      const state = createGameState();
      const source = makeEngineCard('SD46-006', 'Licospiros', 'Spirit', { compiledIr: getCardOverride('SD46-006') });
      const stack = field(state, 'player', source);
      state.players.opponent.hand.push(...Array.from({ length: 7 }, (_, i) => makeEngineCard(`HAND-${i}`, `Hand ${i}`, 'Magic', {}, 'opponent')));
      const ability = getCardOverride('SD46-006').abilities.find(a => a.header.timing === 'WHEN_SUMMONED');
      await new AsyncResolver().resolveAbility(state, ability, { controller: 'player', sourceCard: source, sourceStack: stack }, new EventBus());
      assert.equal(stack.cores.normal, 3);
    });

    it('SD46-006 returns itself to hand only when destroyed by the opponent', async () => {
      const state = createGameState();
      const source = makeEngineCard('SD46-006', 'Licospiros', 'Spirit', { compiledIr: getCardOverride('SD46-006') });
      state.players.player.grave.push(source);
      const ability = getCardOverride('SD46-006').abilities.find(a => a.header.timing === 'WHEN_DESTROYED');
      await new AsyncResolver().resolveAbility(state, ability, { controller: 'player', sourceCard: source, wasDestroyedByOpponent: false }, new EventBus());
      assert.deepEqual(state.players.player.hand, []);
      await new AsyncResolver().resolveAbility(state, ability, { controller: 'player', sourceCard: source, wasDestroyedByOpponent: true }, new EventBus());
      assert.deepEqual(state.players.player.hand, [source]);
    });

    it('normal Nexus deployment resolves SD46-CP01 deck milling and matching core charge', async () => {
      const game = createGame();
      const source = makeEngineCard('SD46-CP01', 'Mogami Shunta', 'Nexus', { family: 'Grandwalker', cost: 2, compiledIr: getCardOverride('SD46-CP01') });
      game.state.players.player.hand.push(source);
      const matched = makeEngineCard('T-MATCH', 'Test God-King', 'Spirit', { family: 'God-King', cost: 3 });
      const unmatched = [makeEngineCard('T-LOW', 'Low Cost God-King', 'Spirit', { family: 'God-King', cost: 2 }), makeEngineCard('T-OTHER', 'Other Family', 'Spirit', { family: 'Beast', cost: 4 })];
      game.state.players.player.deck.push(matched, ...unmatched);
      const result = await game.playCard(source.id);
      assert.equal(result.success, true);
      const nexus = game.state.players.player.field.find(stack => stack.top.id === source.id);
      assert.ok(nexus);
      assert.equal(nexus.cores.normal, 1);
      assert.deepEqual(game.state.players.player.grave, [matched, ...unmatched]);
    });

    it('Mogami Shunta Core Charge reacts only to a qualifying Spirit or Brave summon', async () => {
      const game = createGame();
      const nexus = makeEngineCard('SD46-CP01', 'Mogami Shunta', 'Nexus', { family: 'Grandwalker', compiledIr: getCardOverride('SD46-CP01') });
      const nexusStack = field(game.state, 'player', nexus, 1);
      const tooSmall = makeEngineCard('T-CHEAP', 'Cheap God-King', 'Spirit', { family: 'God-King', cost: 2 });
      await game.events.emit({ type: 'SUMMONED', card: tooSmall, player: 'player', cause: 'effect' });
      assert.equal(nexusStack.cores.normal, 1);
      const qualifying = makeEngineCard('T-QUALIFY', 'God-King Spirit', 'Spirit', { family: 'God-King', cost: 3 });
      await game.events.emit({ type: 'SUMMONED', card: qualifying, player: 'player', cause: 'effect' });
      assert.equal(nexusStack.cores.normal, 2);
    });

    it('SD46-CP01 Grand Skill pays two Nexus cores, draws, and enforces once per turn', async () => {
      const game = createGame();
      const source = makeEngineCard('SD46-CP01', 'Mogami Shunta', 'Nexus', { family: 'Grandwalker', compiledIr: getCardOverride('SD46-CP01') });
      const stack = field(game.state, 'player', source, 3);
      const draw = makeEngineCard('T-DRAW', 'Draw Card');
      game.state.players.player.deck.push(draw);
      game.state.step = 'MAIN';
      const skill = getCardOverride('SD46-CP01').abilities.find(a => a.id === 'SD46-CP01#a5');
      const first = await game.activateAbility(source.id, skill.id);
      assert.equal(first.success, true);
      assert.equal(stack.cores.normal, 1);
      assert.deepEqual(game.state.players.player.hand, [draw]);
      const second = await game.activateAbility(source.id, skill.id);
      assert.equal(second.reason, 'ABILITY_LIMIT_REACHED');
    });

    it('SD46-CP01 Seal skill pays one core and destroys a Spirit or Ultimate up to 15000 BP', async () => {
      const game = createGame();
      const source = makeEngineCard('SD46-CP01', 'Mogami Shunta', 'Nexus', { family: 'Grandwalker', compiledIr: getCardOverride('SD46-CP01') });
      const stack = field(game.state, 'player', source, 3);
      const spirit = makeEngineCard('T-SPIRIT', 'Spirit target', 'Spirit', { bp: 15000 }, 'opponent');
      field(game.state, 'opponent', spirit);
      game.state.step = 'ATTACK';
      const skill = getCardOverride('SD46-CP01').abilities.find(a => a.id === 'SD46-CP01#a6');
      const result = await game.activateAbility(source.id, skill.id);
      assert.equal(result.success, true);
      assert.equal(stack.cores.normal, 2);
      assert.deepEqual(game.state.players.opponent.grave, [spirit]);
    });

    it('SD46-X03 attack effect prevents Spirit blockers while allowing Ultimate blockers', async () => {
      const game = createGame();
      const attacker = makeEngineCard('SD46-X03', 'Igridios-Z', 'Spirit', { compiledIr: getCardOverride('SD46-X03'), levels: { 1: { cost: 1, bp: 1000 }, 2: { cost: 3, bp: 5000 } } });
      const attackerStack = field(game.state, 'player', attacker, 3);
      const spiritBlocker = field(game.state, 'opponent', makeEngineCard('T-BLOCK-SPIRIT', 'Spirit blocker', 'Spirit', { bp: 12000 }, 'opponent'));
      const ultimateBlocker = field(game.state, 'opponent', makeEngineCard('T-BLOCK-ULT', 'Ultimate blocker', 'Ultimate', { bp: 12000 }, 'opponent'));
      const target = field(game.state, 'opponent', makeEngineCard('T-DESTROY', 'Target', 'Spirit', { bp: 8000 }, 'opponent'));
      game.state.step = 'ATTACK';
      await game.declareAttack(attackerStack.id, 'player');
      assert.equal(game.state.players.opponent.field.some(st => st.top.id === target.top.id), false);
      assert.equal(await game.declareBlock(spiritBlocker.id, 'opponent').then(result => result.reason), 'CANNOT_BLOCK');
      assert.equal((await game.declareBlock(ultimateBlocker.id, 'opponent')).success, true);
    });

    it('SD46-005 set effect pays one core, summons itself on a God-King attack, and sets a Burst from hand', async () => {
      const game = createGame();
      const byerley = makeEngineCard('SD46-005', 'Byerley-Dark-Z', 'Spirit', { compiledIr: getCardOverride('SD46-005'), isBurst: true });
      const burstMate = makeEngineCard('T-BURST', 'Other Burst', 'Spirit', { isBurst: true, compiledIr: { abilities: [{ header: { timing: 'BURST' }, clauses: [] }] } });
      game.state.players.player.hand.push(byerley, burstMate);
      assert.equal((await game.setBurst(byerley.id)).success, true);
      game.state.players.player.burstSetThisTurn = false; // The set card was established on an earlier turn.
      const attacker = makeEngineCard('T-GODKING-ATTACK', 'God-King attacker', 'Spirit', { family: 'God-King' });
      const stack = field(game.state, 'player', attacker);
      game.state.step = 'ATTACK';
      await game.declareAttack(stack.id, 'player');
      assert.equal(game.state.players.player.field.some(item => item.top.id === byerley.id), true);
      assert.equal(game.state.players.player.burst.id, burstMate.id);
      assert.equal(game.state.players.player.trash.normal, 1);
    });

    it('SD46-005 Burst responds to an opponent Spirit or Brave summoned by an effect', async () => {
      const game = createGame();
      const burst = makeEngineCard('SD46-005', 'Byerley-Dark-Z', 'Spirit', { compiledIr: getCardOverride('SD46-005'), isBurst: true }, 'opponent');
      game.state.players.opponent.burst = burst;
      const target = makeEngineCard('T-BURST-TARGET', 'Summoned Spirit', 'Spirit', { bp: 10000 }, 'player');
      field(game.state, 'player', target);
      await game.events.emit({ type: 'SUMMONED', card: target, player: 'player', cause: 'effect' });
      assert.deepEqual(game.state.players.player.grave, [target]);
      assert.equal(game.state.players.opponent.field.some(stack => stack.top.id === burst.id), true);
    });

    it('SD46-X03 can summon from Removed Zone to replace opponent effect life loss', async () => {
      const game = createGame();
      const source = makeEngineCard('SD46-X03', 'Igridios-Z', 'Spirit', { compiledIr: getCardOverride('SD46-X03') });
      game.state.players.player.removed.push(source);
      const largeTarget = makeEngineCard('T-LARGE', 'Large Spirit', 'Spirit', { bp: 12000 }, 'opponent');
      field(game.state, 'opponent', largeTarget);
      const lifeBefore = game.state.players.player.life;
      await moveCore(game.state, 1, { zone: 'life', side: 'player' }, { zone: 'reserve', side: 'player' }, { cause: 'effect', by: 'opponent' }, game.events);
      assert.equal(game.state.players.player.life, lifeBefore);
      assert.equal(game.state.players.player.field.some(stack => stack.top.id === source.id), true);
      assert.equal(game.state.players.opponent.field.some(stack => stack.top.id === largeTarget.id), true);
      assert.equal(game.state.players.player.trash.normal, 1);
    });

    it('SD46-003 destroys a 10000 BP or more opposing Spirit when summoned from Removed Zone', async () => {
      const game = createGame();
      const source = makeEngineCard('SD46-003', 'Thunder-Z-Grizzly', 'Spirit', { compiledIr: getCardOverride('SD46-003') });
      game.state.players.player.removed.push(source);
      const target = makeEngineCard('T-REMOVED-TARGET', 'Large Spirit', 'Spirit', { bp: 12000 }, 'opponent');
      field(game.state, 'opponent', target);
      await executeOp(game.state, { op: 'SUMMON_THIS_CARD' }, { controller: 'player', sourceCard: source }, game.resolver.promptResolver, game.events);
      assert.deepEqual(game.state.players.opponent.grave, [target]);
    });

    it('SD46-003 Flash Accel destroys an attached Brave, draws, then removes itself', async () => {
      const game = createGame();
      const source = makeEngineCard('SD46-003', 'Thunder-Z-Grizzly', 'Spirit', { compiledIr: getCardOverride('SD46-003') });
      game.state.players.player.hand.push(source);
      const host = makeEngineCard('T-HOST', 'Brave host', 'Spirit', {}, 'opponent');
      const brave = makeEngineCard('T-BRAVE', 'Opponent Brave', 'Brave', {}, 'opponent');
      const hostStack = field(game.state, 'opponent', host);
      hostStack.braves.push(brave);
      const draw = makeEngineCard('T-DRAW-ACCEL', 'Accel draw');
      game.state.players.player.deck.push(draw);
      const ability = getCardOverride('SD46-003').abilities[0];
      await new AsyncResolver().resolveAbility(game.state, ability, { controller: 'player', sourceCard: source }, game.events);
      assert.deepEqual(game.state.players.opponent.grave, [brave]);
      assert.deepEqual(game.state.players.player.hand, [draw]);
      assert.deepEqual(game.state.players.player.removed, [source]);
    });

    it('SD46-005 draws two cards when attacking at level 2', async () => {
      const game = createGame();
      const source = makeEngineCard('SD46-005', 'Byerley-Dark-Z', 'Spirit', { compiledIr: getCardOverride('SD46-005') });
      const stack = field(game.state, 'player', source, 3);
      const draws = [makeEngineCard('T-DRAW-1', 'Draw 1'), makeEngineCard('T-DRAW-2', 'Draw 2')];
      game.state.players.player.deck.push(...draws);
      await game.declareAttack(stack.id, 'player');
      assert.deepEqual(game.state.players.player.hand, draws);
    });

    it('SD46-X02 When Summoned moves its own Soul Core to Life', async () => {
      const game = createGame();
      const source = makeEngineCard('SD46-X02', 'Revol-Tiger-Z', 'Spirit', { compiledIr: getCardOverride('SD46-X02') });
      const stack = createFieldStack(source, { normal: 1, soul: 1 });
      game.state.players.player.field.push(stack);
      const before = game.state.players.player.life;
      await new AsyncResolver().resolveAbility(game.state, getCardOverride('SD46-X02').abilities[0], { controller: 'player', sourceCard: source, sourceStack: stack }, game.events);
      assert.equal(game.state.players.player.life, before + 1);
      assert.equal(stack.cores.soul, 0);
    });

    it('SD46-X01 level 2 attack returns a Z-named Spirit from Trash to hand', async () => {
      const game = createGame();
      const source = makeEngineCard('SD46-X01', 'Blitz-Tiger-Z', 'Spirit', { compiledIr: getCardOverride('SD46-X01') });
      const stack = field(game.state, 'player', source, 3);
      const salvage = makeEngineCard('SD46-X02', 'Revol-Tiger-Z', 'Spirit');
      game.state.players.player.grave.push(salvage);
      await game.declareAttack(stack.id, 'player');
      assert.deepEqual(game.state.players.player.hand, [salvage]);
    });

    it('engine destruction events resolve SD46-006 When Destroyed from gameplay', async () => {
      const game = createGame();
      const source = makeEngineCard('SD46-006', 'Licospiros', 'Spirit', { compiledIr: getCardOverride('SD46-006'), levels: { 1: { cost: 1, bp: 1000 }, 2: { cost: 3, bp: 3000 } } });
      game.state.players.player.field.push(createFieldStack(source, { normal: 3, soul: 0 }));
      await moveCard(game.state, source, 'grave', 'player', { cause: 'destroy', by: 'opponent' }, game.events);
      assert.deepEqual(game.state.players.player.hand, [source]);
      assert.deepEqual(game.state.players.player.grave, []);
    });
  });

  describe('1. SD46 Thunder God Kings & X-Rares', () => {
    it('SD46-X01 (The BlueThunderGodKing Blitz-Tiger-Z) - When Summoned and When Attacks triggers', () => {
      const override = getCardOverride('SD46-X01');
      assert.ok(override, 'Override must exist for SD46-X01');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length >= 3, 'Must have at least 3 abilities');
      assert.equal(override.abilities[0].header.timing, 'WHEN_SUMMONED');
    });

    it('SD46-X02 (The RedThunderGodKing Revol-Tiger-Z) - BP destruction and attack triggers', () => {
      const override = getCardOverride('SD46-X02');
      assert.ok(override, 'Override must exist for SD46-X02');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length >= 3, 'Must have at least 3 abilities');
      assert.equal(override.abilities[0].header.timing, 'WHEN_SUMMONED');
    });

    it('SD46-X03 (The SteelThunderKing Igridios-Z) - Flash timing and attack/block triggers', () => {
      const override = getCardOverride('SD46-X03');
      assert.ok(override, 'Override must exist for SD46-X03');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length >= 3, 'Must have at least 3 abilities');
    });
  });

  describe('2. SD46 Grandwalker & Thunder Support', () => {
    it('SD46-CP01 (Mogami Shunta) - Grandwalker core charging, god symbols, and attack step triggers', () => {
      const override = getCardOverride('SD46-CP01');
      assert.ok(override, 'Override must exist for SD46-CP01');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });

    it('SD46-005 (The NinthThunderclap ThreeSacredHorses Byerley-Dark-Z) - Burst trigger and attack mechanics', () => {
      const override = getCardOverride('SD46-005');
      assert.ok(override, 'Override must exist for SD46-005');
      assert.equal(override.isFullySupported, true);
      assert.equal(override.unsupportedClausesCount, 0);
      assert.ok(override.abilities.length > 0, 'Must have abilities');
    });
  });

  describe('3. SD46 Starter Deck Completeness & Schema Integrity', () => {
    it('All cards in SD46_OVERRIDES have 100% zero unsupported clauses', () => {
      let cardCount = 0;
      for (const [cardId, override] of Object.entries(SD46_OVERRIDES)) {
        if (!cardId.startsWith('SD46-')) continue;
        cardCount++;
        assert.equal(override.isFullySupported, true, `${cardId} must be fully supported`);
        assert.equal(override.unsupportedClausesCount, 0, `${cardId} must have 0 unsupported clauses`);
        if (!override.isVanilla) {
          assert.ok(override.abilities.length > 0 || (override.keywords && override.keywords.length > 0),
            `${cardId} effect card must have abilities or keywords`);
        }
      }
      assert.equal(cardCount, 9, `Expected exactly 9 SD46 cards, got ${cardCount}`);
    });
  });

});
