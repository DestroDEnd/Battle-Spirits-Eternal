import re, sys

sys.stdout.reconfigure(encoding='utf-8')
print("=== Starting Phase 2: Updating battle_arena.js and app.js ===")

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    arena = f.read()

# -------------------------------------------------------------
# 1. Update formatEffectKeywords in battle_arena.js
# -------------------------------------------------------------
old_fmt_kw_marker = 'function formatEffectKeywords(text) {'
idx_fmt_kw = arena.find(old_fmt_kw_marker)
if idx_fmt_kw == -1:
    print("ERROR: formatEffectKeywords not found in battle_arena.js")
    sys.exit(1)

# Find the end of formatEffectKeywords
end_fmt_kw = arena.find('\n  }\n', idx_fmt_kw)
if end_fmt_kw == -1:
    print("ERROR: End of formatEffectKeywords not found")
    sys.exit(1)
end_fmt_kw += len('\n  }\n')

new_fmt_kw = '''function formatEffectKeywords(text) {
    if (!text) return '<span style="color:var(--muted);font-style:italic;">No special abilities or keywords.</span>';
    let safe = (window.esc ? window.esc(text) : String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;'));

    // 1. Highlight Level tags like [LV1], [LV2][LV3], LV1-LV3
    safe = safe.replace(/\\[(LV\\d+(?:[-~]LV\\d+)*)\\]/gi, '<span class="effect-keyword-pill kw-level">[$1]</span>');

    // 2. Highlight Timing and Step triggers like (When Attacks), (When Summoned), (When Advents), etc.
    safe = safe.replace(/\\((When Attacks(?:\\/[^)]+)?|When Summoned(?:\\/[^)]+)?|When Advents(?:\\/[^)]+)?|When Destroyed|When Blocks|Twinkle Necromancy|Your Attack Step|Opponent\'s Attack Step|Either Attack Step|Main Step|Refresh Step|Start Step|Core Step|Draw Step|End Step)\\)/gi, (match) => {
      return `<span class="effect-keyword-pill kw-timing">${match}</span>`;
    });

    // 3. Highlight Flash - [Advent: ...]
    safe = safe.replace(/Flash\\s*-\\s*\\[Advent:\\s*([^\\]]+)\\]/gi, (match) => {
      return `<span class="effect-keyword-pill kw-advent">${match}</span>`;
    });

    // 4. Highlight all 102 Official Battle Spirits Wiki Keywords + bracketed effects
    const allKwPattern = /\\[(A\\.T\\.\\s*Field|Accel|Advent(?::[^\\]]+)?|Amplify|Appeal|Armed Intervention|Armor(?::[^\\]]+)?|Assault(?::\\s*\\d+)?|Assemble|Awaken|Barrage|Bombardment|Brilliance|Buddy|Bunshin|Burst(?::[^\\]]+)?|Bushido|Cast Off|Catalyze|Change|Charge|Clash|Clock Up|Consecutive Blade|Contract Armor|Contract Awaken|Contract Unleash|Core Charge|Count Break|Crush|Curse|Dispersion|Diva Rush|Double Drive|Draw Lock|Emperor Road|Fast Draw|Fierce Windstorm|Flashing Swift|Fortress|Friend|God Strike|Grand Assault|Grand Field|Grand Ice Wall|Grand Skill|Grandphosis|Great Assault|Great Crush|Heavenly Light|Heavy Armor(?::[^\\]]+)?|High Speed|Holy Life|Ice Wall(?::[^\\]]+)?|Immortality(?::[^\\]]+)?|Infinite Blade|Infinite Flame|Kagemusha|Leap|Level Up|Manifest|Mirage(?::[^\\]]+)?|My Unit|NT-D|On Stage|Plunder|Poison Blade|PS Armor|Pursuit|Rebirth|Reload|Resonance|Revive|Rush|Seal|Shamanism|Show Up|Six Heaven Rush|Soar|Solo Part|Soul Awaken|Soul Drive|Soul Magic|Sound Speed|Spellbind|Spirit Soul|Stampede|Super Boost|Super Unleash|Supreme Clash|Tribute(?::[^\\]]+)?|Trigger Counter|True-Awaken|True-Clash|True-Curse|Twinkle(?::[^\\]]+)?|Ultra Armor(?::[^\\]]+)?|Ultra Holy Life|Unleash|Unsheathe|Windstorm(?::\\s*\\d+)?|Zero Counter|Soul Core(?::[^\\]]+)?|Flash|Twinkle Necromancy)\\]/gi;

    safe = safe.replace(allKwPattern, (match) => {
      let cls = 'kw-generic';
      const low = match.toLowerCase();
      if (low.includes('advent') || low.includes('twinkle')) cls = 'kw-advent';
      else if (low.includes('clash')) cls = 'kw-clash';
      else if (low.includes('curse')) cls = 'kw-curse';
      else if (low.includes('crush')) cls = 'kw-crush';
      else if (low.includes('holy life') || low.includes('heavenly light')) cls = 'kw-holylife';
      else if (low.includes('windstorm') || low.includes('whirlwind')) cls = 'kw-windstorm';
      else if (low.includes('assault')) cls = 'kw-assault';
      else if (low.includes('high speed') || low.includes('swift') || low.includes('sound speed')) cls = 'kw-highspeed';
      else if (low.includes('awaken')) cls = 'kw-awaken';
      else if (low.includes('immortality') || low.includes('revive')) cls = 'kw-immortality';
      else if (low.includes('soul drive')) cls = 'kw-souldrive';
      else if (low.includes('soul core')) cls = 'kw-soul-core';
      else if (low.includes('ice wall')) cls = 'kw-icewall';
      else if (low.includes('armor') || low.includes('field')) cls = 'kw-armor';
      else if (low.includes('burst')) cls = 'kw-burst';
      else if (low.includes('flash')) cls = 'kw-flash';
      else if (low.includes('tribute')) cls = 'kw-tribute';
      else if (low.includes('consecutive blade')) cls = 'kw-consecutive';
      else if (low.includes('mirage')) cls = 'kw-mirage';
      else if (low.includes('spellbind')) cls = 'kw-spellbind';
      else if (low.includes('accel')) cls = 'kw-accel';
      else if (low.includes('change')) cls = 'kw-change';
      else if (low.includes('charge')) cls = 'kw-charge';
      else if (low.includes('rush')) cls = 'kw-rush';
      else if (low.includes('rebirth')) cls = 'kw-rebirth';
      else if (low.includes('unleash')) cls = 'kw-unleash';
      else if (low.includes('grand')) cls = 'kw-grand';
      return `<span class="effect-keyword-pill ${cls}">${match}</span>`;
    });
    return safe;
  }
'''

