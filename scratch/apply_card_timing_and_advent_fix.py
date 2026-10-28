import re

battle_arena_path = 'battle_arena.js'
with open(battle_arena_path, 'r', encoding='utf-8') as f:
    ba_content = f.read()

# 1. Update canPlayCardInCurrentPhase and add checkCardUsageRestriction
old_can_play = '''  function canPlayCardInCurrentPhase(card) {
    if (!card || DuelState.activePlayer !== 'player') return false;
    const currentPhase = DuelState.phases[DuelState.phaseIndex];
    if (currentPhase === 'MAIN') {
      return true; // Main step allows summoning spirits & casting magic
    }
    if (currentPhase === 'ATTACK') {
      // Official Rule: Attack Step ONLY allows cards with [Flash] timing!
      return hasFlashTiming(card);
    }
    return false; // Other steps (Start, Core, Draw, Refresh, End) do not allow card plays
  }'''

new_can_play = '''  function checkCardUsageRestriction(card, side = 'player') {
    if (!card || !card.effect) return { allowed: true };
    const text = (card.effect || '').toLowerCase();
    const isOurTurn = (DuelState.activePlayer === side);
    const phase = DuelState.phases[DuelState.phaseIndex];

    // 1. "can't be used on Your Turn" / "cannot be used on Your Turn" / "自分のターンでは使用できず"
    // e.g. Purple Flash's Extreme, Distant Sea's Extreme, Forbidden Extreme, Rich Harvest's Extreme, etc.
    if (text.includes("can't be used on your turn") || 
        text.includes("cannot be used on your turn") ||
        text.includes("can't be used during your turn") ||
        text.includes("cannot be used during your turn") ||
        text.includes("自分のターンでは使用できず") ||
        text.includes("usable only on opponent's turn") ||
        text.includes("usable only during opponent's turn") ||
        text.includes("can only be used on opponent's turn") ||
        text.includes("can only be used during opponent's turn") ||
        text.includes("usable only during opposing turn")) {
      if (isOurTurn) {
        return { 
          allowed: false, 
          reason: "Cannot be used on Your Turn (Opponent's Turn only)" 
        };
      }
    }

    // 2. "can only be used on your turn" / "usable only on your turn"
    if (text.includes("can only be used on your turn") ||
        text.includes("can only be used during your turn") ||
        text.includes("usable only on your turn")) {
      if (!isOurTurn) {
        return { 
          allowed: false, 
          reason: "Can only be used on Your Turn" 
        };
      }
    }

    // 3. "can't be used in Main Step" / "cannot be used in Main Step" / "Attack Step only"
    // e.g. Great Link, Abyss Break, Balmung Shot, Burst Break, God Speed, Kidzuna Blade, Thunder Branch
    if (text.includes("can't be used in main step") ||
        text.includes("cannot be used in main step") ||
        text.includes("can't be used during main step") ||
        text.includes("cannot be used during main step") ||
        text.includes("usable only in attack step") ||
        text.includes("can only be used in attack step") ||
        text.includes("can only be used during attack step")) {
      if (phase === 'MAIN') {
        return { 
          allowed: false, 
          reason: "Cannot be used in Main Step (Attack Step only)" 
        };
      }
    }

    // 4. "can't be used in Attack Step" / "cannot be used in Attack Step" / "Main Step only"
    if (text.includes("can't be used in attack step") ||
        text.includes("cannot be used in attack step") ||
        text.includes("can't be used during attack step") ||
        text.includes("cannot be used during attack step") ||
        text.includes("can only be used in main step") ||
        text.includes("usable only in main step") ||
        text.includes("can only be used during main step")) {
      if (phase === 'ATTACK') {
        return { 
          allowed: false, 
          reason: "Cannot be used in Attack Step (Main Step only)" 
        };
      }
    }

    // 5. "can only be used during Opponent's Attack Step" / "Opposing Attack Step"
    if (text.includes("only be used during opponent's attack step") ||
        text.includes("only be used in opponent's attack step") ||
        text.includes("only be used in opposing attack step") ||
        text.includes("usable only in opposing attack step") ||
        text.includes("usable only in opponent's attack step")) {
      if (phase !== 'ATTACK' || isOurTurn) {
        return { 
          allowed: false, 
          reason: "Can only be used in Opponent's Attack Step" 
        };
      }
    }

    // 6. "can only be used during your Attack Step"
    if (text.includes("only be used during your attack step") ||
        text.includes("only be used in your attack step") ||
        text.includes("usable only in your attack step")) {
      if (phase !== 'ATTACK' || !isOurTurn) {
        return { 
          allowed: false, 
          reason: "Can only be used in Your Attack Step" 
        };
      }
    }

    return { allowed: true };
  }

  function canPlayCardInCurrentPhase(card, side = 'player') {
    if (!card) return false;
    const isOurTurn = (DuelState.activePlayer === side);
    const currentPhase = DuelState.phases[DuelState.phaseIndex];

    // Check card-specific text restrictions first!
    const rest = checkCardUsageRestriction(card, side);
    if (!rest.allowed) return false;

    if (currentPhase === 'MAIN') {
      if (!isOurTurn) return false;
      return true; // Main step allows summoning spirits & casting magic
    }
    if (currentPhase === 'ATTACK') {
      // Official Rule: Attack Step ONLY allows cards with [Flash] timing!
      return hasFlashTiming(card);
    }
    return false; // Other steps (Start, Core, Draw, Refresh, End) do not allow card plays
  }'''

