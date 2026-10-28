import re

# Read battle_arena.js
with open('battle_arena.js', 'r', encoding='utf-8') as f:
    arena_code = f.read()

# 1. Advent Engine Code
advent_engine = '''
  // ── ADVENT (煌臨 / TWINKLE) MECHANICS ENGINE ──
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
        // Family or trait name
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
    }

    if (eligible.length === 1) {
      // Auto-target single eligible spirit
      executeAdvent(card, eligible[0], 'player');
      return;
    }

    pendingAdvent = { card, req, eligible };
    const modalEl = document.getElementById('battleAdventModal');
    if (!modalEl) {
      executeAdvent(card, eligible[0], 'player');
      return;
    }

    const titleEl = document.getElementById('adventModalTitle');
    if (titleEl) titleEl.textContent = `Flash - [Advent]: ${card.name}`;

    const descEl = document.getElementById('adventModalDesc');
    if (descEl) {
      descEl.innerHTML = `Stack <strong>${card.name}</strong> onto an eligible Spirit matching [<strong>${req.condText}</strong>]. Your <strong>[Soul Core]</strong> will ignite and be sent to the Trash!`;
    }

    const choicesEl = document.getElementById('adventSpiritChoices');
    if (choicesEl) {
      choicesEl.innerHTML = eligible.map(s => `
        <div class="tribute-choice-card" onclick="BattleArena.selectAdventTarget('${s.uid}')" style="border-color:#a855f7; background:rgba(147,51,234,0.12);">
          <div class="tcc-info">
            <span class="tcc-name" style="color:#e9d5ff;">🌟 ${s.name}</span>
            <span class="tcc-meta">Cost ${s.cost} • ${s.currentCores} Core(s) (${s.currentBp} BP, Lv${s.currentLevel}) • ${s.family || 'Spirit'}</span>
          </div>
          <button class="tcc-btn" style="background:linear-gradient(135deg, #7e22ce, #9333ea); border-color:#c084fc;">🌟 Stack [Advent]</button>
        </div>
      `).join('');
    }

    modalEl.classList.add('active');
  }

  function selectAdventTarget(spiritUid) {
    if (!pendingAdvent) return;
    const { card, eligible } = pendingAdvent;
    const chosen = eligible.find(s => s.uid === spiritUid);
    if (!chosen) return;
    closeAdventModal();
    executeAdvent(card, chosen, 'player');
  }

  function closeAdventModal() {
    pendingAdvent = null;
    const modalEl = document.getElementById('battleAdventModal');
    if (modalEl) modalEl.classList.remove('active');
  }

  function cancelAdvent() {
    closeAdventModal();
    if (typeof showToast === 'function') showToast('Advent cancelled.', 'info');
  }

  function executeAdvent(adventCard, targetSpirit, side = 'player') {
    const isPlayer = side === 'player';
    const st = DuelState[side];

    // 1. Remove adventCard from Hand
    const hIdx = st.hand.findIndex(c => c.uid === adventCard.uid);
    if (hIdx !== -1) st.hand.splice(hIdx, 1);

    // 2. Send Soul Core to Trash as the Advent summoning cost
    if (targetSpirit.hasSoulCore) {
      targetSpirit.hasSoulCore = false;
      targetSpirit.currentCores = Math.max(1, targetSpirit.currentCores - 1);
    } else if (st.soulCoreLocation === 'reserve') {
      st.reserve = Math.max(0, st.reserve - 1);
    } else {
      const holder = st.field.find(s => s.hasSoulCore);
      if (holder) {
        holder.hasSoulCore = false;
        holder.currentCores = Math.max(1, holder.currentCores - 1);
      }
    }
    st.soulCoreLocation = 'trash';
    st.trashCores = (st.trashCores || 0) + 1;

    // 3. Stack adventCard onto targetSpirit (preserve underlying card history & cores)
    const prevName = targetSpirit.name;
    targetSpirit.underlyingCards = (targetSpirit.underlyingCards || []).concat([{
      name: targetSpirit.name,
      cost: targetSpirit.cost,
      levels: targetSpirit.levels,
      effect: targetSpirit.effect,
      image_url: targetSpirit.image_url
    }]);

    targetSpirit.name = adventCard.name;
    targetSpirit.cost = adventCard.cost;
    targetSpirit.color = adventCard.color;
    targetSpirit.family = adventCard.family;
    targetSpirit.symbol = adventCard.symbol;
    targetSpirit.levels = adventCard.levels;
    targetSpirit.effect = adventCard.effect;
    targetSpirit.image_url = adventCard.image_url || '';
    targetSpirit.image_filename = adventCard.image_filename || '';
    targetSpirit.isAdvent = true;
    targetSpirit.currentCores = Math.max(1, targetSpirit.currentCores || 1);

    // Recalculate BP & Level
    const { level: newLvl, bp: newBp } = calculateBpAndLevel(targetSpirit.levels, targetSpirit.currentCores, false, targetSpirit.effect);
    targetSpirit.currentLevel = newLvl;
    targetSpirit.currentBp = newBp;

    // 4. Audio & Visuals
    AudioFX.soulCoreIgnite();
    AudioFX.summon();

    addLog(`🌟 **[ADVENT / 煌臨 ACCOMPLISHED!]**: ${isPlayer ? 'You' : 'Opponent'} sent [Soul Core] to Trash! Stacked "${adventCard.name}" onto "${prevName}" (elevated to Lv${newLvl}, ${newBp} BP)!`, 'magic');
    if (typeof showToast === 'function') {
      showToast(`🌟 [Advent]: "${adventCard.name}" stacked onto ${prevName}!`, 'success');
    }

    renderDuelTable();
    if (isPlayer) renderPlayerHand();

    // 5. Trigger (When Advents) / [Twinkle ...] effects
    executeWhenAdventsEffects(targetSpirit, side);

    // 6. Also trigger any general (When Summoned) effects
    executeWhenSummonedEffects(targetSpirit, side);

    // 7. Check opponent Burst: [Burst: After an opposing Spirit's (When Summoned/Advents) effect resolves]
    const enemySide = isPlayer ? 'opponent' : 'player';
    checkBurstTrigger(enemySide, 'AFTER_OPPONENT_SUMMON_EFFECT', { spirit: targetSpirit, isAdvent: true });
  }

  function executeWhenAdventsEffects(spirit, side = 'player') {
    if (!spirit || !spirit.effect) return;
    const effLower = spirit.effect.toLowerCase();
    const isPlayer = side === 'player';
    const myTrash = isPlayer ? DuelState.player.trash : DuelState.opponent.trash;
    const myField = isPlayer ? DuelState.player.field : DuelState.opponent.field;
    const myReserve = isPlayer ? DuelState.player : DuelState.opponent;

    // 1. THE MAKAI PHANTOM DRAGON SIEGFRIED-NECRO: [Twinkle Necromancy] (When Advents)
    // "You can summon Cost 0/1/3/6/9 Spirit cards, one of each, from your Trash, without paying the cost."
    if (effLower.includes('twinkle necromancy') || (effLower.includes('when advents') && /cost\s*(?:0\/1\/3\/6\/9|[\d\/]+)\s*spirit\s*cards/i.test(effLower))) {
      const allowedCosts = [0, 1, 3, 6, 9];
      const reanimated = [];

      for (const targetCost of allowedCosts) {
        const tIdx = myTrash.findIndex(c => (c.type === 'Spirit' || !c.type) && (c.cost === targetCost));
        if (tIdx !== -1) {
          const card = myTrash.splice(tIdx, 1)[0];
          const spiritInstance = {
            ...card,
            uid: generateUniqueId('spirit'),
            currentCores: 1,
            hasSoulCore: false,
            isExhausted: false,
            hasAttacked: false,
            battleBp: 0
          };
          // Try to allocate 1 core from reserve to field to sustain it
          if (myReserve.reserve > 0) {
            myReserve.reserve -= 1;
          }
          const { level, bp } = calculateBpAndLevel(spiritInstance.levels, spiritInstance.currentCores, false, spiritInstance.effect);
          spiritInstance.currentLevel = level;
          spiritInstance.currentBp = bp;
          myField.push(spiritInstance);
          reanimated.push(`${spiritInstance.name} (Cost ${targetCost})`);
          executeWhenSummonedEffects(spiritInstance, side);
        }
      }

      if (reanimated.length > 0) {
        AudioFX.summon();
        addLog(`💀 **[TWINKLE NECROMANCY: ${spirit.name}]**: Reanimated ${reanimated.length} Spirit(s) from Trash onto the battlefield: ${reanimated.join(', ')}!`, 'magic');
        if (typeof showToast === 'function') {
          showToast(`💀 [Twinkle Necromancy]: Reanimated ${reanimated.length} Spirits from Trash!`, 'success');
        }
        renderDuelTable();
      } else {
        addLog(`ℹ️ **[TWINKLE NECROMANCY: ${spirit.name}]**: No Cost 0/1/3/6/9 Spirits found in Trash to reanimate.`, 'step');
      }
    }
  }

  // Helper to test if spirit has unblockable status
  function hasCantBeBlocked(spirit) {
    if (!spirit) return false;
    if (spirit.cantBeBlocked) return true;
    if (!spirit.effect) return false;
    return /this spirit can't be blocked|this spirit cannot be blocked|ブロックされない/i.test(spirit.effect);
  }

  // Block Restriction: Siegfried-Necro [LV2][LV3]
  // "When your Ancient Dragon / Astral Dragon / Ogre Wizard attacks, opponent can't block unless they destroy one of their Spirits"
  function getBlockSacrificeRequirement(attacker, attackingSide) {
    if (!attacker) return null;
    const attackField = attackingSide === 'player' ? DuelState.player.field : DuelState.opponent.field;
    for (const s of attackField) {
      if (!s.effect) continue;
      const effLower = s.effect.toLowerCase();
      if (!effLower.includes("can't block unless they destroy one of their spirits") &&
          !effLower.includes("cannot block unless they destroy one of their spirits") &&
          !effLower.includes("ブロックするには、自分のスピリット1体を破壊")) {
        continue;
      }
      // Check level requirement (e.g. LV2+)
      const blocks = getCardAbilityBlocks(s.effect);
      const reqBlock = blocks.find(b => /can't block unless|cannot block unless/i.test(b));
      if (reqBlock) {
        const lvlMatch = reqBlock.match(/^((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+)/i);
        if (lvlMatch && !isEffectLevelMet(lvlMatch[1], s.currentLevel)) {
          continue;
        }
      }
      // Check attacker family/condition
      const famStr = ((attacker.family || '') + ' ' + (attacker.families ? attacker.families.join(' ') : '') + ' ' + attacker.name).toLowerCase();
      const mFam = s.effect.match(/When your\s+((?:["'][^"']+["']\/?)+)\s+family/i);
      if (mFam) {
        const rawFams = mFam[1].replace(/["']/g, '').split('/').map(f => f.trim().toLowerCase());
        const matchesFam = rawFams.some(f => famStr.includes(f));
        if (!matchesFam) continue;
      }
      return {
        sourceSpirit: s,
        ruleText: `The opponent can't block unless they destroy one of their Spirits.`
      };
    }
    return null;
  }
'''

print("Prepared Advent Engine code.")
