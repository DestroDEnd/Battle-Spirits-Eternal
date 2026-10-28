with open('battle_arena.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update prepareDeck
target_prepare = """    // Prepare card instances with UIDs and parsed levels
    let uidCounter = 1;
    const prepareDeck = (cardsList) => {
      return cardsList.map(c => {
        const pLevels = c.parsed_levels || parseLevels(c.levels);
        return {
          uid: 'c_' + (uidCounter++),
          name: c.name,
          cost: c.cost !== undefined ? c.cost : 2,
          type: c.type || 'Spirit',
          color: c.color || 'Red',
          card_number: c.card_number || '',
          image_url: c.image_url || '/assets/card_back.png',
          levels: pLevels,
          effect: c.effect || '',
          currentCores: 0,
          currentLevel: 1,
          currentBp: pLevels[0]?.bp || 2000,
          isExhausted: false,
          hasAttacked: false
        };
      });
    };"""

replacement_prepare = """    // Prepare card instances with UIDs and parsed levels
    let uidCounter = 1;
    const prepareDeck = (cardsList) => {
      return cardsList.map(c => {
        const pLevels = c.parsed_levels || parseLevels(c.levels);
        return {
          uid: 'c_' + (uidCounter++),
          name: c.name,
          kanji: c.kanji || c.jpname || '',
          cost: c.cost !== undefined ? c.cost : 2,
          type: c.type || 'Spirit',
          color: c.color || 'Red',
          family: c.family || (c.families ? c.families.join(', ') : ''),
          rarity: c.rarity || '',
          flavor: c.flavor || '',
          card_number: c.card_number || '',
          image_url: c.image_url || '/assets/card_back.png',
          levels: pLevels,
          raw_levels: c.levels || '',
          effect: c.effect || '',
          summary: c.summary || '',
          currentCores: 0,
          currentLevel: 1,
          currentBp: pLevels[0]?.bp || 2000,
          isExhausted: false,
          hasAttacked: false
        };
      });
    };"""

# 2. Update renderDuelTable to call renderCardInspector()
target_render_table = """    // Render Player Hand Cards
    renderPlayerHand();

    // Render Clash Banner if combat active
    renderClashZone();"""

replacement_render_table = """    // Render Player Hand Cards
    renderPlayerHand();

    // Render In-Duel Card Details Inspector
    renderCardInspector();

    // Render Clash Banner if combat active
    renderClashZone();"""

# 3. Update renderFieldSpirit to add zoom button
target_field_spirit = """    return `
      <div class="${classes}" id="spirit_${spirit.uid}" onclick="BattleArena.handleSpiritClick('${spirit.uid}', '${side}')">
        <div class="fsc-top">"""

replacement_field_spirit = """    const safeSpName = (spirit.name || '').replace(/'/g, "\\\\'");
    return `
      <div class="${classes}" id="spirit_${spirit.uid}" onclick="BattleArena.handleSpiritClick('${spirit.uid}', '${side}')">
        <button class="fsc-zoom-btn" onclick="event.stopPropagation(); openCardDetail('${safeSpName}')" title="Inspect Card Details">🔍</button>
        <div class="fsc-top">"""

# 4. Update renderPlayerHand to add zoom button
target_player_hand = """      return `
        <div class="${cls}" onclick="BattleArena.selectHandCard('${card.uid}')">
          <div class="hc-cost-badge">${card.cost}</div>"""

replacement_player_hand = """      const safeCardName = (card.name || '').replace(/'/g, "\\\\'");
      return `
        <div class="${cls}" onclick="BattleArena.selectHandCard('${card.uid}')">
          <button class="hc-zoom-btn" onclick="event.stopPropagation(); openCardDetail('${safeCardName}')" title="View Full Card Details">🔍</button>
          <div class="hc-cost-badge">${card.cost}</div>"""

# 5. Update selectHandCard and add deselectCard & renderCardInspector
target_select = """  // ── PLAYER ACTIONS ──
  function selectHandCard(uid) {
    const card = DuelState.player.hand.find(c => c.uid === uid);
    if (!card) return;
    DuelState.selectedPlayerCard = card;
    renderDuelTable();
  }"""

replacement_select = """  // ── PLAYER ACTIONS & CARD INSPECTION ──
  function formatEffectKeywords(text) {
    if (!text) return '<span style="color:var(--muted);font-style:italic;">No special abilities or keywords.</span>';
    let safe = (window.esc ? window.esc(text) : String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;'));
    safe = safe.replace(/\\[(Clash|Curse|Crush|Armor:[^\\]]+|Burst:[^\\]]+|Flash|When Attacks|When Destroyed|When Summoned)\\]/gi, (match) => {
      let cls = 'kw-generic';
      const low = match.toLowerCase();
      if (low.includes('clash')) cls = 'kw-clash';
      else if (low.includes('curse')) cls = 'kw-curse';
      else if (low.includes('crush')) cls = 'kw-crush';
      else if (low.includes('burst')) cls = 'kw-burst';
      else if (low.includes('flash')) cls = 'kw-flash';
      return `<span class="effect-keyword-pill ${cls}">${match}</span>`;
    });
    return safe.replace(/\\n/g, '<br>');
  }

  function renderCardInspector() {
    const inspectorEl = document.getElementById('cardInspectorTray');
    if (!inspectorEl) return;

    const card = DuelState.selectedPlayerCard;
    if (!card) {
      inspectorEl.innerHTML = `
        <div class="inspector-placeholder">
          <div class="inspector-placeholder-icon">🎴</div>
          <div class="inspector-placeholder-text">
            <div class="inspector-placeholder-title">Card Details Inspector</div>
            <div class="inspector-placeholder-desc">Click any card in your hand or spirit on the battlefield to inspect complete effects, level requirements, BP, and keywords.</div>
          </div>
        </div>
      `;
      return;
    }

    const isSpirit = card.type === 'Spirit';
    const isMagic = card.type === 'Magic';
    const cost = card.cost !== undefined ? card.cost : 0;
    const totalNeeded = isSpirit ? cost + 1 : cost;

    const isPlayerTurn = DuelState.activePlayer === 'player';
    const phase = DuelState.phases[DuelState.phaseIndex];
    const canPlayStep = isPlayerTurn && (phase === 'MAIN' || phase === 'ATTACK');

    const available = getPlayerAvailableCores();
    const canAffordDirect = canPlayStep && (available.reserve >= totalNeeded);
    const canAffordWithSacrifice = canPlayStep && (available.total >= totalNeeded);

    // Levels breakdown HTML
    let levelsHtml = '';
    if (card.levels && Array.isArray(card.levels) && card.levels.length) {
      levelsHtml = `
        <div class="inspector-levels-table">
          ${card.levels.map(l => `
            <div class="inspector-level-pill">
              <span class="ilp-lvl">LV${l.level}</span>
              <span class="ilp-cores">🔮 ${l.cores} ${l.cores === 1 ? 'core' : 'cores'}</span>
              <span class="ilp-bp">⚡ ${l.bp} BP</span>
            </div>
          `).join('')}
        </div>
      `;
    } else if (card.raw_levels) {
      levelsHtml = `<div class="inspector-level-pill" style="margin:0.2rem 0;font-size:0.7rem;">${card.raw_levels}</div>`;
    }

    const safeName = (card.name || '').replace(/'/g, "\\\\'");
    const effectHtml = formatEffectKeywords(card.effect || card.summary || '');

    // Action button if in hand
    let actionBtnHtml = '';
    const isInHand = (DuelState.player.hand || []).some(c => c.uid === card.uid);
    const isBurstCard = card.effect && card.effect.includes('[Burst:');
    const canSetBurst = isInHand && isPlayerTurn && !DuelState.player.burst && isBurstCard;
    const burstBtnHtml = canSetBurst ? `
      <button class="btn-inspector-action btn-inspect-burst" onclick="BattleArena.setBurst('${card.uid}')">
        🔒 Set as Burst
      </button>
    ` : '';

    if (isInHand) {
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
    } else {
      // On battlefield spirit
      actionBtnHtml = `<div style="font-size:0.7rem;text-align:center;color:#60a5fa;font-weight:700;padding:0.3rem 0;">⚔️ Current BP: ${card.currentBp || card.bp || '—'} (LV${card.currentLevel || 1})</div>`;
    }

    const cardColor = (card.color || 'Red').toLowerCase();

    inspectorEl.innerHTML = `
      <div class="inspector-card-view card-theme-${cardColor}">
        <!-- Left: Card Artwork Thumbnail & Enlarge -->
        <div class="inspector-art-col">
          <div class="inspector-art-wrap">
            <img src="${card.image_url}" alt="${card.name}" referrerpolicy="no-referrer" onerror="if(!this.dataset.retried && this.src.startsWith('http')){this.dataset.retried='1'; this.src='/api/proxy-image?url=' + encodeURIComponent(this.src);} else { this.onerror=null; this.src='/assets/card_back.png'; }" />
          </div>
          <button class="btn-inspector-zoom" onclick="openCardDetail('${safeName}')" title="Open Fullscreen Card Modal">
            🔍 Enlarge
          </button>
        </div>

        <!-- Middle: Card Metadata, Levels & Effect -->
        <div class="inspector-info-col">
          <div class="inspector-header">
            <div class="inspector-title-row">
              <span class="inspector-card-name">${card.name}</span>
              ${card.kanji ? `<span class="inspector-jp-name">${card.kanji}</span>` : ''}
            </div>
            <button class="btn-inspector-close" onclick="BattleArena.deselectCard()" title="Close details tray">&times;</button>
          </div>

          <div class="inspector-badges-row">
            <span class="badge badge-cost">Cost ${cost}</span>
            <span class="badge badge-color-${cardColor} badge-color">${card.color || 'Neutral'}</span>
            <span class="badge badge-type">${card.type || 'Spirit'}</span>
            ${card.family ? `<span class="badge badge-family">${card.family}</span>` : ''}
            ${card.card_number ? `<span class="badge badge-number"># ${card.card_number}</span>` : ''}
            ${card.rarity ? `<span class="badge badge-rarity">${card.rarity}</span>` : ''}
          </div>

          ${levelsHtml}

          <div class="inspector-effect-wrapper">
            <div class="inspector-section-label">Effect &amp; Abilities:</div>
            <div class="inspector-effect-content">${effectHtml}</div>
          </div>

          ${card.flavor ? `
            <div class="inspector-flavor-content">"${card.flavor}"</div>
          ` : ''}
        </div>

        <!-- Right: Action Buttons -->
        <div class="inspector-actions-col">
          <div class="inspector-actions-title">Duel Actions</div>
          ${actionBtnHtml}
          ${burstBtnHtml}
          <button class="btn-inspector-action btn-inspect-modal" onclick="openCardDetail('${safeName}')">
            📖 Card Details Modal
          </button>
          <button class="btn-inspector-action btn-inspect-cancel" onclick="BattleArena.deselectCard()">
            ✕ Dismiss
          </button>
        </div>
      </div>
    `;
  }

  function selectHandCard(uid) {
    const card = DuelState.player.hand.find(c => c.uid === uid);
    if (!card) return;
    DuelState.selectedPlayerCard = card;
    AudioFX.buttonTick();
    renderPlayerHand();
    renderCardInspector();
    openCardDetail(card.name);
  }

  function deselectCard() {
    DuelState.selectedPlayerCard = null;
    renderPlayerHand();
    renderCardInspector();
  }"""

# 6. Update handleSpiritClick
target_spirit_click = """        } else {
          showToast('No free cores left in Reserve to add!', 'info');
        }
      }
    } else if (side === 'opponent') {
      // Clicked opponent spirit
      const spirit = DuelState.opponent.field.find(s => s.uid === uid);
      if (spirit) {
        showToast(`Opponent: ${spirit.name} • Lv${spirit.currentLevel} • ${spirit.currentBp} BP (${spirit.isExhausted ? 'Exhausted' : 'Ready'})`, 'info');
      }
    }"""

replacement_spirit_click = """        } else {
          DuelState.selectedPlayerCard = spirit;
          renderCardInspector();
          openCardDetail(spirit.name);
        }
      }
    } else if (side === 'opponent') {
      // Clicked opponent spirit - inspect full card details!
      const spirit = DuelState.opponent.field.find(s => s.uid === uid);
      if (spirit) {
        DuelState.selectedPlayerCard = spirit;
        renderCardInspector();
        openCardDetail(spirit.name);
      }
    }"""

# 7. Update window.BattleArena exports
target_exports = """    hasCrush,
    hasArmor,
    getWhenAttacksBpBoost,
    getAttackSymbols,
    selectHandCard,
    summonCard,"""

replacement_exports = """    hasCrush,
    hasArmor,
    getWhenAttacksBpBoost,
    getAttackSymbols,
    selectHandCard,
    deselectCard,
    renderCardInspector,
    formatEffectKeywords,
    getPlayerAvailableCores,
    summonCard,"""

content_norm = content.replace('\r\n', '\n')

for t, r, name in [
    (target_prepare, replacement_prepare, 'target_prepare'),
    (target_render_table, replacement_render_table, 'target_render_table'),
    (target_field_spirit, replacement_field_spirit, 'target_field_spirit'),
    (target_player_hand, replacement_player_hand, 'target_player_hand'),
    (target_select, replacement_select, 'target_select'),
    (target_spirit_click, replacement_spirit_click, 'target_spirit_click'),
    (target_exports, replacement_exports, 'target_exports'),
]:
    t_norm = t.replace('\r\n', '\n')
    r_norm = r.replace('\r\n', '\n')
    assert t_norm in content_norm, f"{name} not found in battle_arena.js"
    content_norm = content_norm.replace(t_norm, r_norm, 1)

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(content_norm)

print("Successfully updated battle_arena.js")
