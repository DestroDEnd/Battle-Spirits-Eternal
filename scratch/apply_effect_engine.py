import re

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    content = f.read()

is_crlf = '\r\n' in content
newline = '\r\n' if is_crlf else '\n'

engine_code = """
  // ==========================================================================
  // UNIVERSAL CARD EFFECT ENGINE (TRIGGERS & ACTIONS)
  // Handles (When Summoned), (When Attacks), (When Blocks), (When Destroyed),
  // and BP Comparison across all 14,000+ Battle Spirits cards.
  // ==========================================================================

  function parseEffectLevelRequirement(tagStr) {
    if (!tagStr) return [1, 2, 3, 4, 5];
    const matches = tagStr.match(/\\[LV(\\d+)\\]/gi);
    if (matches && matches.length) {
      return matches.map(m => parseInt(m.replace(/\\D/g, ''), 10));
    }
    const rangeM = tagStr.match(/LV(\\d+)[-~]LV(\\d+)/i);
    if (rangeM) {
      const start = parseInt(rangeM[1], 10);
      const end = parseInt(rangeM[2], 10);
      const res = [];
      for (let i = start; i <= end; i++) res.push(i);
      return res;
    }
    const singleM = tagStr.match(/LV(\\d+)/i);
    if (singleM) {
      return [parseInt(singleM[1], 10)];
    }
    return [1, 2, 3, 4, 5];
  }

  function isEffectLevelMet(tagStr, currentLevel) {
    const req = parseEffectLevelRequirement(tagStr);
    return req.includes(currentLevel);
  }

  function parseWordNumber(val, defaultVal = 1) {
    if (!val) return defaultVal;
    const s = val.toLowerCase().trim();
    if (/^\\d+$/.test(s)) return parseInt(s, 10);
    const map = {
      'a': 1, 'an': 1, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
      'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
    };
    return map[s] !== undefined ? map[s] : defaultVal;
  }

  function executeWhenSummonedEffects(spirit, side = 'player') {
    if (!spirit || !spirit.effect) return;
    const eff = spirit.effect;

    // Look for (When Summoned) or 『このスピリットの召喚時』
    const m = eff.match(/((?:\\[LV\\d+\\])+|LV\\d+[-~]LV\\d+|LV\\d+)?\\s*(?:\\(When Summoned\\)|『このスピリットの召喚時』)\\s*([\\s\\S]*?)(?=\\n\\s*\\n|\\[LV|$)/i);
    if (!m) return;

    const levelTag = m[1] || '';
    const body = (m[2] || '').trim();
    const bodyLower = body.toLowerCase();

    // Check level requirement
    if (!isEffectLevelMet(levelTag, spirit.currentLevel)) {
      return;
    }

    const isPlayer = side === 'player';
    const myField = isPlayer ? DuelState.player.field : DuelState.opponent.field;
    const myReserve = isPlayer ? DuelState.player : DuelState.opponent;
    const enemyField = isPlayer ? DuelState.opponent.field : DuelState.player.field;
    const enemySide = isPlayer ? 'opponent' : 'player';
    const myDeck = isPlayer ? DuelState.player.deck : DuelState.opponent.deck;
    const myHand = isPlayer ? DuelState.player.hand : DuelState.opponent.hand;

    // 1. THE DUKE KINGTAURUS: "For each other Spirit you control, put a core from the Void to this Spirit."
    if (/for each other spirit you control.*?put a core from the void to this spirit/i.test(bodyLower) ||
        /このスピリット以外の自分のスピリット.*?ボイドから.*?コア/i.test(body)) {
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

        addLog(`👑 **[WHEN SUMMONED: ${spirit.name}]**: Channeled the presence of ${otherSpirits} other Spirit(s)! Claimed +${otherSpirits} Core(s) from the Void onto "${spirit.name}" (elevated to Lv${newLvl}, ${newBp} BP)!`, 'magic');
        if (typeof showToast === 'function') {
          showToast(`👑 ${spirit.name}: +${otherSpirits} Cores from Void! (Lv${newLvl}, ${newBp} BP)`, 'success');
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
      addLog(`🌌 **[WHEN SUMMONED: ${spirit.name}]**: Claimed +${count} Core(s) from the Void onto "${spirit.name}" (now Lv${newLvl}, ${newBp} BP)!`, 'magic');
      if (typeof showToast === 'function') {
        showToast(`🌌 ${spirit.name}: +${count} Core(s) from Void!`, 'success');
      }
    }
    // 3. Fixed Cores from Void to Reserve
    else if (/put\\s+(a|an|one|two|three|\\d+)\\s+cores?\\s+from\\s+the\\s+void\\s+to\\s+(?:your\\s+)?reserve/i.test(bodyLower)) {
      const match = bodyLower.match(/put\\s+(a|an|one|two|three|\\d+)\\s+cores?\\s+from\\s+the\\s+void\\s+to\\s+(?:your\\s+)?reserve/i);
      const count = parseWordNumber(match[1]);
      myReserve.reserve += count;

      AudioFX.coreChime();
      addLog(`🌌 **[WHEN SUMMONED: ${spirit.name}]**: Placed +${count} Core(s) from the Void into ${isPlayer ? 'Player' : 'Opponent'} Reserve!`, 'magic');
      if (typeof showToast === 'function') {
        showToast(`+${count} Core(s) to Reserve from Void!`, 'success');
      }
    }
    // 4. Draw Cards
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
        addLog(`🎴 **[WHEN SUMMONED: ${spirit.name}]**: ${isPlayer ? 'You' : 'Opponent'} drew ${drawn} card(s) from deck into Hand!`, 'step');
        if (typeof showToast === 'function') {
          showToast(`🎴 Drew ${drawn} card(s)!`, 'info');
        }
      }
    }
    // 5. Destroy Opposing Spirit by BP
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
          (enemySide === 'player' ? DuelState.player : DuelState.opponent).reserve += dest.currentCores;
          handleDestroyedSpiritCores(dest, enemySide);
          sendToTrash(dest, enemySide, `Destroyed by ${spirit.name} (When Summoned)`);
          AudioFX.slash();
          addLog(`💥 **[WHEN SUMMONED: ${spirit.name}]**: Destroyed opposing "${dest.name}" (${dest.currentBp} BP <= ${maxBp} BP)! Cores returned to enemy reserve.`, 'kill');
        }
      } else {
        addLog(`ℹ️ **[WHEN SUMMONED: ${spirit.name}]**: No opposing Spirits with <= ${maxBp} BP to destroy.`, 'step');
      }
    }
    // 6. Exhaust Opposing Spirit
    else if (/exhaust\\s+(an|one|\\d+)?\\s*opposing\\s+spirit/i.test(bodyLower)) {
      const ready = enemyField.filter(s => !s.isExhausted);
      if (ready.length > 0) {
        ready.sort((a, b) => (b.currentBp || 0) - (a.currentBp || 0));
        ready[0].isExhausted = true;
        AudioFX.shield();
        addLog(`🌀 **[WHEN SUMMONED: ${spirit.name}]**: Exhausted opposing "${ready[0].name}"!`, 'magic');
      }
    }
    // 7. Bounce Opposing Spirit
    else if (/return\\s+(an|one|\\d+)?\\s*opposing\\s+spirit.*?to\\s+the\\s+hand/i.test(bodyLower)) {
      const enemyHand = enemySide === 'player' ? DuelState.player.hand : DuelState.opponent.hand;
      if (enemyField.length > 0) {
        const target = enemyField.pop();
        (enemySide === 'player' ? DuelState.player : DuelState.opponent).reserve += target.currentCores;
        target.currentCores = 0;
        enemyHand.push(target);
        addLog(`💨 **[WHEN SUMMONED: ${spirit.name}]**: Returned opposing "${target.name}" to their Hand!`, 'magic');
      }
    }

    renderDuelTable();
    if (isPlayer) renderPlayerHand();
  }

  function executeWhenAttacksEffects(attacker, side = 'player') {
    if (!attacker || !attacker.effect) return;
    const eff = attacker.effect;

    const m = eff.match(/((?:\\[LV\\d+\\])+|LV\\d+[-~]LV\\d+|LV\\d+)?\\s*(?:\\(When Attacks\\)|『このスピリットのアタック時』)\\s*([\\s\\S]*?)(?=\\n\\s*\\n|\\[LV|$)/i);
    if (!m) return;

    const levelTag = m[1] || '';
    const body = (m[2] || '').trim();
    const bodyLower = body.toLowerCase();

    if (!isEffectLevelMet(levelTag, attacker.currentLevel)) {
      return;
    }

    const isPlayer = side === 'player';
    const myDeck = isPlayer ? DuelState.player.deck : DuelState.opponent.deck;
    const myHand = isPlayer ? DuelState.player.hand : DuelState.opponent.hand;
    const enemyField = isPlayer ? DuelState.opponent.field : DuelState.player.field;

    // Draw on Attack
    if (/draw\\s+(a|an|one|two|\\d+)\\s+cards?/i.test(bodyLower)) {
      const match = bodyLower.match(/draw\\s+(a|an|one|two|\\d+)\\s+cards?/i);
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
        addLog(`🎴 **[WHEN ATTACKS: ${attacker.name}]**: Drew ${drawn} card(s) from deck!`, 'step');
      }
    }

    // Exhaust Opposing Spirit on Attack
    if (/exhaust\\s+(an|one|\\d+)?\\s*opposing\\s+spirit/i.test(bodyLower)) {
      const ready = enemyField.filter(s => !s.isExhausted);
      if (ready.length > 0) {
        ready.sort((a, b) => (b.currentBp || 0) - (a.currentBp || 0));
        ready[0].isExhausted = true;
        AudioFX.shield();
        addLog(`🌀 **[WHEN ATTACKS: ${attacker.name}]**: Exhausted opposing "${ready[0].name}"!`, 'magic');
      }
    }

    renderDuelTable();
  }

  function executeBpComparisonEffects(att, blk, attSide, defSide) {
    if (!att || !att.effect) return;
    const eff = att.effect;
    const effLower = eff.toLowerCase();

    if (!effLower.includes('bp comparison') && !eff.includes('BPを比べ')) return;

    // Extract the section containing BP comparison
    const m = eff.match(/((?:\\[LV\\d+\\])+|LV\\d+[-~]LV\\d+|LV\\d+)?\\s*(?:\\(When Attacks\\)|『このスピリットのアタック時』)?\\s*([\\s\\S]*?(?:bp comparison|BPを比べ)[\\s\\S]*?)(?=\\n\\s*\\n|\\[LV|$)/i);
    if (!m) return;

    const levelTag = m[1] || '';
    const body = (m[2] || '').trim();
    const bodyLower = body.toLowerCase();

    // Check level requirement (e.g. Kingtaurus requires [LV2][LV3])
    if (!isEffectLevelMet(levelTag, att.currentLevel)) {
      return;
    }

    const defState = defSide === 'player' ? DuelState.player : DuelState.opponent;
    const isPlayerAttacking = attSide === 'player';

    // 1. THE DUKE KINGTAURUS: "When only the opposing Spirit is destroyed via BP comparison, send an opposing Life to their Reserve."
    if (/when only the opposing spirit is destroyed via bp comparison.*?send an opposing life to their reserve/i.test(bodyLower) ||
        /BPを比べ相手のスピリットだけを破壊したとき.*?相手のライフにあるコア1個を相手のリザーブに置く/i.test(body)) {
      if (defState.life > 0) {
        defState.life -= 1;
        defState.reserve += 1;
        AudioFX.lifeDamage();
        addLog(`👑💥 **[BP COMPARISON VICTORY: ${att.name}]**: "Gae Bolg" pierced through opposing defense! Sent 1 opposing Life directly to their Reserve! (${defSide === 'player' ? 'Player' : 'Opponent'} Life remaining: ${defState.life})`, 'damage');
        if (typeof showToast === 'function') {
          showToast(`👑 ${att.name}: Life Burn triggered! Opposing Life -1`, 'error');
        }
        renderDuelTable();
        checkGameOver();
      }
    }
    // 2. THE EMPEROR KAISERATLAS: "When only the opposing Spirit is destroyed via BP comparison, by sending a core from your Reserve to the Void, send two opposing Lives to their Reserve."
    else if (/when only the opposing spirit is destroyed via bp comparison.*?by sending a core from your reserve to the void.*?send two opposing lives to their reserve/i.test(bodyLower)) {
      const attReserve = isPlayerAttacking ? DuelState.player : DuelState.opponent;
      if (attReserve.reserve >= 1 && defState.life > 0) {
        attReserve.reserve -= 1; // sent to void
        const dmg = Math.min(2, defState.life);
        defState.life -= dmg;
        defState.reserve += dmg;
        AudioFX.lifeDamage();
        addLog(`👑💥 **[BP COMPARISON VICTORY: ${att.name}]**: Kaiseratlas channeled 1 core to the Void and shattered 2 opposing Lives to their Reserve! (${defSide === 'player' ? 'Player' : 'Opponent'} Life remaining: ${defState.life})`, 'damage');
        renderDuelTable();
        checkGameOver();
      }
    }
    // 3. THE DARKDRAGONEMPEROR SIEGFRIED: "When only the opposing Spirit is destroyed via BP comparison, draw a card."
    else if (/when only the opposing spirit is destroyed via bp comparison.*?draw a card/i.test(bodyLower)) {
      const attDeck = isPlayerAttacking ? DuelState.player.deck : DuelState.opponent.deck;
      const attHand = isPlayerAttacking ? DuelState.player.hand : DuelState.opponent.hand;
      const card = attDeck.shift();
      if (card) {
        attHand.push(card);
        AudioFX.playTone(440, 'sine', 0.15, 0.1);
        addLog(`🎴 **[BP COMPARISON VICTORY: ${att.name}]**: Drew 1 card from deck for victory in BP comparison!`, 'step');
        renderDuelTable();
      }
    }
  }

  function executeWhenBlocksEffects(blocker, defSide = 'player', attacker = null) {
    if (!blocker || !blocker.effect) return;
    const eff = blocker.effect;

    const m = eff.match(/((?:\\[LV\\d+\\])+|LV\\d+[-~]LV\\d+|LV\\d+)?\\s*(?:\\(When Blocks\\)|『このスピリットのブロック時』)\\s*([\\s\\S]*?)(?=\\n\\s*\\n|\\[LV|$)/i);
    if (!m) return;

    const levelTag = m[1] || '';
    const body = (m[2] || '').trim();
    const bodyLower = body.toLowerCase();

    if (!isEffectLevelMet(levelTag, blocker.currentLevel)) {
      return;
    }

    // BP Boost when blocking
    const bpM = bodyLower.match(/(?:this spirit )?(?:gains|gets)\\s*\\+(\\d+)\\s*bp/i);
    if (bpM) {
      const boost = parseInt(bpM[1], 10);
      blocker.currentBp += boost;
      blocker.battleBp = blocker.currentBp;
      AudioFX.shield();
      addLog(`🛡️ **[WHEN BLOCKS: ${blocker.name}]**: Gained +${boost} BP while defending! (Now ${blocker.currentBp} BP)`, 'damage');
      renderDuelTable();
    }
  }

  function executeWhenDestroyedEffects(destroyedSpirit, side = 'player') {
    if (!destroyedSpirit || !destroyedSpirit.effect) return;
    const eff = destroyedSpirit.effect;

    const m = eff.match(/((?:\\[LV\\d+\\])+|LV\\d+[-~]LV\\d+|LV\\d+)?\\s*(?:\\(When Destroyed\\)|『このスピリットの破壊時』)\\s*([\\s\\S]*?)(?=\\n\\s*\\n|\\[LV|$)/i);
    if (!m) return;

    const levelTag = m[1] || '';
    const body = (m[2] || '').trim();
    const bodyLower = body.toLowerCase();

    if (!isEffectLevelMet(levelTag, destroyedSpirit.currentLevel)) {
      return;
    }

    const isPlayer = side === 'player';
    const myDeck = isPlayer ? DuelState.player.deck : DuelState.opponent.deck;
    const myHand = isPlayer ? DuelState.player.hand : DuelState.opponent.hand;
    const myReserve = isPlayer ? DuelState.player : DuelState.opponent;

    // Draw on destruction
    if (/draw\\s+(a|an|one|two|\\d+)\\s+cards?/i.test(bodyLower)) {
      const match = bodyLower.match(/draw\\s+(a|an|one|two|\\d+)\\s+cards?/i);
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
        addLog(`🎴 **[WHEN DESTROYED: ${destroyedSpirit.name}]**: Drew ${drawn} card(s) from deck!`, 'step');
      }
    }
    // Void core to reserve on destruction
    else if (/put\\s+(a|an|one|\\d+)?\\s*cores?\\s+from\\s+the\\s+void\\s+to\\s+(?:your\\s+)?reserve/i.test(bodyLower)) {
      myReserve.reserve += 1;
      AudioFX.coreChime();
      addLog(`🌌 **[WHEN DESTROYED: ${destroyedSpirit.name}]**: Sent 1 Core from Void to Reserve upon destruction!`, 'magic');
    }
  }
"""

