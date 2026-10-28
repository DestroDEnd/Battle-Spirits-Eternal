with open('battle_arena.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update renderDuelTable to call renderBurstZones()
target_render_table = """    // Render Burst Slots in HUDs
    const pBurstEl = document.getElementById('playerBurstSlot');
    if (pBurstEl) {
      if (DuelState.player.burst) {
        pBurstEl.className = 'burst-slot-pill has-burst';
        pBurstEl.innerHTML = `🚨 Burst: [SET 🔒]`;
        pBurstEl.title = `Your Set Burst: "${DuelState.player.burst.name}" (Click to inspect)`;
      } else {
        pBurstEl.className = 'burst-slot-pill';
        pBurstEl.innerHTML = `🔒 Burst: Empty`;
        pBurstEl.title = 'No Burst card currently set';
      }
    }
    const oBurstEl = document.getElementById('opponentBurstSlot');
    if (oBurstEl) {
      if (DuelState.opponent.burst) {
        oBurstEl.className = 'burst-slot-pill has-burst';
        oBurstEl.innerHTML = `🚨 Burst: [SET 🔒]`;
        oBurstEl.title = 'Opponent has set a secret Burst card!';
      } else {
        oBurstEl.className = 'burst-slot-pill';
        oBurstEl.innerHTML = `🔒 Burst: Empty`;
        oBurstEl.title = 'Opponent Burst Slot is empty';
      }
    }"""

replacement_render_table = """    // Render Burst Zones (Battlefield & HUDs)
    renderBurstZones();"""

# 2. Implement renderBurstZones() right after renderDuelTable
target_render_burst_insert = """    // Update Right Column Step Navigator
    renderStepNavigator();
  }"""

replacement_render_burst_insert = """    // Update Right Column Step Navigator
    renderStepNavigator();
  }

  function renderBurstZones() {
    // 1. Render Player Battlefield Burst Zone
    const pZone = document.getElementById('playerBurstZone');
    if (pZone) {
      if (DuelState.player.burst) {
        const b = DuelState.player.burst;
        const colorLower = (b.color || 'Red').toLowerCase();
        pZone.className = 'burst-field-zone player-burst-zone has-burst';
        pZone.innerHTML = `
          <div class="burst-zone-inner active">
            <div class="burst-zone-header">
              <span class="burst-zone-badge">BURST READY</span>
              <span class="burst-pulse-dot"></span>
            </div>
            <div class="burst-card-display">
              <div class="burst-card-thumb card-theme-${colorLower}">
                <img src="${b.image_url}" alt="${b.name}" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='/assets/card_back.png';" />
                <div class="burst-card-overlay">
                  <span class="burst-lock-tag">🔒 SET</span>
                </div>
              </div>
            </div>
            <div class="burst-info-block">
              <div class="burst-card-name" title="${b.name}">${b.name}</div>
              <div class="burst-card-type">${b.type} • Cost ${b.cost}</div>
            </div>
            <div class="burst-btn-group">
              <button class="btn-burst-view" onclick="event.stopPropagation(); BattleArena.inspectBurst();" title="Inspect card details">👁️ View</button>
              <button class="btn-burst-trigger" onclick="event.stopPropagation(); BattleArena.activateBurst('player');" title="Activate Burst effect now">⚡ Trigger</button>
            </div>
          </div>
        `;
      } else {
        pZone.className = 'burst-field-zone player-burst-zone empty';
        pZone.innerHTML = `
          <div class="burst-zone-inner empty">
            <div class="burst-zone-badge empty">BURST ZONE</div>
            <div class="burst-empty-icon">🔒</div>
            <div class="burst-empty-title">Burst Slot</div>
            <div class="burst-empty-sub">Empty (Set [Burst:] here)</div>
          </div>
        `;
      }
    }

    // 2. Render Opponent Battlefield Burst Zone
    const oZone = document.getElementById('opponentBurstZone');
    if (oZone) {
      if (DuelState.opponent.burst) {
        oZone.className = 'burst-field-zone opponent-burst-zone has-burst';
        oZone.innerHTML = `
          <div class="burst-zone-inner active opponent">
            <div class="burst-zone-header">
              <span class="burst-zone-badge opponent">OPPONENT BURST</span>
              <span class="burst-pulse-dot opp"></span>
            </div>
            <div class="burst-card-display">
              <div class="burst-card-thumb opp-back">
                <div class="burst-card-back-sigil">💥</div>
                <div class="burst-lock-tag">🔒 SECRET</div>
              </div>
            </div>
            <div class="burst-info-block">
              <div class="burst-card-name">Face-Down Trap</div>
              <div class="burst-card-type">Triggers on Life Damage</div>
            </div>
          </div>
        `;
      } else {
        oZone.className = 'burst-field-zone opponent-burst-zone empty';
        oZone.innerHTML = `
          <div class="burst-zone-inner empty">
            <div class="burst-zone-badge empty">BURST ZONE</div>
            <div class="burst-empty-icon">🔒</div>
            <div class="burst-empty-title">Opponent Slot</div>
            <div class="burst-empty-sub">Empty</div>
          </div>
        `;
      }
    }

    // 3. Keep HUD pills in sync as well
    const pBurstEl = document.getElementById('playerBurstSlot');
    if (pBurstEl) {
      if (DuelState.player.burst) {
        pBurstEl.className = 'burst-slot-pill has-burst';
        pBurstEl.innerHTML = `🚨 Burst: [${DuelState.player.burst.name}]`;
        pBurstEl.title = `Your Set Burst: "${DuelState.player.burst.name}" (Click to inspect or activate)`;
      } else {
        pBurstEl.className = 'burst-slot-pill';
        pBurstEl.innerHTML = `🔒 Burst: Empty`;
        pBurstEl.title = 'No Burst card currently set';
      }
    }
    const oBurstEl = document.getElementById('opponentBurstSlot');
    if (oBurstEl) {
      if (DuelState.opponent.burst) {
        oBurstEl.className = 'burst-slot-pill has-burst';
        oBurstEl.innerHTML = `🚨 Burst: [SET 💥]`;
        oBurstEl.title = 'Opponent has set a secret Burst card!';
      } else {
        oBurstEl.className = 'burst-slot-pill';
        oBurstEl.innerHTML = `🔒 Burst: Empty`;
        oBurstEl.title = 'Opponent Burst Slot is empty';
      }
    }
  }"""

# 3. Update renderCardInspector to handle isSetBurst
target_inspector_burst = """    // Action button if in hand
    let actionBtnHtml = '';
    const isInHand = (DuelState.player.hand || []).some(c => c.uid === card.uid);
    const isBurstCard = card.effect && card.effect.includes('[Burst:');
    const canSetBurst = isInHand && isPlayerTurn && !DuelState.player.burst && isBurstCard;
    const burstBtnHtml = canSetBurst ? `
      <button class="btn-inspector-action btn-inspect-burst" onclick="BattleArena.setBurst('${card.uid}')">
        🔒 Set as Burst
      </button>
    ` : '';

    if (isInHand) {"""

replacement_inspector_burst = """    // Action button
    let actionBtnHtml = '';
    const isInHand = (DuelState.player.hand || []).some(c => c.uid === card.uid);
    const isSetBurst = DuelState.player.burst && card.uid === DuelState.player.burst.uid;
    const isBurstCard = card.effect && card.effect.includes('[Burst:');
    const canSetBurst = isInHand && isPlayerTurn && !DuelState.player.burst && isBurstCard;
    const burstBtnHtml = canSetBurst ? `
      <button class="btn-inspector-action btn-inspect-burst" onclick="BattleArena.setBurst('${card.uid}')">
        🔒 Set as Burst
      </button>
    ` : '';

    if (isSetBurst) {
      actionBtnHtml = `
        <button class="btn-inspector-action btn-inspect-burst-trigger" onclick="BattleArena.activateBurst('player')">
          ⚡ Trigger Burst Now
        </button>
      `;
    } else if (isInHand) {"""

# 4. Update applyMagicEffect with side support
target_apply_magic = """  function applyMagicEffect(card) {
    let effectDesc = '';
    if (card.name.includes('Draw')) {
      const d1 = DuelState.player.deck.shift();
      const d2 = DuelState.player.deck.shift();
      if (d1) DuelState.player.hand.push(d1);
      if (d2) DuelState.player.hand.push(d2);
      effectDesc = 'Drew 2 cards from deck!';
    } else if (card.name.includes('Flame') || card.name.includes('Bomb') || card.name.includes('Tempest')) {
      if (DuelState.opponent.field.length) {
        DuelState.opponent.field.sort((a, b) => a.currentBp - b.currentBp);
        const destroyed = DuelState.opponent.field.shift();
        DuelState.opponent.reserve += destroyed.currentCores;
        DuelState.opponent.trash += 1;
        effectDesc = `Incinerated opponent's "${destroyed.name}" (${destroyed.currentBp} BP)! Cores returned to opponent reserve.`;
      } else {
        effectDesc = 'No opponent spirits on field to destroy.';
      }
    } else {
      DuelState.player.field.forEach(s => s.currentBp += 3000);
      effectDesc = 'Granted +3000 BP to all active allied spirits!';
    }
    return effectDesc;
  }"""

replacement_apply_magic = """  function applyMagicEffect(card, side = 'player') {
    let effectDesc = '';
    const isPlayer = side === 'player';
    const myDeck = isPlayer ? DuelState.player.deck : DuelState.opponent.deck;
    const myHand = isPlayer ? DuelState.player.hand : DuelState.opponent.hand;
    const enemyField = isPlayer ? DuelState.opponent.field : DuelState.player.field;
    const enemyReserve = isPlayer ? DuelState.opponent : DuelState.player;
    const myField = isPlayer ? DuelState.player.field : DuelState.opponent.field;

    if (card.name.includes('Draw')) {
      const d1 = myDeck.shift();
      const d2 = myDeck.shift();
      if (d1) myHand.push(d1);
      if (d2) myHand.push(d2);
      effectDesc = `${isPlayer ? 'You drew' : 'Opponent drew'} 2 cards from deck!`;
    } else if (card.name.includes('Flame') || card.name.includes('Bomb') || card.name.includes('Tempest')) {
      if (enemyField.length) {
        enemyField.sort((a, b) => a.currentBp - b.currentBp);
        const destroyed = enemyField.shift();
        enemyReserve.reserve += destroyed.currentCores;
        enemyReserve.trash += 1;
        effectDesc = `Incinerated enemy "${destroyed.name}" (${destroyed.currentBp} BP)! Cores returned to reserve.`;
      } else {
        effectDesc = 'No enemy spirits on field to destroy.';
      }
    } else {
      myField.forEach(s => s.currentBp += 3000);
      effectDesc = `Granted +3000 BP to all active ${isPlayer ? 'allied' : 'opponent'} spirits!`;
    }
    return effectDesc;
  }"""

# 5. Update setBurst, inspectBurst, inspectOpponentBurst, activateBurst, checkBurstTrigger
target_burst_system = """  // ── BURST SYSTEM ──
  function setBurst(uid) {
    if (DuelState.activePlayer !== 'player') {
      showToast("Cannot set Burst on opponent's turn!", 'warning');
      return;
    }
    if (DuelState.player.burst) {
      showToast("You already have a Burst set in your Burst Zone!", 'warning');
      return;
    }
    const idx = DuelState.player.hand.findIndex(c => c.uid === uid);
    if (idx === -1) return;
    const card = DuelState.player.hand.splice(idx, 1)[0];
    DuelState.player.burst = card;

    AudioFX.shield();
    addLog(`🔒 **BURST SET**: Set "${card.name}" face-down in your Burst Zone!`, 'step');
    renderDuelTable();
  }

  function inspectBurst() {
    if (!DuelState.player.burst) {
      showToast("Your Burst Slot is empty. Set a card with [Burst:] here!", 'info');
      return;
    }
    const b = DuelState.player.burst;
    showToast(`🔒 Your Set Burst: "${b.name}" (${b.type}, Cost ${b.cost})`, 'info');
  }

  function checkBurstTrigger(side) {
    const burstCard = side === 'player' ? DuelState.player.burst : DuelState.opponent.burst;
    if (!burstCard) return;

    const eff = burstCard.effect || '';
    if (eff.includes('After your Life is reduced') || eff.includes('Burst: s') || eff.includes('After an opposing')) {
      if (side === 'player') DuelState.player.burst = null;
      else DuelState.opponent.burst = null;

      addLog(`🚨 **[BURST ACTIVATED]**: "${burstCard.name}" triggered in response to Life damage!`, 'magic');
      AudioFX.slash();

      if (burstCard.type === 'Spirit') {
        const coresToPlace = 1;
        const { level, bp } = calculateBpAndLevel(burstCard.levels, coresToPlace);
        burstCard.currentCores = coresToPlace;
        burstCard.currentLevel = level;
        burstCard.currentBp = bp;
        burstCard.isExhausted = false;
        burstCard.hasAttacked = false;

        const targetField = side === 'player' ? DuelState.player.field : DuelState.opponent.field;
        targetField.push(burstCard);
        setTimeout(() => AudioFX.summon(), 180);
        addLog(`✨ **BURST SUMMON**: "${burstCard.name}" summoned to the field for free (Lv${level}, ${bp} BP)!`, 'step');
      } else if (burstCard.type === 'Magic') {
        setTimeout(() => AudioFX.coreChime(), 180);
        const desc = applyMagicEffect(burstCard);
        addLog(`🔮 **BURST MAGIC**: "${burstCard.name}" activated its effect! ${desc}`, 'magic');
      }
      renderDuelTable();
    }
  }"""

replacement_burst_system = """  // ── BURST SYSTEM (DEDICATED BURST ZONE & SINGLE-USE ACTIVATION) ──
  function setBurst(uid) {
    if (DuelState.activePlayer !== 'player') {
      showToast("Cannot set Burst on opponent's turn!", 'warning');
      return;
    }
    if (DuelState.player.burst) {
      showToast("You already have a Burst set in your Burst Zone! Only 1 Burst allowed.", 'warning');
      return;
    }
    const idx = DuelState.player.hand.findIndex(c => c.uid === uid);
    if (idx === -1) return;
    const card = DuelState.player.hand.splice(idx, 1)[0];
    DuelState.player.burst = card;

    // Immediately update inspector to the set burst card so it reflects its new status
    DuelState.selectedPlayerCard = card;

    AudioFX.shield();
    addLog(`🔒 **BURST SET**: Set "${card.name}" face-down in your Burst Zone!`, 'step');
    renderDuelTable();
  }

  function inspectBurst() {
    if (!DuelState.player.burst) {
      showToast("Your Burst Zone is empty. Set a card with [Burst:] here!", 'info');
      return;
    }
    const b = DuelState.player.burst;
    DuelState.selectedPlayerCard = b;
    renderCardInspector();
    openCardDetail(b.name);
  }

  function inspectOpponentBurst() {
    if (!DuelState.opponent.burst) {
      showToast("Opponent's Burst Zone is currently empty.", 'info');
      return;
    }
    showToast("🔒 Opponent has set a secret face-down Burst trap! It will trigger on Life damage.", 'warning');
  }

  function activateBurst(side = 'player') {
    const isPlayer = side === 'player';
    const burstCard = isPlayer ? DuelState.player.burst : DuelState.opponent.burst;
    if (!burstCard) {
      if (isPlayer) showToast("No Burst card is currently set!", 'info');
      return;
    }

    // 1. Immediately consume from Burst Zone to guarantee it cannot be duplicated or re-triggered
    if (isPlayer) DuelState.player.burst = null;
    else DuelState.opponent.burst = null;

    if (DuelState.selectedPlayerCard && DuelState.selectedPlayerCard.uid === burstCard.uid) {
      DuelState.selectedPlayerCard = null;
    }

    AudioFX.burstIgnite();
    addLog(`🚨 **[BURST ACTIVATED]**: "${burstCard.name}" triggered by ${isPlayer ? 'Player' : 'Opponent'}!`, 'magic');

    // 2. Resolve effect based on card type without duplicating
    if (burstCard.type === 'Spirit') {
      const targetField = isPlayer ? DuelState.player.field : DuelState.opponent.field;
      // Prevent duplicate spirits if already on field
      if (!targetField.some(s => s.uid === burstCard.uid)) {
        const coresToPlace = 1;
        const { level, bp } = calculateBpAndLevel(burstCard.levels, coresToPlace);
        burstCard.currentCores = coresToPlace;
        burstCard.currentLevel = level;
        burstCard.currentBp = bp;
        burstCard.isExhausted = false;
        burstCard.hasAttacked = false;
        targetField.push(burstCard);
        setTimeout(() => AudioFX.summon(), 180);
        addLog(`✨ **BURST SUMMON**: "${burstCard.name}" summoned to the battle line for free (Lv${level}, ${bp} BP)!`, 'step');
      }
    } else if (burstCard.type === 'Magic') {
      setTimeout(() => AudioFX.coreChime(), 180);
      const desc = applyMagicEffect(burstCard, side);
      // Consume magic card to trash
      if (isPlayer) DuelState.player.trash += 1;
      else DuelState.opponent.trash += 1;
      addLog(`🔮 **BURST MAGIC**: "${burstCard.name}" resolved its effect! ${desc}`, 'magic');
    }

    renderDuelTable();
  }

  function checkBurstTrigger(side) {
    const burstCard = side === 'player' ? DuelState.player.burst : DuelState.opponent.burst;
    if (!burstCard) return;

    const eff = burstCard.effect || '';
    if (eff.includes('After your Life is reduced') || eff.includes('Burst: s') || eff.includes('After an opposing') || eff.includes('Burst:')) {
      activateBurst(side);
    }
  }"""

# 6. Update exports in window.BattleArena
target_exports = """    setBurst,
    inspectBurst,"""

replacement_exports = """    setBurst,
    inspectBurst,
    inspectOpponentBurst,
    activateBurst,
    renderBurstZones,"""

content_norm = content.replace('\r\n', '\n')

for t, r, name in [
    (target_render_table, replacement_render_table, 'target_render_table'),
    (target_render_burst_insert, replacement_render_burst_insert, 'target_render_burst_insert'),
    (target_inspector_burst, replacement_inspector_burst, 'target_inspector_burst'),
    (target_apply_magic, replacement_apply_magic, 'target_apply_magic'),
    (target_burst_system, replacement_burst_system, 'target_burst_system'),
    (target_exports, replacement_exports, 'target_exports')
]:
    t_norm = t.replace('\r\n', '\n')
    r_norm = r.replace('\r\n', '\n')
    assert t_norm in content_norm, f"{name} not found"
    content_norm = content_norm.replace(t_norm, r_norm, 1)

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(content_norm)

print("Successfully updated battle_arena.js with Burst Zone and anti-duplication logic")