arena = arena[:idx_fmt_kw] + new_fmt_kw + arena[end_fmt_kw:]
print("✓ Updated formatEffectKeywords in battle_arena.js")

# -------------------------------------------------------------
# 2. Insert Advent Engine Code right above Tribute Engine
# -------------------------------------------------------------
tribute_marker = '  // ── TRIBUTE (供物) MECHANICS ENGINE ──'
idx_trib = arena.find(tribute_marker)
if idx_trib == -1:
    print("ERROR: Tribute marker not found in battle_arena.js")
    sys.exit(1)

advent_engine_code = '''  // ── ADVENT (煌臨 / TWINKLE) MECHANICS ENGINE ──
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
    }

    if (eligible.length === 1) {
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
        <div class="tribute-choice-card" onclick="BattleArena.selectAdventTarget('${s.uid}')" style="border-color:#a855f7; background:rgba(147,51,234,0.12); margin-bottom:0.5rem; padding:0.6rem; border-radius:0.5rem; display:flex; justify-content:space-between; align-items:center; cursor:pointer;">
          <div class="tcc-info">
            <span class="tcc-name" style="color:#e9d5ff; font-weight:800;">🌟 ${s.name}</span>
            <div class="tcc-meta" style="font-size:0.75rem; color:#cbd5e1;">Cost ${s.cost} • ${s.currentCores} Core(s) (${s.currentBp} BP, Lv${s.currentLevel}) • ${s.family || 'Spirit'}</div>
          </div>
          <button class="tcc-btn" style="background:linear-gradient(135deg, #7e22ce, #9333ea); border:1px solid #c084fc; color:#fff; padding:0.35rem 0.75rem; border-radius:0.4rem; font-weight:800; cursor:pointer;">🌟 Stack [Advent]</button>
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
    if (effLower.includes('twinkle necromancy') || (effLower.includes('when advents') && /cost\\s*(?:0\\/1\\/3\\/6\\/9|[\\d\\/]+)\\s*spirit\\s*cards/i.test(effLower))) {
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
      const mFam = s.effect.match(/When your\\s+((?:["'][^"']+["']\\/?)+)\\s+family/i);
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

arena = arena[:idx_trib] + advent_engine_code + arena[idx_trib:]
print("✓ Inserted Advent Engine before Tribute Engine")

# -------------------------------------------------------------
# 3. Expand executeWhenSummonedEffects in battle_arena.js
# -------------------------------------------------------------
# Let's inspect where executeWhenSummonedEffects ends and add our expanded effects
old_summon_marker = 'function executeWhenSummonedEffects(spirit, side = \'player\') {'
idx_summon = arena.find(old_summon_marker)
if idx_summon == -1:
    print("ERROR: executeWhenSummonedEffects not found in battle_arena.js")
    sys.exit(1)

# Find the end of executeWhenSummonedEffects
end_summon = arena.find('\n  }\n', idx_summon)
if end_summon == -1:
    print("ERROR: End of executeWhenSummonedEffects not found")
    sys.exit(1)
end_summon += len('\n  }\n')

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
        addLog(`🃏 **[WHEN SUMMONED: ${spirit.name}]**: ${isPlayer ? 'You' : 'Opponent'} drew ${drawn} card(s) from deck into Hand!`, 'step');
        if (typeof showToast === 'function') {
          showToast(`🃏 Drew ${drawn} card(s)!`, 'info');
        }
      }
    }
    // 5. OPPONENT SACRIFICIAL DESTRUCTION: "The opponent destroys a Spirit/Ultimate they control" (e.g. The MakaiKnight Pandegaiz)
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
    // 6. CORE REMOVAL TO RESERVE OR TRASH (e.g. The MakaiSwordDeityDoll †Enchante†)
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
    // 7. Destroy Opposing Spirit by Cost or Unconditional
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
    // 8. Destroy Opposing Spirit by BP
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
  }
'''

