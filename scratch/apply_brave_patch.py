with open('battle_arena.js', 'r', encoding='utf-8') as f:
    content = f.read()

def replace_or_fail(src, old, new, label):
    if old not in src:
        raise ValueError(f"Target not found for: {label}")
    print(f"Applying: {label}")
    return src.replace(old, new, 1)

# 1. recalculateSpiritBp brave bonus
t1 = """    spirit.currentBp = (spirit.baseBp || 0) + (spirit.turnBpBoost || 0);
    if (spirit.battleBpBoost) {
      spirit.battleBp = spirit.currentBp + spirit.battleBpBoost;
    } else {
      delete spirit.battleBp;
    }"""
r1 = """    spirit.currentBp = (spirit.baseBp || 0) + (spirit.turnBpBoost || 0);
    if (spirit.brave && spirit.brave.bpBonus) {
      spirit.currentBp += spirit.brave.bpBonus;
    }
    if (spirit.battleBpBoost) {
      spirit.battleBp = spirit.currentBp + spirit.battleBpBoost;
    } else {
      delete spirit.battleBp;
    }"""
content = replace_or_fail(content, t1, r1, "1. recalculateSpiritBp Brave bonus")

# 2. Add Brave helpers before shuffle
t2 = """  function shuffle(array) {
    const arr = [...array];"""
r2 = """  // ── BRAVE CARD HELPERS & PARSERS ──
  function isBraveCard(card) {
    if (!card) return false;
    return (card.type || '').includes('Brave');
  }

  function parseBraveBonus(levelsStr, effectStr) {
    if (levelsStr && typeof levelsStr === 'string') {
      const m = levelsStr.match(/(?:Brave|Braved)\\s*:\\s*\\d+\\s*cores?,\\s*\\+?(\\d+)\\s*BP/i);
      if (m) return parseInt(m[1], 10);
    }
    if (effectStr && typeof effectStr === 'string') {
      const mEff = effectStr.match(/(?:give|gains?|\\+)\\s*(\\d{3,5})\\s*BP/i) || effectStr.match(/(\\d{3,5})\\s*BP/i);
      if (mEff) return parseInt(mEff[1], 10);
    }
    return 1000;
  }

  function isEligibleBraveHost(braveCard, hostCard) {
    if (!hostCard) return { eligible: false, reason: 'No host selected' };
    if (hostCard.brave) return { eligible: false, reason: 'Spirit already has a Brave' };
    if (braveCard.uid === hostCard.uid) return { eligible: false, reason: 'Cannot combine onto itself' };
    return { eligible: true };
  }

  function shuffle(array) {
    const arr = [...array];"""
content = replace_or_fail(content, t2, r2, "2. Brave helper functions")

# 3. Field spirit render (renderFieldSpirit)
t3 = """    return `
      <div class="${classes}" id="spirit_${spirit.uid}" ${dragAttrs} onclick="BattleArena.handleSpiritClick('${spirit.uid}', '${side}')">
        ${dragHandleHtml}
        ${hasSC ? `<div class="spirit-soul-core-badge" title="Soul Core is placed on this Spirit!">${getHexCoreSvg('soul', 13)} SOUL CORE</div>` : ''}
        <button class="fsc-zoom-btn" onclick="event.stopPropagation(); openCardDetail('${safeSpName}')" title="Inspect Card Details">🔍</button>
        <div class="fsc-header-row">
          <span class="fsc-level-tag">LV${spirit.currentLevel}</span>
          <span class="fsc-bp-tag">${spirit.currentBp} BP</span>
        </div>
        ${coreStepperHtml}
        <div class="fsc-img-wrap">
          <img src="${spirit.image_url}" alt="${spirit.name}" loading="lazy" referrerpolicy="no-referrer" onerror="if(!this.dataset.retried && this.src.startsWith('http')){this.dataset.retried='1'; this.src='/api/proxy-image?url=' + encodeURIComponent(this.src);} else { this.onerror=null; this.src='./assets/card_back.png'; }" />
        </div>
        <div class="fsc-name" title="${spirit.name}">${spirit.name}</div>
        <div class="fsc-status-pill">${spirit.isExhausted ? 'EXHAUSTED' : 'READY'}</div>
        ${soulCoreActionBtn}
        ${reorderButtonsHtml}
      </div>
    `;"""

