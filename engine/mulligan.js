/**
 * engine/mulligan.js
 * 
 * Opening hand setup, Contract Partner guarantee, and Mulligan resolution.
 * Executes identically whether player or opponent goes first.
 */

import { ETERNAL_RULES } from './rules/eternal.js';

export async function setupOpeningHands(game) {
  const { state, resolver, events } = game;

  for (const side of ['player', 'opponent']) {
    const p = state.players[side];

    // 1. Contract Partner Guarantee (Rule 3.5 & R39)
    const partnerIndex = p.deck.findIndex(c => c.isContractPartner);
    if (partnerIndex !== -1) {
      const partnerCard = p.deck.splice(partnerIndex, 1)[0];
      p.hand.push(partnerCard);
    }

    // 2. Fill remaining opening hand up to 4 cards
    while (p.hand.length < ETERNAL_RULES.setup.initialHandSize && p.deck.length > 0) {
      p.hand.push(p.deck.shift());
    }

    // 3. Prompt for Mulligan (Rule 3.5 & R41)
    if (!p.hasUsedMulligan && ETERNAL_RULES.setup.mulliganAllowed) {
      const choice = await resolver.promptResolver.choose({
        type: 'MULLIGAN_CHOICE',
        title: `${side === 'player' ? 'Player' : 'Opponent'}: Redraw opening hand of 4 cards?`,
        hand: p.hand,
        chooser: side
      });

      if (choice && choice.mulligan) {
        p.hasUsedMulligan = true;

        // Return hand cards to deck
        p.deck.push(...p.hand);
        p.hand = [];

        // Shuffle deck
        shuffleArray(p.deck);

        // Re-guarantee contract partner if in deck
        const rePartnerIndex = p.deck.findIndex(c => c.isContractPartner);
        if (rePartnerIndex !== -1) {
          const partnerCard = p.deck.splice(rePartnerIndex, 1)[0];
          p.hand.push(partnerCard);
        }

        // Draw 4 new cards
        while (p.hand.length < ETERNAL_RULES.setup.mulliganHandSize && p.deck.length > 0) {
          p.hand.push(p.deck.shift());
        }

        if (events) {
          await events.emit({
            type: 'MULLIGAN_RESOLVED',
            player: side,
            newHandCount: p.hand.length
          });
        }
      }
    }
  }

  return true;
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