assert old_can_play in ba_content, "old_can_play not found!"
ba_content = ba_content.replace(old_can_play, new_can_play)
print("1. Replaced canPlayCardInCurrentPhase and added checkCardUsageRestriction successfully!")

# 2. Update renderHandCards canAdvent calculation
old_hand_advent = '''      // Advent Action Button
      const adventReq = getCardAdventRequirement(card);
      const canAdvent = adventReq && (DuelState.player.soulCoreLocation !== 'trash') && (getEligibleAdventTargets(adventReq, DuelState.player.field).length > 0) && (isMainStep || isAttackStep);
      const adventBtnHtml = canAdvent ? `<button class="btn-quick-advent" onclick="event.stopPropagation(); BattleArena.openAdventPrompt('${card.uid}')">🌟 [Advent]</button>` : '';'''

new_hand_advent = '''      // Advent Action Button - ONLY active when step/turn timing requirements are met (Official Rule: Attack Step only, never Main Step)
      const adventReq = getCardAdventRequirement(card);
      const canAdvent = canPerformAdvent(card, 'player');
      const adventBtnHtml = canAdvent ? `<button class="btn-quick-advent" onclick="event.stopPropagation(); BattleArena.openAdventPrompt('${card.uid}')">🌟 [Advent]</button>` : '';'''

assert old_hand_advent in ba_content, "old_hand_advent not found!"
ba_content = ba_content.replace(old_hand_advent, new_hand_advent)
print("2. Replaced renderHandCards canAdvent calculation successfully!")

# 3. Update renderCardInspector for restricted cards and Advent button
old_inspector_btn = '''      } else if (!canPlayStep) {
        if (phase === 'ATTACK') {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-disabled" disabled title="Normal cards without [Flash] cannot be played in Attack Step">⚔️ Main Step Only (No Flash)</button>`;
        } else {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-disabled" disabled>⏳ Cannot Play in ${phase} Step</button>`;
        }
      }'''

