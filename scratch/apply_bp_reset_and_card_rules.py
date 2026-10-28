import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add recalculateSpiritBp, getWhenBlocksBpBoost, and endOfBattleBpReset
helper_functions = """
  // ── SPIRIT BP LIFECYCLE MANAGEMENT ──
  function recalculateSpiritBp(spirit) {
    if (!spirit) return 0;
    const { level, bp: baseBp } = calculateBpAndLevel(spirit.levels, spirit.currentCores, !!spirit.hasSoulCore, spirit.effect);
    spirit.currentLevel = level;
    spirit.baseBp = baseBp;
    spirit.currentBp = baseBp + (spirit.turnBpBoost || 0);
    if (spirit.battleBpBoost) {
      spirit.battleBp = spirit.currentBp + spirit.battleBpBoost;
    } else {
      delete spirit.battleBp;
    }
    return spirit.currentBp;
  }

  function getWhenBlocksBpBoost(spirit) {
    if (!spirit || !spirit.effect) return 0;
    const m = spirit.effect.match(/((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+)?\s*(?:\(When Blocks\)|『このスピリットのブロック時』)?[^\.]*?(?:gains|gets|\+)\s*(\d+)[\s]*BP/i);
    if (m && m[2]) {
      const levelTag = m[1] || '';
      if (isEffectLevelMet(levelTag, spirit.currentLevel)) {
        return parseInt(m[2], 10);
      }
    }
    return 0;
  }

  function endOfBattleBpReset(spirit) {
    if (!spirit) return;
    spirit.battleBpBoost = 0;
    delete spirit.battleBp;
    recalculateSpiritBp(spirit);
  }
"""

if 'function recalculateSpiritBp(' not in code:
    target_calc = "  function calculateBpAndLevel(parsedLevels, cores, hasSoulCore = false, cardEffect = '') {"
    code = code.replace(target_calc, helper_functions + "\n" + target_calc, 1)
    print("1. Added recalculateSpiritBp, getWhenBlocksBpBoost, and endOfBattleBpReset!")
else:
    print("1. BP helper functions already present.")

# 2. Update Rule 15 BP BOOST in executeAbilityActions
target_rule_15 = """    // 15. BP BOOST
    if (/(?:this spirit\s+)?(?:gets?|gains?)\s*\+(\d+)[\s]*bp/i.test(bodyLower)) {
      const match = bodyLower.match(/(?:this spirit\s+)?(?:gets?|gains?)\s*\+(\d+)[\s]*bp/i);
      const boost = parseInt(match[1], 10);
      card.currentBp = (card.currentBp || 0) + boost;
      card.battleBp = card.currentBp;
      AudioFX.shield();
      addLog(`💥 **[BP BOOST: ${card.name}]**: Gained +${boost} BP (now ${card.currentBp} BP)!`, 'damage');
    }"""

repl_rule_15 = """    // 15. BP BOOST
    if (/(?:this spirit\s+)?(?:gets?|gains?)\s*\+(\d+)[\s]*bp/i.test(bodyLower)) {
      const match = bodyLower.match(/(?:this spirit\s+)?(?:gets?|gains?)\s*\+(\d+)[\s]*bp/i);
      const boost = parseInt(match[1], 10);
      if (triggerName === 'ATTACK' || triggerName === 'BLOCK') {
        // Battle-duration BP boost only active during this battle!
        if (!card.battleBpBoost) {
          card.battleBpBoost = boost;
          card.battleBp = (card.currentBp || 0) + boost;
          AudioFX.shield();
          addLog(`💥 **[BP BOOST: ${card.name}]**: Temporarily gained +${boost} BP for battle (fighting with ${card.battleBp} BP)!`, 'damage');
        }
      } else {
        // Turn-duration or permanent boost
        card.turnBpBoost = (card.turnBpBoost || 0) + boost;
        recalculateSpiritBp(card);
        AudioFX.shield();
        addLog(`💥 **[BP BOOST: ${card.name}]**: Gained +${boost} BP (now ${card.currentBp} BP)!`, 'damage');
      }
    }"""

if target_rule_15 in code:
    code = code.replace(target_rule_15, repl_rule_15, 1)
    print("2. Updated Rule 15 BP boost for battle-duration only!")
else:
    print("2. Rule 15 target not found.")