arena = arena[:idx_summon] + new_summon_effects + arena[end_summon:]
print("✓ Expanded executeWhenSummonedEffects in battle_arena.js")

# -------------------------------------------------------------
# 4. Expand executeWhenAttacksEffects in battle_arena.js
# -------------------------------------------------------------
old_attacks_marker = 'function executeWhenAttacksEffects(attacker, side = \'player\') {'
idx_att_eff = arena.find(old_attacks_marker)
if idx_att_eff == -1:
    print("ERROR: executeWhenAttacksEffects not found in battle_arena.js")
    sys.exit(1)

end_att_eff = arena.find('\n  }\n', idx_att_eff)
if end_att_eff == -1:
    print("ERROR: End of executeWhenAttacksEffects not found")
    sys.exit(1)
end_att_eff += len('\n  }\n')

new_att_effects = '''function executeWhenAttacksEffects(attacker, side = 'player') {
    if (!attacker || !attacker.effect) return;
    const isPlayer = side === 'player';
    const enemyField = isPlayer ? DuelState.opponent.field : DuelState.player.field;
    const enemySide = isPlayer ? 'opponent' : 'player';
    const enemyReserve = isPlayer ? DuelState.opponent : DuelState.player;
    const myField = isPlayer ? DuelState.player.field : DuelState.opponent.field;
    const myTrash = isPlayer ? DuelState.player.trash : DuelState.opponent.trash;
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
          uid: generateUniqueId('spirit'),
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

    // Draw on Attack
    if (/draw\\s+(a|an|one|two|three|\\d+)\\s+cards?/i.test(bodyLower)) {
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
  }
'''

arena = arena[:idx_att_eff] + new_att_effects + arena[end_att_eff:]
print("✓ Expanded executeWhenAttacksEffects in battle_arena.js")

# -------------------------------------------------------------
# 5. Update executePlayerAttack for Unblockable & Block Sacrifice
# -------------------------------------------------------------
old_exec_att_marker = 'function executePlayerAttack(attacker) {'
idx_exec_att = arena.find(old_exec_att_marker)
if idx_exec_att == -1:
    print("ERROR: executePlayerAttack not found")
    sys.exit(1)

# Find where AI chooses to block in executePlayerAttack
idx_ai_block_choice = arena.find('// AI chooses to Block or take Life Damage', idx_exec_att)
if idx_ai_block_choice == -1:
    print("ERROR: AI block choice section not found in executePlayerAttack")
    sys.exit(1)

idx_block_declared = arena.find('if (chosenBlocker) {', idx_ai_block_choice)
if idx_block_declared == -1:
    print("ERROR: chosenBlocker check not found in executePlayerAttack")
    sys.exit(1)

