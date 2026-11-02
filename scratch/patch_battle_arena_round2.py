import re

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Patch sendToTrash
# - Pre-advent cards cleanup
# - isSelfInflicted vs isByOpponent for Burst trigger
# - Shugraus LV2 on Makai destroyed by opponent
old_send_to_trash = '''    card.graveyardReason = reason || 'Sent to Trash';
    executeUniversalCardEffect(card, side, 'WHEN_DESTROYED', { reason });
    card.graveyardTurn = DuelState.turn;
    target.trashCards.unshift(card);'''

new_send_to_trash = '''    card.graveyardReason = reason || 'Sent to Trash';
    executeUniversalCardEffect(card, side, 'WHEN_DESTROYED', { reason });
    card.graveyardTurn = DuelState.turn;
    target.trashCards.unshift(card);

    // Send all pre-advent cards stacked under an Advent spirit to Trash
    if (card.underlyingCards && card.underlyingCards.length > 0) {
      const stacked = card.underlyingCards;
      card.underlyingCards = [];
      stacked.forEach(u => {
        u.graveyardReason = `Pre-Advent card under fallen ${card.name}`;
        u.graveyardTurn = DuelState.turn;
        target.trashCards.unshift(u);
        addLog(`🪦 **[PRE-ADVENT TRASHED]**: "${u.name}" stacked under "${card.name}" sent to Trash.`, 'info');
      });
    }'''

assert old_send_to_trash in content, "old_send_to_trash not found"
content = content.replace(old_send_to_trash, new_send_to_trash, 1)

old_burst_in_trash = '''    // Trigger Burst: [After your Spirit is depleted/destroyed by the Opponent]
    if (card.type === 'Spirit' && (rLower.includes('destroy') || rLower.includes('curse') || rLower.includes('deplet') || rLower.includes('combat') || rLower.includes('fell in battle'))) {
      checkBurstTrigger(side, 'AFTER_YOUR_SPIRIT_DESTROYED', { destroyedSpirit: card, reason });
    }'''

new_burst_in_trash = '''    // Trigger Burst: [After your Spirit is depleted/destroyed by the Opponent]
    const isSelfInflicted = rLower.includes('core sacrifice') || rLower.includes('self-sacrifice') || rLower.includes('for summon') || rLower.includes('tribute') || rLower.includes('friendly') || rLower.includes('paid cost') || rLower.includes('cost payment');
    const isByOpponent = !isSelfInflicted && (
      rLower.includes('opponent') || rLower.includes('opposing') || rLower.includes('combat') || rLower.includes('fell in battle') || rLower.includes('curse') || rLower.includes('destroyed by') || (DuelState.activePlayer !== side)
    );
    if (card.type === 'Spirit' && isByOpponent) {
      checkBurstTrigger(side, 'AFTER_YOUR_SPIRIT_DESTROYED', { destroyedSpirit: card, reason });
    }

    // Check Shugraus LV2: When your "Makai"-named Spirits are destroyed by the opponent, draw one card from your deck.
    if (isByOpponent && ((card.name || '').toLowerCase().includes('makai') || (card.family || '').toLowerCase().includes('makai'))) {
      const allies = (side === 'player' ? DuelState.player.field : DuelState.opponent.field) || [];
      for (const ally of allies) {
        if (!ally || ally.uid === card.uid) continue;
        if ((ally.name || '').includes('Shugraus') && (ally.currentLevel || 1) >= 2) {
          if (target.deck && target.deck.length > 0) {
            const drawn = target.deck.shift();
            if (target.hand) target.hand.push(drawn);
            AudioFX.draw();
            addLog(`🔮 **[${ally.name} Lv2]**: Drew "${drawn.name}" because allied Makai "${card.name}" was destroyed by opponent!`, 'draw');
            if (side === 'player') renderPlayerHand();
          }
        }
      }
    }'''

assert old_burst_in_trash in content, "old_burst_in_trash not found"
content = content.replace(old_burst_in_trash, new_burst_in_trash, 1)

# 2. Patch executeWhenSummonedEffects for Shugraus
old_maurice = '''    // Allied Field triggers on summon (e.g. Shugraus):
    const myField = side === 'player' ? DuelState.player.field : DuelState.opponent.field;
    for (const ally of myField) {
      if (!ally || ally.uid === spirit.uid) continue;
      const allyEff = (ally.effect || '').toLowerCase();
      if ((allyEff.includes('when your "makai"-named spirits') || allyEff.includes('when your makai-named spirits')) && ((spirit.name || '').toLowerCase().includes('makai') || (spirit.family || '').toLowerCase().includes('makai'))) {
        ally.currentCores = (ally.currentCores || 0) + 1;
        recalculateSpiritBp(ally);
        AudioFX.coreChime();
        addLog(`🔮 **[MAURICE HARVEST: ${ally.name}]**: Harvested +1 Core from Void upon summoning "${spirit.name}"!`, 'magic');
      }
    }'''