# 3. Add rules 18-28 to executeAbilityActions
extra_rules = """
    // 18. DESPERADO CORE STRIP & VOID HARVEST (When Summoned)
    if (/send all cores on every other spirit to each respective player's reserve/i.test(bodyLower) || (card.name.includes('Desperado') && triggerName === 'SUMMON')) {
      let depletedCount = 0;
      const allOtherSpirits = [
        ...DuelState.player.field.filter(s => s.uid !== card.uid),
        ...DuelState.opponent.field.filter(s => s.uid !== card.uid)
      ];
      for (const sp of allOtherSpirits) {
        const spSide = DuelState.player.field.some(s => s.uid === sp.uid) ? 'player' : 'opponent';
        const res = DuelState[spSide];
        res.reserve += sp.currentCores;
        sp.currentCores = 0;
        const list = DuelState[spSide].field;
        const idx = list.findIndex(s => s.uid === sp.uid);
        if (idx !== -1) list.splice(idx, 1);
        sendToTrash(sp, spSide, `Depleted by ${card.name} core strip`);
        depletedCount++;
      }
      if (depletedCount > 0) {
        card.currentCores += depletedCount;
        recalculateSpiritBp(card);
        AudioFX.slash();
        addLog(`💀 **[DESPERADO SWEEP: ${card.name}]**: Sent all cores from ${depletedCount} spirits to reserves! Claimed +${depletedCount} cores from Void to "${card.name}"!`, 'kill');
        if (typeof showToast === 'function') showToast(`Desperado claimed +${depletedCount} cores!`, 'success');
      }
    }

    // 19. DECK DISCARD / MILL (Titus, Titus XV, Golem Mill)
    if (/discard\s+(\d+|ten)\s+cards?\s+from\s+the\s+opposing\s+decktop/i.test(bodyLower) || (card.name.includes('Titus') && triggerName === 'SUMMON')) {
      const match = bodyLower.match(/discard\s+(\d+|ten)\s+cards?\s+from\s+the\s+opposing\s+decktop/i);
      const millCount = match ? parseWordNumber(match[1]) : 10;
      let milled = 0;
      const enemyDeck = enemySide === 'player' ? DuelState.player.deck : DuelState.opponent.deck;
      for (let m = 0; m < millCount; m++) {
        const milledCard = enemyDeck.shift();
        if (milledCard) {
          sendToTrash(milledCard, enemySide, `Milled by ${card.name}`);
          milled++;
        }
      }
      if (milled > 0) {
        AudioFX.slash();
        addLog(`🌊 **[DECK MILL: ${card.name}]**: Discarded ${milled} card(s) from opponent's decktop to Trash!`, 'kill');
        if (typeof showToast === 'function') showToast(`Milled ${milled} cards from enemy deck!`, 'info');
        if (!enemyDeck.length) {
          DuelState[enemySide].life = 0;
          checkGameOver();
        }
      }
    }

    // 20. ALEXANDER DESTROY & MILL (When Attacks)
    if (card.name.includes('Alexander') && /destroy an opposing cost 4 or less spirit/i.test(bodyLower)) {
      const eligible = enemyField.filter(s => (s.cost || 0) <= 4);
      if (eligible.length > 0) {
        eligible.sort((a, b) => (b.cost || 0) - (a.cost || 0));
        const target = eligible[0];
        const tIdx = enemyField.findIndex(s => s.uid === target.uid);
        if (tIdx !== -1) enemyField.splice(tIdx, 1);
        enemyReserve.reserve += target.currentCores;
        sendToTrash(target, enemySide, `Destroyed by ${card.name}`);
        const targetCost = target.cost || 1;
        let milled = 0;
        const enemyDeck = enemySide === 'player' ? DuelState.player.deck : DuelState.opponent.deck;
        for (let m = 0; m < targetCost; m++) {
          const c = enemyDeck.shift();
          if (c) { sendToTrash(c, enemySide, `Milled by Alexander`); milled++; }
        }
        AudioFX.slash();
        addLog(`⚔️ **[ALEXANDER CRUSH: ${card.name}]**: Destroyed opposing "${target.name}" and milled ${milled} cards from enemy deck!`, 'kill');
      }
    }

    // 21. BAZZEL BURST TRIGGER (When Attacks)
    if (card.name.includes('Bazzel') && /reveal one of your bursts/i.test(bodyLower)) {
      const setBurst = DuelState[side].burst;
      if (setBurst) {
        addLog(`⚡ **[BAZZEL BURST ACTIVATION: ${card.name}]**: Revealed set Burst "${setBurst.name}"!`, 'magic');
        const cond = parseBurstCondition(setBurst.effect);
        if (cond.type === 'AFTER_OPPONENT_SUMMON_EFFECT' || cond.type === 'GENERIC_BURST' || (setBurst.effect && setBurst.effect.includes('When Summoned'))) {
          activateBurst(side, true);
        } else {
          addLog(`ℹ️ **[BAZZEL: ${card.name}]**: Set Burst "${setBurst.name}" condition [${cond.label}] is not a (When Summoned) burst.`, 'step');
        }
      }
    }

    // 22. BURNING-SOULDRAGON TRUE-CONSECUTIVE BLADE (When Attacks)
    if (/true-consecutive blade/i.test(bodyLower) || card.name.includes('Burning-Souldragon')) {
      if (card.hasSoulCore) {
        card.hasSoulCore = false;
        DuelState[side].soulCoreLocation = 'trash';
        AudioFX.slash();
        addLog(`🔥 **[TRUE-CONSECUTIVE BLADE: ${card.name}]**: Sent Soul Core to Trash to unleash full devastating power across opposing lines!`, 'damage');
        card._trueConsecutiveActive = true;
      }
    }

    // 23. ALDIUS-VIPER 2-CORE REMOVAL TO TRASH (When Summoned)
    if (/send two cores from two opposing spirits to the trash/i.test(bodyLower) || (card.name.includes('Aldius-Viper') && triggerName === 'SUMMON')) {
      for (let i = 0; i < 2; i++) {
        if (enemyField.length > i) {
          const target = enemyField[i];
          const toRemove = Math.min(2, target.currentCores);
          target.currentCores -= toRemove;
          enemyReserve.trashCores = (enemyReserve.trashCores || 0) + toRemove;
          addLog(`💀 **[ALDIUS-VIPER: ${card.name}]**: Sent ${toRemove} core(s) from "${target.name}" directly to Trash!`, 'kill');
          if (target.currentCores <= 0) {
            const tIdx = enemyField.findIndex(s => s.uid === target.uid);
            if (tIdx !== -1) enemyField.splice(tIdx, 1);
            sendToTrash(target, enemySide, `Depleted by Aldius-Viper`);
          } else {
            recalculateSpiritBp(target);
          }
        }
      }
    }

    // 24. ANGELIA ARCHIEL BP REDUCTION (When Attacks)
    if (/give an opposing spirit -(\d+)[\s]*bp/i.test(bodyLower)) {
      const match = bodyLower.match(/give an opposing spirit -(\d+)[\s]*bp/i);
      const minusBp = parseInt(match[1], 10);
      if (enemyField.length > 0) {
        enemyField.sort((a, b) => (b.currentBp || 0) - (a.currentBp || 0));
        const target = enemyField[0];
        target.currentBp = Math.max(0, (target.currentBp || 0) - minusBp);
        AudioFX.slash();
        addLog(`✨ **[BP REDUCTION: ${card.name}]**: Decreased opposing "${target.name}" by -${minusBp} BP (now ${target.currentBp} BP)!`, 'magic');
        if (target.currentBp <= 0) {
          const tIdx = enemyField.findIndex(s => s.uid === target.uid);
          if (tIdx !== -1) enemyField.splice(tIdx, 1);
          enemyReserve.reserve += target.currentCores;
          sendToTrash(target, enemySide, `Reduced to 0 BP by ${card.name}`);
          addLog(`💀 **[BP 0 DESTRUCTION]**: "${target.name}" was reduced to 0 BP and destroyed!`, 'kill');
        }
      }
    }

    // 25. TZAPHKIEL 2-LIFE BURN ON MAGIC USE
    if (/when you use a magic card.*?send two opposing lives to the reserve/i.test(bodyLower)) {
      card._tzaphkielLifeBurn = true;
    }

    // 26. PUPPET SOLDIER MAKAI REANIMATION (When Depleted/Destroyed)
    if (/return a\s+["']?makai["']?-named spirit card from your trash to the hand/i.test(bodyLower)) {
      const mIdx = myTrash.findIndex(c => (c.name || '').toLowerCase().includes('makai') || (c.family || '').toLowerCase().includes('makai'));
      if (mIdx !== -1) {
        const recovered = myTrash.splice(mIdx, 1)[0];
        myHand.push(recovered);
        addLog(`💀 **[PUPPET SOLDIER: ${card.name}]**: Returned "${recovered.name}" from Trash to Hand!`, 'magic');
      }
    }

    // 27. ZOMBIE-SNAKE ANCIENT DRAGON REVENGE (When Destroyed)
    if (/destroy an opposing\s+["']?ancient dragon["']?\s+family spirit/i.test(bodyLower)) {
      const target = enemyField.find(s => ((s.family || '') + ' ' + (s.families ? s.families.join(' ') : '')).toLowerCase().includes('ancient dragon'));
      if (target) {
        const tIdx = enemyField.findIndex(s => s.uid === target.uid);
        if (tIdx !== -1) enemyField.splice(tIdx, 1);
        enemyReserve.reserve += target.currentCores;
        sendToTrash(target, enemySide, `Destroyed by Zombie-Snake revenge`);
        addLog(`🐍 **[ZOMBIE-SNAKE REVENGE: ${card.name}]**: Destroyed opposing "${target.name}" (Ancient Dragon)!`, 'kill');
      }
    }
"""