new_inspector_btn = '''      } else if (!canPlayStep) {
        const rest = checkCardUsageRestriction(card, 'player');
        if (!rest.allowed) {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-disabled" disabled title="${rest.reason}">🚫 ${rest.reason}</button>`;
        } else if (phase === 'ATTACK') {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-disabled" disabled title="Normal cards without [Flash] cannot be played in Attack Step">⚔️ Main Step Only (No Flash)</button>`;
        } else {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-disabled" disabled>⏳ Cannot Play in ${phase} Step</button>`;
        }
      }

      // Check Advent in inspector
      const adventReq = getCardAdventRequirement(card);
      if (adventReq) {
        if (canPerformAdvent(card, 'player')) {
          actionBtnHtml += `<button class="btn-inspector-action btn-inspect-advent" onclick="BattleArena.openAdventPrompt('${card.uid}')">🌟 Advent (${adventReq.timingLabel})</button>`;
        } else if (!isAdventTimingValid(adventReq, 'player')) {
          actionBtnHtml += `<button class="btn-inspector-action btn-inspect-disabled" disabled title="Advent timing is ${adventReq.timingLabel}">⚔️ Advent: ${adventReq.timingLabel} Only</button>`;
        } else if (DuelState.player.soulCoreLocation === 'trash') {
          actionBtnHtml += `<button class="btn-inspector-action btn-inspect-disabled" disabled title="Advent requires your [Soul Core], but it is in Trash">⚠️ Advent: Soul Core in Trash</button>`;
        } else {
          actionBtnHtml += `<button class="btn-inspector-action btn-inspect-disabled" disabled title="No eligible field Spirit satisfies [Advent: ${adventReq.condText}]">⚠️ Advent: No Target (${adventReq.condText})</button>`;
        }
      }'''

assert old_inspector_btn in ba_content, "old_inspector_btn not found!"
ba_content = ba_content.replace(old_inspector_btn, new_inspector_btn)
print("3. Replaced renderCardInspector buttons successfully!")

# 4. Update getCardAdventRequirement, isAdventTimingValid, canPerformAdvent, openAdventPrompt
old_advent_engine = '''  // ── ADVENT (煌臨 / TWINKLE) MECHANICS ENGINE ──
  function getCardAdventRequirement(card) {
    if (!card || !card.effect) return null;
    const m = card.effect.match(/\\[Advent:\\s*([^\\]]+)\\]|【煌臨：([^】]+)】/i);
    if (!m) return null;
    const rawCond = (m[1] || m[2]).trim();

    // Parse sub-conditions separated by & or , or and
    const parts = rawCond.split(/[,&]|\\band\\b/i).map(s => s.trim()).filter(Boolean);
    const parsed = {
      raw: m[0],
      condText: rawCond,
      minCost: null,
      maxCost: null,
      colors: [],
      families: []
    };

    const validColors = ['red', 'purple', 'green', 'white', 'yellow', 'blue'];
    for (const p of parts) {
      const moreM = p.match(/cost\\s*(\\d+)\\s*or\\s*more/i);
      const lessM = p.match(/cost\\s*(\\d+)\\s*or\\s*less/i);
      if (moreM) {
        parsed.minCost = parseInt(moreM[1], 10);
      } else if (lessM) {
        parsed.maxCost = parseInt(lessM[1], 10);
      } else if (validColors.includes(p.toLowerCase())) {
        parsed.colors.push(p.toLowerCase());
      } else {
        parsed.families.push(p.replace(/[\\[\\]"']/g, '').trim());
      }
    }
    return parsed;
  }

  function getEligibleAdventTargets(adventReq, fieldSpirits) {
    if (!adventReq || !fieldSpirits || !fieldSpirits.length) return [];
    return fieldSpirits.filter(s => {
      // Cost check
      if (adventReq.minCost !== null && (s.cost || 0) < adventReq.minCost) return false;
      if (adventReq.maxCost !== null && (s.cost || 0) > adventReq.maxCost) return false;
      // Color check
      if (adventReq.colors.length > 0) {
        const sColor = (s.color || '').toLowerCase();
        if (!adventReq.colors.includes(sColor)) return false;
      }
      // Family check
      if (adventReq.families.length > 0) {
        const famStr = ((s.family || '') + ' ' + (s.families ? s.families.join(' ') : '') + ' ' + s.name).toLowerCase();
        const matchesFamily = adventReq.families.some(f => famStr.includes(f.toLowerCase()));
        if (!matchesFamily) return false;
      }
      return true;
    });
  }

  function canPerformAdvent(card, side = 'player') {
    if (!card) return false;
    const req = getCardAdventRequirement(card);
    if (!req) return false;
    const st = DuelState[side];
    if (!st || st.soulCoreLocation === 'trash') return false; // Soul Core required
    const eligible = getEligibleAdventTargets(req, st.field);
    return eligible.length > 0;
  }

  let pendingAdvent = null;

  function openAdventPrompt(cardUid) {
    const card = DuelState.player.hand.find(c => c.uid === cardUid);
    if (!card) return;
    const req = getCardAdventRequirement(card);
    if (!req) {
      if (typeof showToast === 'function') showToast('Card does not have [Advent] ability!', 'warning');
      return;
    }
    if (DuelState.player.soulCoreLocation === 'trash') {
      if (typeof showToast === 'function') showToast('Official Rule: [Advent] requires your [Soul Core], but it is currently in Trash!', 'warning');
      return;
    }
    const eligible = getEligibleAdventTargets(req, DuelState.player.field);
    if (!eligible.length) {
      if (typeof showToast === 'function') showToast(`No eligible field Spirit satisfies [Advent: ${req.condText}]!`, 'warning');
      return;
    }'''

