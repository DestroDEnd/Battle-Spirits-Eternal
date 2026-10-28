import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    arena = f.read()

# In executeWhenSummonedEffects, move Draw Cards (4) after Core Removal (6), Destroy by Cost (7), Destroy by BP (8)
# And make sure Draw Cards regex only triggers if not preceded by "depletes"
old_summon_marker = 'function executeWhenSummonedEffects(spirit, side = \'player\') {'
idx_summon = arena.find(old_summon_marker)
end_summon = arena.find('\n  }\n', idx_summon) + len('\n  }\n')

new_summon_effects = '''function executeWhenSummonedEffects(spirit, side = 'player') {
    if (!spirit || !spirit.effect) return;

    // Isolate ability blocks
    const blocks = getCardAbilityBlocks(spirit.effect);
    const summonedBlock = blocks.find(b => /\\(When Summoned(?:[^)]*)\\)|召喚時/i.test(b));
    if (!summonedBlock) return;

    const lvlMatch = summonedBlock.match(/^((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+)/i);
    const levelTag = lvlMatch ? lvlMatch[1] : '';

    // Check level requirement
    if (!isEffectLevelMet(levelTag, spirit.currentLevel)) {
      return;
    }

    const bodyLower = summonedBlock.toLowerCase();
    const isPlayer = side === 'player';
    const myField = isPlayer ? DuelState.player.field : DuelState.opponent.field;
    const myReserve = isPlayer ? DuelState.player : DuelState.opponent;
    const enemyField = isPlayer ? DuelState.opponent.field : DuelState.player.field;
    const enemySide = isPlayer ? 'opponent' : 'player';
    const enemyReserve = isPlayer ? DuelState.opponent : DuelState.player;
    const myDeck = isPlayer ? DuelState.player.deck : DuelState.opponent.deck;
    const myHand = isPlayer ? DuelState.player.hand : DuelState.opponent.hand;

    // 1. THE DUKE KINGTAURUS: "For each other Spirit you control, put a core from the Void to this Spirit."
    if (/for each other spirit you control.*?put a core from the void to this spirit/i.test(bodyLower) ||
        /他の自分のスピリット.*ボイドからコア/i.test(summonedBlock)) {
      const otherSpirits = myField.filter(s => s.uid !== spirit.uid).length;
      if (otherSpirits > 0) {
        spirit.currentCores += otherSpirits;
        const { level: newLvl, bp: newBp } = calculateBpAndLevel(spirit.levels, spirit.currentCores, !!spirit.hasSoulCore, spirit.effect);
        spirit.currentLevel = newLvl;
        spirit.currentBp = newBp;

        AudioFX.summon();
        const voidEl = document.getElementById('battleVoidZone');
        if (voidEl) {
          voidEl.classList.remove('void-pulse-active');
          void voidEl.offsetWidth;
          voidEl.classList.add('void-pulse-active');
          setTimeout(() => voidEl.classList.remove('void-pulse-active'), 1200);
        }

        addLog(`🌲 **[WHEN SUMMONED: ${spirit.name}]**: Channeled the presence of ${otherSpirits} other Spirit(s)! Claimed +${otherSpirits} Core(s) from the Void onto "${spirit.name}" (elevated to Lv${newLvl}, ${newBp} BP)!`, 'magic');
        if (typeof showToast === 'function') {
          showToast(`🌲 ${spirit.name}: +${otherSpirits} Cores from Void! (Lv${newLvl}, ${newBp} BP)`, 'success');
        }
      } else {
        addLog(`ℹ️ **[WHEN SUMMONED: ${spirit.name}]**: No other Spirits on field; no Void cores placed.`, 'step');
      }
    }
    // 2. Fixed Cores from Void onto this Spirit (e.g. Biollante)
    else if (/put\\s+(a|an|one|two|three|\\d+)\\s+cores?\\s+from\\s+the\\s+void\\s+to\\s+this\\s+spirit/i.test(bodyLower)) {
      const match = bodyLower.match(/put\\s+(a|an|one|two|three|\\d+)\\s+cores?\\s+from\\s+the\\s+void\\s+to\\s+this\\s+spirit/i);
      const count = parseWordNumber(match[1]);
      spirit.currentCores += count;
      const { level: newLvl, bp: newBp } = calculateBpAndLevel(spirit.levels, spirit.currentCores, !!spirit.hasSoulCore, spirit.effect);
      spirit.currentLevel = newLvl;
      spirit.currentBp = newBp;

      AudioFX.summon();
      addLog(`✨ **[WHEN SUMMONED: ${spirit.name}]**: Claimed +${count} Core(s) from the Void onto "${spirit.name}" (now Lv${newLvl}, ${newBp} BP)!`, 'magic');
      if (typeof showToast === 'function') {
        showToast(`✨ ${spirit.name}: +${count} Core(s) from Void!`, 'success');
      }
    }
    // 3. Fixed Cores from Void to Reserve
    else if (/put\\s+(a|an|one|two|three|\\d+)\\s+cores?\\s+from\\s+the\\s+void\\s+to\\s+(?:your\\s+)?reserve/i.test(bodyLower)) {
      const match = bodyLower.match(/put\\s+(a|an|one|two|three|\\d+)\\s+cores?\\s+from\\s+the\\s+void\\s+to\\s+(?:your\\s+)?reserve/i);
      const count = parseWordNumber(match[1]);
      myReserve.reserve += count;

      AudioFX.coreChime();
      addLog(`✨ **[WHEN SUMMONED: ${spirit.name}]**: Placed +${count} Core(s) from the Void into ${isPlayer ? 'Player' : 'Opponent'} Reserve!`, 'magic');
      if (typeof showToast === 'function') {
        showToast(`+${count} Core(s) to Reserve from Void!`, 'success');
      }
    }
    // 4. OPPONENT SACRIFICIAL DESTRUCTION: "The opponent destroys a Spirit/Ultimate they control" (e.g. The MakaiKnight Pandegaiz)
    else if (/the opponent destroys a (?:spirit|ultimate)(?:\\s+they\\s+control)?|opponent destroys a (?:spirit|ultimate)/i.test(bodyLower) ||
             /相手は、相手のスピリット.*破壊する/i.test(summonedBlock)) {
      if (enemyField.length > 0) {
        enemyField.sort((a, b) => (a.currentBp || 0) - (b.currentBp || 0));
        const sacrificed = enemyField.shift();
        enemyReserve.reserve += sacrificed.currentCores;
        handleDestroyedSpiritCores(sacrificed, enemySide);
        sendToTrash(sacrificed, enemySide, `Sacrificed due to ${spirit.name} (When Summoned)`);
        AudioFX.slash();
        addLog(`💥 **[SACRIFICE RESOLUTION: ${spirit.name}]**: Opponent was forced to destroy their own "${sacrificed.name}" (${sacrificed.currentBp} BP)! Cores moved to reserve.`, 'kill');
        if (typeof showToast === 'function') {
          showToast(`💥 Opponent sacrificed "${sacrificed.name}"!`, 'success');
        }
      } else {
        addLog(`ℹ️ **[WHEN SUMMONED: ${spirit.name}]**: Opponent controls no Spirits to destroy.`, 'step');
      }
    }
    // 5. CORE REMOVAL TO RESERVE OR TRASH (e.g. The MakaiSwordDeityDoll †Enchante†)
    else if (/send\\s+(?:up to\\s+)?(a|an|one|two|three|\\d+)\\s+cores?\\s+from\\s+(?:an|one|\\d+)?\\s*opposing\\s+(?:spirit|ultimate).*?to\\s+the\\s+(reserve|trash)/i.test(bodyLower)) {
      const match = bodyLower.match(/send\\s+(?:up to\\s+)?(a|an|one|two|three|\\d+)\\s+cores?\\s+from\\s+(?:an|one|\\d+)?\\s*opposing\\s+(?:spirit|ultimate).*?to\\s+the\\s+(reserve|trash)/i);
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
        addLog(`🔮 **[CORE DEPLETION: ${spirit.name}]**: Sent ${coresToRemove} core(s) from opposing "${target.name}" to their ${dest}!`, 'magic');

        // Check if target was depleted (0 cores)
        if (target.currentCores <= 0) {
          const tIdx = enemyField.findIndex(s => s.uid === target.uid);
          if (tIdx !== -1) enemyField.splice(tIdx, 1);
          handleDestroyedSpiritCores(target, enemySide);
          sendToTrash(target, enemySide, `Depleted by ${spirit.name} (When Summoned)`);
          AudioFX.slash();
          addLog(`💀 **[DEPLETED!]**: Opposing "${target.name}" was left with 0 cores and sent to Trash!`, 'kill');

          // Depletion bonus (e.g. Enchante: "When this effect depletes, draw two cards.")
          if (/when this effect depletes|when depleted/i.test(bodyLower) && /draw\\s+(a|an|one|two|three|\\d+)\\s+cards?/i.test(bodyLower)) {
            const mDraw = bodyLower.match(/draw\\s+(a|an|one|two|three|\\d+)\\s+cards?/i);
            const numDraw = parseWordNumber(mDraw[1]);
            let bonusDrawn = 0;
            for (let d = 0; d < numDraw; d++) {
              const c = myDeck.shift();
              if (c) { myHand.push(c); bonusDrawn++; }
            }
            if (bonusDrawn > 0) {
              addLog(`🃏 **[DEPLETION BONUS: ${spirit.name}]**: Drew +${bonusDrawn} card(s) from deck!`, 'step');
              if (typeof showToast === 'function') showToast(`Drew +${bonusDrawn} cards on depletion!`, 'info');
            }
          }
        } else {
          const { level: tLvl, bp: tBp } = calculateBpAndLevel(target.levels, target.currentCores, !!target.hasSoulCore, target.effect);
          target.currentLevel = tLvl;
          target.currentBp = tBp;
        }
      } else {
        addLog(`ℹ️ **[WHEN SUMMONED: ${spirit.name}]**: No opposing Spirits with cores to remove.`, 'step');
      }
    }
    // 6. Destroy Opposing Spirit by Cost or Unconditional
    else if (/destroy\\s+(?:an|one|\\d+)?\\s*opposing\\s+(?:cost\\s*(\\d+)\\s*or\\s*(less|more)\\s+)?(?:spirit|ultimate)/i.test(bodyLower)) {
      const match = bodyLower.match(/destroy\\s+(?:an|one|\\d+)?\\s*opposing\\s+(?:cost\\s*(\\d+)\\s*or\\s*(less|more)\\s+)?(?:spirit|ultimate)/i);
      const targetCost = match[1] ? parseInt(match[1], 10) : null;
      const isLess = match[2] ? match[2].toLowerCase() === 'less' : true;

      let eligible = enemyField;
      if (targetCost !== null) {
        eligible = enemyField.filter(s => isLess ? (s.cost || 0) <= targetCost : (s.cost || 0) >= targetCost);
      }

      if (eligible.length > 0) {
        eligible.sort((a, b) => (b.currentBp || 0) - (a.currentBp || 0));
        const target = eligible[0];
        const tIdx = enemyField.findIndex(s => s.uid === target.uid);
        if (tIdx !== -1) {
          const dest = enemyField.splice(tIdx, 1)[0];
          enemyReserve.reserve += dest.currentCores;
          handleDestroyedSpiritCores(dest, enemySide);
          sendToTrash(dest, enemySide, `Destroyed by ${spirit.name} (When Summoned)`);
          AudioFX.slash();
          addLog(`💥 **[WHEN SUMMONED: ${spirit.name}]**: Destroyed opposing "${dest.name}" (Cost ${dest.cost}, ${dest.currentBp} BP)! Cores returned to enemy reserve.`, 'kill');
        }
      } else {
        addLog(`ℹ️ **[WHEN SUMMONED: ${spirit.name}]**: No eligible opposing Spirits to destroy.`, 'step');
      }
    }
    // 7. Destroy Opposing Spirit by BP
    else if (/destroy\\s+an\\s+opposing\\s+(\\d+)\\s*bp\\s+or\\s+less\\s+spirit/i.test(bodyLower)) {
      const match = bodyLower.match(/destroy\\s+an\\s+opposing\\s+(\\d+)\\s*bp\\s+or\\s+less\\s+spirit/i);
      const maxBp = parseInt(match[1], 10);
      const eligible = enemyField.filter(s => (s.currentBp || 0) <= maxBp);
      if (eligible.length > 0) {
        eligible.sort((a, b) => (b.currentBp || 0) - (a.currentBp || 0));
        const target = eligible[0];
        const tIdx = enemyField.findIndex(s => s.uid === target.uid);
        if (tIdx !== -1) {
          const dest = enemyField.splice(tIdx, 1)[0];
          enemyReserve.reserve += dest.currentCores;
          handleDestroyedSpiritCores(dest, enemySide);
          sendToTrash(dest, enemySide, `Destroyed by ${spirit.name} (When Summoned)`);
          AudioFX.slash();
          addLog(`💥 **[WHEN SUMMONED: ${spirit.name}]**: Destroyed opposing "${dest.name}" (${dest.currentBp} BP <= ${maxBp} BP)! Cores returned to enemy reserve.`, 'kill');
        }
      } else {
        addLog(`ℹ️ **[WHEN SUMMONED: ${spirit.name}]**: No opposing Spirits with <= ${maxBp} BP to destroy.`, 'step');
      }
    }
    // 8. Draw Cards (only standalone draw not conditioned on depletion/destruction)
    else if (/draw\\s+(a|an|one|two|three|\\d+)\\s+cards?/i.test(bodyLower)) {
      const match = bodyLower.match(/draw\\s+(a|an|one|two|three|\\d+)\\s+cards?/i);
      const count = parseWordNumber(match[1]);
      let drawn = 0;
      for (let i = 0; i < count; i++) {
        const c = myDeck.shift();
        if (c) {
          myHand.push(c);
          drawn++;
        }
      }
      if (drawn > 0) {
        AudioFX.playTone(440, 'sine', 0.15, 0.1);
        addLog(`🃏 **[WHEN SUMMONED: ${spirit.name}]**: ${isPlayer ? 'You' : 'Opponent'} drew ${drawn} card(s) from deck into Hand!`, 'step');
        if (typeof showToast === 'function') {
          showToast(`🃏 Drew ${drawn} card(s)!`, 'info');
        }
      }
    }
    // 9. Exhaust Opposing Spirit
    else if (/exhaust\\s+(an|one|\\d+)?\\s*opposing\\s+spirit/i.test(bodyLower)) {
      const ready = enemyField.filter(s => !s.isExhausted);
      if (ready.length > 0) {
        ready.sort((a, b) => (b.currentBp || 0) - (a.currentBp || 0));
        ready[0].isExhausted = true;
        AudioFX.shield();
        addLog(`🛡️ **[WHEN SUMMONED: ${spirit.name}]**: Exhausted opposing "${ready[0].name}"!`, 'magic');
      }
    }
    // 10. Bounce Opposing Spirit
    else if (/return\\s+(an|one|\\d+)?\\s*opposing\\s+spirit.*?to\\s+the\\s+hand/i.test(bodyLower)) {
      const enemyHand = enemySide === 'player' ? DuelState.player.hand : DuelState.opponent.hand;
      if (enemyField.length > 0) {
        const target = enemyField.pop();
        enemyReserve.reserve += target.currentCores;
        target.currentCores = 0;
        enemyHand.push(target);
        addLog(`💨 **[WHEN SUMMONED: ${spirit.name}]**: Returned opposing "${target.name}" to their Hand!`, 'magic');
      }
    }

    renderDuelTable();
    if (isPlayer) renderPlayerHand();

    // Trigger Burst for opposing player: [After an opposing Spirit's (When Summoned) effect resolves]
    checkBurstTrigger(enemySide, 'AFTER_OPPONENT_SUMMON_EFFECT', { spirit });
  }'''