target_end_ability = "    renderDuelTable();\n    if (side === 'player') renderPlayerHand();"
if target_end_ability in code:
    code = code.replace(target_end_ability, extra_rules + "\n" + target_end_ability, 1)
    print("3. Successfully added rules 18-27 to executeAbilityActions!")
else:
    print("3. target_end_ability not found.")

# 4. In executePlayerAttack, set attacker.battleBpBoost
target_exec_att = """    // Check (When Attacks) BP Boost
    const bpBoost = getWhenAttacksBpBoost(attacker);
    const battleBp = attacker.currentBp + bpBoost;
    attacker.battleBp = battleBp;

    AudioFX.slash();
    addLog(`⚔️ **ATTACK DECLARED**: "${attacker.name}" attacks with ${battleBp} BP!${bpBoost > 0 ? ` (+${bpBoost} BP When Attacks bonus)` : ''}`, 'damage');"""

repl_exec_att = """    // Check (When Attacks) BP Boost
    const bpBoost = getWhenAttacksBpBoost(attacker);
    attacker.battleBpBoost = bpBoost;
    attacker.battleBp = attacker.currentBp + bpBoost;
    const battleBp = attacker.battleBp;

    AudioFX.slash();
    addLog(`⚔️ **ATTACK DECLARED**: "${attacker.name}" attacks with ${battleBp} BP!${bpBoost > 0 ? ` (+${bpBoost} BP When Attacks bonus)` : ''}`, 'damage');"""

