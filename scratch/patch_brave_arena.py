# Patch battle_arena.js for Brave and Nexus mechanics
import re

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update recalculateSpiritBp to include spirit.brave.bpBonus
target1 = """spirit.currentBp = (spirit.baseBp || 0) + (spirit.turnBpBoost || 0);
  if (spirit.battleBpBoost) {
    spirit.battleBp = spirit.currentBp + spirit.battleBpBoost;
  } else {
    delete spirit.battleBp;
  }"""
replacement1 = """spirit.currentBp = (spirit.baseBp || 0) + (spirit.turnBpBoost || 0);
  if (spirit.brave && spirit.brave.bpBonus) {
    spirit.currentBp += spirit.brave.bpBonus;
  }
  if (spirit.battleBpBoost) {
    spirit.battleBp = spirit.currentBp + spirit.battleBpBoost;
  } else {
    delete spirit.battleBp;
  }"""

if target1 in content:
    content = content.replace(target1, replacement1, 1)
    print("1. Patched recalculateSpiritBp")
else:
    print("1. Target 1 NOT found!")

# 2. Add Brave helper functions after recalculateSpiritBp / calculateBpAndLevel
target2 = """// Fisher-Yates Shuffle
function shuffle(array) {"""
replacement2 = """// --- BRAVE HELPERS & PARSERS ---
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

// Fisher-Yates Shuffle
function shuffle(array) {"""

if target2 in content:
    content = content.replace(target2, replacement2, 1)
    print("2. Added Brave helper functions")
else:
    print("2. Target 2 NOT found!")

# 3. Update field spirit rendering (renderFieldSpirit) to show Braved badge & De-Brave button, or Spirit Mode badge & Brave button
target3 = """    return `
      <div class="${classes}" id="spirit_${spirit.uid}" ${dragAttrs} onclick="BattleArena.handleSpiritClick('${spirit.uid}')">
        ${dragHandleHtml}
        ${hasSC ? `<div class="spirit-soul-core-badge" title="Soul Core is placed on this Spirit!">${getHexCoreSvg('soul', 12)} <span class="spirit-sc-txt">SOUL</span></div>` : ''}
        <button class="fsc-zoom-btn" onclick="event.stopPropagation(); openCardDetail('${safeSpName}')" title="Inspect Full Card Details">🔍</button>
        <div class="fsc-header-row">
          <span class="fsc-level-tag">LV${spirit.currentLevel}</span>
          <span class="fsc-bp-tag">${spirit.currentBp} BP</span>
        </div>
        ${coreStepperHtml}
        <div class="fsc-img-wrap">
          <img src="${spirit.image_url}" alt="${spirit.name}" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src=FALLBACK_CARD_ART;" />
        </div>
        <div class="fsc-name" title="${spirit.name}">${spirit.name}</div>
        <div class="fsc-status-pill">${spirit.isExhausted ? 'EXHAUSTED' : 'READY'}</div>
        ${soulCoreActionBtn}
        ${reorderButtonsHtml}
      </div>
    `;"""

replacement3 = """    let braveFieldBadge = '';
    let braveFieldActionBtn = '';
    if (spirit.brave) {
      braveFieldBadge = `<div class="spirit-brave-badge" title="Braved with ${spirit.brave.name} (+${spirit.brave.bpBonus || 1000} BP)">🔗 +${spirit.brave.bpBonus || 1000} BP</div>`;
      if (isPlayer && isMainStep) {
        braveFieldActionBtn = `<button class="fsc-brave-btn debrave" onclick="event.stopPropagation(); BattleArena.separateBrave('${spirit.uid}')" title="Separate Brave into Spirit form">🔄 De-Brave</button>`;
      }
    } else if (spirit.type === 'Brave' || spirit.isBraveCard) {
      braveFieldBadge = `<div class="spirit-brave-mode-badge" title="Brave in Spirit Form">⚔️ BRAVE</div>`;
      if (isPlayer && isMainStep) {
        braveFieldActionBtn = `<button class="fsc-brave-btn brave" onclick="event.stopPropagation(); BattleArena.openBraveCombineModal('${spirit.uid}', 'field')" title="Combine with another Spirit">🔗 Brave</button>`;
      }
    }

    return `
      <div class="${classes}" id="spirit_${spirit.uid}" ${dragAttrs} onclick="BattleArena.handleSpiritClick('${spirit.uid}')">
        ${dragHandleHtml}
        ${braveFieldBadge}
        ${hasSC ? `<div class="spirit-soul-core-badge" title="Soul Core is placed on this Spirit!">${getHexCoreSvg('soul', 12)} <span class="spirit-sc-txt">SOUL</span></div>` : ''}
        <button class="fsc-zoom-btn" onclick="event.stopPropagation(); openCardDetail('${safeSpName}')" title="Inspect Full Card Details">🔍</button>
        <div class="fsc-header-row">
          <span class="fsc-level-tag">LV${spirit.currentLevel}</span>
          <span class="fsc-bp-tag">${spirit.currentBp} BP</span>
        </div>
        ${coreStepperHtml}
        <div class="fsc-img-wrap">
          <img src="${spirit.image_url}" alt="${spirit.name}" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src=FALLBACK_CARD_ART;" />
        </div>
        <div class="fsc-name" title="${spirit.name}">${spirit.name}</div>
        <div class="fsc-status-pill">${spirit.isExhausted ? 'EXHAUSTED' : 'READY'}</div>
        ${braveFieldActionBtn}
        ${soulCoreActionBtn}
        ${reorderButtonsHtml}
      </div>
    `;"""