r3 = """    let braveFieldBadge = '';
    let braveFieldActionBtn = '';
    if (spirit.brave) {
      braveFieldBadge = `<div class="spirit-brave-badge" title="Braved with ${spirit.brave.name} (+${spirit.brave.bpBonus || 1000} BP)">🔗 +${spirit.brave.bpBonus || 1000} BP</div>`;
      if (isPlayer && isMainStep) {
        braveFieldActionBtn = `<button class="fsc-brave-btn debrave" onclick="event.stopPropagation(); BattleArena.separateBrave('${spirit.uid}')" title="Separate Brave into Spirit form">🔄 De-Brave</button>`;
      }
    } else if (spirit.type === 'Brave' || spirit.isBraveCard) {
      braveFieldBadge = `<div class="spirit-brave-mode-badge" title="Brave in Spirit Form">⚔️ BRAVE (Spirit)</div>`;
      if (isPlayer && isMainStep) {
        braveFieldActionBtn = `<button class="fsc-brave-btn brave" onclick="event.stopPropagation(); BattleArena.openBraveCombineModal('${spirit.uid}', 'field')" title="Combine with another Spirit">🔗 Brave</button>`;
      }
    }

    return `
      <div class="${classes}" id="spirit_${spirit.uid}" ${dragAttrs} onclick="BattleArena.handleSpiritClick('${spirit.uid}', '${side}')">
        ${dragHandleHtml}
        ${braveFieldBadge}
        ${hasSC ? `<div class="spirit-soul-core-badge" title="Soul Core is placed on this Spirit!">${getHexCoreSvg('soul', 13)} SOUL CORE</div>` : ''}
        <button class="fsc-zoom-btn" onclick="event.stopPropagation(); openCardDetail('${safeSpName}')" title="Inspect Card Details">🔍</button>
        <div class="fsc-header-row">
          <span class="fsc-level-tag">LV${spirit.currentLevel}</span>
          <span class="fsc-bp-tag">${spirit.currentBp} BP</span>
        </div>
        ${coreStepperHtml}
        <div class="fsc-img-wrap">
          <img src="${spirit.image_url}" alt="${spirit.name}" loading="lazy" referrerpolicy="no-referrer" onerror="if(!this.dataset.retried && this.src.startsWith('http')){this.dataset.retried='1'; this.src='/api/proxy-image?url=' + encodeURIComponent(this.src);} else { this.onerror=null; this.src='./assets/card_back.png'; }" />
        </div>
        <div class="fsc-name" title="${spirit.name}">${spirit.name}</div>
        <div class="fsc-status-pill">${spirit.isExhausted ? 'EXHAUSTED' : 'READY'}</div>
        ${braveFieldActionBtn}
        ${soulCoreActionBtn}
        ${reorderButtonsHtml}
      </div>
    `;"""
content = replace_or_fail(content, t3, r3, "3. renderFieldSpirit Brave badges & buttons")

# 4. renderPlayerHand card types
t4 = """      const isSpirit = card.type === 'Spirit' || (card.type || '').includes('Spirit');
      const isMagic = card.type === 'Magic';
      const isNexus = (card.type || '').includes('Nexus');
      const cost = card.cost || 0;
      const totalNeeded = isSpirit ? cost + 1 : cost;"""

r4 = """      const isBrave = card.type === 'Brave' || (card.type || '').includes('Brave');
      const isSpirit = (card.type === 'Spirit' || (card.type || '').includes('Spirit')) && !isBrave;
      const isMagic = card.type === 'Magic';
      const isNexus = (card.type || '').includes('Nexus');
      const cost = card.cost || 0;
      const totalNeeded = (isSpirit || isBrave) ? cost + 1 : cost;"""
content = replace_or_fail(content, t4, r4, "4. renderPlayerHand card type flags")

# 5. renderPlayerHand actions
t5 = """      if (canPlayStep && isSpirit) {
        const btnLabel = isAttackStep ? '⚡ Flash Summon' : '⚡ Summon';
        if (canAffordDirect) {
          actionBtnHtml = `<button class="btn-quick-summon" onclick="event.stopPropagation(); BattleArena.summonCard('${card.uid}')">${btnLabel}</button>`;
        } else if (needsSacrifice) {
          actionBtnHtml = `<button class="btn-quick-sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('${card.uid}')">💀 Sacrifice &amp; ${isAttackStep ? 'Flash Summon' : 'Summon'} (${cost})</button>`;
        }
      } else if (canPlayStep && isMagic) {
        const btnLabel = isAttackStep ? '✨ Flash Cast' : '✨ Cast';
        if (canAffordDirect) {
          actionBtnHtml = `<button class="btn-quick-magic" onclick="event.stopPropagation(); BattleArena.castMagic('${card.uid}')">${btnLabel} (${cost})</button>`;
        } else if (needsSacrifice) {
          actionBtnHtml = `<button class="btn-quick-sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('${card.uid}')">💀 Sacrifice &amp; ${isAttackStep ? 'Flash Cast' : 'Cast'} (${cost})</button>`;
        }
      } else if (canPlayStep && isNexus && isMainStep) {"""

r5 = """      if (canPlayStep && isBrave && isMainStep) {
        const eligibleHosts = DuelState.player.field.filter(s => !s.brave);
        let braveBtns = '';
        if (canAffordDirect) {
          braveBtns += `<button class="btn-quick-summon" onclick="event.stopPropagation(); BattleArena.summonBraveAsSpirit('${card.uid}')" title="Summon as Spirit (Cost ${cost} + 1 Core)">⚔️ Spirit</button>`;
        } else if (needsSacrifice) {
          braveBtns += `<button class="btn-quick-sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('${card.uid}')">⚡ Sac</button>`;
        }
        if (eligibleHosts.length > 0 && reserve >= cost) {
          braveBtns += `<button class="btn-quick-brave" onclick="event.stopPropagation(); BattleArena.openBraveCombineModal('${card.uid}', 'hand')" title="Combine with field Spirit (Cost ${cost})">🔗 Brave</button>`;
        }
        actionBtnHtml = `<div class="brave-actions-duo">${braveBtns}</div>`;
      } else if (canPlayStep && isSpirit) {
        const btnLabel = isAttackStep ? '⚡ Flash Summon' : '⚡ Summon';
        if (canAffordDirect) {
          actionBtnHtml = `<button class="btn-quick-summon" onclick="event.stopPropagation(); BattleArena.summonCard('${card.uid}')">${btnLabel}</button>`;
        } else if (needsSacrifice) {
          actionBtnHtml = `<button class="btn-quick-sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('${card.uid}')">💀 Sacrifice &amp; ${isAttackStep ? 'Flash Summon' : 'Summon'} (${cost})</button>`;
        }
      } else if (canPlayStep && isMagic) {
        const btnLabel = isAttackStep ? '✨ Flash Cast' : '✨ Cast';
        if (canAffordDirect) {
          actionBtnHtml = `<button class="btn-quick-magic" onclick="event.stopPropagation(); BattleArena.castMagic('${card.uid}')">${btnLabel} (${cost})</button>`;
        } else if (needsSacrifice) {
          actionBtnHtml = `<button class="btn-quick-sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('${card.uid}')">💀 Sacrifice &amp; ${isAttackStep ? 'Flash Cast' : 'Cast'} (${cost})</button>`;
        }
      } else if (canPlayStep && isNexus && isMainStep) {"""