new_ai_block_resolution = '''// AI chooses to Block or take Life Damage
    const isClash = hasClash(attacker);
    const readyBlockers = DuelState.opponent.field.filter(s => !s.isExhausted);
    let chosenBlocker = null;

    // Check Unblockable status
    if (hasCantBeBlocked(attacker)) {
      addLog(`⚡ **[UNBLOCKABLE ATTACK: ${attacker.name}]**: This Spirit cannot be blocked! Interception blocked!`, 'damage');
    } else {
      if (isClash && readyBlockers.length > 0) {
        addLog(`⚔️ **[CLASH ACTIVATED]**: "${attacker.name}" forces opposing defense to intercept!`, 'damage');
        readyBlockers.sort((a, b) => b.currentBp - a.currentBp);
        chosenBlocker = readyBlockers[0];
      } else {
        const winBlocker = readyBlockers.find(s => s.currentBp > battleBp);
        if (winBlocker) {
          chosenBlocker = winBlocker;
        } else if (DuelState.opponent.life <= 1 && readyBlockers.length) {
          readyBlockers.sort((a, b) => a.currentBp - b.currentBp);
          chosenBlocker = readyBlockers[0];
        } else if (readyBlockers.length && Math.random() < 0.4) {
          chosenBlocker = readyBlockers[0];
        }
      }

      // Check Siegfried-Necro block sacrifice restriction:
      // "When your Ancient Dragon / Astral Dragon / Ogre Wizard attacks, opponent can't block unless they destroy one of their Spirits"
      const blockSacrificeReq = getBlockSacrificeRequirement(attacker, 'player');
      if (blockSacrificeReq && chosenBlocker) {
        // Opponent MUST destroy another Spirit they control to block!
        const otherSpirits = DuelState.opponent.field.filter(s => s.uid !== chosenBlocker.uid);
        if (otherSpirits.length > 0) {
          // AI sacrifices its lowest-BP other spirit
          otherSpirits.sort((a, b) => (a.currentBp || 0) - (b.currentBp || 0));
          const sacrificed = otherSpirits[0];
          const sIdx = DuelState.opponent.field.findIndex(s => s.uid === sacrificed.uid);
          if (sIdx !== -1) {
            DuelState.opponent.field.splice(sIdx, 1);
            DuelState.opponent.reserve += sacrificed.currentCores;
            handleDestroyedSpiritCores(sacrificed, 'opponent');
            sendToTrash(sacrificed, 'opponent', `Sacrificed to block under ${blockSacrificeReq.sourceSpirit.name}`);
            AudioFX.slash();
            addLog(`⚡ **[BLOCK SACRIFICE: ${blockSacrificeReq.sourceSpirit.name}]**: Opponent sacrificed and destroyed their own "${sacrificed.name}" (${sacrificed.currentBp} BP) in order to block with "${chosenBlocker.name}"!`, 'damage');
            if (typeof showToast === 'function') {
              showToast(`⚡ Opponent sacrificed "${sacrificed.name}" to declare block!`, 'info');
            }
          }
        } else {
          // Opponent has NO OTHER spirits to sacrifice! Block is ILLEGAL!
          addLog(`⚡ **[BLOCK RESTRICTION: ${blockSacrificeReq.sourceSpirit.name}]**: Opponent controls no other Spirit to sacrifice! Block denied; attack strikes Opponent Life directly!`, 'damage');
          chosenBlocker = null;
        }
      }
    }

    '''

arena = arena[:idx_ai_block_choice] + new_ai_block_resolution + arena[idx_block_declared:]
print("✓ Updated executePlayerAttack with block sacrifice and unblockable checks")

# -------------------------------------------------------------
# 6. Update showBlockPrompt & chooseBlocker for Block Sacrifice
# -------------------------------------------------------------
idx_show_block = arena.find('function showBlockPrompt(attacker, readyBlockers) {')
if idx_show_block == -1:
    print("ERROR: showBlockPrompt not found")
    sys.exit(1)

# Check Unblockable in showBlockPrompt
idx_modal_el = arena.find('const isClash = hasClash(attacker);', idx_show_block)
if idx_modal_el != -1:
    unblockable_check = '''const isUnblockable = hasCantBeBlocked(attacker);
    const blockSacrificeReq = getBlockSacrificeRequirement(attacker, 'opponent');
    '''
    arena = arena[:idx_modal_el] + unblockable_check + arena[idx_modal_el:]