new_advent_engine = '''  // ── ADVENT (煌臨 / TWINKLE) MECHANICS ENGINE ──
  function getCardAdventRequirement(card) {
    if (!card || !card.effect) return null;
    const m = card.effect.match(/\\[Advent:\\s*([^\\]]+)\\]|【煌臨：([^】]+)】/i);
    if (!m) return null;
    const rawCond = (m[1] || m[2]).trim();

    // Parse timing in parentheses following [Advent: ...]
    // e.g. "((Either Attack Step))", "(Your Attack Step)", "(Opposing Attack Step)", "(Your Main Step)"
    let timing = 'either_attack_step';
    let timingLabel = 'Either Attack Step';
    
    const timeMatch = card.effect.match(/(?:\\[Advent:[^\\]]+\\]|【煌臨:[^】]+】)\\s*(?:\\(?\\s*\\(([^)]+)\\)\\)?|\\(([^)]+)\\)|『([^』]+)』)/i);
    let rawTime = timeMatch ? (timeMatch[1] || timeMatch[2] || timeMatch[3] || '').trim().toLowerCase() : '';
    if (!rawTime) {
      const beforeMatch = card.effect.match(/(?:\\(?\\s*\\(([^)]+)\\)\\)?|\\(([^)]+)\\)|『([^』]+)』)\\s*(?:\\[Advent:|【煌臨:)/i);
      if (beforeMatch) {
        rawTime = (beforeMatch[1] || beforeMatch[2] || beforeMatch[3] || '').trim().toLowerCase();
      }
    }

    if (rawTime.includes('your main step')) {
      timing = 'your_main_step';
      timingLabel = 'Your Main Step';
    } else if (rawTime.includes('start of your attack step')) {
      timing = 'start_your_attack_step';
      timingLabel = 'Start of Your Attack Step';
    } else if (rawTime.includes('start of either attack step')) {
      timing = 'start_either_attack_step';
      timingLabel = 'Start of Either Attack Step';
    } else if (rawTime.includes('your attack step') || rawTime.includes('your turn')) {
      timing = 'your_attack_step';
      timingLabel = 'Your Attack Step';
    } else if (rawTime.includes('opposing attack step') || rawTime.includes("opponent's attack step") || rawTime.includes('相手のアタックステップ')) {
      timing = 'opposing_attack_step';
      timingLabel = "Opponent's Attack Step";
    } else {
      timing = 'either_attack_step';
      timingLabel = 'Either Attack Step';
    }

    // Parse sub-conditions separated by & or , or and
    const parts = rawCond.split(/[,&]|\\band\\b/i).map(s => s.trim()).filter(Boolean);
    const parsed = {
      raw: m[0],
      condText: rawCond,
      timing,
      timingLabel,
      minCost: null,
      maxCost: null,
      colors: [],
      families: []
    };

    const validColors = ['red', 'purple', 'green', 'white', 'yellow', 'blue'];
    for (const p of parts) {
      const moreM = p.match(/cost\\s*(\\d+)\\s*or\\s*more/i);
      const lessM = p.match(/cost\\s*(\\d+)\\s*or\\s*less/i);
      if (moreM) {
        parsed.minCost = parseInt(moreM[1], 10);
      } else if (lessM) {
        parsed.maxCost = parseInt(lessM[1], 10);
      } else if (validColors.includes(p.toLowerCase())) {
        parsed.colors.push(p.toLowerCase());
      } else {
        parsed.families.push(p.replace(/[\\[\\]"']/g, '').trim());
      }
    }
    return parsed;
  }

  function getEligibleAdventTargets(adventReq, fieldSpirits) {
    if (!adventReq || !fieldSpirits || !fieldSpirits.length) return [];
    return fieldSpirits.filter(s => {
      // Cost check
      if (adventReq.minCost !== null && (s.cost || 0) < adventReq.minCost) return false;
      if (adventReq.maxCost !== null && (s.cost || 0) > adventReq.maxCost) return false;
      // Color check
      if (adventReq.colors.length > 0) {
        const sColor = (s.color || '').toLowerCase();
        if (!adventReq.colors.includes(sColor)) return false;
      }
      // Family check
      if (adventReq.families.length > 0) {
        const famStr = ((s.family || '') + ' ' + (s.families ? s.families.join(' ') : '') + ' ' + s.name).toLowerCase();
        const matchesFamily = adventReq.families.some(f => famStr.includes(f.toLowerCase()));
        if (!matchesFamily) return false;
      }
      return true;
    });
  }

  function isAdventTimingValid(adventReq, side = 'player') {
    if (!adventReq) return false;
    const isOurTurn = (DuelState.activePlayer === side);
    const currentPhase = DuelState.phases[DuelState.phaseIndex];

    if (adventReq.timing === 'your_main_step') {
      return isOurTurn && currentPhase === 'MAIN';
    }

    // Official Battle Spirits Rule: Advent is a Flash timing keyword exclusively for the ATTACK step!
    // Under NO circumstances can Advent be used in MAIN, START, CORE, DRAW, REFRESH, or END steps!
    if (currentPhase !== 'ATTACK') {
      return false;
    }

    if (adventReq.timing === 'your_attack_step') {
      return isOurTurn;
    }
    if (adventReq.timing === 'opposing_attack_step') {
      return !isOurTurn;
    }
    if (adventReq.timing === 'either_attack_step' || adventReq.timing === 'start_either_attack_step' || adventReq.timing === 'start_your_attack_step') {
      return true;
    }
    return false;
  }

  function canPerformAdvent(card, side = 'player') {
    if (!card) return false;
    const req = getCardAdventRequirement(card);
    if (!req) return false;
    if (!isAdventTimingValid(req, side)) return false;
    const st = DuelState[side];
    if (!st || st.soulCoreLocation === 'trash') return false; // Soul Core required
    const eligible = getEligibleAdventTargets(req, st.field);
    return eligible.length > 0;
  }

  let pendingAdvent = null;

  function openAdventPrompt(cardUid) {
    const card = DuelState.player.hand.find(c => c.uid === cardUid);
    if (!card) return;
    const req = getCardAdventRequirement(card);
    if (!req) {
      if (typeof showToast === 'function') showToast('Card does not have [Advent] ability!', 'warning');
      return;
    }
    if (!isAdventTimingValid(req, 'player')) {
      const currentPhase = DuelState.phases[DuelState.phaseIndex];
      const isOurTurn = (DuelState.activePlayer === 'player');
      if (typeof showToast === 'function') {
        showToast(`Official Rule: [Advent] for "${card.name}" can only be used during ${req.timingLabel}! (Currently in ${currentPhase} Step of ${isOurTurn ? 'Your' : "Opponent's"} Turn)`, 'warning');
      }
      return;
    }
    if (DuelState.player.soulCoreLocation === 'trash') {
      if (typeof showToast === 'function') showToast('Official Rule: [Advent] requires your [Soul Core], but it is currently in Trash!', 'warning');
      return;
    }
    const eligible = getEligibleAdventTargets(req, DuelState.player.field);
    if (!eligible.length) {
      if (typeof showToast === 'function') showToast(`No eligible field Spirit satisfies [Advent: ${req.condText}]!`, 'warning');
      return;
    }'''