if is_crlf:
    engine_code = engine_code.replace('\n', '\r\n')

# 1. Insert engine before summonCard
target_summon = '  function summonCard(uid, customCoresToPlace) {'
if target_summon not in content:
    print("Error: target_summon not found!")
    exit(1)

content = content.replace(target_summon, engine_code + newline + target_summon, 1)

# 2. Add executeWhenSummonedEffects in summonCard
old_summon_log = "addLog(`✨ **SUMMONED**: \"${card.name}\" placed on field! Paid ${cost} cores, allocated ${coresToPlace} core (Lv${level}, ${bp} BP).`, 'step');"
new_summon_log = old_summon_log + newline + "    executeWhenSummonedEffects(card, 'player');"
if old_summon_log in content:
    content = content.replace(old_summon_log, new_summon_log, 1)
else:
    print("Warning: old_summon_log not found!")

# 3. Add executeWhenSummonedEffects in executeTribute
old_trib_log = 'if (card.name.includes(\'Grand-Woden\')) {'
new_trib_log = "executeWhenSummonedEffects(card, 'player');" + newline + "    " + old_trib_log
if old_trib_log in content:
    content = content.replace(old_trib_log, new_trib_log, 1)
else:
    print("Warning: old_trib_log not found!")

# 4. Add executeWhenSummonedEffects in Swift flash summon
old_swift_log = "if (typeof showToast === 'function') showToast(`⚡ Flash Summoned \"${card.name}\"! Ready to block.`, 'success');"
new_swift_log = old_swift_log + newline + "      executeWhenSummonedEffects(card, 'player');"
if old_swift_log in content:
    content = content.replace(old_swift_log, new_swift_log, 1)