# Update blocker choices HTML in showBlockPrompt
idx_blocker_html = arena.find('let blockerHtml = readyBlockers.map(s => `', idx_show_block)
if idx_blocker_html != -1:
    end_blocker_map = arena.find('`).join(\'\');', idx_blocker_html)
    if end_blocker_map != -1:
        end_blocker_map += len('`).join(\'\');')
        new_blocker_html_gen = '''let blockerHtml = '';
    if (isUnblockable) {
      blockerHtml = `
        <div style="padding:0.75rem; background:rgba(239,68,68,0.18); border:1px solid #ef4444; border-radius:0.5rem; color:#fca5a5; font-size:0.82rem; font-weight:800; text-align:center; margin-bottom:0.75rem;">
          ⚡ [UNBLOCKABLE ATTACK]: "${attacker.name}" cannot be intercepted! You must take Life damage.
        </div>
      `;
    } else if (blockSacrificeReq && DuelState.player.field.length < 2) {
      blockerHtml = `
        <div style="padding:0.75rem; background:rgba(168,85,247,0.18); border:1px solid #a855f7; border-radius:0.5rem; color:#e9d5ff; font-size:0.82rem; font-weight:800; text-align:center; margin-bottom:0.75rem;">
          ⚠️ [BLOCK RESTRICTION]: ${blockSacrificeReq.sourceSpirit.name} requires you to destroy 1 of your Spirits to block! You have no other Spirit to sacrifice.
        </div>
      `;
    } else {
      let sacrificeNotice = '';
      if (blockSacrificeReq) {
        sacrificeNotice = `
          <div style="padding:0.6rem; background:rgba(168,85,247,0.15); border:1px solid #a855f7; border-radius:0.5rem; color:#e9d5ff; font-size:0.78rem; font-weight:800; margin-bottom:0.6rem;">
            ⚠️ [BLOCK SACRIFICE REQUIREMENT]: ${blockSacrificeReq.sourceSpirit.name} requires destroying one of your Spirits! Blocking will sacrifice your lowest-cost allied Spirit.
          </div>
        `;
      }
      blockerHtml = sacrificeNotice + readyBlockers.map(s => `
        <div class="blocker-choice-card" onclick="BattleArena.chooseBlocker('${s.uid}', '${attacker.uid}')">
          <div class="bc-name">${s.name}</div>
          <div class="bc-bp">${s.currentBp} BP (Lv${s.currentLevel})</div>
          <button class="btn-block-action">🛡️ Block With This Spirit</button>
        </div>
      `).join('');
    }'''
        arena = arena[:idx_blocker_html] + new_blocker_html_gen + arena[end_blocker_map:]
        print("✓ Updated blockerHtml in showBlockPrompt")

# Update chooseBlocker for player sacrifice
idx_choose_blocker = arena.find('function chooseBlocker(blockerUid, attackerUid) {')
if idx_choose_blocker != -1:
    idx_shield_sound = arena.find('AudioFX.shield();', idx_choose_blocker)
    if idx_shield_sound != -1:
        sacrifice_in_block = '''// Check Siegfried-Necro block sacrifice
    const blockSacrificeReq = getBlockSacrificeRequirement(attacker, 'opponent');
    if (blockSacrificeReq) {
      const otherAllies = DuelState.player.field.filter(s => s.uid !== blocker.uid);
      if (otherAllies.length > 0) {
        otherAllies.sort((a, b) => (a.cost || 0) - (b.cost || 0));
        const sacrificed = otherAllies[0];
        const sIdx = DuelState.player.field.findIndex(s => s.uid === sacrificed.uid);
        if (sIdx !== -1) {
          DuelState.player.field.splice(sIdx, 1);
          DuelState.player.reserve += sacrificed.currentCores;
          handleDestroyedSpiritCores(sacrificed, 'player');
          sendToTrash(sacrificed, 'player', `Sacrificed to block under ${blockSacrificeReq.sourceSpirit.name}`);
          addLog(`⚡ **[BLOCK SACRIFICE: ${blockSacrificeReq.sourceSpirit.name}]**: You sacrificed your own "${sacrificed.name}" to declare a block!`, 'damage');
        }
      }
    }
    '''
        arena = arena[:idx_shield_sound] + sacrifice_in_block + arena[idx_shield_sound:]
        print("✓ Updated chooseBlocker with player sacrifice handling")