new_maurice = '''    // Allied Field triggers on summon (e.g. Shugraus):
    const myField = side === 'player' ? DuelState.player.field : DuelState.opponent.field;
    const oppField = side === 'player' ? DuelState.opponent.field : DuelState.player.field;
    const oppTarget = side === 'player' ? DuelState.opponent : DuelState.player;
    for (const ally of myField) {
      if (!ally || ally.uid === spirit.uid) continue;
      const allyEff = (ally.effect || '').toLowerCase();
      const isMakaiSummoned = (spirit.name || '').toLowerCase().includes('makai') || (spirit.family || '').toLowerCase().includes('makai');
      if (isMakaiSummoned && ((ally.name || '').includes('Shugraus') || (allyEff.includes('when your "makai"-named spirits') && allyEff.includes('other than this spirit')))) {
        const targets = oppField.filter(s => s && (s.currentCores || 0) > 0);
        if (targets.length > 0) {
          const oppSp = targets[0];
          oppSp.currentCores -= 1;
          oppTarget.reserve = (oppTarget.reserve || 0) + 1;
          recalculateSpiritBp(oppSp);
          AudioFX.coreChime();
          addLog(`🔮 **[${ally.name}]**: Sent 1 core from opposing "${oppSp.name}" to their Reserve upon summoning "${spirit.name}"!`, 'magic');
          if (oppSp.currentCores <= 0) {
            addLog(`💀 "${oppSp.name}" was depleted to 0 Cores by ${ally.name}!`, 'destroy');
            sendToTrash(oppSp, side === 'player' ? 'opponent' : 'player', `Depleted by ${ally.name}`);
            const oppIdx = oppField.indexOf(oppSp);
            if (oppIdx !== -1) oppField.splice(oppIdx, 1);
          }
        } else {
          addLog(`🔮 **[${ally.name}]**: Triggered upon summoning "${spirit.name}", but opponent controls no Spirits with cores!`, 'info');
        }
      }
    }'''

assert old_maurice in content, "old_maurice not found"
content = content.replace(old_maurice, new_maurice, 1)

# 3. Patch executeAdvent to re-render hand after effects resolve
old_advent_render = '''    renderDuelTable();
    if (isPlayer) renderPlayerHand();

    // 5. Trigger (When Advents) / [Twinkle ...] effects
    executeWhenAdventsEffects(targetSpirit, side);'''

new_advent_render = '''    renderDuelTable();

    // 5. Trigger (When Advents) / [Twinkle ...] effects
    executeWhenAdventsEffects(targetSpirit, side);'''

assert old_advent_render in content, "old_advent_render not found"
content = content.replace(old_advent_render, new_advent_render, 1)

old_advent_end = '''    // 6. Also trigger any general (When Summoned) effects
    executeWhenSummonedEffects(targetSpirit, side);'''

new_advent_end = '''    // 6. Also trigger any general (When Summoned) effects
    executeWhenSummonedEffects(targetSpirit, side);

    renderDuelTable();
    if (isPlayer) renderPlayerHand();'''

assert old_advent_end in content, "old_advent_end not found"
content = content.replace(old_advent_end, new_advent_end, 1)

# 4. Patch DRAW_CARDS immediate render
old_draw_core = '''            if (side === 'player') {
              AudioFX.playTone(390, 'sine', 0.15, 0.08);
              addLog(`🎴 **[${card.name}]**: Channeled ability! Drew "${drawn.name}" into your hand.`, 'magic');
            }'''

new_draw_core = '''            if (side === 'player') {
              AudioFX.playTone(390, 'sine', 0.15, 0.08);
              addLog(`🎴 **[${card.name}]**: Channeled ability! Drew "${drawn.name}" into your hand.`, 'magic');
              renderPlayerHand();
              renderDuelTable();
            }'''

assert old_draw_core in content, "old_draw_core not found"
content = content.replace(old_draw_core, new_draw_core, 1)

old_draw_actions = '''      if (drawn > 0) {
        AudioFX.playTone(440, 'sine', 0.15, 0.1);
        addLog(`🎴 **[DRAW EFFECT: ${card.name}]**: Drew ${drawn} card(s) from deck into Hand!`, 'step');
        if (typeof showToast === 'function') showToast(`Drew ${drawn} card(s)!`, 'info');
      }'''

new_draw_actions = '''      if (drawn > 0) {
        AudioFX.playTone(440, 'sine', 0.15, 0.1);
        addLog(`🎴 **[DRAW EFFECT: ${card.name}]**: Drew ${drawn} card(s) from deck into Hand!`, 'step');
        if (typeof showToast === 'function') showToast(`Drew ${drawn} card(s)!`, 'info');
        if (side === 'player') {
          renderPlayerHand();
          renderDuelTable();
        }
      }'''