if target3 in content:
    content = content.replace(target3, replacement3, 1)
    print("3. Patched renderFieldSpirit")
else:
    print("3. Target 3 NOT found!")

# 4. Update renderPlayerHand to recognize Brave and Nexus
target4 = """    const isSelected = DuelState.selectedPlayerCard && DuelState.selectedPlayerCard.uid === card.uid;
    const isSpirit = card.type === 'Spirit' || (card.type || '').includes('Spirit');
    const isMagic = card.type === 'Magic';
    const isNexus = (card.type || '').includes('Nexus');
    const cost = card.cost || 0;
    const totalNeeded = isSpirit ? cost + 1 : cost;"""

replacement4 = """    const isSelected = DuelState.selectedPlayerCard && DuelState.selectedPlayerCard.uid === card.uid;
    const isBrave = card.type === 'Brave' || (card.type || '').includes('Brave');
    const isSpirit = (card.type === 'Spirit' || (card.type || '').includes('Spirit')) && !isBrave;
    const isMagic = card.type === 'Magic';
    const isNexus = (card.type || '').includes('Nexus');
    const cost = card.cost || 0;
    const totalNeeded = (isSpirit || isBrave) ? cost + 1 : cost;"""

if target4 in content:
    content = content.replace(target4, replacement4, 1)
    print("4. Patched hand card type flags in renderPlayerHand")
else:
    print("4. Target 4 NOT found!")

# 5. Update renderPlayerHand button generation
target5 = """    if (canPlayStep && isSpirit) {
      const btnLabel = isAttackStep ? '⚡ Flash Summon' : '⚔️ Summon';
      if (canAffordDirect) {
        actionBtnHtml = `<button class="btn-quick-summon" onclick="event.stopPropagation(); BattleArena.summonCard('${card.uid}')">${btnLabel}</button>`;
      } else if (needsSacrifice) {
        actionBtnHtml = `<button class="btn-quick-sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('${card.uid}')">⚡ Sacrifice</button>`;
      }
    } else if (canPlayStep && isMagic) {
      const btnLabel = isAttackStep ? '⚡ Flash Cast' : '⚡ Cast';
      if (canAffordDirect) {
        actionBtnHtml = `<button class="btn-quick-magic" onclick="event.stopPropagation(); BattleArena.castMagic('${card.uid}')">${btnLabel}</button>`;
      } else if (needsSacrifice) {
        actionBtnHtml = `<button class="btn-quick-sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('${card.uid}')">⚡ Sacrifice</button>`;
      }
    } else if (canPlayStep && isNexus && isMainStep) {
      const btnLabel = '🏛️ Deploy';
      if (canAffordDirect) {
        actionBtnHtml = `<button class="btn-quick-summon" style="background:linear-gradient(135deg, #0284c7, #0369a1);" onclick="event.stopPropagation(); BattleArena.deployNexus('${card.uid}')">${btnLabel}</button>`;
      } else if (needsSacrifice) {
        actionBtnHtml = `<button class="btn-quick-sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('${card.uid}')">⚡ Sacrifice</button>`;
      }
    }"""