content = replace_or_fail(content, t5, r5, "5. renderPlayerHand Brave buttons")

# 6. Inspector hand card buttons
t6 = """      if (canPlayStep && isSpirit) {
        const btnText = (phase === 'ATTACK') ? `⚡ Flash Summon (${cost})` : `⚡ Summon Spirit (Cost ${cost})`;
        if (canAffordDirect) {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-summon" onclick="BattleArena.summonCard('${card.uid}')">${btnText}</button>`;
        } else if (canAffordWithSacrifice) {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-sac" onclick="BattleArena.openSacrificeModal('${card.uid}')">💀 Sacrifice &amp; Summon (${cost})</button>`;
        } else {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-disabled" disabled>⚠️ Need ${totalNeeded} Cores</button>`;
        }
      } else if (canPlayStep && isMagic) {"""

r6 = """      const isInspectBrave = card.type === 'Brave' || (card.type || '').includes('Brave');
      const isInspectSpirit = (card.type === 'Spirit' || (card.type || '').includes('Spirit')) && !isInspectBrave;
      if (canPlayStep && isInspectBrave) {
        const eligibleHosts = DuelState.player.field.filter(s => !s.brave);
        let bBtns = '';
        if (canAffordDirect) {
          bBtns += `<button class="btn-inspector-action btn-inspect-summon" onclick="BattleArena.summonBraveAsSpirit('${card.uid}')">⚔️ Summon as Spirit (Cost ${cost} + 1 Core)</button>`;
        } else if (canAffordWithSacrifice) {
          bBtns += `<button class="btn-inspector-action btn-inspect-sac" onclick="BattleArena.openSacrificeModal('${card.uid}')">💀 Sacrifice &amp; Summon</button>`;
        } else {
          bBtns += `<button class="btn-inspector-action btn-inspect-disabled" disabled>⚠️ Need ${totalNeeded} Cores</button>`;
        }
        if (eligibleHosts.length > 0 && reserve >= cost) {
          bBtns += `<button class="btn-inspector-action btn-inspect-brave" onclick="BattleArena.openBraveCombineModal('${card.uid}', 'hand')">🔗 Brave onto Spirit (Cost ${cost})</button>`;
        }
        actionBtnHtml = bBtns;
      } else if (canPlayStep && isInspectSpirit) {
        const btnText = (phase === 'ATTACK') ? `⚡ Flash Summon (${cost})` : `⚡ Summon Spirit (Cost ${cost})`;
        if (canAffordDirect) {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-summon" onclick="BattleArena.summonCard('${card.uid}')">${btnText}</button>`;
        } else if (canAffordWithSacrifice) {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-sac" onclick="BattleArena.openSacrificeModal('${card.uid}')">💀 Sacrifice &amp; Summon (${cost})</button>`;
        } else {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-disabled" disabled>⚠️ Need ${totalNeeded} Cores</button>`;
        }
      } else if (canPlayStep && isMagic) {"""
content = replace_or_fail(content, t6, r6, "6. renderCardInspector hand card Brave actions")

# 7. Inspector battlefield spirit actions
t7 = """      // On battlefield spirit
      const isPlayerSpirit = (DuelState.player.field || []).some(s => s.uid === card.uid);
      const isMainStep = isPlayerTurn && phase === 'MAIN';
      let scBtn = '';
      if (isPlayerSpirit && isMainStep) {
        if (card.hasSoulCore) {
          scBtn = `<button class="btn-inspector-action btn-remove-soul-core" onclick="BattleArena.removeSoulCoreFromSpirit('${card.uid}')">🔥 Return Soul Core to Reserve</button>`;
        } else if (DuelState.player.soulCoreLocation === 'reserve') {
          scBtn = `<button class="btn-inspector-action btn-place-soul-core" onclick="BattleArena.placeSoulCoreOnSpirit('${card.uid}')">🔥 Place Soul Core on this Spirit</button>`;
        } else if (DuelState.player.soulCoreLocation === 'field') {
          scBtn = `<button class="btn-inspector-action btn-place-soul-core" onclick="BattleArena.placeSoulCoreOnSpirit('${card.uid}')">🔥 Transfer Soul Core to this Spirit</button>`;
        }
      }
      actionBtnHtml = `
        <div style="font-size:0.75rem;text-align:center;color:#60a5fa;font-weight:700;padding:0.2rem 0;">
          ⚔️ Current BP: ${card.currentBp || card.bp || '—'} BP (LV${card.currentLevel || 1})
          ${card.hasSoulCore ? ' • <span style="color:#f59e0b;font-weight:800;">🔥 SOUL CORE ACTIVE</span>' : ''}
        </div>
        ${scBtn}
      `;"""