assert old_advent_engine in ba_content, "old_advent_engine not found!"
ba_content = ba_content.replace(old_advent_engine, new_advent_engine)
print("4. Replaced Advent engine functions successfully!")

# 5. Update executeWhenAdventsEffects to trigger all (When Advents) ability blocks
old_advent_effects = '''  function executeWhenAdventsEffects(spirit, side = 'player') {
    if (!spirit || !spirit.effect) return;
    const effLower = spirit.effect.toLowerCase();
    const isPlayer = side === 'player';
    const myTrash = (isPlayer ? (DuelState.player.trashCards || DuelState.player.trash) : (DuelState.opponent.trashCards || DuelState.opponent.trash)) || [];
    const myField = isPlayer ? DuelState.player.field : DuelState.opponent.field;
    const myReserve = isPlayer ? DuelState.player : DuelState.opponent;

    // 1. THE MAKAI PHANTOM DRAGON SIEGFRIED-NECRO: [Twinkle Necromancy] (When Advents)'''

new_advent_effects = '''  function executeWhenAdventsEffects(spirit, side = 'player') {
    if (!spirit || !spirit.effect) return;
    const effLower = spirit.effect.toLowerCase();
    const isPlayer = side === 'player';
    const myTrash = (isPlayer ? (DuelState.player.trashCards || DuelState.player.trash) : (DuelState.opponent.trashCards || DuelState.opponent.trash)) || [];
    const myField = isPlayer ? DuelState.player.field : DuelState.opponent.field;
    const myReserve = isPlayer ? DuelState.player : DuelState.opponent;

    // 1. Universal (When Advents) / (When Advents/Summoned) / 煌臨時 ability blocks (e.g. The MakaiKnight Shazworth: Draw two cards)
    const blocks = getCardAbilityBlocks(spirit.effect);
    const adventBlocks = blocks.filter(b => /(?:When Advents|When [^)]*\\/Advents|When Advents\\/[^\\)]*|煌臨時)/i.test(b));
    for (const b of adventBlocks) {
      const lvlMatch = b.match(/^((?:\\[LV\\d+\\])+|LV\\d+[-~]LV\\d+|LV\\d+)/i);
      const levelTag = lvlMatch ? lvlMatch[1] : '';
      if (isEffectLevelMet(levelTag, spirit.currentLevel || 1)) {
        executeAbilityActions(b, spirit, side, 'ADVENT');
      }
    }

    // 2. THE MAKAI PHANTOM DRAGON SIEGFRIED-NECRO: [Twinkle Necromancy] (When Advents)'''

