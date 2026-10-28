with open('battle_arena.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add hasFlashTiming and canPlayCardInCurrentPhase before renderPlayerHand
target_helpers_insert = """  // ── PLAYER ACTIONS & CARD INSPECTION ──"""

replacement_helpers_insert = """  // ── STEP TIMING & FLASH VERIFICATION ──
  function hasFlashTiming(card) {
    if (!card || !card.effect) return false;
    const eff = card.effect.toLowerCase();
    return eff.includes('[flash]') || eff.includes('(flash)') || eff.includes('flash:') || eff.includes('flash -') || eff.includes('swift') || eff.includes('神速');
  }

  function canPlayCardInCurrentPhase(card) {
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
  }

  // ── PLAYER ACTIONS & CARD INSPECTION ──"""

# 2. Update renderPlayerHand
target_render_hand = """  function renderPlayerHand() {
    const handEl = document.getElementById('playerHand');
    if (!handEl) return;
    const isPlayerTurn = DuelState.activePlayer === 'player';
    const currentPhase = DuelState.phases[DuelState.phaseIndex];
    // Main step or Attack step (Flash timing) allows card plays
    const canPlayStep = isPlayerTurn && (currentPhase === 'MAIN' || currentPhase === 'ATTACK');

    const { reserve, fieldCores, total: totalAvailableCores } = getPlayerAvailableCores();

    handEl.innerHTML = DuelState.player.hand.map(card => {
      const isSelected = DuelState.selectedPlayerCard && DuelState.selectedPlayerCard.uid === card.uid;
      const isSpirit = card.type === 'Spirit';
      const isMagic = card.type === 'Magic';
      const cost = card.cost || 0;
      const totalNeeded = isSpirit ? cost + 1 : cost;

      const canAfford = canPlayStep && (totalAvailableCores >= totalNeeded);
      const canAffordDirect = canPlayStep && (reserve >= totalNeeded);
      const needsSacrifice = canAfford && !canAffordDirect;

      let cls = `hand-card-item card-theme-${card.color.toLowerCase()}`;
      if (isSelected) cls += ' selected-hand-card';
      if (!canAfford) cls += ' cannot-afford';

      let actionBtnHtml = '';
      // Check if card can be set as a Burst
      const isBurstCard = card.effect && card.effect.includes('[Burst:');
      const canSetBurst = isPlayerTurn && !DuelState.player.burst && isBurstCard;
      const burstBtnHtml = canSetBurst ? `<button class="btn-set-burst" onclick="event.stopPropagation(); BattleArena.setBurst('${card.uid}')">🔒 Set as Burst</button>` : '';

      if (canPlayStep && isSpirit) {
        if (canAffordDirect) {
          actionBtnHtml = `<button class="btn-quick-summon" onclick="event.stopPropagation(); BattleArena.summonCard('${card.uid}')">⚡ Summon</button>`;
        } else if (needsSacrifice) {
          actionBtnHtml = `<button class="btn-quick-sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('${card.uid}')">💀 Sacrifice &amp; Summon (${cost})</button>`;
        }
      } else if (canPlayStep && isMagic) {
        if (canAffordDirect) {
          actionBtnHtml = `<button class="btn-quick-magic" onclick="event.stopPropagation(); BattleArena.castMagic('${card.uid}')">✨ Cast (${cost})</button>`;
        } else if (needsSacrifice) {
          actionBtnHtml = `<button class="btn-quick-sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('${card.uid}')">💀 Sacrifice &amp; Cast (${cost})</button>`;
        }
      }"""

replacement_render_hand = """  function renderPlayerHand() {
    const handEl = document.getElementById('playerHand');
    if (!handEl) return;
    const isPlayerTurn = DuelState.activePlayer === 'player';
    const currentPhase = DuelState.phases[DuelState.phaseIndex];
    const isMainStep = isPlayerTurn && currentPhase === 'MAIN';
    const isAttackStep = isPlayerTurn && currentPhase === 'ATTACK';

    const { reserve, fieldCores, total: totalAvailableCores } = getPlayerAvailableCores();

    handEl.innerHTML = DuelState.player.hand.map(card => {
      const isSelected = DuelState.selectedPlayerCard && DuelState.selectedPlayerCard.uid === card.uid;
      const isSpirit = card.type === 'Spirit';
      const isMagic = card.type === 'Magic';
      const cost = card.cost || 0;
      const totalNeeded = isSpirit ? cost + 1 : cost;

      // Strict Battle Spirits Rule: Attack step ONLY permits Flash cards!
      const canPlayStep = canPlayCardInCurrentPhase(card);
      const canAfford = canPlayStep && (totalAvailableCores >= totalNeeded);
      const canAffordDirect = canPlayStep && (reserve >= totalNeeded);
      const needsSacrifice = canAfford && !canAffordDirect;

      let cls = `hand-card-item card-theme-${card.color.toLowerCase()}`;
      if (isSelected) cls += ' selected-hand-card';
      if (!canPlayStep) cls += ' cannot-play-step';
      else if (!canAfford) cls += ' cannot-afford';

      let actionBtnHtml = '';
      // Burst can only be set during the MAIN step
      const isBurstCard = card.effect && card.effect.includes('[Burst:');
      const canSetBurst = isMainStep && !DuelState.player.burst && isBurstCard;
      const burstBtnHtml = canSetBurst ? `<button class="btn-set-burst" onclick="event.stopPropagation(); BattleArena.setBurst('${card.uid}')">🔒 Set as Burst</button>` : '';

      if (canPlayStep && isSpirit) {
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
      }"""

# 3. Update renderCardInspector
target_inspector = """    const isPlayerTurn = DuelState.activePlayer === 'player';
    const phase = DuelState.phases[DuelState.phaseIndex];
    const canPlayStep = isPlayerTurn && (phase === 'MAIN' || phase === 'ATTACK');

    const available = getPlayerAvailableCores();
    const canAffordDirect = canPlayStep && (available.reserve >= totalNeeded);
    const canAffordWithSacrifice = canPlayStep && (available.total >= totalNeeded);"""

replacement_inspector = """    const isPlayerTurn = DuelState.activePlayer === 'player';
    const phase = DuelState.phases[DuelState.phaseIndex];
    const canPlayStep = canPlayCardInCurrentPhase(card);

    const available = getPlayerAvailableCores();
    const canAffordDirect = canPlayStep && (available.reserve >= totalNeeded);
    const canAffordWithSacrifice = canPlayStep && (available.total >= totalNeeded);"""

target_inspector_buttons = """    if (isSetBurst) {
      actionBtnHtml = `
        <button class="btn-inspector-action btn-inspect-burst-trigger" onclick="BattleArena.activateBurst('player')">
          ⚡ Trigger Burst Now
        </button>
      `;
    } else if (isInHand) {
      if (canPlayStep && isSpirit) {
        if (canAffordDirect) {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-summon" onclick="BattleArena.summonCard('${card.uid}')">⚡ Summon Spirit (Cost ${cost})</button>`;
        } else if (canAffordWithSacrifice) {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-sac" onclick="BattleArena.openSacrificeModal('${card.uid}')">💀 Sacrifice &amp; Summon (${cost})</button>`;
        } else {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-disabled" disabled>⚠️ Need ${totalNeeded} Cores</button>`;
        }
      } else if (canPlayStep && isMagic) {
        if (canAffordDirect) {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-magic" onclick="BattleArena.castMagic('${card.uid}')">✨ Cast Magic (Cost ${cost})</button>`;
        } else if (canAffordWithSacrifice) {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-sac" onclick="BattleArena.openSacrificeModal('${card.uid}')">💀 Sacrifice &amp; Cast (${cost})</button>`;
        } else {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-disabled" disabled>⚠️ Need ${cost} Cores</button>`;
        }
      }
    }"""

replacement_inspector_buttons = """    if (isSetBurst) {
      actionBtnHtml = `
        <button class="btn-inspector-action btn-inspect-burst-trigger" onclick="BattleArena.activateBurst('player')">
          ⚡ Trigger Burst Now
        </button>
      `;
    } else if (isInHand) {
      if (canPlayStep && isSpirit) {
        const btnText = (phase === 'ATTACK') ? `⚡ Flash Summon (${cost})` : `⚡ Summon Spirit (Cost ${cost})`;
        if (canAffordDirect) {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-summon" onclick="BattleArena.summonCard('${card.uid}')">${btnText}</button>`;
        } else if (canAffordWithSacrifice) {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-sac" onclick="BattleArena.openSacrificeModal('${card.uid}')">💀 Sacrifice &amp; Summon (${cost})</button>`;
        } else {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-disabled" disabled>⚠️ Need ${totalNeeded} Cores</button>`;
        }
      } else if (canPlayStep && isMagic) {
        const btnText = (phase === 'ATTACK') ? `✨ Flash Cast (${cost})` : `✨ Cast Magic (Cost ${cost})`;
        if (canAffordDirect) {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-magic" onclick="BattleArena.castMagic('${card.uid}')">${btnText}</button>`;
        } else if (canAffordWithSacrifice) {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-sac" onclick="BattleArena.openSacrificeModal('${card.uid}')">💀 Sacrifice &amp; Cast (${cost})</button>`;
        } else {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-disabled" disabled>⚠️ Need ${cost} Cores</button>`;
        }
      } else if (!canPlayStep) {
        if (phase === 'ATTACK') {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-disabled" disabled title="Normal cards without [Flash] cannot be played in Attack Step">⚔️ Main Step Only (No Flash)</button>`;
        } else {
          actionBtnHtml = `<button class="btn-inspector-action btn-inspect-disabled" disabled>⏳ Cannot Play in ${phase} Step</button>`;
        }
      }
    }"""

# 4. Update summonCard validation
target_summon_check = """    const phase = DuelState.phases[DuelState.phaseIndex];
    if (phase !== 'MAIN' && phase !== 'ATTACK') {
      showToast("Spirits can only be summoned during MAIN or ATTACK (Flash) steps!", 'warning');
      return;
    }"""

replacement_summon_check = """    const phase = DuelState.phases[DuelState.phaseIndex];
    if (phase !== 'MAIN' && phase !== 'ATTACK') {
      showToast("Spirits can only be summoned during MAIN or ATTACK (Flash) steps!", 'warning');
      return;
    }

    if (phase === 'ATTACK' && !hasFlashTiming(card)) {
      showToast(`Official Rule: Normal Spirits cannot be summoned during the Attack Step! "${card.name}" does not have [Flash] timing.`, 'warning');
      return;
    }"""

# 5. Update openSacrificeModal validation
target_sac_check = """  function openSacrificeModal(uid) {
    const card = DuelState.player.hand.find(c => c.uid === uid);
    if (!card) return;"""

replacement_sac_check = """  function openSacrificeModal(uid) {
    const card = DuelState.player.hand.find(c => c.uid === uid);
    if (!card) return;

    if (!canPlayCardInCurrentPhase(card)) {
      const phase = DuelState.phases[DuelState.phaseIndex];
      showToast(`Official Rule: Cannot summon "${card.name}" during ${phase} Step! Normal cards cannot be played in Attack Step.`, 'warning');
      return;
    }"""

# 6. Update castMagic validation
target_cast_check = """    const phase = DuelState.phases[DuelState.phaseIndex];
    if (phase !== 'MAIN' && phase !== 'ATTACK') {
      showToast("Magic can only be cast during MAIN or ATTACK (Flash) steps!", 'warning');
      return;
    }"""

replacement_cast_check = """    const phase = DuelState.phases[DuelState.phaseIndex];
    if (phase !== 'MAIN' && phase !== 'ATTACK') {
      showToast("Magic can only be cast during MAIN or ATTACK (Flash) steps!", 'warning');
      return;
    }

    if (phase === 'ATTACK' && !hasFlashTiming(card)) {
      showToast(`Official Rule: "${card.name}" does not have [Flash] timing and can only be cast during the MAIN step!`, 'warning');
      return;
    }"""

# 7. Update window.BattleArena exports
target_exports = """    renderCardInspector,
    formatEffectKeywords,"""

replacement_exports = """    renderCardInspector,
    formatEffectKeywords,
    hasFlashTiming,
    canPlayCardInCurrentPhase,"""

content_norm = content.replace('\r\n', '\n')

for t, r, name in [
    (target_helpers_insert, replacement_helpers_insert, 'target_helpers_insert'),
    (target_render_hand, replacement_render_hand, 'target_render_hand'),
    (target_inspector, replacement_inspector, 'target_inspector'),
    (target_inspector_buttons, replacement_inspector_buttons, 'target_inspector_buttons'),
    (target_summon_check, replacement_summon_check, 'target_summon_check'),
    (target_sac_check, replacement_sac_check, 'target_sac_check'),
    (target_cast_check, replacement_cast_check, 'target_cast_check'),
    (target_exports, replacement_exports, 'target_exports')
]:
    t_norm = t.replace('\r\n', '\n')
    r_norm = r.replace('\r\n', '\n')
    assert t_norm in content_norm, f"{name} not found"
    content_norm = content_norm.replace(t_norm, r_norm, 1)

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(content_norm)

print("Successfully updated battle_arena.js with strict Attack Step Flash rules")
