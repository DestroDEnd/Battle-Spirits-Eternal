import { test } from 'node:test';
import assert from 'node:assert/strict';
import { launchRealBrowser } from './helpers/real_browser.js';

test('M4-BROWSER-E2E: Zone/side prompt identity and draw-to-hand DOM update in real Chrome', async () => {
  const dynamicPort = 4800 + Math.floor(Math.random() * 150);
  const harness = await launchRealBrowser({ serverPort: dynamicPort });

  try {
    await harness.navigate('/arena.html');
    await harness.waitForFunction(
      'window.BattleArena && typeof window.BattleArena.promptStructuredDecision === "function" && window.SagaConditionDSL && window.SagaConditionDSL.fx && typeof window.SagaConditionDSL.fx.drawCards === "function"',
      25000
    );

    // 1. Verify hand targeting modal preserves candidateId, zone, and side, and does not auto-select
    const handPromptRes = await harness.evaluate(`(async function() {
      const card = { id: 'BS01-002', name: 'Hand Targeter' };
      const prompt = {
        interactionId: 'irq-m4-hand-1',
        requestType: 'SELECT_CARDS',
        type: 'SELECT_CARDS',
        title: 'Discard 1 card from Hand',
        description: 'Select 1 card from your Hand.',
        player: 'player',
        candidates: [
          { candidateId: 'hand:player:h_1', uid: 'h_1', id: 'BS01-010', name: 'Hand Dragon', zone: 'hand', side: 'player', cost: 3 },
          { candidateId: 'hand:player:h_2', uid: 'h_2', id: 'BS01-011', name: 'Hand Bird', zone: 'hand', side: 'player', cost: 2 }
        ],
        minSelections: 1,
        maxSelections: 1,
        optional: false
      };

      let resolved = false;
      let result = null;
      const p = window.BattleArena.promptStructuredDecision(prompt, card, 'player').then(r => {
        resolved = true;
        result = r;
      });

      await new Promise(r => setTimeout(r, 200));
      const autoSelected = resolved;
      const modal = document.querySelector('.universal-target-modal');
      if (!modal) return { ok: false, error: 'Missing target modal' };

      const row2 = modal.querySelector('[data-cand-key="hand:player:h_2"]');
      if (!row2) return { ok: false, error: 'Missing canonical data-cand-key row' };
      const text = row2.textContent || '';
      row2.click();
      modal.querySelector('button[data-act="confirm"]').click();
      await p;

      return { ok: true, autoSelected, resolved, text, result };
    })()`);

    assert.equal(handPromptRes.ok, true, handPromptRes.error || 'Hand prompt failed');
    assert.equal(handPromptRes.autoSelected, false, 'Must not auto-select');
    assert.equal(handPromptRes.resolved, true);
    assert.match(handPromptRes.text, /player:hand/, 'Modal must display physical side:zone');
    assert.deepEqual(handPromptRes.result.selected, ['hand:player:h_2']);

    // 2. Verify drawCards updates both DuelState.player.hand/deck AND the #playerHand DOM
    const drawRes = await harness.evaluate(`(async function() {
      const ds = window.BattleArena.DuelState || window.DuelState;
      if (!ds || !ds.player) return { ok: false, error: 'DuelState unavailable' };

      ds.player.deck = [
        { uid: 'm4_dom_d1', id: 'BS01-001', name: 'Draconic Top 1', type: 'Spirit', cost: 2, color: 'Red', currentCores: 0 },
        { uid: 'm4_dom_d2', id: 'BS01-002', name: 'Draconic Top 2', type: 'Spirit', cost: 3, color: 'Red', currentCores: 0 }
      ];
      ds.player.hand = [
        { uid: 'm4_dom_h0', id: 'BS01-003', name: 'Existing Hand Card', type: 'Spirit', cost: 1, color: 'Red' }
      ];
      if (typeof window.BattleArena.renderDuelTable === 'function') window.BattleArena.renderDuelTable();
      if (typeof window.BattleArena.renderPlayerHand === 'function') window.BattleArena.renderPlayerHand();

      const domBefore = document.getElementById('playerHand')?.children.length || 0;
      const deckBefore = ds.player.deck.length;
      const handBefore = ds.player.hand.length;

      const dslRes = window.SagaConditionDSL.fx.drawCards({
        duelState: ds,
        side: 'player',
        card: { uid: 'm4_src_draw', id: 'BS01-118', name: 'Double Draw' },
        arenaApi: window.BattleArena
      }, { count: 2 });

      const domAfter = document.getElementById('playerHand')?.children.length || 0;
      return {
        ok: true,
        dslRes,
        deckBefore,
        deckAfter: ds.player.deck.length,
        handBefore,
        handAfter: ds.player.hand.length,
        domBefore,
        domAfter
      };
    })()`);

    assert.equal(drawRes.ok, true, drawRes.error || 'Draw E2E failed');
    assert.equal(drawRes.dslRes.applied, true);
    assert.equal(drawRes.dslRes.count, 2);
    assert.equal(drawRes.deckBefore, 2);
    assert.equal(drawRes.deckAfter, 0);
    assert.equal(drawRes.handBefore, 1);
    assert.equal(drawRes.handAfter, 3);
    assert.equal(drawRes.domAfter, drawRes.domBefore + 2, 'DOM #playerHand must render both drawn cards');
  } finally {
    await harness.close();
  }
});