assert old_advent_effects in ba_content, "old_advent_effects not found!"
ba_content = ba_content.replace(old_advent_effects, new_advent_effects)
print("5. Replaced executeWhenAdventsEffects successfully!")

# 6. Update castMagic: check restrictions and banish
old_cast_magic = '''    if (phase !== 'MAIN' && phase !== 'ATTACK') {
      showToast("Magic can only be cast during MAIN or ATTACK (Flash) steps!", 'warning');
      return;
    }

    if (phase === 'ATTACK' && !hasFlashTiming(card)) {
      if (typeof showToast === 'function') showToast(`Official Rule: "${card.name}" does not have [Flash] timing and can only be cast during the MAIN step!`, 'warning');
      return;
    }'''

new_cast_magic = '''    if (phase !== 'MAIN' && phase !== 'ATTACK') {
      showToast("Magic can only be cast during MAIN or ATTACK (Flash) steps!", 'warning');
      return;
    }

    const rest = checkCardUsageRestriction(card, 'player');
    if (!rest.allowed) {
      if (typeof showToast === 'function') showToast(`Official Restriction: "${card.name}" ${rest.reason}`, 'warning');
      return;
    }

    if (phase === 'ATTACK' && !hasFlashTiming(card)) {
      if (typeof showToast === 'function') showToast(`Official Rule: "${card.name}" does not have [Flash] timing and can only be cast during the MAIN step!`, 'warning');
      return;
    }'''