else:
    print("Warning: old_swift_log not found!")

# 5. Add executeWhenSummonedEffects in executeSacrificePay
old_sac_sum = "addLog(`✨ **SUMMONED**: \"${card.name}\" entered the battlefield with 1 Core (Lv${newLevel}, ${newBp} BP)!`, 'step');"
new_sac_sum = old_sac_sum + newline + "      executeWhenSummonedEffects(card, 'player');"
if old_sac_sum in content:
    content = content.replace(old_sac_sum, new_sac_sum, 1)
else:
    print("Warning: old_sac_sum not found!")

# 6. Add executeWhenSummonedEffects in Burst spirit summon
old_burst_sp = "(side === 'player' ? DuelState.player.field : DuelState.opponent.field).push(burstCard);"
new_burst_sp = old_burst_sp + newline + "      executeWhenSummonedEffects(burstCard, side);"
if old_burst_sp in content:
    content = content.replace(old_burst_sp, new_burst_sp, 1)
else:
    print("Warning: old_burst_sp not found!")

# 7. Add executeWhenSummonedEffects in runAiMainStep
old_ai_sum = "DuelState.opponent.field.push(best);"
new_ai_sum = old_ai_sum + newline + "        executeWhenSummonedEffects(best, 'opponent');"
if old_ai_sum in content:
    content = content.replace(old_ai_sum, new_ai_sum, 1)
