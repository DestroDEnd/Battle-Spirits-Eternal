import sys, re

sys.stdout.reconfigure(encoding='utf-8')
print("=== Integrating Universal Card Ability Dispatcher ===")

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Define executeAbilityActions and updated executeWhenSummonedEffects, executeWhenAttacksEffects, executeWhenBlocksEffects, executeWhenDestroyedEffects
replacement_code = '''  // ── UNIVERSAL CARD ABILITY DISPATCHER ──
  // Resolves core abilities across all 14,500+ cards for all triggers: SUMMON, ATTACK, BLOCK, DESTROYED, ADVENT, MAGIC
  function executeAbilityActions(bodyText, card, side = 'player', triggerName = 'SUMMON', context = {}) {
    if (!bodyText || !card) return;
    const bodyLower = bodyText.toLowerCase();
    const isPlayer = side === 'player';
    const myField = isPlayer ? DuelState.player.field : DuelState.opponent.field;
    const myReserve = isPlayer ? DuelState.player : DuelState.opponent;
    const enemyField = isPlayer ? DuelState.opponent.field : DuelState.player.field;
    const enemySide = isPlayer ? 'opponent' : 'player';
    const enemyReserve = isPlayer ? DuelState.opponent : DuelState.player;
    const myDeck = isPlayer ? DuelState.player.deck : DuelState.opponent.deck;
    const myHand = isPlayer ? DuelState.player.hand : DuelState.opponent.hand;
    const myTrash = (isPlayer ? (DuelState.player.trashCards || DuelState.player.trash) : (DuelState.opponent.trashCards || DuelState.opponent.trash)) || [];

    // 1. UNBLOCKABLE STATUS
    if (/this spirit can't be blocked|this spirit cannot be blocked|cannot be blocked by opposing|can't be blocked by opposing/i.test(bodyLower)) {
      card.cantBeBlocked = true;
      addLog(`⚡ **[UNBLOCKABLE: ${card.name}]**: This Spirit cannot be blocked!`, 'damage');
    }

    // 2. OPPONENT SACRIFICE DESTRUCTION
    if (/the opponent destroys a (?:spirit|ultimate)(?:\s+they\s+control)?|opponent destroys a (?:spirit|ultimate)/i.test(bodyLower)) {
      if (enemyField.length > 0) {
        enemyField.sort((a, b) => (a.currentBp || 0) - (b.currentBp || 0));
        const sacrificed = enemyField.shift();
        enemyReserve.reserve += sacrificed.currentCores;
        handleDestroyedSpiritCores(sacrificed, enemySide);
        sendToTrash(sacrificed, enemySide, `Sacrificed due to ${card.name} (${triggerName})`);
        AudioFX.slash();
        addLog(`💀 **[SACRIFICE RESOLUTION: ${card.name}]**: Opponent was forced to destroy their own "${sacrificed.name}" (${sacrificed.currentBp} BP)! Cores moved to reserve.`, 'kill');
        if (typeof showToast === 'function') {
          showToast(`💀 Opponent sacrificed "${sacrificed.name}"!`, 'success');
        }
      }
    }

    // 3. DESTROY EXHAUSTED OPPOSING SPIRIT
    if (/destroy\s+(?:an?|one|all|\d+)?\s*(?:opposing\s+)?exhausted\s+(?:spirit|ultimate)/i.test(bodyLower)) {
      const exhausted = enemyField.filter(s => s.isExhausted);
      if (exhausted.length > 0) {
        exhausted.sort((a, b) => (b.currentBp || 0) - (a.currentBp || 0));
        const target = exhausted[0];
        const tIdx = enemyField.findIndex(s => s.uid === target.uid);
        if (tIdx !== -1) {
          const dest = enemyField.splice(tIdx, 1)[0];
          enemyReserve.reserve += dest.currentCores;
          handleDestroyedSpiritCores(dest, enemySide);
          sendToTrash(dest, enemySide, `Destroyed by ${card.name} (${triggerName})`);
          AudioFX.slash();
          addLog(`💀 **[EXHAUSTED DESTRUCTION: ${card.name}]**: Destroyed opposing exhausted "${dest.name}" (${dest.currentBp} BP)! Cores returned to reserve.`, 'kill');
          if (typeof showToast === 'function') showToast(`Destroyed exhausted "${dest.name}"!`, 'success');
        }
      }
    }
    // 4. DESTROY OPPOSING SPIRIT BY BP
    else if (/destroy\s+(?:an?|one|\d+)?\s*opposing\s+(\d+)\s*bp\s+or\s+less\s+(?:spirit|ultimate)/i.test(bodyLower)) {
      const match = bodyLower.match(/destroy\s+(?:an?|one|\d+)?\s*opposing\s+(\d+)\s*bp\s+or\s+less\s+(?:spirit|ultimate)/i);
      const maxBp = parseInt(match[1], 10);
      const eligible = enemyField.filter(s => (s.currentBp || 0) <= maxBp);
      if (eligible.length > 0) {
        eligible.sort((a, b) => (b.currentBp || 0) - (a.currentBp || 0));
        const dest = eligible[0];
        const tIdx = enemyField.findIndex(s => s.uid === dest.uid);
        if (tIdx !== -1) {
          enemyField.splice(tIdx, 1);
          enemyReserve.reserve += dest.currentCores;
          handleDestroyedSpiritCores(dest, enemySide);
          sendToTrash(dest, enemySide, `Destroyed by ${card.name} (${triggerName})`);
          AudioFX.slash();
          addLog(`💀 **[BP DESTRUCTION: ${card.name}]**: Destroyed opposing "${dest.name}" (${dest.currentBp} BP <= ${maxBp} BP)! Cores returned to enemy reserve.`, 'kill');
          if (typeof showToast === 'function') showToast(`Destroyed "${dest.name}" (<= ${maxBp} BP)!`, 'success');
        }
      }
    }
    // 5. DESTROY OPPOSING SPIRIT BY COST OR UNCONDITIONAL
    else if (/destroy\s+(?:an?|one|\d+)?\s*opposing\s+(?:cost\s*(\d+)\s*or\s*(less|more)\s+)?(?:spirit|ultimate)/i.test(bodyLower)) {
      const match = bodyLower.match(/destroy\s+(?:an?|one|\d+)?\s*opposing\s+(?:cost\s*(\d+)\s*or\s*(less|more)\s+)?(?:spirit|ultimate)/i);
      const targetCost = match[1] ? parseInt(match[1], 10) : null;
      const isLess = match[2] ? match[2].toLowerCase() === 'less' : true;

      let eligible = enemyField;
      if (targetCost !== null) {
        eligible = enemyField.filter(s => isLess ? (s.cost || 0) <= targetCost : (s.cost || 0) >= targetCost);
      }
      if (eligible.length > 0) {
        eligible.sort((a, b) => (b.currentBp || 0) - (a.currentBp || 0));
        const dest = eligible[0];
        const tIdx = enemyField.findIndex(s => s.uid === dest.uid);
        if (tIdx !== -1) {
          enemyField.splice(tIdx, 1);
          enemyReserve.reserve += dest.currentCores;
          handleDestroyedSpiritCores(dest, enemySide);
          sendToTrash(dest, enemySide, `Destroyed by ${card.name} (${triggerName})`);
          AudioFX.slash();
          addLog(`💀 **[DESTRUCTION: ${card.name}]**: Destroyed opposing "${dest.name}" (Cost ${dest.cost}, ${dest.currentBp} BP)! Cores returned to enemy reserve.`, 'kill');
          if (typeof showToast === 'function') showToast(`Destroyed "${dest.name}"!`, 'success');
        }
      }
    }

    // 6. CORE REMOVAL TO RESERVE OR TRASH (DEPLETION)
    if (/send\s+(?:up to\s+)?(a|an|one|two|three|\d+)\s+cores?\s+from\s+(?:an|one|\d+)?\s*opposing\s+(?:spirit|ultimate|nexus).*?to\s+the\s+(reserve|trash)/i.test(bodyLower)) {
      const match = bodyLower.match(/send\s+(?:up to\s+)?(a|an|one|two|three|\d+)\s+cores?\s+from\s+(?:an|one|\d+)?\s*opposing\s+(?:spirit|ultimate|nexus).*?to\s+the\s+(reserve|trash)/i);
      const count = parseWordNumber(match[1]);
      const dest = match[2].toLowerCase();

      if (enemyField.length > 0) {
        enemyField.sort((a, b) => (b.currentBp || 0) - (a.currentBp || 0));
        const target = enemyField[0];
        const coresToRemove = Math.min(count, target.currentCores);
        target.currentCores -= coresToRemove;

        if (dest === 'trash') {
          enemyReserve.trashCores = (enemyReserve.trashCores || 0) + coresToRemove;
        } else {
          enemyReserve.reserve += coresToRemove;
        }

        AudioFX.coreChime();
        addLog(`🔮 **[CORE DEPLETION: ${card.name}]**: Sent ${coresToRemove} core(s) from opposing "${target.name}" to their ${dest}!`, 'magic');

        if (target.currentCores <= 0) {
          const tIdx = enemyField.findIndex(s => s.uid === target.uid);
          if (tIdx !== -1) enemyField.splice(tIdx, 1);
          handleDestroyedSpiritCores(target, enemySide);
          sendToTrash(target, enemySide, `Depleted by ${card.name} (${triggerName})`);
          AudioFX.slash();
          addLog(`💀 **[DEPLETED!]**: Opposing "${target.name}" was left with 0 cores and sent to Trash!`, 'kill');

          if (/when this effect depletes|when depleted/i.test(bodyLower) && /draw\s+(a|an|one|two|three|\d+)\s+cards?/i.test(bodyLower)) {
            const mDraw = bodyLower.match(/draw\s+(a|an|one|two|three|\d+)\s+cards?/i);
            const numDraw = parseWordNumber(mDraw[1]);
            let bonusDrawn = 0;
            for (let d = 0; d < numDraw; d++) {
              const c = myDeck.shift();
              if (c) { myHand.push(c); bonusDrawn++; }
            }
            if (bonusDrawn > 0) {
              addLog(`🎴 **[DEPLETION BONUS: ${card.name}]**: Drew +${bonusDrawn} card(s) from deck!`, 'step');
              if (typeof showToast === 'function') showToast(`Drew +${bonusDrawn} cards on depletion!`, 'info');
            }
          }
        } else {
          const { level: tLvl, bp: tBp } = calculateBpAndLevel(target.levels, target.currentCores, !!target.hasSoulCore, target.effect);
          target.currentLevel = tLvl;
          target.currentBp = tBp;
        }
      }
    }

    // 7. VOID CORE BOOST TO THIS SPIRIT (or Kingtaurus aura)
    if (/for each other spirit you control.*?put a core from the void to this spirit/i.test(bodyLower)) {
      const otherSpirits = myField.filter(s => s.uid !== card.uid).length;
      if (otherSpirits > 0) {
        card.currentCores += otherSpirits;
        const { level: newLvl, bp: newBp } = calculateBpAndLevel(card.levels, card.currentCores, !!card.hasSoulCore, card.effect);
        card.currentLevel = newLvl;
        card.currentBp = newBp;
        AudioFX.summon();
        addLog(`⚡ **[VOID BOOST: ${card.name}]**: Channeled presence of ${otherSpirits} allied Spirit(s)! Added +${otherSpirits} Void Cores to "${card.name}" (now Lv${newLvl}, ${newBp} BP)!`, 'magic');
      }
    } else if (/put\s+(a|an|one|two|three|\d+)\s+cores?\s+from\s+the\s+void\s+to\s+this\s+spirit/i.test(bodyLower)) {
      const match = bodyLower.match(/put\s+(a|an|one|two|three|\d+)\s+cores?\s+from\s+the\s+void\s+to\s+this\s+spirit/i);
      const count = parseWordNumber(match[1]);
      card.currentCores = (card.currentCores || 0) + count;
      const { level: newLvl, bp: newBp } = calculateBpAndLevel(card.levels, card.currentCores, !!card.hasSoulCore, card.effect);
      card.currentLevel = newLvl;
      card.currentBp = newBp;
      AudioFX.summon();
      addLog(`✨ **[VOID BOOST: ${card.name}]**: Claimed +${count} Core(s) from the Void onto "${card.name}" (now Lv${newLvl}, ${newBp} BP)!`, 'magic');
      if (typeof showToast === 'function') showToast(`+${count} Core(s) from Void onto ${card.name}!`, 'success');
    }

    // 8. VOID CORE BOOST TO RESERVE
    if (/put\s+(a|an|one|two|three|\d+)\s+cores?\s+from\s+the\s+void\s+to\s+(?:your\s+)?reserve/i.test(bodyLower)) {
      const match = bodyLower.match(/put\s+(a|an|one|two|three|\d+)\s+cores?\s+from\s+the\s+void\s+to\s+(?:your\s+)?reserve/i);
      const count = parseWordNumber(match[1]);
      myReserve.reserve += count;
      AudioFX.coreChime();
      addLog(`✨ **[VOID BOOST: ${card.name}]**: Placed +${count} Core(s) from Void to Reserve!`, 'magic');
      if (typeof showToast === 'function') showToast(`+${count} Core(s) to Reserve!`, 'success');
    }

    // 9. LIFE RECOVERY / HOLY LIFE
    if (/put\s+(a|an|one|two|\d+)?\s*cores?\s+from\s+(?:the\s+)?(?:void|reserve)\s+to\s+(?:your\s+)?life/i.test(bodyLower)) {
      const match = bodyLower.match(/put\s+(a|an|one|two|\d+)?\s*cores?\s+from\s+(?:the\s+)?(?:void|reserve)\s+to\s+(?:your\s+)?life/i);
      const count = match && match[1] ? parseWordNumber(match[1]) : 1;
      const healed = Math.min(count, 5 - myReserve.life);
      if (healed > 0) {
        myReserve.life += healed;
        AudioFX.coreChime();
        addLog(`💖 **[LIFE RECOVERY: ${card.name}]**: Recovered +${healed} Life Core(s) (Life: ${myReserve.life})!`, 'magic');
        if (typeof showToast === 'function') showToast(`+${healed} Life Core(s) Recovered!`, 'success');
      }
    }

    // 10. DRAW CARDS (when not part of unfulfilled condition)
    if (/draw\s+(a|an|one|two|three|\d+)\s+cards?/i.test(bodyLower) && !/when this effect depletes/i.test(bodyLower)) {
      const match = bodyLower.match(/draw\s+(a|an|one|two|three|\d+)\s+cards?/i);
      const count = parseWordNumber(match[1]);
      let drawn = 0;
      for (let i = 0; i < count; i++) {
        const c = myDeck.shift();
        if (c) { myHand.push(c); drawn++; }
      }
      if (drawn > 0) {
        AudioFX.playTone(440, 'sine', 0.15, 0.1);
        addLog(`🎴 **[DRAW EFFECT: ${card.name}]**: Drew ${drawn} card(s) from deck into Hand!`, 'step');
        if (typeof showToast === 'function') showToast(`Drew ${drawn} card(s)!`, 'info');
      }
    }

    // 11. EXHAUST OPPOSING SPIRIT
    if (/exhaust\s+(an?|one|\d+)?\s*opposing\s+spirit/i.test(bodyLower)) {
      const ready = enemyField.filter(s => !s.isExhausted);
      if (ready.length > 0) {
        ready.sort((a, b) => (b.currentBp || 0) - (a.currentBp || 0));
        ready[0].isExhausted = true;
        AudioFX.shield();
        addLog(`🛡️ **[EXHAUST EFFECT: ${card.name}]**: Exhausted opposing "${ready[0].name}"!`, 'magic');
        if (typeof showToast === 'function') showToast(`Exhausted "${ready[0].name}"!`, 'info');
      }
    }

    // 12. REFRESH SPIRIT
    if (/refresh\s+(this\s+spirit|a\s+spirit\s+you\s+control|an?\s+allied\s+spirit|one\s+spirit)/i.test(bodyLower)) {
      if (/refresh\s+this\s+spirit/i.test(bodyLower)) {
        card.isExhausted = false;
        AudioFX.shield();
        addLog(`🔄 **[REFRESH: ${card.name}]**: Refreshed "${card.name}" to Ready!`, 'magic');
      } else {
        const exhausted = myField.filter(s => s.isExhausted);
        if (exhausted.length > 0) {
          exhausted[0].isExhausted = false;
          AudioFX.shield();
          addLog(`🔄 **[REFRESH: ${card.name}]**: Refreshed allied "${exhausted[0].name}" to Ready!`, 'magic');
        }
      }
    }

    // 13. BOUNCE TO HAND
    if (/return\s+(?:an?|one|all|\d+)?\s*(?:opposing\s+)?spirit.*?to\s+(?:the\s+)?hand/i.test(bodyLower)) {
      const enemyHand = enemySide === 'player' ? DuelState.player.hand : DuelState.opponent.hand;
      if (enemyField.length > 0) {
        enemyField.sort((a, b) => (b.cost || 0) - (a.cost || 0));
        const target = enemyField.shift();
        enemyReserve.reserve += target.currentCores;
        target.currentCores = 0;
        enemyHand.push(target);
        AudioFX.slash();
        addLog(`↩️ **[BOUNCE TO HAND: ${card.name}]**: Returned opposing "${target.name}" to their Hand! Cores moved to reserve.`, 'magic');
        if (typeof showToast === 'function') showToast(`Returned "${target.name}" to Hand!`, 'info');
      }
    }

    // 14. BOUNCE TO DECK
    if (/return\s+(?:an?|one|all|\d+)?\s*(?:opposing\s+)?spirit.*?to\s+(?:the\s+)?(?:top|bottom\s+of\s+the\s+)?deck/i.test(bodyLower)) {
      const enemyDeck = enemySide === 'player' ? DuelState.player.deck : DuelState.opponent.deck;
      if (enemyField.length > 0) {
        enemyField.sort((a, b) => (b.cost || 0) - (a.cost || 0));
        const target = enemyField.shift();
        enemyReserve.reserve += target.currentCores;
        target.currentCores = 0;
        enemyDeck.push(target);
        AudioFX.slash();
        addLog(`🌀 **[BOUNCE TO DECK: ${card.name}]**: Sent opposing "${target.name}" to the bottom of their Deck!`, 'magic');
        if (typeof showToast === 'function') showToast(`Sent "${target.name}" to Deck!`, 'info');
      }
    }

    // 15. BP BOOST
    if (/(?:this spirit\s+)?(?:gets?|gains?)\s*\+(\d+)[\s]*bp/i.test(bodyLower)) {
      const match = bodyLower.match(/(?:this spirit\s+)?(?:gets?|gains?)\s*\+(\d+)[\s]*bp/i);
      const boost = parseInt(match[1], 10);
      card.currentBp = (card.currentBp || 0) + boost;
      card.battleBp = card.currentBp;
      AudioFX.shield();
      addLog(`💥 **[BP BOOST: ${card.name}]**: Gained +${boost} BP (now ${card.currentBp} BP)!`, 'damage');
    }

    // 16. DIRECT LIFE BURN
    if (/send\s+(a|an|one|two|\d+)\s+cores?\s+from\s+(?:the\s+opposing|your\s+opponent'?s?)\s*life\s+to\s+(?:their\s+)?(?:reserve|trash)/i.test(bodyLower)) {
      const match = bodyLower.match(/send\s+(a|an|one|two|\d+)\s+cores?\s+from\s+(?:the\s+opposing|your\s+opponent'?s?)\s*life\s+to\s+(?:their\s+)?(?:reserve|trash)/i);
      const count = parseWordNumber(match[1]);
      const burn = Math.min(count, enemyReserve.life);
      if (burn > 0) {
        enemyReserve.life -= burn;
        enemyReserve.reserve += burn;
        AudioFX.slash();
        addLog(`🔥 **[LIFE BURN: ${card.name}]**: Burned ${burn} Life from opponent directly to Reserve! (Opponent Life: ${enemyReserve.life})`, 'damage');
        if (typeof showToast === 'function') showToast(`Inflicted ${burn} Direct Life Damage!`, 'warning');
        checkBurstTrigger(enemySide, 'AFTER_LIFE_DECREASED', { attacker: card });
        checkGameOver();
      }
    }

    // 17. TRASH REANIMATION (Evil Deity / Family / Cost)
    if (/summon an?\s+["']?(\w+)["']?\s+family\s+spirit.*?from\s+(?:your\s+)?trash/i.test(bodyLower)) {
      const famMatch = bodyLower.match(/summon an?\s+["']?(\w+)["']?\s+family\s+spirit.*?from\s+(?:your\s+)?trash/i);
      const targetFamily = famMatch ? famMatch[1].toLowerCase() : '';
      const tIdx = myTrash.findIndex(c => ((c.family || '') + ' ' + (c.families ? c.families.join(' ') : '')).toLowerCase().includes(targetFamily));
      if (tIdx !== -1 && (myReserve.reserve >= 1 || isPlayer === false)) {
        const reanimatedCard = myTrash.splice(tIdx, 1)[0];
        const reanimatedSpirit = {
          ...reanimatedCard,
          uid: 'sp_' + Math.random().toString(36).slice(2, 9),
          currentCores: 1,
          hasSoulCore: false,
          isExhausted: false,
          hasAttacked: false,
          battleBp: 0
        };
        const { level, bp } = calculateBpAndLevel(reanimatedSpirit.levels, 1, false, reanimatedSpirit.effect);
        reanimatedSpirit.currentLevel = level;
        reanimatedSpirit.currentBp = bp;
        myField.push(reanimatedSpirit);
        card.cantBeBlocked = true;
        AudioFX.summon();
        addLog(`💀 **[REANIMATION: ${card.name}]**: Summoned "${reanimatedSpirit.name}" from Trash! "${card.name}" cannot be blocked this attack!`, 'magic');
        executeWhenSummonedEffects(reanimatedSpirit, side);
      }
    }
  }

  function executeWhenSummonedEffects(spirit, side = 'player') {
    if (!spirit || !spirit.effect) return;

    const blocks = getCardAbilityBlocks(spirit.effect);
    const eligibleBlocks = blocks.filter(b => /\(When Summoned(?:[^)]*)\)|\(When [^)]*\/Summoned(?:[^)]*)\)|\(When Summoned\/[^\)]*\)/i.test(b));
    if (!eligibleBlocks.length) return;

    for (const b of eligibleBlocks) {
      const lvlMatch = b.match(/^((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+)/i);
      const levelTag = lvlMatch ? lvlMatch[1] : '';
      if (isEffectLevelMet(levelTag, spirit.currentLevel)) {
        executeAbilityActions(b, spirit, side, 'SUMMON');
      }
    }

    renderDuelTable();
    if (side === 'player') renderPlayerHand();

    const enemySide = side === 'player' ? 'opponent' : 'player';
    checkBurstTrigger(enemySide, 'AFTER_OPPONENT_SUMMON_EFFECT', { spirit });
  }

  function executeWhenAttacksEffects(attacker, side = 'player') {
    if (!attacker || !attacker.effect) return;

    // 1. Windstorm
    const windCount = hasWindstorm(attacker);
    if (windCount > 0) {
      const enemyField = side === 'player' ? DuelState.opponent.field : DuelState.player.field;
      const readyEnemies = enemyField.filter(s => !s.isExhausted);
      if (readyEnemies.length > 0) {
        readyEnemies.sort((a, b) => (b.currentBp || 0) - (a.currentBp || 0));
        const toExhaust = readyEnemies.slice(0, windCount);
        toExhaust.forEach(s => { s.isExhausted = true; });
        AudioFX.shield();
        const names = toExhaust.map(s => `"${s.name}"`).join(', ');
        addLog(`🌪️ **[WINDSTORM ACTIVATED: ${attacker.name}]**: Tempest exhausted ${toExhaust.length} opposing defense Spirit(s): ${names}!`, 'damage');
        if (side === 'player' && typeof showToast === 'function') {
          showToast(`🌪️ [Windstorm]: Exhausted ${names}!`, 'info');
        }
      }
    }

    // 2. Assault
    const assaultTier = hasAssault(attacker);
    if (assaultTier > 0 && !(attacker._assaultCount >= assaultTier)) {
      const myField = side === 'player' ? DuelState.player.field : DuelState.opponent.field;
      const allies = myField.filter(s => s.uid !== attacker.uid && !s.isExhausted);
      if (allies.length > 0) {
        const ally = allies[0];
        ally.isExhausted = true;
        attacker.isExhausted = false;
        attacker.hasAttacked = false;
        attacker._assaultCount = (attacker._assaultCount || 0) + 1;
        AudioFX.slash();
        addLog(`⚔️ **[ASSAULT ACTIVATED: ${attacker.name}]**: Exhausted allied "${ally.name}" to re-ready and prepare a second assault!`, 'magic');
        if (side === 'player' && typeof showToast === 'function') {
          showToast(`⚔️ [Assault]: "${attacker.name}" re-readied for another strike!`, 'success');
        }
      }
    }

    // 3. Ability blocks
    const blocks = getCardAbilityBlocks(attacker.effect);
    const eligibleBlocks = blocks.filter(b => /\(When Attacks(?:[^)]*)\)|\(When [^)]*\/Attacks(?:[^)]*)\)|\(When Battles(?:[^)]*)\)|\(When Brave Attacks(?:[^)]*)\)/i.test(b));
    for (const b of eligibleBlocks) {
      const lvlMatch = b.match(/^((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+)/i);
      const levelTag = lvlMatch ? lvlMatch[1] : '';
      if (isEffectLevelMet(levelTag, attacker.currentLevel)) {
        executeAbilityActions(b, attacker, side, 'ATTACK');
      }
    }

    renderDuelTable();
  }

  function executeWhenBlocksEffects(blocker, defSide = 'player', attacker = null) {
    if (!blocker || !blocker.effect) return;

    const blocks = getCardAbilityBlocks(blocker.effect);
    const eligibleBlocks = blocks.filter(b => /\(When Blocks(?:[^)]*)\)|\(When Attacks\/Blocks(?:[^)]*)\)|\(When Battles(?:[^)]*)\)/i.test(b));
    for (const b of eligibleBlocks) {
      const lvlMatch = b.match(/^((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+)/i);
      const levelTag = lvlMatch ? lvlMatch[1] : '';
      if (isEffectLevelMet(levelTag, blocker.currentLevel)) {
        executeAbilityActions(b, blocker, defSide, 'BLOCK', { attacker });
      }
    }
    renderDuelTable();
  }

  function executeWhenDestroyedEffects(destroyedSpirit, side = 'player') {
    if (!destroyedSpirit || !destroyedSpirit.effect) return;

    const blocks = getCardAbilityBlocks(destroyedSpirit.effect);
    const eligibleBlocks = blocks.filter(b => /\(When (?:(?:Depleted\/)?Destroyed(?:[^)]*)|[^)]*\/Destroyed(?:[^)]*))\)/i.test(b));
    for (const b of eligibleBlocks) {
      const lvlMatch = b.match(/^((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+)/i);
      const levelTag = lvlMatch ? lvlMatch[1] : '';
      if (isEffectLevelMet(levelTag, destroyedSpirit.currentLevel)) {
        executeAbilityActions(b, destroyedSpirit, side, 'DESTROYED');
      }
    }
    renderDuelTable();
  }
'''