replacement5 = """    if (canPlayStep && isBrave && isMainStep) {
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
      const btnLabel = isAttackStep ? '⚡ Flash Summon' : '⚔️ Summon';
      if (canAffordDirect) {
        actionBtnHtml = `<button class="btn-quick-summon" onclick="event.stopPropagation(); BattleArena.summonCard('${card.uid}')">${btnLabel}</button>`;
      } else if (needsSacrifice) {
        actionBtnHtml = `<button class="btn-quick-sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('${card.uid}')">⚡ Sacrifice</button>`;
      }
    } else if (canPlayStep && isMagic) {
      const btnLabel = isAttackStep ? '⚡ Flash Cast' : '⚡ Cast';
      if (canAffordDirect) {
        actionBtnHtml = `<button class="btn-quick-magic" onclick="event.stopPropagation(); BattleArena.castMagic('${card.uid}')">${btnLabel}</button>`;
      } else if (needsSacrifice) {
        actionBtnHtml = `<button class="btn-quick-sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('${card.uid}')">⚡ Sacrifice</button>`;
      }
    } else if (canPlayStep && isNexus && isMainStep) {
      const btnLabel = '🏛️ Deploy';
      if (canAffordDirect) {
        actionBtnHtml = `<button class="btn-quick-nexus" onclick="event.stopPropagation(); BattleArena.deployNexus('${card.uid}')">${btnLabel}</button>`;
      } else if (needsSacrifice) {
        actionBtnHtml = `<button class="btn-quick-sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('${card.uid}')">⚡ Sacrifice</button>`;
      }
    }"""

if target5 in content:
    content = content.replace(target5, replacement5, 1)
    print("5. Patched renderPlayerHand action buttons")
else:
    print("5. Target 5 NOT found!")

# 6. Update renderCardInspector in inspector panel
target6 = """      if (canPlayStep && isSpirit) {
        const btnText = (phase === 'ATTACK') ? `⚡ Flash Summon (${cost})` : `⚔️ Summon Spirit (Cost ${cost})`;
        if (canAffordDirect) {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-summon" onclick="BattleArena.summonCard('${card.uid}')">${btnText}</button>`;
        } else if (canAffordWithSacrifice) {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-sac" onclick="BattleArena.openSacrificeModal('${card.uid}')">⚡ Sacrifice & Summon</button>`;
        } else {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-disabled" disabled>⏳ Need ${totalNeeded} Cores</button>`;
        }
      } else if (canPlayStep && isMagic) {
        const btnText = (phase === 'ATTACK') ? `⚡ Flash Cast (${cost})` : `⚡ Cast Magic (Cost ${cost})`;
        if (canAffordDirect) {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-magic" onclick="BattleArena.castMagic('${card.uid}')">${btnText}</button>`;
        } else if (canAffordWithSacrifice) {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-sac" onclick="BattleArena.openSacrificeModal('${card.uid}')">⚡ Sacrifice & Cast</button>`;
        } else {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-disabled" disabled>⏳ Need ${cost} Cores</button>`;
        }
      } else if (canPlayStep && isNexus) {
        const btnText = (phase === 'ATTACK') ? `🏛️ Flash Deploy Nexus (${cost})` : `🏛️ Deploy Nexus (Cost ${cost})`;
        if (canAffordDirect) {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-summon" style="background:linear-gradient(135deg, #0284c7, #0369a1);" onclick="BattleArena.deployNexus('${card.uid}')">${btnText}</button>`;
        } else if (canAffordWithSacrifice) {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-sac" onclick="BattleArena.openSacrificeModal('${card.uid}')">⚡ Sacrifice & Deploy</button>`;
        } else {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-disabled" disabled>⏳ Need ${cost} Cores</button>`;
        }
      }"""