arena = arena[:idx_summon] + new_summon_effects + arena[end_summon:]

# Also in executeWhenAttacksEffects, ensure Core Removal comes before standalone Draw
idx_att = arena.find('function executeWhenAttacksEffects(attacker, side = \'player\') {')
end_att = arena.find('\n  }\n', idx_att) + len('\n  }\n')

new_att_effects = '''function executeWhenAttacksEffects(attacker, side = 'player') {
    if (!attacker || !attacker.effect) return;
    const isPlayer = side === 'player';
    const enemyField = isPlayer ? DuelState.opponent.field : DuelState.player.field;
    const enemySide = isPlayer ? 'opponent' : 'player';
    const enemyReserve = isPlayer ? DuelState.opponent : DuelState.player;
    const myField = isPlayer ? DuelState.player.field : DuelState.opponent.field;
    const myTrash = (isPlayer ? (DuelState.player.trashCards || DuelState.player.trash) : (DuelState.opponent.trashCards || DuelState.opponent.trash)) || [];
    const myReserve = isPlayer ? DuelState.player : DuelState.opponent;

    // [Windstorm / 暴風]: Exhaust N opposing Spirits on Attack declaration
    const windCount = hasWindstorm(attacker);
    if (windCount > 0) {
      const readyEnemies = enemyField.filter(s => !s.isExhausted);
      if (readyEnemies.length > 0) {
        readyEnemies.sort((a, b) => (b.currentBp || 0) - (a.currentBp || 0));
        const toExhaust = readyEnemies.slice(0, windCount);
        toExhaust.forEach(s => { s.isExhausted = true; });
        AudioFX.shield();
        const names = toExhaust.map(s => `"${s.name}"`).join(', ');
        addLog(`🌪️ **[WINDSTORM ACTIVATED: ${attacker.name}]**: Tempest exhausted ${toExhaust.length} opposing defense Spirit(s): ${names}!`, 'damage');
        if (isPlayer && typeof showToast === 'function') {
          showToast(`🌪️ [Windstorm]: Exhausted ${names}!`, 'info');
        }
      }
    }

    // [Assault / 突進]: By exhausting another allied Spirit/Nexus, re-ready this Spirit to attack again
    const assaultTier = hasAssault(attacker);
    if (assaultTier > 0 && !(attacker._assaultCount >= assaultTier)) {
      const allies = myField.filter(s => s.uid !== attacker.uid && !s.isExhausted);
      if (allies.length > 0) {
        const ally = allies[0];
        ally.isExhausted = true;
        attacker.isExhausted = false;
        attacker.hasAttacked = false;
        attacker._assaultCount = (attacker._assaultCount || 0) + 1;
        AudioFX.slash();
        addLog(`⚔️ **[ASSAULT ACTIVATED: ${attacker.name}]**: Exhausted allied "${ally.name}" to re-ready and prepare a second assault!`, 'magic');
        if (isPlayer && typeof showToast === 'function') {
          showToast(`⚔️ [Assault]: "${attacker.name}" re-readied for another strike!`, 'success');
        }
      }
    }

    const blocks = getCardAbilityBlocks(attacker.effect);
    const attacksBlock = blocks.find(b => /\\(When Attacks(?:[^)]*)\\)|\\(When Summoned\\/Attacks\\)|アタック時/i.test(b));
    if (!attacksBlock) return;

    const lvlMatch = attacksBlock.match(/^((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+)/i);
    const levelTag = lvlMatch ? lvlMatch[1] : '';

    if (!isEffectLevelMet(levelTag, attacker.currentLevel)) {
      return;
    }

    const bodyLower = attacksBlock.toLowerCase();
    const myDeck = isPlayer ? DuelState.player.deck : DuelState.opponent.deck;
    const myHand = isPlayer ? DuelState.player.hand : DuelState.opponent.hand;

    // Check Unblockable status: "this spirit can't be blocked"
    if (/this spirit can't be blocked|this spirit cannot be blocked|ブロックされない/i.test(bodyLower)) {
      attacker.cantBeBlocked = true;
      addLog(`⚡ **[UNBLOCKABLE AURA: ${attacker.name}]**: This Spirit cannot be blocked!`, 'damage');
    }

    // THE MAKAINIGHT PANDEGAIZ: [LV2][LV3] (When Attacks)
    // "You can summon an 'Evil Deity' family Spirit card from your Trash by paying four costs. When you've done so, this Spirit can't be blocked."
    if (/summon an?\\s+["']?evil deity["']?\\s+family\\s+spirit.*?from\\s+(?:your\\s+)?trash/i.test(bodyLower)) {
      const tIdx = myTrash.findIndex(c => ((c.family || '') + ' ' + (c.families ? c.families.join(' ') : '')).toLowerCase().includes('evil deity'));
      if (tIdx !== -1 && (myReserve.reserve >= 4 || isPlayer === false)) {
        if (myReserve.reserve >= 4) myReserve.reserve -= 4;
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
        attacker.cantBeBlocked = true;
        AudioFX.summon();
        addLog(`💀 **[WHEN ATTACKS: ${attacker.name}]**: Summoned "Evil Deity" "${reanimatedSpirit.name}" from Trash by paying 4 costs! "${attacker.name}" cannot be blocked this attack!`, 'magic');
        if (isPlayer && typeof showToast === 'function') {
          showToast(`💀 Summoned "${reanimatedSpirit.name}" from Trash! Cannot be blocked!`, 'success');
        }
        executeWhenSummonedEffects(reanimatedSpirit, side);
      }
    }

    // Core removal on Attack (e.g. Enchante)
    if (/send\\s+(?:up to\\s+)?(a|an|one|two|three|\\d+)\\s+cores?\\s+from\\s+(?:an|one|\\d+)?\\s*opposing\\s+(?:spirit|ultimate).*?to\\s+the\\s+(reserve|trash)/i.test(bodyLower)) {
      const match = bodyLower.match(/send\\s+(?:up to\\s+)?(a|an|one|two|three|\\d+)\\s+cores?\\s+from\\s+(?:an|one|\\d+)?\\s*opposing\\s+(?:spirit|ultimate).*?to\\s+the\\s+(reserve|trash)/i);
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
        addLog(`🔮 **[CORE DEPLETION (ATTACK): ${attacker.name}]**: Sent ${coresToRemove} core(s) from opposing "${target.name}" to their ${dest}!`, 'magic');

        if (target.currentCores <= 0) {
          const tIdx = enemyField.findIndex(s => s.uid === target.uid);
          if (tIdx !== -1) enemyField.splice(tIdx, 1);
          handleDestroyedSpiritCores(target, enemySide);
          sendToTrash(target, enemySide, `Depleted by ${attacker.name} (When Attacks)`);
          AudioFX.slash();
          addLog(`💀 **[DEPLETED!]**: Opposing "${target.name}" was left with 0 cores and sent to Trash!`, 'kill');

          if (/when this effect depletes|when depleted/i.test(bodyLower) && /draw\\s+(a|an|one|two|three|\\d+)\\s+cards?/i.test(bodyLower)) {
            const mDraw = bodyLower.match(/draw\\s+(a|an|one|two|three|\\d+)\\s+cards?/i);
            const numDraw = parseWordNumber(mDraw[1]);
            let bonusDrawn = 0;
            for (let d = 0; d < numDraw; d++) {
              const c = myDeck.shift();
              if (c) { myHand.push(c); bonusDrawn++; }
            }
            if (bonusDrawn > 0) {
              addLog(`🃏 **[DEPLETION BONUS: ${attacker.name}]**: Drew +${bonusDrawn} card(s) from deck!`, 'step');
            }
          }
        }
      }
    }

    // Draw on Attack (standalone draw only)
    else if (/draw\\s+(a|an|one|two|three|\\d+)\\s+cards?/i.test(bodyLower)) {
      const match = bodyLower.match(/draw\\s+(a|an|one|two|three|\\d+)\\s+cards?/i);
      const count = parseWordNumber(match[1]);
      let drawn = 0;
      for (let i = 0; i < count; i++) {
        const c = myDeck.shift();
        if (c) {
          myHand.push(c);
          drawn++;
        }
      }
      if (drawn > 0) {
        AudioFX.playTone(440, 'sine', 0.15, 0.1);
        addLog(`🃏 **[WHEN ATTACKS: ${attacker.name}]**: Drew ${drawn} card(s) from deck!`, 'step');
      }
    }

    // Exhaust Opposing Spirit on Attack
    if (/exhaust\\s+(an|one|\\d+)?\\s*opposing\\s+spirit/i.test(bodyLower)) {
      const ready = enemyField.filter(s => !s.isExhausted);
      if (ready.length > 0) {
        ready.sort((a, b) => (b.currentBp || 0) - (a.currentBp || 0));
        ready[0].isExhausted = true;
        AudioFX.shield();
        addLog(`🛡️ **[WHEN ATTACKS: ${attacker.name}]**: Exhausted opposing "${ready[0].name}"!`, 'magic');
      }
    }

    renderDuelTable();
  }'''

arena = arena[:idx_att] + new_att_effects + arena[end_att:]

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(arena)
print("✓ Successfully optimized execution order in battle_arena.js")