# Find the start of executeWhenSummonedEffects and end of executeWhenDestroyedEffects
start_marker = '  function executeWhenSummonedEffects(spirit, side = \'player\') {'
end_marker = '  function summonCard(uid, customCoresToPlace) {'

idx_start = js.find(start_marker)
idx_end = js.find(end_marker)

if idx_start == -1 or idx_end == -1:
    print(f"Error: Markers not found: start={idx_start}, end={idx_end}")
    sys.exit(1)

# Notice executeBpComparisonEffects was between executeWhenAttacksEffects and executeWhenBlocksEffects.
# Let's preserve executeBpComparisonEffects!
bp_start = js.find('  function executeBpComparisonEffects(', idx_start)
bp_end = js.find('  function executeWhenBlocksEffects(', bp_start)
bp_code = js[bp_start:bp_end]

# Combine replacement with preserved bp comparison code
full_replacement = replacement_code.replace(
    '  function executeWhenBlocksEffects(blocker, defSide = \'player\', attacker = null) {',
    bp_code + '  function executeWhenBlocksEffects(blocker, defSide = \'player\', attacker = null) {'
)

js = js[:idx_start] + full_replacement + '\n' + js[idx_end:]

# Also update applyMagicEffect to call executeAbilityActions for any magic cards!
magic_fallback_target = '''            } else {
              effectDesc = `Granted +${bpAmount} BP to "${target.name}" (now ${target.currentBp} BP)!`;
            }
          }
        }
      } else {
        effectDesc = `Activated magic spell "${card.name}"!`;
      }'''

magic_fallback_replacement = '''            } else {
              effectDesc = `Granted +${bpAmount} BP to "${target.name}" (now ${target.currentBp} BP)!`;
            }
          }
        }
      } else {
        // Universal Magic Ability Dispatcher for all database magic cards
        executeAbilityActions(card.effect, card, side, 'MAGIC', { contextAttacker, targetSpiritUid });
        effectDesc = `Cast "${card.name}" and unleashed its magical effects!`;
      }'''

if magic_fallback_target in js:
    js = js.replace(magic_fallback_target, magic_fallback_replacement)
    print("✅ Hooked Universal Action Dispatcher into applyMagicEffect")
else:
    print("Warning: magic_fallback_target not found in exact form")

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("✅ Successfully updated battle_arena.js with Universal Card Ability Dispatcher")