replacement6 = """      const isInspectBrave = card.type === 'Brave' || (card.type || '').includes('Brave');
      const isInspectSpirit = (card.type === 'Spirit' || (card.type || '').includes('Spirit')) && !isInspectBrave;
      if (canPlayStep && isInspectBrave) {
        const eligibleHosts = DuelState.player.field.filter(s => !s.brave);
        let bBtns = '';
        if (canAffordDirect) {
          bBtns += `<button class="btn-inspector-action btn-inspect-summon" onclick="BattleArena.summonBraveAsSpirit('${card.uid}')">⚔️ Summon as Spirit (Cost ${cost} + 1 Core)</button>`;
        } else if (canAffordWithSacrifice) {
          bBtns += `<button class="btn-inspector-action btn-inspect-sac" onclick="BattleArena.openSacrificeModal('${card.uid}')">⚡ Sacrifice & Summon</button>`;
        } else {
          bBtns += `<button class="btn-inspector-action btn-inspect-disabled" disabled>⏳ Need ${totalNeeded} Cores</button>`;
        }
        if (eligibleHosts.length > 0 && reserve >= cost) {
          bBtns += `<button class="btn-inspector-action btn-inspect-brave" onclick="BattleArena.openBraveCombineModal('${card.uid}', 'hand')">🔗 Brave onto Spirit (Cost ${cost})</button>`;
        }
        actionBtnHtml = bBtns;
      } else if (canPlayStep && isInspectSpirit) {
        const btnText = (phase === 'ATTACK') ? `⚡ Flash Summon (${cost})` : `⚔️ Summon Spirit (Cost ${cost})`;
        if (canAffordDirect) {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-summon" onclick="BattleArena.summonCard('${card.uid}')">${btnText}</button>`;
        } else if (canAffordWithSacrifice) {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-sac" onclick="BattleArena.openSacrificeModal('${card.uid}')">⚡ Sacrifice & Summon</button>`;
        } else {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-disabled" disabled>⏳ Need ${totalNeeded} Cores</button>`;
        }
      } else if (canPlayStep && isMagic) {
        const btnText = (phase === 'ATTACK') ? `⚡ Flash Cast (${cost})` : `⚡ Cast Magic (Cost ${cost})`;
        if (canAffordDirect) {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-magic" onclick="BattleArena.castMagic('${card.uid}')">${btnText}</button>`;
        } else if (canAffordWithSacrifice) {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-sac" onclick="BattleArena.openSacrificeModal('${card.uid}')">⚡ Sacrifice & Cast</button>`;
        } else {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-disabled" disabled>⏳ Need ${cost} Cores</button>`;
        }
      } else if (canPlayStep && isNexus) {
        const btnText = (phase === 'ATTACK') ? `🏛️ Flash Deploy Nexus (${cost})` : `🏛️ Deploy Nexus (Cost ${cost})`;
        if (canAffordDirect) {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-summon" style="background:linear-gradient(135deg, #0284c7, #0369a1);" onclick="BattleArena.deployNexus('${card.uid}')">${btnText}</button>`;
        } else if (canAffordWithSacrifice) {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-sac" onclick="BattleArena.openSacrificeModal('${card.uid}')">⚡ Sacrifice & Deploy</button>`;
        } else {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-disabled" disabled>⏳ Need ${cost} Cores</button>`;
        }
      }"""

if target6 in content:
    content = content.replace(target6, replacement6, 1)
    print("6. Patched renderCardInspector hand card buttons")
else:
    print("6. Target 6 NOT found!")

# 7. Update renderCardInspector for battlefield spirits (Brave / De-Brave)
target7 = """      const isPlayerSpirit = (DuelState.player.field || []).some(s => s.uid === card.uid);
      const isMainStep = isPlayerTurn && phase === 'MAIN';
      let scBtn = '';
      if (isPlayerSpirit && isMainStep) {"""

replacement7 = """      const isPlayerSpirit = (DuelState.player.field || []).some(s => s.uid === card.uid);
      const isMainStep = isPlayerTurn && phase === 'MAIN';
      let braveActionBtn = '';
      if (isPlayerSpirit && isMainStep) {
        if (card.brave) {
          braveActionBtn = `<button class="btn-inspector-action btn-inspect-debrave" onclick="BattleArena.separateBrave('${card.uid}')">🔄 Separate Brave (${card.brave.name})</button>`;
        } else if (card.type === 'Brave' || card.isBraveCard) {
          braveActionBtn = `<button class="btn-inspector-action btn-inspect-brave" onclick="BattleArena.openBraveCombineModal('${card.uid}', 'field')">🔗 Combine Brave onto Spirit</button>`;
        }
      }
      let scBtn = '';
      if (isPlayerSpirit && isMainStep) {"""