r7 = """      // On battlefield spirit
      const isPlayerSpirit = (DuelState.player.field || []).some(s => s.uid === card.uid);
      const isMainStep = isPlayerTurn && phase === 'MAIN';
      let braveInspectorBtn = '';
      if (isPlayerSpirit && isMainStep) {
        if (card.brave) {
          braveInspectorBtn = `<button class="btn-inspector-action btn-inspect-debrave" onclick="BattleArena.separateBrave('${card.uid}')">🔄 Separate Brave (${card.brave.name})</button>`;
        } else if (card.type === 'Brave' || card.isBraveCard) {
          braveInspectorBtn = `<button class="btn-inspector-action btn-inspect-brave" onclick="BattleArena.openBraveCombineModal('${card.uid}', 'field')">🔗 Combine Brave onto Spirit</button>`;
        }
      }
      let scBtn = '';
      if (isPlayerSpirit && isMainStep) {
        if (card.hasSoulCore) {
          scBtn = `<button class="btn-inspector-action btn-remove-soul-core" onclick="BattleArena.removeSoulCoreFromSpirit('${card.uid}')">🔥 Return Soul Core to Reserve</button>`;
        } else if (DuelState.player.soulCoreLocation === 'reserve') {
          scBtn = `<button class="btn-inspector-action btn-place-soul-core" onclick="BattleArena.placeSoulCoreOnSpirit('${card.uid}')">🔥 Place Soul Core on this Spirit</button>`;
        } else if (DuelState.player.soulCoreLocation === 'field') {
          scBtn = `<button class="btn-inspector-action btn-place-soul-core" onclick="BattleArena.placeSoulCoreOnSpirit('${card.uid}')">🔥 Transfer Soul Core to this Spirit</button>`;
        }
      }
      actionBtnHtml = `
        <div style="font-size:0.75rem;text-align:center;color:#60a5fa;font-weight:700;padding:0.2rem 0;">
          ⚔️ Current BP: ${card.currentBp || card.bp || '—'} BP (LV${card.currentLevel || 1})
          ${card.hasSoulCore ? ' • <span style="color:#f59e0b;font-weight:800;">🔥 SOUL CORE ACTIVE</span>' : ''}
          ${card.brave ? ` • <span style="color:#c084fc;font-weight:800;">🔗 BRAVED (+${card.brave.bpBonus || 1000} BP)</span>` : ''}
        </div>
        ${braveInspectorBtn}
        ${scBtn}
      `;"""
content = replace_or_fail(content, t7, r7, "7. renderCardInspector battlefield spirit Brave actions")

# 8. executeAbilityActions Brave and timing gating
t8 = """  function executeAbilityActions(bodyText, card, side = 'player', triggerName = 'SUMMON', context = {}) {
    if (!bodyText || !card) return;
    const bodyLower = bodyText.toLowerCase();"""

r8 = """  function executeAbilityActions(bodyText, card, side = 'player', triggerName = 'SUMMON', context = {}) {
    if (!bodyText || !card) return;
    const bodyLower = bodyText.toLowerCase();

    // STRICT BRAVE GATING: [When Braved], [During Brave], or 合体時 abilities are strictly inactive unless the card is Braved!
    const isBraveAbility = /\\[(?:when|during)\\s+braved?\\]|合体時|合体中/i.test(bodyText);
    if (isBraveAbility && !card.isBraved && !card.brave) {
      return;
    }

    // TIMING RESTRICTION: (When Attacks) or (When Brave Attacks) can NEVER trigger on SUMMON or MAGIC!
    if (/\\(When (?:Brave )?Attacks(?:\\/[^)]+)?\\)/i.test(bodyText) && triggerName !== 'ATTACK') {
      return;
    }

    // DESTRUCTION RESTRICTION: (When Destroyed) or "destroyed by comparing BP" can NEVER trigger on SUMMON or MAGIC!
    if (/(?:When (?:only )?this (?:Spirit|Ultimate|Brave) is destroyed|\\(When Destroyed(?:\\/[^)]+)?\\))/i.test(bodyText) && triggerName !== 'DESTROY' && triggerName !== 'BP_DESTRUCTION') {
      return;
    }"""
content = replace_or_fail(content, t8, r8, "8. executeAbilityActions Brave & timing gating")

# 9. castMagic validation
t9 = """  function castMagic(uid, targetSpiritUid = null) {
    const cardIdx = DuelState.player.hand.findIndex(c => c.uid === uid);
    if (cardIdx === -1) return;
    const card = DuelState.player.hand[cardIdx];"""

r9 = """  function castMagic(uid, targetSpiritUid = null) {
    const cardIdx = DuelState.player.hand.findIndex(c => c.uid === uid);
    if (cardIdx === -1) return;
    const card = DuelState.player.hand[cardIdx];

    // STRICT RULE ENFORCEMENT: Only Magic cards can be cast via castMagic!
    if (card.type !== 'Magic' && !(card.type || '').includes('Magic')) {
      if (typeof showToast === 'function') {
        showToast(`Official Rule: "${card.name}" is a ${card.type}, not a Magic card!`, 'warning');
      }
      return;
    }"""