if target_exec_att in code:
    code = code.replace(target_exec_att, repl_exec_att, 1)
    print("4. Successfully updated executePlayerAttack for battleBpBoost!")
else:
    print("4. executePlayerAttack target not found.")

# 5. In runAiAttackStep, add battleBpBoost
target_ai_att = """    const attacker = bestAttacker;
    attacker.isExhausted = true;
    attacker.hasAttacked = true;

    AudioFX.slash();
    addLog(`⚔️ **OPPONENT ATTACK** [Expectimax EV +${bestScore.toFixed(2)}]: "${attacker.name}" (${attacker.currentBp} BP) attacks your Life!`, 'damage');"""

repl_ai_att = """    const attacker = bestAttacker;
    attacker.isExhausted = true;
    attacker.hasAttacked = true;

    const bpBoost = getWhenAttacksBpBoost(attacker);
    attacker.battleBpBoost = bpBoost;
    attacker.battleBp = attacker.currentBp + bpBoost;

    AudioFX.slash();
    addLog(`⚔️ **OPPONENT ATTACK** [Expectimax EV +${bestScore.toFixed(2)}]: "${attacker.name}" (${attacker.battleBp} BP) attacks your Life!${bpBoost > 0 ? ` (+${bpBoost} BP When Attacks bonus)` : ''}`, 'damage');"""

if target_ai_att in code:
    code = code.replace(target_ai_att, repl_ai_att, 1)
    print("5. Successfully updated runAiAttackStep for battleBpBoost!")
else:
    print("5. runAiAttackStep target not found.")

# 6. In chooseBlocker, add blockBpBoost
target_choose_blk = """    blocker.isExhausted = true;
    // Check Siegfried-Necro block sacrifice"""

repl_choose_blk = """    blocker.isExhausted = true;
    const blockBoost = getWhenBlocksBpBoost(blocker);
    blocker.battleBpBoost = blockBoost;
    blocker.battleBp = blocker.currentBp + blockBoost;
    // Check Siegfried-Necro block sacrifice"""

if target_choose_blk in code:
    code = code.replace(target_choose_blk, repl_choose_blk, 1)
    print("6. Successfully updated chooseBlocker for blockBpBoost!")
else:
    print("6. chooseBlocker target not found.")

# 7. In resolveClash, reset BP at end of clash
target_clash_reset = """      checkEndOfBattleEffects(survivors, attSide, defSide, () => {
        DuelState.combatEvent = null;
        renderDuelTable();
        checkGameOver();"""