else:
    print("Warning: old_ai_sum not found!")

# 8. Add executeWhenAttacksEffects in executePlayerAttack
old_att_log = "addLog(`⚔️ **ATTACK DECLARED**: \"${attacker.name}\" attacks with ${battleBp} BP!${bpBoost > 0 ? ` (+${bpBoost} BP When Attacks bonus)` : ''}`, 'damage');"
new_att_log = old_att_log + newline + "    executeWhenAttacksEffects(attacker, 'player');"
if old_att_log in content:
    content = content.replace(old_att_log, new_att_log, 1)
else:
    print("Warning: old_att_log not found!")

# 9. Add executeWhenAttacksEffects in runAiAttackStep
old_ai_att = "addLog(`⚔️ **OPPONENT ATTACK**: \"${attacker.name}\" (${attacker.currentBp} BP) attacks your Life!`, 'damage');"
new_ai_att = old_ai_att + newline + "    executeWhenAttacksEffects(attacker, 'opponent');"
if old_ai_att in content:
    content = content.replace(old_ai_att, new_ai_att, 1)
else:
    print("Warning: old_ai_att not found!")

# 10. Add executeBpComparisonEffects in resolveClash
old_clash_win = "addLog(`💀 **SPIRIT DESTROYED**: \"${blk.name}\" fell in battle!`, 'kill');"
new_clash_win = old_clash_win + newline + newline + "      // BP Comparison victory resolution" + newline + "      executeBpComparisonEffects(att, blk, attSide, defSide);"
if old_clash_win in content:
    content = content.replace(old_clash_win, new_clash_win, 1)