content = replace_or_fail(content, t9, r9, "9. castMagic non-magic validation")

# 10. Insert Brave engine methods above openTargetModal
brave_methods = """  // =========================================================================
  // 🗡️ BRAVE CARD MECHANICS ENGINE (DUAL FORM: SPIRIT & COMBINED BRAVE)
  // =========================================================================
  function summonBraveAsSpirit(uid, customCoresToPlace = 1) {
    if (DuelState.activePlayer !== 'player') {
      if (typeof showToast === 'function') showToast("Cannot summon during opponent's turn!", 'warning');
      return;
    }
    const cardIdx = DuelState.player.hand.findIndex(c => c.uid === uid);
    if (cardIdx === -1) return;
    const card = DuelState.player.hand[cardIdx];

    const phase = DuelState.phases[DuelState.phaseIndex];
    if (phase !== 'MAIN' && phase !== 'ATTACK') {
      if (typeof showToast === 'function') showToast("Braves can only be summoned during MAIN or ATTACK (Flash) steps!", 'warning');
      return;
    }
    if (phase === 'ATTACK' && !hasFlashTiming(card)) {
      if (typeof showToast === 'function') showToast(`Official Rule: "${card.name}" does not have [Flash] timing!`, 'warning');
      return;
    }

    const cost = card.cost || 0;
    const coresToPlace = customCoresToPlace || 1;
    const totalNeeded = cost + coresToPlace;

    if (DuelState.player.reserve < totalNeeded) {
      const { total } = getPlayerAvailableCores();
      if (total >= totalNeeded) {
        openSacrificeModal(uid);
        return;
      }
      if (typeof showToast === 'function') {
        showToast(`Not enough cores! Need ${totalNeeded} (Cost ${cost} + ${coresToPlace} on Brave), but only have ${total} available!`, 'warning');
      }
      return;
    }

    DuelState.player.reserve -= totalNeeded;
    DuelState.player.trash += cost;
    DuelState.player.hand.splice(cardIdx, 1);

    card.currentCores = coresToPlace;
    card.currentLevel = 1;
    const parsed = parseLevels(card.levels);
    card.lv1Bp = parsed[0]?.bp || 1000;
    card.currentBp = card.lv1Bp;
    card.bpBonus = parseBraveBonus(card.levels, card.effect);
    card.isExhausted = false;
    card.hasAttacked = false;
    card.isBraveCard = true;
    card.isBraved = false;

    DuelState.player.field.push(card);
    DuelState.selectedPlayerCard = null;

    AudioFX.summon();
    addLog(`⚔️ **SUMMONED (SPIRIT FORM)**: Brave "${card.name}" summoned as a Spirit! Paid ${cost} cores, allocated ${coresToPlace} core(s) (${card.currentBp} BP).`, 'summon');
    if (typeof showToast === 'function') {
      showToast(`⚔️ Summoned Brave: ${card.name} in Spirit Form!`, 'success');
    }

    executeWhenSummonedEffects(card, 'player');
    renderDuelTable();
    renderPlayerHand();
  }

  function openBraveCombineModal(braveUid, source = 'hand') {
    let braveCard = null;
    if (source === 'hand') {
      braveCard = DuelState.player.hand.find(c => c.uid === braveUid);
    } else {
      braveCard = DuelState.player.field.find(c => c.uid === braveUid);
    }
    if (!braveCard) return;

    const eligibleSpirits = DuelState.player.field.filter(s => s.uid !== braveCard.uid && !s.brave);

    if (eligibleSpirits.length === 0) {
      if (source === 'hand') {
        if (typeof showToast === 'function') {
          showToast(`No allied Spirits on battlefield to Brave with! You can summon "${braveCard.name}" in Spirit Form first.`, 'warning');
        }
      } else {
        if (typeof showToast === 'function') {
          showToast(`No other allied Spirits on battlefield to combine with "${braveCard.name}"!`, 'warning');
        }
      }
      return;
    }

    if (eligibleSpirits.length === 1) {
      braveOntoSpirit(braveUid, eligibleSpirits[0].uid, source);
      return;
    }

    openTargetModal(braveCard, source === 'hand' ? 'brave_hand' : 'brave_field');
  }

  function braveOntoSpirit(braveUid, targetSpiritUid, source = 'hand') {
    if (DuelState.activePlayer !== 'player') {
      if (typeof showToast === 'function') showToast("Cannot Brave during opponent's turn!", 'warning');
      return;
    }
    const phase = DuelState.phases[DuelState.phaseIndex];
    if (phase !== 'MAIN') {
      if (typeof showToast === 'function') showToast("Official Rule: Braves can only be combined during the MAIN step!", 'warning');
      return;
    }

    let braveCard = null;
    let cardIdx = -1;

    if (source === 'hand') {
      cardIdx = DuelState.player.hand.findIndex(c => c.uid === braveUid);
      if (cardIdx === -1) return;
      braveCard = DuelState.player.hand[cardIdx];
    } else {
      cardIdx = DuelState.player.field.findIndex(c => c.uid === braveUid);
      if (cardIdx === -1) return;
      braveCard = DuelState.player.field[cardIdx];
    }

    const targetSpirit = DuelState.player.field.find(s => s.uid === targetSpiritUid);
    if (!targetSpirit) {
      if (typeof showToast === 'function') showToast("Target Spirit not found on field!", 'warning');
      return;
    }

    if (targetSpirit.brave) {
      if (typeof showToast === 'function') showToast(`"${targetSpirit.name}" already has a Brave attached!`, 'warning');
      return;
    }

    const bpBonus = parseBraveBonus(braveCard.levels, braveCard.effect);
    braveCard.bpBonus = bpBonus;

    if (source === 'hand') {
      const cost = braveCard.cost || 0;
      if (DuelState.player.reserve < cost) {
        const { total } = getPlayerAvailableCores();
        if (total >= cost) {
          openSacrificeModal(braveUid);
          return;
        }
        if (typeof showToast === 'function') showToast(`Need ${cost} cores to Brave "${braveCard.name}"!`, 'warning');
        return;
      }
      DuelState.player.reserve -= cost;
      DuelState.player.trash += cost;
      DuelState.player.hand.splice(cardIdx, 1);
    } else {
      // From field: cores on the brave spirit move onto the target spirit
      const fieldCores = braveCard.currentCores || 0;
      targetSpirit.currentCores = (targetSpirit.currentCores || 0) + fieldCores;
      DuelState.player.field.splice(cardIdx, 1);
    }

    targetSpirit.brave = braveCard;
    targetSpirit.isBraved = true;
    braveCard.isBraved = true;
    braveCard.hostSpiritUid = targetSpirit.uid;

    recalculateSpiritBp(targetSpirit);

    AudioFX.summon();
    addLog(`🔗 **BRAVED**: "${braveCard.name}" combined with "${targetSpirit.name}"! Granted +${bpBonus} BP bonus (Now ${targetSpirit.currentBp} BP)!`, 'summon');
    if (typeof showToast === 'function') {
      showToast(`🔗 Braved "${braveCard.name}" onto "${targetSpirit.name}" (+${bpBonus} BP)!`, 'success');
    }

    executeWhenBravedEffects(braveCard, targetSpirit, 'player');
    renderDuelTable();
    renderPlayerHand();
  }

  function separateBrave(hostSpiritUid) {
    if (DuelState.activePlayer !== 'player') {
      if (typeof showToast === 'function') showToast("You can only separate Braves on your turn!", 'warning');
      return;
    }
    const phase = DuelState.phases[DuelState.phaseIndex];
    if (phase !== 'MAIN') {
      if (typeof showToast === 'function') showToast("Braves can only be separated during the MAIN step!", 'warning');
      return;
    }

    const hostSpirit = DuelState.player.field.find(s => s.uid === hostSpiritUid);
    if (!hostSpirit || !hostSpirit.brave) {
      if (typeof showToast === 'function') showToast("No Brave attached to this Spirit!", 'warning');
      return;
    }

    let coreSource = null;
    if (DuelState.player.reserve >= 1) {
      DuelState.player.reserve -= 1;
      coreSource = 'Reserve';
    } else if (hostSpirit.currentCores > 1) {
      hostSpirit.currentCores -= 1;
      coreSource = hostSpirit.name;
    } else {
      if (typeof showToast === 'function') showToast("Need at least 1 Core in Reserve or on Spirit to separate Brave into Spirit form!", 'warning');
      return;
    }

    const braveCard = hostSpirit.brave;
    hostSpirit.brave = null;
    hostSpirit.isBraved = false;
    braveCard.isBraved = false;
    braveCard.hostSpiritUid = null;

    recalculateSpiritBp(hostSpirit);

    braveCard.currentCores = 1;
    braveCard.currentLevel = 1;
    const parsed = parseLevels(braveCard.levels);
    braveCard.lv1Bp = parsed[0]?.bp || 1000;
    braveCard.currentBp = braveCard.lv1Bp;
    braveCard.isExhausted = hostSpirit.isExhausted;
    braveCard.hasAttacked = hostSpirit.hasAttacked;
    braveCard.isBraveCard = true;

    DuelState.player.field.push(braveCard);

    AudioFX.coreChime();
    addLog(`🔄 **DE-BRAVED**: "${braveCard.name}" separated from "${hostSpirit.name}" into Spirit Form (Allocated 1 Core from ${coreSource}, ${braveCard.currentBp} BP).`, 'info');
    if (typeof showToast === 'function') {
      showToast(`🔄 "${braveCard.name}" separated into Spirit Form!`, 'info');
    }

    renderDuelTable();
    renderPlayerHand();
  }

  function executeWhenBravedEffects(braveCard, hostSpirit, side = 'player') {
    if (!braveCard || !braveCard.effect) return;
    const blocks = getCardAbilityBlocks(braveCard.effect);
    const bravedBlocks = blocks.filter(b => /\\(When Braved(?:[^)]*)\\)|\\(When Braved\\/[^)]*\\)|合体時/i.test(b) && !/\\(When (?:Brave )?Attacks\\)/i.test(b));
    for (const b of bravedBlocks) {
      executeAbilityActions(b, hostSpirit, side, 'BRAVED', { braveCard });
    }
  }

  function executeBpComparisonDefeatEffects(loser, winner, loserSide, winnerSide) {
    if (!loser) return;
    const winnerField = winnerSide === 'player' ? DuelState.player.field : DuelState.opponent.field;

    // 1. Check if loser has a Brave attached (e.g. The PoisonSnakeScythe Alphard)
    const braveCard = loser.brave;
    if (braveCard && braveCard.effect) {
      const bEff = braveCard.effect;
      if (bEff.includes('destroyed by comparing BP') || bEff.includes('BPを比べ')) {
        if (bEff.includes('destroy an opposing') || bEff.includes('破壊する')) {
          const wIdx = winnerField.findIndex(s => s.uid === winner.uid);
          if (wIdx !== -1) {
            const dest = winnerField.splice(wIdx, 1)[0];
            recycleSpiritCoresToReserve(dest, winnerSide);
            sendToTrash(dest, winnerSide, `Destroyed by [When Braved] BP comparison effect of ${braveCard.name}`);
            AudioFX.slash();
            addLog(`🗡️ **[WHEN BRAVED: ${braveCard.name}]**: Revenge destruction! Destroyed opposing "${winner.name}" that defeated it in BP comparison!`, 'kill');
            if (typeof showToast === 'function') {
              showToast(`🗡️ [${braveCard.name}]: Destroyed opposing "${winner.name}"!`, 'success');
            }
          }
        }
      }
    }

    // 2. Check loser's own effect
    if (loser.effect && (loser.effect.includes('destroyed by comparing BP') || loser.effect.includes('BPを比べ'))) {
      if (loser.effect.includes('destroy an opposing') || loser.effect.includes('破壊する')) {
        const wIdx = winnerField.findIndex(s => s.uid === winner.uid);
        if (wIdx !== -1) {
          const dest = winnerField.splice(wIdx, 1)[0];
          recycleSpiritCoresToReserve(dest, winnerSide);
          sendToTrash(dest, winnerSide, `Destroyed by BP comparison revenge of ${loser.name}`);
          AudioFX.slash();
          addLog(`💥 **[BP REVENGE: ${loser.name}]**: Destroyed opposing "${winner.name}" that defeated it in BP comparison!`, 'kill');
        }
      }
    }
  }
"""
t10 = "  function openTargetModal(card, mode = 'magic', attackerUid = null) {"
content = replace_or_fail(content, t10, brave_methods + "\n" + t10, "10. Insert Brave engine methods")

