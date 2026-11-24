import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { createGame } from '../engine/index.js';
import { createCardInstance, createFieldStack } from '../engine/state.js';

function loadRealCardSamples() {
  const cardsDetailed = JSON.parse(fs.readFileSync(path.resolve('data/cards_detailed.json'), 'utf8'));
  const shardsDir = path.resolve('data/ir_shards');
  const shardFiles = fs.readdirSync(shardsDir).filter(f => f.endsWith('.json')).sort();

  const buckets = {
    DRAW: [],
    DISCARD_HAND: [],
    SALVAGE: [],
    REVEAL_DECKTOP: [],
    DESTROY: []
  };

  for (const file of shardFiles) {
    if (Object.values(buckets).every(arr => arr.length >= 5)) break;
    const shard = JSON.parse(fs.readFileSync(path.join(shardsDir, file), 'utf8'));
    for (const [cardNum, ir] of Object.entries(shard)) {
      if (!ir || !Array.isArray(ir.abilities)) continue;
      for (const ab of ir.abilities) {
        if (!Array.isArray(ab.clauses) || ab.clauses.length === 0) continue;
        // Pick straightforward single-clause or clean multi-clause abilities without complex unmet prerequisites
        const ops = ab.clauses.map(c => c?.op?.op).filter(Boolean);
        for (const key of Object.keys(buckets)) {
          if (buckets[key].length >= 5) continue;
          if (ops.includes(key) && ab.clauses.length === 1 && !ab.clauses[0]?.condition) {
            if (!buckets[key].some(item => item.cardNumber === cardNum)) {
              buckets[key].push({
                cardNumber: cardNum,
                cardDef: cardsDetailed[cardNum] || { card_number: cardNum, name: ir.name || cardNum, type: 'Spirit', cost: 3 },
                ir,
                ability: ab,
                primaryOp: key
              });
            }
          }
        }
      }
    }
  }
  return buckets;
}

test('M4-REAL-CARDS-01: Validate real compiled cards across DRAW, DISCARD_HAND, SALVAGE, REVEAL_DECKTOP, and DESTROY', async () => {
  const buckets = loadRealCardSamples();
  const matrix = [];

  for (const [category, samples] of Object.entries(buckets)) {
    assert.ok(samples.length > 0, `Expected at least 1 real card sample for ${category}`);
    for (const sample of samples) {
      const game = createGame({ interactive: false, strictRules: false, unsafeTestBypassDeckValidation: true });
      const state = game.state;
      const p = state.players.player;
      const opp = state.players.opponent;

      const sourceCard = createCardInstance(sample.cardDef, 'player');
      sourceCard.compiledIr = sample.ir;
      p.field.push(createFieldStack(sourceCard, { normal: 3, soul: 0 }));

      // Populate clean distinct zones for both players
      for (let i = 0; i < 6; i++) {
        p.deck.push(createCardInstance({ id: `p_d_${i}`, card_number: `PD-${i}`, name: `Player Deck ${i}`, type: 'Spirit', cost: 2, color: 'Red' }, 'player'));
        opp.deck.push(createCardInstance({ id: `o_d_${i}`, card_number: `OD-${i}`, name: `Opp Deck ${i}`, type: 'Spirit', cost: 2, color: 'Purple' }, 'opponent'));
      }
      for (let i = 0; i < 3; i++) {
        p.hand.push(createCardInstance({ id: `p_h_${i}`, card_number: `PH-${i}`, name: `Player Hand ${i}`, type: 'Spirit', cost: 2, color: 'Red' }, 'player'));
        p.grave.push(createCardInstance({ id: `p_g_${i}`, card_number: `PG-${i}`, name: `Player Grave ${i}`, type: 'Spirit', cost: 2, color: 'Red' }, 'player'));
        opp.hand.push(createCardInstance({ id: `o_h_${i}`, card_number: `OH-${i}`, name: `Opp Hand ${i}`, type: 'Spirit', cost: 2, color: 'Purple' }, 'opponent'));
        const oppSp = createCardInstance({ id: `o_f_${i}`, card_number: `OF-${i}`, name: `Opp Field ${i}`, type: 'Spirit', cost: 2, bp: 2000, color: 'Purple' }, 'opponent');
        opp.field.push(createFieldStack(oppSp, { normal: 1, soul: 0 }));
      }

      const beforeDeck = p.deck.length;
      const beforeHand = p.hand.length;
      const beforeOppHand = opp.hand.length;
      const observedPromptZones = [];

      const promptResolver = {
        async choose(prompt) {
          for (const c of prompt.candidates || []) {
            observedPromptZones.push({ zone: c.zone || null, side: c.side || null });
          }
          const cands = prompt.candidates || [];
          const pickCount = Math.min(prompt.count || prompt.maxSelections || 1, cands.length);
          return {
            accepted: true,
            selected: cands.slice(0, pickCount).map(c => c.candidateId || c.cardId || c.id)
          };
        }
      };

      const res = await game.resolver.resolveAbility(state, sample.ability, {
        controller: 'player',
        sourceCard,
        promptResolver
      });

      // Verify no card ID exists in multiple zones simultaneously
      const seenIds = new Set();
      let duplicateIds = 0;
      for (const s of ['player', 'opponent']) {
        const ps = state.players[s];
        for (const z of ['deck', 'hand', 'grave', 'removed', 'revealed']) {
          for (const c of ps[z] || []) {
            if (seenIds.has(c.id)) duplicateIds++;
            seenIds.add(c.id);
          }
        }
        for (const st of ps.field || []) {
          if (st?.top?.id) {
            if (seenIds.has(st.top.id)) duplicateIds++;
            seenIds.add(st.top.id);
          }
        }
      }
      assert.equal(duplicateIds, 0, `${sample.cardNumber} must not duplicate card instances across zones`);
      const targetsOppHand = (sample.ability.clauses || []).some(c =>
        c?.op?.side === 'opp' || c?.op?.side === 'opponent' || c?.op?.target?.side === 'opp'
      );
      if (!targetsOppHand) {
        assert.equal(opp.hand.length, beforeOppHand, `${sample.cardNumber} must not touch opponent hand unexpectedly`);
      }

      matrix.push({
        category,
        cardNumber: sample.cardNumber,
        name: sample.cardDef.name || sample.ir.name,
        abilityId: sample.ability.id,
        success: res.success !== false,
        beforeDeck,
        afterDeck: p.deck.length,
        beforeHand,
        afterHand: p.hand.length,
        observedPromptZones
      });
    }
  }

  fs.mkdirSync(path.resolve('reports/phase_m4'), { recursive: true });
  fs.writeFileSync(
    path.resolve('reports/phase_m4/REAL_CARD_VALIDATION_MATRIX.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), totalTested: matrix.length, results: matrix }, null, 2)
  );
  assert.ok(matrix.length >= 10, 'Must validate at least 10 real compiled cards');
});