# -------------------------------------------------------------
# 7. Update renderPlayerHand for Advent Action Button
# -------------------------------------------------------------
idx_render_hand = arena.find('function renderPlayerHand() {')
if idx_render_hand != -1:
    idx_burst_btn = arena.find('const burstBtnHtml = canSetBurst', idx_render_hand)
    if idx_burst_btn != -1:
        advent_btn_hand = '''// Advent Action Button
      const adventReq = getCardAdventRequirement(card);
      const canAdvent = adventReq && (DuelState.player.soulCoreLocation !== 'trash') && (getEligibleAdventTargets(adventReq, DuelState.player.field).length > 0) && (isMainStep || isAttackStep);
      const adventBtnHtml = canAdvent ? `<button class="btn-quick-advent" onclick="event.stopPropagation(); BattleArena.openAdventPrompt('${card.uid}')">🌟 [Advent]</button>` : '';

      '''
        arena = arena[:idx_burst_btn] + advent_btn_hand + arena[idx_burst_btn:]

        # Prepend adventBtnHtml to action buttons
        idx_ret_hand_html = arena.find('return `', idx_render_hand)
        if idx_ret_hand_html != -1:
            idx_btn_container = arena.find('${burstBtnHtml}', idx_ret_hand_html)
            if idx_btn_container != -1:
                arena = arena[:idx_btn_container] + '${adventBtnHtml}' + arena[idx_btn_container:]
                print("✓ Added Advent button to renderPlayerHand")

# -------------------------------------------------------------
# 8. Export new functions on window.BattleArena
# -------------------------------------------------------------
idx_ba_export = arena.rfind('window.BattleArena = {')
if idx_ba_export != -1:
    idx_export_end = arena.find('};', idx_ba_export)
    if idx_export_end != -1:
        new_exports = ''',
    openAdventPrompt,
    selectAdventTarget,
    cancelAdvent,
    getCardAdventRequirement,
    getEligibleAdventTargets,
    executeAdvent,
    executeWhenAdventsEffects,
    hasCantBeBlocked,
    getBlockSacrificeRequirement
'''
        arena = arena[:idx_export_end] + new_exports + arena[idx_export_end:]
        print("✓ Exported Advent & Block Restriction functions on window.BattleArena")

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(arena)
print("✓ Successfully saved updated battle_arena.js")

# -------------------------------------------------------------
# 9. Update formatEffectKeywordsInModal in app.js
# -------------------------------------------------------------
with open('app.js', 'r', encoding='utf-8') as f:
    app_code = f.read()