assert old_cast_magic in ba_content, "old_cast_magic not found!"
ba_content = ba_content.replace(old_cast_magic, new_cast_magic)

old_send_trash_magic = '''    DuelState.player.reserve -= card.cost;
    DuelState.player.trash += card.cost;
    DuelState.player.hand.splice(cardIdx, 1);
    sendToTrash(card, 'player', 'Cast Magic from Hand');'''

new_send_trash_magic = '''    DuelState.player.reserve -= card.cost;
    DuelState.player.trash += card.cost;
    DuelState.player.hand.splice(cardIdx, 1);
    
    // Check if card is banished from game after resolving (e.g. Purple Flash's Extreme)
    const isBanished = /banished from the game after its effect resolves|除外される/i.test(card.effect || '');
    if (isBanished) {
      sendToVoid(card, 'player', 'Banished from game after resolving');
      addLog(`🌌 **[EXCLUDED FROM GAME]**: "${card.name}" was banished from the game after its effect resolved!`, 'magic');
    } else {
      sendToTrash(card, 'player', 'Cast Magic from Hand');
    }'''

assert old_send_trash_magic in ba_content, "old_send_trash_magic not found!"
ba_content = ba_content.replace(old_send_trash_magic, new_send_trash_magic)
print("6. Replaced castMagic restrictions and banishment successfully!")

# 7. Update core depletion regex to match 'from any opposing' and add mass core send & pre-advent discard
old_core_deplete = '''    if (/send\\s+(?:up to\\s+)?(a|an|one|two|three|\\d+)\\s+cores?\\s+from\\s+(?:an|one|\\d+)?\\s*opposing\\s+(?:spirit|ultimate|nexus).*?to\\s+the\\s+(reserve|trash)/i.test(bodyLower)) {
      const match = bodyLower.match(/send\\s+(?:up to\\s+)?(a|an|one|two|three|\\d+)\\s+cores?\\s+from\\s+(?:an|one|\\d+)?\\s*opposing\\s+(?:spirit|ultimate|nexus).*?to\\s+the\\s+(reserve|trash)/i);'''