else:
    print("Warning: old_clash_win not found!")

# 11. Add executeWhenBlocksEffects in chooseBlocker
old_block_log = "addLog(`🛡️ **YOU BLOCKED** with \"${blocker.name}\" (${blocker.currentBp} BP)!`, 'damage');"
new_block_log = old_block_log + newline + "    executeWhenBlocksEffects(blocker, 'player', attacker);"
if old_block_log in content:
    content = content.replace(old_block_log, new_block_log, 1)
else:
    print("Warning: old_block_log not found!")

# 12. Add executeWhenBlocksEffects in AI block
old_ai_block_log = "addLog(`🛡️ **BLOCK DECLARED**: Opponent blocks with \"${chosenBlocker.name}\" (${chosenBlocker.currentBp} BP)!`, 'damage');"
new_ai_block_log = old_ai_block_log + newline + "      executeWhenBlocksEffects(chosenBlocker, 'opponent', attacker);"
if old_ai_block_log in content:
    content = content.replace(old_ai_block_log, new_ai_block_log, 1)
else:
    print("Warning: old_ai_block_log not found!")

# 13. Add executeWhenDestroyedEffects in handleDestroyedSpiritCores
old_destroy_hook = "function handleDestroyedSpiritCores(spirit, side) {"
new_destroy_hook = "function handleDestroyedSpiritCores(spirit, side) {" + newline + "    executeWhenDestroyedEffects(spirit, side);"
if old_destroy_hook in content:
    content = content.replace(old_destroy_hook, new_destroy_hook, 1)