# 11. selectTargetSpirit Brave handling
t11 = """  function selectTargetSpirit(spiritUid) {
    if (!pendingTargetSelection) return;
    const { card, mode, attackerUid } = pendingTargetSelection;
    closeTargetModal();

    if (mode === 'flash_battle') {
      castFlashInBattle(card.uid, attackerUid, spiritUid);
    } else {
      castMagic(card.uid, spiritUid);
    }
  }"""

r11 = """  function selectTargetSpirit(spiritUid) {
    if (!pendingTargetSelection) return;
    const { card, mode, attackerUid } = pendingTargetSelection;
    closeTargetModal();

    if (mode === 'flash_battle') {
      castFlashInBattle(card.uid, attackerUid, spiritUid);
    } else if (mode === 'brave_hand') {
      braveOntoSpirit(card.uid, spiritUid, 'hand');
    } else if (mode === 'brave_field') {
      braveOntoSpirit(card.uid, spiritUid, 'field');
    } else {
      castMagic(card.uid, spiritUid);
    }
  }"""
content = replace_or_fail(content, t11, r11, "11. selectTargetSpirit Brave handling")

# 11b. openTargetModal Brave UI
t11b = """    const bpAmount = getMagicBpBoostAmount(card);
    const titleEl = document.getElementById('targetModalTitle');
    if (titleEl) {
      titleEl.textContent = `Target Spirit: ${card.name}`;
    }
    const descEl = document.getElementById('targetModalDesc');
    if (descEl) {
      descEl.innerHTML = `Select which allied Spirit receives <strong>+${bpAmount} BP</strong> this turn:`;
    }

    const choicesEl = document.getElementById('targetSpiritChoices');
    if (choicesEl) {
      choicesEl.innerHTML = DuelState.player.field.map(s => `
        <div class="target-choice-card" onclick="BattleArena.selectTargetSpirit('${s.uid}')">
          <div class="tcc-info">
            <span class="tcc-name">${s.name}</span>
            <span class="tcc-meta">Lv${s.currentLevel} • ${s.currentBp} BP • ${s.currentCores} Core${s.currentCores === 1 ? '' : 's'}${s.isExhausted ? ' (Exhausted)' : ' (Ready)'}</span>
          </div>
          <button class="target-choice-btn">🎯 Target (+${bpAmount} BP)</button>
        </div>
      `).join('');
    }"""