new_core_deplete = '''    // 28. SEND ALL CORES FROM EVERY OPPOSING SPIRIT/ULTIMATE TO RESERVE (e.g. Purple Flash's Extreme)
    if (/send all cores from every opposing (?:spirit|ultimate|spirit\\/ultimate).*?to (?:the|their) reserve/i.test(bodyLower)) {
      let totalCoresMoved = 0;
      const depletedSpirits = [];
      for (let i = enemyField.length - 1; i >= 0; i--) {
        const s = enemyField[i];
        const coresOnS = s.currentCores;
        s.currentCores = 0;
        enemyReserve.reserve += coresOnS;
        totalCoresMoved += coresOnS;
        depletedSpirits.push(s.name);
        enemyField.splice(i, 1);
        handleDestroyedSpiritCores(s, enemySide);
        sendToTrash(s, enemySide, `Depleted to 0 cores by ${card.name} (${triggerName})`);
      }
      AudioFX.slash();
      addLog(`🔮💥 **[VOID EXTINCTION: ${card.name}]**: Sent all ${totalCoresMoved} core(s) from every opposing Spirit/Ultimate to their Reserve! Depleted and destroyed: ${depletedSpirits.join(', ')}!`, 'kill');
      if (typeof showToast === 'function') {
        showToast(`🔮 Sent all ${totalCoresMoved} enemy cores to Reserve!`, 'success');
      }
    }

    // 29. DISCARD PRE-ADVENT CARD TO SEND OPPOSING CORES TO VOID (e.g. The MakaiKnight Shazworth)
    if (/discarding one of this spirit's ["']?([^"']+)["']?-named pre-advent cards.*?send (?:two|\\d+) cores.*?to the void/i.test(bodyLower)) {
      const matchFam = bodyLower.match(/discarding one of this spirit's ["']?([^"']+)["']?-named pre-advent cards/i);
      const reqName = matchFam ? matchFam[1].toLowerCase() : 'sevenshogun';
      const underlying = card.underlyingCards || [];
      const matchIdx = underlying.findIndex(u => (u.name || '').toLowerCase().includes(reqName) || (u.family || '').toLowerCase().includes(reqName));
      if (matchIdx !== -1) {
        const discarded = underlying.splice(matchIdx, 1)[0];
        myTrash.push(discarded);
        let voided = 0;
        for (let i = enemyField.length - 1; i >= 0 && voided < 2; i--) {
          const s = enemyField[i];
          if (s.currentCores > 0) {
            const take = Math.min(2 - voided, s.currentCores);
            s.currentCores -= take;
            voided += take;
            if (s.currentCores <= 0) {
              enemyField.splice(i, 1);
              handleDestroyedSpiritCores(s, enemySide);
              sendToTrash(s, enemySide, `Depleted by ${card.name}`);
            }
          }
        }
        AudioFX.coreChime();
        addLog(`🌌 **[VOID SENT: ${card.name}]**: Discarded pre-advent "${discarded.name}" and sent ${voided} opposing core(s) to the Void!`, 'magic');
      }
    }

    if (/send\\s+(?:up to\\s+)?(a|an|one|two|three|\\d+)\\s+cores?\\s+from\\s+(?:an|any|one|\\d+)?\\s*opposing\\s+(?:spirit|ultimate|nexus).*?to\\s+(?:the\\s+|their\\s+)?(reserve|trash)/i.test(bodyLower)) {
      const match = bodyLower.match(/send\\s+(?:up to\\s+)?(a|an|one|two|three|\\d+)\\s+cores?\\s+from\\s+(?:an|any|one|\\d+)?\\s*opposing\\s+(?:spirit|ultimate|nexus).*?to\\s+(?:the\\s+|their\\s+)?(reserve|trash)/i);'''

assert old_core_deplete in ba_content, "old_core_deplete not found!"
ba_content = ba_content.replace(old_core_deplete, new_core_deplete)
print("7. Replaced core depletion regex and added ability actions successfully!")

# 8. Export new functions in BattleArena
old_exports = '''    hasCantBeBlocked,
    getBlockSacrificeRequirement,'''

new_exports = '''    checkCardUsageRestriction,
    isAdventTimingValid,
    canPerformAdvent,
    hasCantBeBlocked,
    getBlockSacrificeRequirement,'''

assert old_exports in ba_content, "old_exports not found!"
ba_content = ba_content.replace(old_exports, new_exports)
print("8. Exported checkCardUsageRestriction, isAdventTimingValid, canPerformAdvent successfully!")

with open(battle_arena_path, 'w', encoding='utf-8') as f:
    f.write(ba_content)

print("\n🎉 ALL BATTLE ARENA UPDATES APPLIED SUCCESSFULLY!")