if target7 in content:
    content = content.replace(target7, replacement7, 1)
    print("7. Patched renderCardInspector battlefield spirit actions")
else:
    print("7. Target 7 NOT found!")

# Also attach braveActionBtn in inspector battlefield render
target7b = """        <div class="card-inspector-actions">
          ${scBtn}
        </div>"""
replacement7b = """        <div class="card-inspector-actions">
          ${braveActionBtn}
          ${scBtn}
        </div>"""
if target7b in content:
    content = content.replace(target7b, replacement7b, 1)
    print("7b. Attached braveActionBtn in inspector HTML")

# 8. Update executeAbilityActions with Brave gating and trigger gating
target8 = """function executeAbilityActions(bodyText, card, side = 'player', triggerName = 'SUMMON', context = {}) {
  if (!bodyText || !card) return;
  const bodyLower = bodyText.toLowerCase();"""

replacement8 = """function executeAbilityActions(bodyText, card, side = 'player', triggerName = 'SUMMON', context = {}) {
  if (!bodyText || !card) return;
  const bodyLower = bodyText.toLowerCase();

  // STRICT BRAVE GATING: [When Braved], [During Brave], or 合体時 abilities are inactive unless the card is Braved!
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

if target8 in content:
    content = content.replace(target8, replacement8, 1)
    print("8. Patched executeAbilityActions with Brave gating")
else:
    print("8. Target 8 NOT found!")

# 9. Update castMagic to reject non-Magic cards
target9 = """function castMagic(uid, targetSpiritUid = null) {
  const cardIdx = DuelState.player.hand.findIndex(c => c.uid === uid);
  if (cardIdx === -1) return;
  const card = DuelState.player.hand[cardIdx];"""

replacement9 = """function castMagic(uid, targetSpiritUid = null) {
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

if target9 in content:
    content = content.replace(target9, replacement9, 1)
    print("9. Patched castMagic non-magic validation")
else:
    print("9. Target 9 NOT found!")

# 10. Implement summonBraveAsSpirit, openBraveCombineModal, braveOntoSpirit, separateBrave
brave_methods = """
// =========================================================================
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

# Insert brave_methods right above openTargetModal
target10 = "function openTargetModal(card, mode = 'magic', attackerUid = null) {"
if target10 in content:
    content = content.replace(target10, brave_methods + "\n" + target10, 1)
    print("10. Inserted Brave engine methods")
else:
    print("10. Target 10 NOT found!")

# 11. Update openTargetModal and selectTargetSpirit for Brave modes
target11 = """function openTargetModal(card, mode = 'magic', attackerUid = null) {
  pendingTargetSelection = { card, mode, attackerUid };
  const modalEl = document.getElementById('battleTargetModal');
  if (!modalEl) {
    // Fallback: smart default target
    if (mode === 'flash_battle') {
      const attacker = DuelState.opponent.field.find(s => s.uid === attackerUid) || DuelState.selectedAttacker;
      castFlashInBattle(card.uid, attackerUid, DuelState.player.field[0]?.uid);
    } else {
      castMagic(card.uid, DuelState.player.field[0]?.uid);
    }
    return;
  }

  const bpAmount = getMagicBpBoostAmount(card);
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
          <span class="tcc-meta">Lv${s.currentLevel} • ${s.currentBp} BP • ${s.currentCores} Core${s.currentCores !== 1 ? 's' : ''}</span>
        </div>
        <button class="target-choice-btn">⚡ Target (+${bpAmount} BP)</button>
      </div>
    `).join('');
  }

  modalEl.classList.add('active');
}

function selectTargetSpirit(spiritUid) {
  if (!pendingTargetSelection) return;
  const { card, mode, attackerUid } = pendingTargetSelection;
  closeTargetModal();

  if (mode === 'flash_battle') {
    castFlashInBattle(card.uid, attackerUid, spiritUid);
  } else {
    castMagic(card.uid, spiritUid);
  }
}"""

replacement11 = """function openTargetModal(card, mode = 'magic', attackerUid = null) {
  pendingTargetSelection = { card, mode, attackerUid };
  const modalEl = document.getElementById('battleTargetModal');
  if (!modalEl) {
    // Fallback: smart default target
    if (mode === 'brave_hand' || mode === 'brave_field') {
      const target = DuelState.player.field.find(s => s.uid !== card.uid && !s.brave);
      if (target) braveOntoSpirit(card.uid, target.uid, mode === 'brave_hand' ? 'hand' : 'field');
      return;
    }
    if (mode === 'flash_battle') {
      const attacker = DuelState.opponent.field.find(s => s.uid === attackerUid) || DuelState.selectedAttacker;
      castFlashInBattle(card.uid, attackerUid, DuelState.player.field[0]?.uid);
    } else {
      castMagic(card.uid, DuelState.player.field[0]?.uid);
    }
    return;
  }

  const titleEl = document.getElementById('targetModalTitle');
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
            <span class="tcc-meta">Lv${s.currentLevel} • ${s.currentBp} BP • ${s.currentCores} Core${s.currentCores !== 1 ? 's' : ''}</span>
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
            <span class="tcc-meta">Lv${s.currentLevel} • ${s.currentBp} BP • ${s.currentCores} Core${s.currentCores !== 1 ? 's' : ''}</span>
          </div>
          <button class="target-choice-btn">⚡ Target (+${bpAmount} BP)</button>
        </div>
      `).join('');
    }
  }

  modalEl.classList.add('active');
}