r11b = """    const titleEl = document.getElementById('targetModalTitle');
    const descEl = document.getElementById('targetModalDesc');
    const choicesEl = document.getElementById('targetSpiritChoices');

    if (mode === 'brave_hand' || mode === 'brave_field') {
      const bpBonus = parseBraveBonus(card.levels, card.effect);
      if (titleEl) titleEl.textContent = `🔗 Combine Brave: ${card.name}`;
      if (descEl) descEl.innerHTML = `Select which allied Spirit or Ultimate combines with <strong>${card.name}</strong> (+${bpBonus} BP):`;
      if (choicesEl) {
        const eligible = DuelState.player.field.filter(s => s.uid !== card.uid && !s.brave);
        choicesEl.innerHTML = eligible.map(s => `
          <div class="target-choice-card" onclick="BattleArena.selectTargetSpirit('${s.uid}')">
            <div class="tcc-info">
              <span class="tcc-name">${s.name}</span>
              <span class="tcc-meta">Lv${s.currentLevel} • ${s.currentBp} BP • ${s.currentCores} Core${s.currentCores === 1 ? '' : 's'}${s.isExhausted ? ' (Exhausted)' : ' (Ready)'}</span>
            </div>
            <button class="target-choice-btn" style="background:linear-gradient(135deg, #a855f7, #6366f1); border-color:#c084fc;">🔗 Brave (+${bpBonus} BP)</button>
          </div>
        `).join('');
      }
    } else {
      const bpAmount = getMagicBpBoostAmount(card);
      if (titleEl) titleEl.textContent = `Target Spirit: ${card.name}`;
      if (descEl) descEl.innerHTML = `Select which allied Spirit receives <strong>+${bpAmount} BP</strong> this turn:`;
      if (choicesEl) {
        choicesEl.innerHTML = DuelState.player.field.map(s => `
          <div class="target-choice-card" onclick="BattleArena.selectTargetSpirit('${s.uid}')">
            <div class="tcc-info">
              <span class="tcc-name">${s.name}</span>
              <span class="tcc-meta">Lv${s.currentLevel} • ${s.currentBp} BP • ${s.currentCores} Core${s.currentCores === 1 ? '' : 's'}${s.isExhausted ? ' (Exhausted)' : ' (Ready)'}</span>
            </div>
            <button class="target-choice-btn">🎯 Target (+${bpAmount} BP)</button>
          </div>
        `).join('');
      }
    }"""
