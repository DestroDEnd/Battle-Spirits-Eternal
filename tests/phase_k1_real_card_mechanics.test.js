import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../engine/index.js';
import { AsyncResolver, DefaultPromptResolver } from '../engine/resolver.js';
import { executeOp } from '../engine/ops/index.js';
import { createCardInstance, createFieldStack } from '../engine/state.js';
import { evaluateStructuredCondition, CONDITION_TYPES, CONDITION_RESULT } from '../engine/conditions.js';

function makeFillerDeck(count = 40) {
  return Array.from({ length: count }, (_, i) => ({
    card_number: `FILL-${i + 1}`,
    name: `Filler ${i + 1}`,
    type: 'Spirit',
    cost: 1,
    color: 'Red',
    symbols: ['Red'],
    levels: { 1: { cost: 1, bp: 1000 } }
  }));
}

describe('Phase K.1 Work Package I: Real-Card Semantic & Mechanic Execution Battery', () => {

  it('1. BSC42-082 (Reanimate LT): Valid execution summons Cost <= 3 Spirit from Trash for free & enforces ONCE_PER_TURN_SAME_NAME', async () => {
    const game = createGame({ playerDeck: makeFillerDeck(40), opponentDeck: makeFillerDeck(40) });
    const p1 = game.state.players.player;
    p1.reserve.normal = 4;
    p1.reserve.soul = 1;

    // Place Cost 2 Spirit in player grave
    const cheapSpirit = createCardInstance({ id: 'SPIRIT_COST_2', cardNumber: 'BS01-001', name: 'Lizard Man', type: 'Spirit', cost: 2, colors: ['Purple'] }, 'player');
    p1.grave.push(cheapSpirit);

    const reanimateCard = createCardInstance({
      id: 'MAGIC_BSC42_082',
      cardNumber: 'BSC42-082',
      name: 'Reanimate LT',
      type: 'Magic',
      cost: 3
    }, 'player');

    const reanimateAbility = {
      id: 'BSC42-082#AB_MAIN_0',
      semanticId: 'SEM#BSC42-082#a0',
      header: {
        timing: 'MAIN',
        activationRestrictions: ['ONCE_PER_TURN_SAME_NAME'],
        limit: 'ONCE_PER_TURN_SAME_NAME'
      },
      clauses: [
        {
          op: {
            op: 'SUMMON',
            from: 'trash',
            side: 'self',
            count: 1,
            filter: { types: ['Spirit'], costLte: 3 },
            free: true
          }
        }
      ]
    };

    const resolver = new AsyncResolver(new DefaultPromptResolver());

    // First activation: must succeed
    const res1 = await resolver.resolveAbility(game.state, reanimateAbility, {
      controller: 'player',
      sourceCard: reanimateCard
    }, game.events);

    assert.equal(res1.success, true, 'First activation of Reanimate LT must succeed');
    assert.equal(p1.field.length, 1, 'Cheap Spirit must be summoned on field');
    assert.equal(p1.field[0].top.id, cheapSpirit.id);
    assert.equal(p1.field[0].cores.normal, 1, 'Initial core placed on summoned Spirit');
    assert.equal(p1.grave.length, 0, 'Card removed from trash');

    // Second activation in same turn: must be blocked by ONCE_PER_TURN_SAME_NAME restriction
    const cheapSpirit2 = createCardInstance({ id: 'SPIRIT_COST_2_B', cardNumber: 'BS01-002', name: 'Lizard Scout', type: 'Spirit', cost: 2, colors: ['Purple'] }, 'player');
    p1.grave.push(cheapSpirit2);

    const res2 = await resolver.resolveAbility(game.state, reanimateAbility, {
      controller: 'player',
      sourceCard: reanimateCard
    }, game.events);

    assert.equal(res2.success, false, 'Second activation of Reanimate LT must fail closed');
    assert.match(res2.reason || '', /RESTRICTED|ONCE_PER_TURN_SAME_NAME|ABILITY_LIMIT_REACHED/, 'Must cite ONCE_PER_TURN_SAME_NAME restriction');
    assert.equal(p1.field.length, 1, 'Field must remain unchanged');
    assert.equal(p1.grave.length, 1, 'Second card remains in trash');
  });

  it('2. BSC42-082 (Reanimate LT): Rejects when trash contains only Cost > 3 Spirits (Fail-closed)', async () => {
    const game = createGame({ playerDeck: makeFillerDeck(40), opponentDeck: makeFillerDeck(40) });
    const p1 = game.state.players.player;

    // Only Cost 5 Spirit in trash
    const bigSpirit = createCardInstance({ id: 'SPIRIT_COST_5', cardNumber: 'BS01-055', name: 'Dark Dragon', type: 'Spirit', cost: 5, colors: ['Purple'] }, 'player');
    p1.grave.push(bigSpirit);

    const reanimateCard = createCardInstance({ id: 'MAGIC_BSC42_082_B', cardNumber: 'BSC42-082', name: 'Reanimate LT', type: 'Magic' }, 'player');
    const reanimateAbility = {
      id: 'BSC42-082#AB_MAIN_0',
      header: { timing: 'MAIN' },
      clauses: [
        {
          op: {
            op: 'SUMMON',
            from: 'trash',
            side: 'self',
            count: 1,
            filter: { types: ['Spirit'], costLte: 3 },
            free: true
          }
        }
      ]
    };

    const resolver = new AsyncResolver(new DefaultPromptResolver());
    const res = await resolver.resolveAbility(game.state, reanimateAbility, { controller: 'player', sourceCard: reanimateCard }, game.events);

    assert.equal(res.success, false, 'Must fail when no legal Cost <= 3 spirits in trash');
    assert.equal(p1.field.length, 0, 'No spirit summoned');
    assert.equal(p1.grave.length, 1, 'Cost 5 card remains in trash');
  });

  it('3. BS71-075 (Bat Evolution): Optional Summon of "Bat" Spirit and then destroys opposing Nexus', async () => {
    const game = createGame({ playerDeck: makeFillerDeck(40), opponentDeck: makeFillerDeck(40) });
    const p1 = game.state.players.player;
    const p2 = game.state.players.opponent;
    p1.reserve.normal = 6;

    // Bat Spirit in grave
    const batSpirit = createCardInstance({ id: 'BAT_01', cardNumber: 'BS71-001', name: 'Bat Scout', type: 'Spirit', cost: 2, colors: ['Purple'] }, 'player');
    p1.grave.push(batSpirit);

    // Opposing Nexus on field
    const oppNexus = createCardInstance({ id: 'NEXUS_OPP_1', cardNumber: 'BS01-080', name: 'Obsidian Citadel', type: 'Nexus', cost: 3, colors: ['Purple'] }, 'opponent');
    p2.nexus.push(oppNexus);

    const batEvolutionCard = createCardInstance({ id: 'MAGIC_BS71_075', cardNumber: 'BS71-075', name: 'Bat Evolution', type: 'Magic' }, 'player');
    const batEvolutionAbility = {
      id: 'BS71-075#AB_FLASH_0',
      header: { timing: 'FLASH', activationRestrictions: ['ONCE_PER_TURN_SAME_NAME'] },
      clauses: [
        {
          clauseIndex: 0,
          isOptional: true,
          op: {
            op: 'SUMMON',
            from: 'trash',
            side: 'self',
            count: 1,
            filter: { types: ['Spirit'], nameIncludes: 'Bat' },
            free: true
          }
        },
        {
          clauseIndex: 1,
          link: 'then',
          op: {
            op: 'DESTROY',
            count: 1,
            target: { side: 'opp', types: ['Nexus'] }
          }
        }
      ]
    };

    const resolver = new AsyncResolver(new DefaultPromptResolver());
    const res = await resolver.resolveAbility(game.state, batEvolutionAbility, { controller: 'player', sourceCard: batEvolutionCard }, game.events);

    assert.equal(res.success, true, 'Bat Evolution ability must succeed');
    assert.equal(p1.field.length, 1, 'Bat spirit must be summoned');
    assert.equal(p1.field[0].top.id, batSpirit.id);
    assert.equal(p2.grave.length, 1, 'Opposing nexus must be destroyed and moved to grave');
    assert.equal(p2.grave[0].id, oppNexus.id);
  });

  it('4. BS10-062 (Phoenix-Cannon): Brave separation preserves core allocations upon stack removal', async () => {
    const game = createGame({ playerDeck: makeFillerDeck(40), opponentDeck: makeFillerDeck(40) });
    const p1 = game.state.players.player;

    const hostSpirit = createCardInstance({ id: 'HOST_SPIRIT', cardNumber: 'BS01-005', name: 'Dragon Soldier', type: 'Spirit', cost: 4 }, 'player');
    const braveCard = createCardInstance({ id: 'BRAVE_PHOENIX', cardNumber: 'BS10-062', name: 'The GunDragon Phoenix-Cannon', type: 'Brave', cost: 5 }, 'player');

    // Create braved stack on field with 3 normal cores
    const bravedStack = createFieldStack(hostSpirit, { normal: 3, soul: 0 }, [braveCard]);
    p1.field.push(bravedStack);
    p1.reserve.normal = 5;

    // Separate Brave onto field as standalone Spirit/Brave stack
    const res = await game.separateBrave(bravedStack.id, braveCard.id, 1, 'player');
    assert.equal(res.success, true, 'Brave separation must succeed');

    assert.equal(p1.field.length, 2, 'Field must now have 2 independent stacks');
    assert.equal(p1.field[0].top.id, hostSpirit.id);
    assert.equal(p1.field[0].cores.normal, 3, 'Host retains original cores');
    assert.equal(p1.field[1].top.id, braveCard.id, 'Brave becomes top card of new stack');
    assert.equal(p1.field[1].cores.normal, 1, 'New brave stack receives allocated 1 core from reserve');
    assert.equal(p1.reserve.normal, 4, '1 core deducted from reserve for separate brave');
    assert.equal(p1.field[0].braves.length, 0, 'Original stack has 0 braves attached');
  });

  it('5. SD63-CP01 (Grandwalkers Gallet & Varte): Tracks God Cores & Pays God Cores with Delta C = 0', async () => {
    const game = createGame({ playerDeck: makeFillerDeck(40), opponentDeck: makeFillerDeck(40) });
    const p1 = game.state.players.player;

    const grandwalkerCard = createCardInstance({
      id: 'GW_GALLET_VARTE',
      cardNumber: 'SD63-CP01',
      name: 'Grandwalkers Gallet & Varte',
      type: 'Grandwalker Nexus',
      cost: 2
    }, 'player');

    const gwStack = createFieldStack(grandwalkerCard, { normal: 0, soul: 0 });
    gwStack.godCores = 4;
    p1.field.push(gwStack);

    // Initial total cores
    const initialReserve = p1.reserve.normal;

    // Execute PAY_GOD_CORES op (Send 2 God Cores from Grandwalker to Void)
    const payOp = {
      op: 'PAY_GOD_CORES',
      count: 2,
      stackId: gwStack.id
    };

    const res = await executeOp(game.state, payOp, { controller: 'player', sourceCard: grandwalkerCard }, null, game.events);
    assert.equal(res.success, true, 'PAY_GOD_CORES must succeed');
    assert.equal(gwStack.godCores, 2, 'Grandwalker God Cores reduced by 2');
    assert.equal(p1.reserve.normal, initialReserve, 'Reserve cores strictly conserved');
  });

  it('6. BS52-TX01 (The Red Divine Dragon Emperor): Rebirth Face Flip transforms Face A to Face B', async () => {
    const game = createGame({ playerDeck: makeFillerDeck(40), opponentDeck: makeFillerDeck(40) });
    const p1 = game.state.players.player;

    const rebirthSpirit = createCardInstance({
      id: 'REBIRTH_SPIRIT_A',
      cardNumber: 'BS52-TX01',
      name: 'The Red Divine Dragon Emperor',
      type: 'Spirit',
      cost: 6,
      bp: 6000,
      face: 'A',
      backSide: {
        cardNumber: 'BS52-TX01-B',
        name: 'The Red Divine Dragon Emperor - Rebirth Form',
        type: 'Spirit',
        cost: 9,
        bp: 12000,
        face: 'B'
      }
    }, 'player');

    const stack = createFieldStack(rebirthSpirit, { normal: 2, soul: 0 });
    p1.field.push(stack);

    const flipOp = {
      op: 'FLIP_CARD',
      target: { stackId: stack.id },
      toFace: 'B'
    };

    const res = await executeOp(game.state, flipOp, { controller: 'player' }, null, game.events);
    assert.equal(res.success, true, 'FLIP_CARD to Face B must succeed');
    assert.equal(stack.top.face, 'B');
    assert.equal(stack.top.name, 'The Red Divine Dragon Emperor - Rebirth Form');
    assert.equal(stack.top.cost, 9);
    assert.equal(stack.top.bp, 12000);
    assert.equal(stack.cores.normal, 2, 'Field cores preserved across face flip');
  });

  it('7. Compound Nested Conditions (AND / OR / NOT): evaluated recursively with exact truth tables', () => {
    const state = {
      players: {
        player: { life: 4, reserve: { normal: 3, soul: 0 }, field: [] },
        opponent: { life: 5, reserve: { normal: 0, soul: 0 }, field: [] }
      }
    };

    const condA = { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.LIFE_THRESHOLD, operator: 'LTE', threshold: 3, side: 'self' }; // 4 <= 3 -> FALSE
    const condB = { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.RESERVE_CORE_THRESHOLD, operator: 'GTE', count: 2, side: 'self' }; // 3 >= 2 -> TRUE
    const condC = { kind: 'STRUCTURED_CONDITION', type: CONDITION_TYPES.LIFE_THRESHOLD, operator: 'EQ', threshold: 5, side: 'self' }; // 4 == 5 -> FALSE

    const nestedCond = {
      kind: 'STRUCTURED_CONDITION',
      type: CONDITION_TYPES.COMPOUND,
      combinator: 'AND',
      conditions: [
        {
          kind: 'STRUCTURED_CONDITION',
          type: CONDITION_TYPES.COMPOUND,
          combinator: 'OR',
          conditions: [condA, condB] // FALSE OR TRUE -> TRUE
        },
        {
          kind: 'STRUCTURED_CONDITION',
          type: CONDITION_TYPES.COMPOUND,
          combinator: 'NOT',
          conditions: [condC] // NOT(FALSE) -> TRUE
        }
      ]
    };

    const res = evaluateStructuredCondition(state, nestedCond, { controller: 'player' });
    assert.equal(res.result, CONDITION_RESULT.TRUE, 'Nested AND(OR, NOT) evaluated to TRUE');
  });
});