assert old_draw_actions in content, "old_draw_actions not found"
content = content.replace(old_draw_actions, new_draw_actions, 1)

# 5. Patch activateBurst
old_activate_burst = '''    // 2. Resolve effect based on card type without duplicating
    if (burstCard.type === 'Spirit') {
      const targetField = isPlayer ? DuelState.player.field : DuelState.opponent.field;
      // Prevent duplicate spirits if already on field
      if (!targetField.some(s => s.uid === burstCard.uid)) {
        const coresToPlace = 1;
        const { level, bp } = calculateBpAndLevel(burstCard.levels, coresToPlace);
        burstCard.currentCores = coresToPlace;
        burstCard.currentLevel = level;
        burstCard.currentBp = bp;
        burstCard.isExhausted = false;
        burstCard.hasAttacked = false;
        targetField.push(burstCard);
        setTimeout(() => AudioFX.summon(), 180);
        addLog(`✨ **BURST SUMMON**: "${burstCard.name}" summoned to the battle line for free (Lv${level}, ${bp} BP)!`, 'step');
        executeWhenSummonedEffects(burstCard, side);
      }
    } else if (burstCard.type === 'Magic') {
      setTimeout(() => AudioFX.coreChime(), 180);
      const desc = applyMagicEffect(burstCard, side);
      sendToTrash(burstCard, side, `${isPlayer ? 'Player' : 'Opponent'} Burst Magic Activated`);
      addLog(`🔮 **BURST MAGIC**: "${burstCard.name}" resolved its effect! ${desc}`, 'magic');
    }'''