content = replace_or_fail(content, t11b, r11b, "11b. openTargetModal Brave UI")

# 12. sendToTrash host brave detachment
t12 = """    card.graveyardReason = reason || 'Sent to Trash';
    executeUniversalCardEffect(card, side, 'WHEN_DESTROYED', { reason });"""

r12 = """    // If a Braved host is destroyed, Brave can remain on field in Spirit form with 1 Core!
    if (card.brave) {
      const braveCard = card.brave;
      card.brave = null;
      card.isBraved = false;
      braveCard.isBraved = false;
      braveCard.hostSpiritUid = null;

      if (target.reserve >= 1) {
        target.reserve -= 1;
        braveCard.currentCores = 1;
        braveCard.currentLevel = 1;
        const parsed = parseLevels(braveCard.levels);
        braveCard.lv1Bp = parsed[0]?.bp || 1000;
        braveCard.currentBp = braveCard.lv1Bp;
        braveCard.isBraveCard = true;
        target.field.push(braveCard);
        addLog(`🛡️ **[BRAVE PRESERVED]**: "${braveCard.name}" remained on field in Spirit Form with 1 Core!`, 'info');
      } else {
        sendToTrash(braveCard, side, `Host spirit "${card.name}" destroyed`);
      }
    }

    card.graveyardReason = reason || 'Sent to Trash';
    executeUniversalCardEffect(card, side, 'WHEN_DESTROYED', { reason });"""
content = replace_or_fail(content, t12, r12, "12. sendToTrash Braved host preservation")

# 13. combat BP defeat revenge (both branches)
t13 = """      resultMsg = `DEFENDED! ${blk.name} defeated ${att.name}!`;
      const idx = attList.findIndex(s => s.uid === att.uid);
      if (idx !== -1) {
        const dest = attList.splice(idx, 1)[0];
        recycleSpiritCoresToReserve(dest, attSide);
        sendToTrash(dest, attSide, `Destroyed in combat by ${blk.name} (${blkBp} vs ${attBp} BP)`);
      }
      addLog(`💀 **SPIRIT DESTROYED**: "${att.name}" fell in battle!`, 'kill');

      if (hasCurse(att)) {"""

r13 = """      resultMsg = `DEFENDED! ${blk.name} defeated ${att.name}!`;
      const idx = attList.findIndex(s => s.uid === att.uid);
      if (idx !== -1) {
        const dest = attList.splice(idx, 1)[0];
        recycleSpiritCoresToReserve(dest, attSide);
        sendToTrash(dest, attSide, `Destroyed in combat by ${blk.name} (${blkBp} vs ${attBp} BP)`);
      }
      addLog(`💀 **SPIRIT DESTROYED**: "${att.name}" fell in battle!`, 'kill');

      // Check BP comparison defeat revenge (e.g. Alphard [When Braved] (When Brave Attacks))
      executeBpComparisonDefeatEffects(att, blk, attSide, defSide);

      if (hasCurse(att)) {"""
content = replace_or_fail(content, t13, r13, "13. Combat BP defeat revenge")

# 14. Export new methods in BattleArena
t14 = """    deployNexus,
    addCoreToNexus,"""

r14 = """    summonBraveAsSpirit,
    openBraveCombineModal,
    braveOntoSpirit,
    separateBrave,
    isBraveCard,
    parseBraveBonus,
    isEligibleBraveHost,
    deployNexus,
    addCoreToNexus,"""
content = replace_or_fail(content, t14, r14, "14. Export BattleArena methods")

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully patched battle_arena.js!")
