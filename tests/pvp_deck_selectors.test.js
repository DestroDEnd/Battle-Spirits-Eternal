import test from 'node:test';
import assert from 'node:assert/strict';
import { launchRealBrowser } from './helpers/real_browser.js';

test('PvP Arena Deck Selectors include user saved decks, active Deck Builder deck, and Standard decks', async () => {
  const browser = await launchRealBrowser({ headless: true });
  try {
    await browser.navigate('http://127.0.0.1:3000/arena.html');

    const result = await browser.evaluate(`(async () => {
      const deadline = Date.now() + 12000;
      while (Date.now() < deadline && (!window.BattleArena || !window.DeckManager)) {
        await new Promise(r => setTimeout(r, 100));
      }
      // Seed user saved decks + 45-card active Deck Builder deck
      const makeCards = (n) => {
        const obj = {};
        for (let i = 1; i <= n; i++) obj['BS01-' + String(i).padStart(3, '0')] = 1;
        return obj;
      };
      const userData = {
        activeDeckId: 'deck_crimson',
        battleDeckId: 'deck_crimson',
        decks: [
          { id: 'deck_crimson', name: 'Crimson Wyverns', color: 'Red', isStandard: false, cards: makeCards(42), updatedAt: Date.now() },
          { id: 'deck_shadow', name: 'Shadow Reapers', color: 'Purple', isStandard: false, cards: makeCards(40), updatedAt: Date.now() }
        ]
      };
      localStorage.setItem('bs_user_decks_v2', JSON.stringify(userData));
      localStorage.setItem('bs_deck', JSON.stringify(makeCards(45)));

      if (window.BattleArena && typeof window.BattleArena.switchArenaMode === 'function') {
        window.BattleArena.switchArenaMode('pvp');
      }
      if (window.BattleArena && typeof window.BattleArena.populatePvpDeckSelects === 'function') {
        window.BattleArena.populatePvpDeckSelects();
      }
      await new Promise(r => setTimeout(r, 400));

      const ids = ['pvpRandomDeckSelect', 'pvpHostDeckSelect', 'pvpJoinDeckSelect'];
      const summary = {};
      for (const id of ids) {
        const sel = document.getElementById(id);
        const opts = sel ? Array.from(sel.options).map(o => ({ value: o.value, text: o.textContent })) : [];
        if (sel) sel.value = 'deck_shadow';
        summary[id] = {
          count: opts.length,
          hasActive45: opts.some(o => o.value === 'deck_builder_active' && o.text.includes('45 Cards')),
          hasCrimson42: opts.some(o => o.value === 'deck_crimson' && o.text.includes('Crimson Wyverns') && o.text.includes('42 Cards')),
          hasShadow40: opts.some(o => o.value === 'deck_shadow' && o.text.includes('Shadow Reapers') && o.text.includes('40 Cards')),
          hasStandard: opts.some(o => o.value === 'deck_std_red'),
          canSelectCustom: sel ? sel.value === 'deck_shadow' : false
        };
      }
      return summary;
    })()`);

    for (const id of ['pvpRandomDeckSelect', 'pvpHostDeckSelect', 'pvpJoinDeckSelect']) {
      assert.equal(result[id].hasActive45, true, `${id} must list 45-card Deck Builder Active Deck. Got: ${JSON.stringify(result[id])}`);
      assert.equal(result[id].hasCrimson42, true, `${id} must list saved Crimson Wyverns (42 Cards)`);
      assert.equal(result[id].hasShadow40, true, `${id} must list saved Shadow Reapers (40 Cards)`);
      assert.equal(result[id].hasStandard, true, `${id} must also list Standard decks`);
      assert.equal(result[id].canSelectCustom, true, `${id} must allow selecting user custom decks`);
    }
  } finally {
    await browser.close();
  }
});