else:
    print("Warning: old_destroy_hook not found!")

# 14. Update getWhenAttacksBpBoost with level checking
old_bp_boost_fn = """  function getWhenAttacksBpBoost(spirit) {
    if (!spirit || !spirit.effect) return 0;
    const m = spirit.effect.match(/\\(When Attacks\\)[^\\.]*?\\+(\\d+)[\\s]*BP/i);
    if (m && m[1]) return parseInt(m[1], 10);
    const m2 = spirit.effect.match(/gains \\+(\\d+)[\\s]*BP/i);
    if (m2 && m2[1]) return parseInt(m2[1], 10);
    return 0;
  }"""
if is_crlf:
    old_bp_boost_fn = old_bp_boost_fn.replace('\n', '\r\n')

new_bp_boost_fn = """  function getWhenAttacksBpBoost(spirit) {
    if (!spirit || !spirit.effect) return 0;
    const m = spirit.effect.match(/((?:\\[LV\\d+\\])+|LV\\d+[-~]LV\\d+|LV\\d+)?\\s*(?:\\(When Attacks\\)|『このスピリットのアタック時』)?[^\\.]*?(?:gains|gets|\\+)\\s*(\\d+)[\\s]*BP/i);
    if (m && m[2]) {
      const levelTag = m[1] || '';
      if (isEffectLevelMet(levelTag, spirit.currentLevel)) {
        return parseInt(m[2], 10);
      }
    }
    return 0;
  }"""
if is_crlf:
    new_bp_boost_fn = new_bp_boost_fn.replace('\n', '\r\n')

if old_bp_boost_fn in content:
    content = content.replace(old_bp_boost_fn, new_bp_boost_fn, 1)
else:
    print("Warning: old_bp_boost_fn not found!")

# 15. Export new functions in BattleArena
old_exports = "applyMagicEffect"
new_exports = """applyMagicEffect,
    executeWhenSummonedEffects,
    executeWhenAttacksEffects,
    executeBpComparisonEffects,
    executeWhenBlocksEffects,
    executeWhenDestroyedEffects,
    parseEffectLevelRequirement,
    isEffectLevelMet"""
if is_crlf:
    new_exports = new_exports.replace('\n', '\r\n')

if old_exports in content:
    content = content.replace(old_exports, new_exports, 1)
else:
    print("Warning: old_exports not found!")

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("CardEffectEngine successfully integrated into battle_arena.js!")