function selectTargetSpirit(spiritUid) {
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

if target11 in content:
    content = content.replace(target11, replacement11, 1)
    print("11. Patched openTargetModal and selectTargetSpirit")
else:
    print("11. Target 11 NOT found!")

# 12. Update sendToTrash to preserve Brave on field in Spirit Form if core available
target12 = """  if (!target.trashCards) target.trashCards = [];
  card.graveyardReason = reason || 'Sent to Trash';"""

replacement12 = """  // If a Braved host is destroyed, Brave can remain on field in Spirit form with 1 Core!
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

  if (!target.trashCards) target.trashCards = [];
  card.graveyardReason = reason || 'Sent to Trash';"""

if target12 in content:
    content = content.replace(target12, replacement12, 1)
    print("12. Patched sendToTrash for Braved hosts")
else:
    print("12. Target 12 NOT found!")

# 13. Hook executeBpComparisonDefeatEffects in combat resolution (both win and defeat branches)
target13 = """    } else if (blkBp > attBp) {
      resultMsg = `DEFENDED! ${blk.name} defeated ${att.name}!`;
      const idx = attList.findIndex(s => s.uid === att.uid);
      if (idx !== -1) {
        const dest = attList.splice(idx, 1)[0];
        recycleSpiritCoresToReserve(dest, attSide);
        sendToTrash(dest, attSide, `Destroyed in combat by ${blk.name} (${blkBp} vs ${attBp} BP)`);
      }
      addLog(`💥 **SPIRIT DESTROYED**: "${att.name}" fell in battle!`, 'kill');

      if (hasCurse(att)) {"""

replacement13 = """    } else if (blkBp > attBp) {
      resultMsg = `DEFENDED! ${blk.name} defeated ${att.name}!`;
      const idx = attList.findIndex(s => s.uid === att.uid);
      if (idx !== -1) {
        const dest = attList.splice(idx, 1)[0];
        recycleSpiritCoresToReserve(dest, attSide);
        sendToTrash(dest, attSide, `Destroyed in combat by ${blk.name} (${blkBp} vs ${attBp} BP)`);
      }
      addLog(`💥 **SPIRIT DESTROYED**: "${att.name}" fell in battle!`, 'kill');

      // Check BP comparison defeat revenge (e.g. Alphard [When Braved] (When Brave Attacks))
      executeBpComparisonDefeatEffects(att, blk, attSide, defSide);

      if (hasCurse(att)) {"""

if target13 in content:
    content = content.replace(target13, replacement13, 1)
    print("13. Patched combat BP defeat branch")
else:
    print("13. Target 13 NOT found!")

# 14. Export new methods in BattleArena
target14 = """    deployNexus,
    addCoreToNexus,"""

replacement14 = """    summonBraveAsSpirit,
    openBraveCombineModal,
    braveOntoSpirit,
    separateBrave,
    isBraveCard,
    parseBraveBonus,
    isEligibleBraveHost,
    deployNexus,
    addCoreToNexus,"""

if target14 in content:
    content = content.replace(target14, replacement14, 1)
    print("14. Exported Brave methods in BattleArena")
else:
    print("14. Target 14 NOT found!")

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Finished patching battle_arena.js")