repl_clash_reset = """      checkEndOfBattleEffects(survivors, attSide, defSide, () => {
        endOfBattleBpReset(att);
        endOfBattleBpReset(blk);
        DuelState.combatEvent = null;
        renderDuelTable();
        checkGameOver();"""

if target_clash_reset in code:
    code = code.replace(target_clash_reset, repl_clash_reset, 1)
    print("7. Successfully added endOfBattleBpReset to resolveClash!")
else:
    print("7. resolveClash reset target not found.")

# 8. In executePlayerAttack direct hit, reset BP
target_player_hit_reset = """        const isAttackerAlive = DuelState.player.field.some(s => s.uid === attacker.uid);
        if (isAttackerAlive) {
          checkEndOfBattleEffects([attacker], 'player', 'opponent', () => {
            renderDuelTable();
          });
        }"""

repl_player_hit_reset = """        const isAttackerAlive = DuelState.player.field.some(s => s.uid === attacker.uid);
        if (isAttackerAlive) {
          checkEndOfBattleEffects([attacker], 'player', 'opponent', () => {
            endOfBattleBpReset(attacker);
            renderDuelTable();
          });
        } else {
          endOfBattleBpReset(attacker);
        }"""

if target_player_hit_reset in code:
    code = code.replace(target_player_hit_reset, repl_player_hit_reset, 1)
    print("8. Successfully added endOfBattleBpReset to executePlayerAttack direct hit!")
else:
    print("8. executePlayerAttack reset target not found.")

# 9. In runAiAttackStep direct hit, reset BP
target_ai_hit_reset = """          if (isAttackerAlive) {
            checkEndOfBattleEffects([attacker], 'opponent', 'player', () => {
              finishAiTurn();
            });
          } else {
            finishAiTurn();
          }"""

repl_ai_hit_reset = """          if (isAttackerAlive) {
            checkEndOfBattleEffects([attacker], 'opponent', 'player', () => {
              endOfBattleBpReset(attacker);
              finishAiTurn();
            });
          } else {
            endOfBattleBpReset(attacker);
            finishAiTurn();
          }"""

if target_ai_hit_reset in code:
    code = code.replace(target_ai_hit_reset, repl_ai_hit_reset, 1)
    print("9. Successfully added endOfBattleBpReset to runAiAttackStep direct hit!")
else:
    print("9. runAiAttackStep reset target not found.")

# 10. In takeLifeDamage, reset BP
target_take_life_reset = """      if (isAttackerAlive) {
        checkEndOfBattleEffects([attacker], 'opponent', 'player', () => {
          continueOpponent();
        });
      } else {
        continueOpponent();
      }"""

repl_take_life_reset = """      if (isAttackerAlive) {
        checkEndOfBattleEffects([attacker], 'opponent', 'player', () => {
          if (attacker) endOfBattleBpReset(attacker);
          continueOpponent();
        });
      } else {
        if (attacker) endOfBattleBpReset(attacker);
        continueOpponent();
      }"""

if target_take_life_reset in code:
    code = code.replace(target_take_life_reset, repl_take_life_reset, 1)
    print("10. Successfully added endOfBattleBpReset to takeLifeDamage!")
else:
    print("10. takeLifeDamage reset target not found.")

# 11. In endTurn, reset all turn and battle BP buffs across both fields
target_end_turn = """    DuelState.turn++;
    if (DuelState.activePlayer === 'player') {"""

repl_end_turn = """    // Reset all turn and battle BP boosts for all spirits across both fields
    const allSpirits = [...(DuelState.player.field || []), ...(DuelState.opponent.field || [])];
    for (const s of allSpirits) {
      s.turnBpBoost = 0;
      s.battleBpBoost = 0;
      delete s.battleBp;
      recalculateSpiritBp(s);
    }

    DuelState.turn++;
    if (DuelState.activePlayer === 'player') {"""

if target_end_turn in code:
    code = code.replace(target_end_turn, repl_end_turn, 1)
    print("11. Successfully added turn & battle BP resets to endTurn!")
else:
    print("11. endTurn target not found.")

# 12. Export new functions on window.BattleArena
target_exports = "    executeBurstDiscardRefresh\n};"
repl_exports = """    executeBurstDiscardRefresh,
    recalculateSpiritBp,
    endOfBattleBpReset,
    getWhenBlocksBpBoost
};"""

if target_exports in code:
    code = code.replace(target_exports, repl_exports, 1)
    print("12. Successfully exported recalculateSpiritBp and endOfBattleBpReset!")
else:
    print("12. Exports target not found.")

with open('battle_arena.js', 'w', encoding='utf-8', newline='') as f:
    f.write(code)

print("battle_arena.js updated successfully!")