idx_app_fmt = app_code.find('function formatEffectKeywordsInModal(text) {')
if idx_app_fmt != -1:
    end_app_fmt = app_code.find('\n}\n', idx_app_fmt)
    if end_app_fmt != -1:
        end_app_fmt += len('\n}\n')
        new_app_fmt = '''function formatEffectKeywordsInModal(text) {
  if (!text) return '<span style="color:var(--muted);font-style:italic;">No special effects or abilities.</span>';
  let safe = esc(text);

  // 1. Highlight Level tags like [LV1], [LV2][LV3]
  safe = safe.replace(/\\[(LV\\d+(?:[-~]LV\\d+)*)\\]/gi, '<span class="effect-keyword-pill kw-level">[$1]</span>');

  // 2. Highlight Timing and Step triggers
  safe = safe.replace(/\\((When Attacks(?:\\/[^)]+)?|When Summoned(?:\\/[^)]+)?|When Advents(?:\\/[^)]+)?|When Destroyed|When Blocks|Twinkle Necromancy|Your Attack Step|Opponent\'s Attack Step|Either Attack Step|Main Step|Refresh Step|Start Step|Core Step|Draw Step|End Step)\\)/gi, (match) => {
    return `<span class="effect-keyword-pill kw-timing">${match}</span>`;
  });

  // 3. Highlight Flash - [Advent: ...]
  safe = safe.replace(/Flash\\s*-\\s*\\[Advent:\\s*([^\\]]+)\\]/gi, (match) => {
    return `<span class="effect-keyword-pill kw-advent">${match}</span>`;
  });

  // 4. Highlight all 102 Official Battle Spirits Wiki Keywords
  const allKwPattern = /\\[(A\\.T\\.\\s*Field|Accel|Advent(?::[^\\]]+)?|Amplify|Appeal|Armed Intervention|Armor(?::[^\\]]+)?|Assault(?::\\s*\\d+)?|Assemble|Awaken|Barrage|Bombardment|Brilliance|Buddy|Bunshin|Burst(?::[^\\]]+)?|Bushido|Cast Off|Catalyze|Change|Charge|Clash|Clock Up|Consecutive Blade|Contract Armor|Contract Awaken|Contract Unleash|Core Charge|Count Break|Crush|Curse|Dispersion|Diva Rush|Double Drive|Draw Lock|Emperor Road|Fast Draw|Fierce Windstorm|Flashing Swift|Fortress|Friend|God Strike|Grand Assault|Grand Field|Grand Ice Wall|Grand Skill|Grandphosis|Great Assault|Great Crush|Heavenly Light|Heavy Armor(?::[^\\]]+)?|High Speed|Holy Life|Ice Wall(?::[^\\]]+)?|Immortality(?::[^\\]]+)?|Infinite Blade|Infinite Flame|Kagemusha|Leap|Level Up|Manifest|Mirage(?::[^\\]]+)?|My Unit|NT-D|On Stage|Plunder|Poison Blade|PS Armor|Pursuit|Rebirth|Reload|Resonance|Revive|Rush|Seal|Shamanism|Show Up|Six Heaven Rush|Soar|Solo Part|Soul Awaken|Soul Drive|Soul Magic|Sound Speed|Spellbind|Spirit Soul|Stampede|Super Boost|Super Unleash|Supreme Clash|Tribute(?::[^\\]]+)?|Trigger Counter|True-Awaken|True-Clash|True-Curse|Twinkle(?::[^\\]]+)?|Ultra Armor(?::[^\\]]+)?|Ultra Holy Life|Unleash|Unsheathe|Windstorm(?::\\s*\\d+)?|Zero Counter|Soul Core(?::[^\\]]+)?|Flash|Twinkle Necromancy)\\]/gi;

  safe = safe.replace(allKwPattern, (match) => {
    let cls = 'kw-generic';
    const low = match.toLowerCase();
    if (low.includes('advent') || low.includes('twinkle')) cls = 'kw-advent';
    else if (low.includes('clash')) cls = 'kw-clash';
    else if (low.includes('curse')) cls = 'kw-curse';
    else if (low.includes('crush')) cls = 'kw-crush';
    else if (low.includes('holy life') || low.includes('heavenly light')) cls = 'kw-holylife';
    else if (low.includes('windstorm') || low.includes('whirlwind')) cls = 'kw-windstorm';
    else if (low.includes('assault')) cls = 'kw-assault';
    else if (low.includes('high speed') || low.includes('swift') || low.includes('sound speed')) cls = 'kw-highspeed';
    else if (low.includes('awaken')) cls = 'kw-awaken';
    else if (low.includes('immortality') || low.includes('revive')) cls = 'kw-immortality';
    else if (low.includes('soul drive')) cls = 'kw-souldrive';
    else if (low.includes('soul core')) cls = 'kw-soul-core';
    else if (low.includes('ice wall')) cls = 'kw-icewall';
    else if (low.includes('armor') || low.includes('field')) cls = 'kw-armor';
    else if (low.includes('burst')) cls = 'kw-burst';
    else if (low.includes('flash')) cls = 'kw-flash';
    else if (low.includes('tribute')) cls = 'kw-tribute';
    else if (low.includes('consecutive blade')) cls = 'kw-consecutive';
    else if (low.includes('mirage')) cls = 'kw-mirage';
    else if (low.includes('spellbind')) cls = 'kw-spellbind';
    else if (low.includes('accel')) cls = 'kw-accel';
    else if (low.includes('change')) cls = 'kw-change';
    else if (low.includes('charge')) cls = 'kw-charge';
    else if (low.includes('rush')) cls = 'kw-rush';
    else if (low.includes('rebirth')) cls = 'kw-rebirth';
    else if (low.includes('unleash')) cls = 'kw-unleash';
    else if (low.includes('grand')) cls = 'kw-grand';
    return `<span class="effect-keyword-pill ${cls}">${match}</span>`;
  });
  return safe;
}
'''
        app_code = app_code[:idx_app_fmt] + new_app_fmt + app_code[end_app_fmt:]
        with open('app.js', 'w', encoding='utf-8') as f:
            f.write(app_code)
        print("✓ Updated formatEffectKeywordsInModal in app.js")

print("=== Phase 2 Execution Completed Successfully ===")
