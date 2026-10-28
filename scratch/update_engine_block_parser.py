with open('battle_arena.js', 'r', encoding='utf-8') as f:
    content = f.read()

is_crlf = '\r\n' in content
newline = '\r\n' if is_crlf else '\n'

# Find the start of the Universal Card Effect Engine
start_marker = "  // ==========================================================================\n  // UNIVERSAL CARD EFFECT ENGINE (TRIGGERS & ACTIONS)"
if is_crlf:
    start_marker = start_marker.replace('\n', '\r\n')

# Find the end of executeWhenDestroyedEffects
end_marker = "  function summonCard(uid, customCoresToPlace) {"
if is_crlf:
    end_marker = end_marker.replace('\n', '\r\n')

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print(f"Error: Markers not found! start_idx={start_idx}, end_idx={end_idx}")
    exit(1)

new_engine = """  // ==========================================================================
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

  function getCardAbilityBlocks(cardEffect) {
    if (!cardEffect) return [];
    const rawBlocks = cardEffect.split(/(?=\\n\\s*(?:\\[LV\\d+\\]|LV\\d+))/i);
    return rawBlocks.map(b => b.trim()).filter(Boolean);
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

    // Isolate ability blocks
    const blocks = getCardAbilityBlocks(spirit.effect);
    const summonedBlock = blocks.find(b => /\\(When Summoned\\)|『このスピリットの召喚時』/i.test(b));
    if (!summonedBlock) return;

    const lvlMatch = summonedBlock.match(/^((?:\\[LV\\d+\\])+|LV\\d+[-~]LV\\d+|LV\\d+)/i);
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
    const myDeck = isPlayer ? DuelState.player.deck : DuelState.opponent.deck;
    const myHand = isPlayer ? DuelState.player.hand : DuelState.opponent.hand;

    // 1. THE DUKE KINGTAURUS: "For each other Spirit you control, put a core from the Void to this Spirit."
    if (/for each other spirit you control.*?put a core from the void to this spirit/i.test(bodyLower) ||
        /このスピリット以外の自分のスピリット.*?ボイドから.*?コア/i.test(summonedBlock)) {
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

    const blocks = getCardAbilityBlocks(attacker.effect);
    const attacksBlock = blocks.find(b => /\\(When Attacks\\)|『このスピリットのアタック時』/i.test(b));
    if (!attacksBlock) return;

    const lvlMatch = attacksBlock.match(/^((?:\\[LV\\d+\\])+|LV\\d+[-~]LV\\d+|LV\\d+)/i);
    const levelTag = lvlMatch ? lvlMatch[1] : '';

    if (!isEffectLevelMet(levelTag, attacker.currentLevel)) {
      return;
    }

    const bodyLower = attacksBlock.toLowerCase();
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

    if (!eff.toLowerCase().includes('bp comparison') && !eff.includes('BPを比べ')) return;

    // Isolate the ability block containing BP comparison
    const blocks = getCardAbilityBlocks(eff);
    const bpBlock = blocks.find(b => /bp comparison|BPを比べ/i.test(b));
    if (!bpBlock) return;

    const lvlMatch = bpBlock.match(/^((?:\\[LV\\d+\\])+|LV\\d+[-~]LV\\d+|LV\\d+)/i);
    const levelTag = lvlMatch ? lvlMatch[1] : '';

    // Check level requirement (e.g. Kingtaurus requires [LV2][LV3])
    if (!isEffectLevelMet(levelTag, att.currentLevel)) {
      return;
    }

    const bodyLower = bpBlock.toLowerCase();
    const defState = defSide === 'player' ? DuelState.player : DuelState.opponent;
    const isPlayerAttacking = attSide === 'player';

    // 1. THE DUKE KINGTAURUS: "When only the opposing Spirit is destroyed via BP comparison, send an opposing Life to their Reserve."
    if (/when only the opposing spirit is destroyed via bp comparison.*?send an opposing life to their reserve/i.test(bodyLower) ||
        /BPを比べ相手のスピリットだけを破壊したとき.*?相手のライフにあるコア1個を相手のリザーブに置く/i.test(bpBlock)) {
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

    const blocks = getCardAbilityBlocks(blocker.effect);
    const blocksBlock = blocks.find(b => /\\(When Blocks\\)|『このスピリットのブロック時』/i.test(b));
    if (!blocksBlock) return;

    const lvlMatch = blocksBlock.match(/^((?:\\[LV\\d+\\])+|LV\\d+[-~]LV\\d+|LV\\d+)/i);
    const levelTag = lvlMatch ? lvlMatch[1] : '';

    if (!isEffectLevelMet(levelTag, blocker.currentLevel)) {
      return;
    }

    const bodyLower = blocksBlock.toLowerCase();
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

    const blocks = getCardAbilityBlocks(destroyedSpirit.effect);
    const destroyedBlock = blocks.find(b => /\\(When Destroyed\\)|『このスピリットの破壊時』/i.test(b));
    if (!destroyedBlock) return;

    const lvlMatch = destroyedBlock.match(/^((?:\\[LV\\d+\\])+|LV\\d+[-~]LV\\d+|LV\\d+)/i);
    const levelTag = lvlMatch ? lvlMatch[1] : '';

    if (!isEffectLevelMet(levelTag, destroyedSpirit.currentLevel)) {
      return;
    }

    const bodyLower = destroyedBlock.toLowerCase();
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
    new_engine = new_engine.replace('\n', '\r\n')

content = content[:start_idx] + new_engine + content[end_idx:]

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated CardEffectEngine with block splitter successfully!")