new_activate_burst = '''    // 2. Resolve effect based on card type without duplicating
    if (burstCard.type === 'Spirit') {
      const targetField = isPlayer ? DuelState.player.field : DuelState.opponent.field;
      const targetState = isPlayer ? DuelState.player : DuelState.opponent;

      // First, resolve the Burst Effect itself!
      let burstEffectResolved = false;

      if ((burstCard.name || '').includes('Renegada') || /summon up to two Cost 6 or less Purple Spirit cards from your Trash/i.test(burstCard.effect || '')) {
        // Renegada Burst Effect:
        // "You can summon up to two Cost 6 or less Purple Spirit cards from your Trash, paying one cost each, and during this turn, treat their LV1 cost as 0. Every Spirit summoned by this effect is destroyed during this turn's End Step."
        const trash = targetState.trashCards || [];
        const eligible = trash.filter(c => (c.type === 'Spirit' || !c.type) && (c.color === 'Purple' || !c.color) && (c.cost <= 6));
        let summonedCount = 0;
        for (const reanimCard of [...eligible]) {
          if (summonedCount >= 2) break;
          const hasCost = (targetState.reserve >= 1 || targetState.cores >= 1 || !isPlayer);
          if (hasCost) {
            if (targetState.reserve >= 1) targetState.reserve -= 1;
            else if (targetState.cores >= 1) targetState.cores -= 1;
            const idx = trash.indexOf(reanimCard);
            if (idx !== -1) trash.splice(idx, 1);
            const reanimatedSpirit = {
              ...reanimCard,
              uid: 'sp_' + Math.random().toString(36).slice(2, 9),
              currentCores: 1,
              hasSoulCore: false,
              isExhausted: false,
              hasAttacked: false,
              battleBp: 0,
              destroyAtEndStep: true
            };
            const { level, bp } = calculateBpAndLevel(reanimatedSpirit.levels, 1, false, reanimatedSpirit.effect);
            reanimatedSpirit.currentLevel = level;
            reanimatedSpirit.currentBp = bp;
            targetField.push(reanimatedSpirit);
            summonedCount++;
            AudioFX.summon();
            addLog(`💀 **[RENEGADA REANIMATION]**: Summoned "${reanimatedSpirit.name}" from Trash (Cost ${reanimCard.cost}, 1 Core paid)! Will be destroyed at End Step.`, 'magic');
            executeWhenSummonedEffects(reanimatedSpirit, side);
          }
        }
        burstEffectResolved = true;
      } else if ((burstCard.name || '').includes('BurguHearts') || /Send two cores each from every non-"Makai"-named Spirits to the Reserve/i.test(burstCard.effect || '')) {
        // BurguHearts Burst Effect:
        let depletedCount = 0;
        const allSpirits = [...(DuelState.player.field || []), ...(DuelState.opponent.field || [])];
        for (const sp of allSpirits) {
          const spMakai = (sp.name || '').toLowerCase().includes('makai') || (sp.family || '').toLowerCase().includes('makai');
          if (!spMakai && (sp.currentCores || 0) > 0) {
            const drain = Math.min(2, sp.currentCores);
            sp.currentCores -= drain;
            const spOwner = (DuelState.player.field || []).includes(sp) ? DuelState.player : DuelState.opponent;
            spOwner.reserve = (spOwner.reserve || 0) + drain;
            recalculateSpiritBp(sp);
            if (sp.currentCores <= 0) {
              depletedCount++;
              const spSide = (DuelState.player.field || []).includes(sp) ? 'player' : 'opponent';
              sendToTrash(sp, spSide, `Depleted by ${burstCard.name}`);
              const fld = spSide === 'player' ? DuelState.player.field : DuelState.opponent.field;
              const idx = fld.indexOf(sp);
              if (idx !== -1) fld.splice(idx, 1);
            }
          }
        }
        addLog(`💥 **[${burstCard.name} BURST]**: Drained 2 cores each from non-Makai spirits to their Reserve!`, 'magic');
        if (DuelState.activePlayer === side && depletedCount > 0) {
          targetState.reserve = (targetState.reserve || 0) + depletedCount;
          addLog(`✨ **[${burstCard.name}]**: Placed +${depletedCount} Core(s) from Void to Reserve for depleted spirits!`, 'magic');
        }
        burstEffectResolved = true;
      } else {
        // Generic Spirit Burst effects
        executeUniversalCardEffect(burstCard, side, 'BURST');
        const burstBlocks = getCardAbilityBlocks(burstCard.effect).filter(b => /\[Burst:/i.test(b) || /^Burst:/i.test(b));
        for (const b of burstBlocks) {
          executeAbilityActions(b, burstCard, side, 'BURST');
        }
        burstEffectResolved = true;
      }

      // Battle Spirits Rule: "After this effect resolves, summon this Spirit card without paying the cost."
      const canSummonFree = /summon this (?:spirit\s+)?card without paying the cost/i.test(burstCard.effect || '') ||
                            /after this effect resolves/i.test(burstCard.effect || '') ||
                            burstCard.type === 'Spirit';

      if (canSummonFree && burstEffectResolved) {
        if (!targetField.some(s => s.uid === burstCard.uid)) {
          const coresToPlace = 1;
          const { level, bp } = calculateBpAndLevel(burstCard.levels, coresToPlace);
          burstCard.currentCores = coresToPlace;
          burstCard.currentLevel = level;
          burstCard.currentBp = bp;
          burstCard.isExhausted = false;
          burstCard.hasAttacked = false;
          targetField.push(burstCard);
          setTimeout(() => AudioFX.summon(), 180);
          addLog(`✨ **BURST SUMMON**: "${burstCard.name}" summoned to the battle line for free (Lv${level}, ${bp} BP)!`, 'step');
          executeWhenSummonedEffects(burstCard, side);
        }
      } else {
        sendToTrash(burstCard, side, 'Burst resolved without summon');
        addLog(`🪦 **[BURST RESOLVED]**: "${burstCard.name}" sent to Trash after resolving effect.`, 'info');
      }
    } else if (burstCard.type === 'Magic') {
      setTimeout(() => AudioFX.coreChime(), 180);
      const desc = applyMagicEffect(burstCard, side);
      sendToTrash(burstCard, side, `${isPlayer ? 'Player' : 'Opponent'} Burst Magic Activated`);
      addLog(`🔮 **BURST MAGIC**: "${burstCard.name}" resolved its effect! ${desc}`, 'magic');
    }'''

assert old_activate_burst in content, "old_activate_burst not found"
content = content.replace(old_activate_burst, new_activate_burst, 1)

# 6. Patch endTurn to clean up destroyAtEndStep spirits
old_end_turn = '''    DuelState.turn++;
    if (DuelState.activePlayer === 'player') {'''

new_end_turn = '''    // Destroy spirits with destroyAtEndStep (e.g. Renegada reanimation)
    for (const side of ['player', 'opponent']) {
      const fld = DuelState[side].field || [];
      for (let i = fld.length - 1; i >= 0; i--) {
        const s = fld[i];
        if (s && s.destroyAtEndStep) {
          fld.splice(i, 1);
          addLog(`💀 **[END STEP DESTRUCTION]**: "${s.name}" was destroyed at End Step as required by Renegada's effect!`, 'destroy');
          sendToTrash(s, side, 'Destroyed at End Step by Renegada effect');
        }
      }
    }

    DuelState.turn++;
    if (DuelState.activePlayer === 'player') {'''

assert old_end_turn in content, "old_end_turn not found"
content = content.replace(old_end_turn, new_end_turn, 1)

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("ALL BATTLE ARENA ROUND 2 PATCHES APPLIED SUCCESSFULLY!")
