with open('battle_arena.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Grab lines 0 to 2440 (up to and including scrollToBattleArena)
top_lines = lines[:2440]

tail = """
  // ── ZONE VIEWER MODAL CONTROLLERS (TRASH & VOID) ──
  function openZoneModal(tab = 'player-trash') {
    DuelState.currentZoneTab = tab;
    renderZoneModal();
    const modalEl = document.getElementById('battleZoneModal');
    if (modalEl) modalEl.style.display = 'flex';
    AudioFX.buttonTick();
  }

  function closeZoneModal() {
    const modalEl = document.getElementById('battleZoneModal');
    if (modalEl) modalEl.style.display = 'none';
    AudioFX.buttonTick();
  }

  function closeZoneModalBg(e) {
    if (e.target && e.target.id === 'battleZoneModal') {
      closeZoneModal();
    }
  }

  function switchZoneTab(tab) {
    DuelState.currentZoneTab = tab;
    AudioFX.buttonTick();
    renderZoneModal();
  }

  function inspectZoneCard(cardName) {
    const decoded = decodeURIComponent(cardName);
    openCardDetail(decoded);
  }

  function renderZoneModal() {
    const tab = DuelState.currentZoneTab || 'player-trash';
    const pTrash = DuelState.player.trashCards || [];
    const oTrash = DuelState.opponent.trashCards || [];
    const pVoid = DuelState.player.voidCards || [];
    const oVoid = DuelState.opponent.voidCards || [];
    const totalVoidCards = pVoid.length + oVoid.length;

    // Update tab count badges
    const pCountEl = document.getElementById('tabCountPlayerTrash');
    if (pCountEl) pCountEl.textContent = pTrash.length;
    const oCountEl = document.getElementById('tabCountOpponentTrash');
    if (oCountEl) oCountEl.textContent = oTrash.length;
    const vCountEl = document.getElementById('tabCountVoid');
    if (vCountEl) vCountEl.textContent = totalVoidCards;

    // Update active tab buttons
    const btnPT = document.getElementById('tabPlayerTrash');
    if (btnPT) btnPT.classList.toggle('active', tab === 'player-trash');
    const btnOT = document.getElementById('tabOpponentTrash');
    if (btnOT) btnOT.classList.toggle('active', tab === 'opponent-trash');
    const btnV = document.getElementById('tabVoid');
    if (btnV) btnV.classList.toggle('active', tab === 'void');

    // Update Title & Subtitle
    const titleEl = document.getElementById('zoneModalTitle');
    const subEl = document.getElementById('zoneModalSubtitle');
    const bodyEl = document.getElementById('zoneModalBody');
    if (!bodyEl) return;

    if (tab === 'player-trash') {
      if (titleEl) titleEl.textContent = '🪦 Your Trash (Graveyard)';
      if (subEl) subEl.textContent = `Cards and spirits sent to your graveyard (${pTrash.length} Card${pTrash.length === 1 ? '' : 's'} • ${DuelState.player.trash} Core${DuelState.player.trash === 1 ? '' : 's'} currently in Trash)`;
      if (!pTrash.length) {
        bodyEl.innerHTML = `
          <div class="zone-empty-state">
            <div class="zone-empty-icon">🪦</div>
            <div class="zone-empty-text">Your Trash is Empty</div>
            <div class="zone-empty-subtext">Spirits destroyed in battle, depleted of cores by sacrifices, or used magic spells will be placed here.</div>
          </div>
        `;
      } else {
        bodyEl.innerHTML = `
          <div class="zone-cards-grid">
            ${pTrash.map(c => `
              <div class="zone-card-item" onclick="BattleArena.inspectZoneCard('${encodeURIComponent(c.name)}')" title="Click to inspect full details of ${c.name}">
                <img src="${c.image_url || '/placeholder.png'}" class="zone-card-thumb" alt="${c.name}" onerror="this.src='/placeholder.png';">
                <div class="zone-card-info">
                  <div class="zone-card-name">${c.name}</div>
                  <div class="zone-card-sub">
                    <span>${c.type || 'Card'}</span>
                    <span>Cost ${c.cost ?? 0}</span>
                  </div>
                  ${c.graveyardReason ? `<div class="zone-card-reason" title="${c.graveyardReason}">🪦 ${c.graveyardReason}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }
    } else if (tab === 'opponent-trash') {
      if (titleEl) titleEl.textContent = `💀 Opponent's Trash (Graveyard)`;
      if (subEl) subEl.textContent = `Cards and spirits sent to opponent's graveyard (${oTrash.length} Card${oTrash.length === 1 ? '' : 's'} • ${DuelState.opponent.trash} Core${DuelState.opponent.trash === 1 ? '' : 's'} currently in Trash)`;
      if (!oTrash.length) {
        bodyEl.innerHTML = `
          <div class="zone-empty-state">
            <div class="zone-empty-icon">💀</div>
            <div class="zone-empty-text">Opponent's Trash is Empty</div>
            <div class="zone-empty-subtext">No enemy spirits have fallen or been milled to the graveyard yet.</div>
          </div>
        `;
      } else {
        bodyEl.innerHTML = `
          <div class="zone-cards-grid">
            ${oTrash.map(c => `
              <div class="zone-card-item" onclick="BattleArena.inspectZoneCard('${encodeURIComponent(c.name)}')" title="Click to inspect full details of ${c.name}">
                <img src="${c.image_url || '/placeholder.png'}" class="zone-card-thumb" alt="${c.name}" onerror="this.src='/placeholder.png';">
                <div class="zone-card-info">
                  <div class="zone-card-name">${c.name}</div>
                  <div class="zone-card-sub">
                    <span>${c.type || 'Card'}</span>
                    <span>Cost ${c.cost ?? 0}</span>
                  </div>
                  ${c.graveyardReason ? `<div class="zone-card-reason" title="${c.graveyardReason}">🪦 ${c.graveyardReason}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }
    } else if (tab === 'void') {
      if (titleEl) titleEl.textContent = '🌌 The Void (Cosmic Reservoir & Removed Zone)';
      if (subEl) subEl.textContent = 'Infinite source of Cores and the dimensional void for banished cards';
      const allVoidCards = [...pVoid, ...oVoid];
      
      let voidHtml = `
        <div class="void-cosmic-overview">
          <div class="void-cosmic-banner">
            <div class="void-cosmic-icon">🌌</div>
            <div class="void-cosmic-text">
              <div class="void-cosmic-title">Cosmic Void Reservoir (ボイド)</div>
              <div class="void-cosmic-desc">
                In official Battle Spirits rules, The Void is the boundless reservoir of universal energy from which all Cores materialize. At each player's <strong>Core Step</strong>, 1 Core is transferred from the Void directly into their Reserve.
              </div>
            </div>
          </div>

          <div class="void-stats-grid">
            <div class="void-stat-box">
              <div class="void-stat-num">∞</div>
              <div class="void-stat-lbl">Void Cores Remaining</div>
            </div>
            <div class="void-stat-box">
              <div class="void-stat-num">${DuelState.turn}</div>
              <div class="void-stat-lbl">Duel Round / Turn</div>
            </div>
            <div class="void-stat-box">
              <div class="void-stat-num">${totalVoidCards}</div>
              <div class="void-stat-lbl">Cards Banished to Void</div>
            </div>
          </div>
      `;

      if (allVoidCards.length > 0) {
        voidHtml += `
          <div class="void-cards-section-header">🌌 Cards Banished to The Void (${allVoidCards.length})</div>
          <div class="zone-cards-grid">
            ${allVoidCards.map(c => `
              <div class="zone-card-item" onclick="BattleArena.inspectZoneCard('${encodeURIComponent(c.name)}')" title="Click to inspect ${c.name}">
                <img src="${c.image_url || '/placeholder.png'}" class="zone-card-thumb" alt="${c.name}" onerror="this.src='/placeholder.png';">
                <div class="zone-card-info">
                  <div class="zone-card-name">${c.name}</div>
                  <div class="zone-card-sub">
                    <span>${c.type || 'Card'}</span>
                    <span>Cost ${c.cost ?? 0}</span>
                  </div>
                  ${c.voidReason ? `<div class="zone-card-reason" style="border-left-color:#c084fc;">🌌 ${c.voidReason}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        voidHtml += `
          <div class="zone-empty-state" style="padding: 1.5rem 1rem;">
            <div class="zone-empty-icon" style="font-size:2.5rem;">✨</div>
            <div class="zone-empty-text">No Cards Currently Banished in The Void</div>
            <div class="zone-empty-subtext">Cards removed completely from the game by Void banishment effects will be held here.</div>
          </div>
        `;
      }

      voidHtml += `</div>`;
      bodyEl.innerHTML = voidHtml;
    }
  }

  // ── EXPOSE PUBLIC API ──
  window.BattleArena = {
    init: initBattleArena,
    startDuel,
    renderDuelTable,
    renderPlayerHand,
    nextPhase,
    manualStep,
    advanceOpponentStep,
    toggleOpponentAuto,
    getState: () => DuelState,
    getPlayerAvailableCores,
    openSacrificeModal,
    adjustSacrificeCore,
    closeSacrificeModal,
    executeSacrificeSummon,
    setBurst,
    inspectBurst,
    inspectOpponentBurst,
    activateBurst,
    renderBurstZones,
    hasClash,
    hasCurse,
    hasCrush,
    hasArmor,
    getWhenAttacksBpBoost,
    getAttackSymbols,
    selectHandCard,
    deselectCard,
    renderCardInspector,
    formatEffectKeywords,
    hasFlashTiming,
    canPlayCardInCurrentPhase,
    summonCard,
    castMagic,
    handleSpiritClick,
    chooseBlocker,
    takeLifeDamage,
    closeBlockModal,
    closeResultModal,
    toggleAutoDuel,
    quickLaunchDuel,
    scrollToBattleArena,
    updateLobbyPreviews,
    openZoneModal,
    closeZoneModal,
    closeZoneModalBg,
    switchZoneTab,
    inspectZoneCard,
    renderZoneModal,
    sendToTrash,
    sendToVoid
  };

  // Auto initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBattleArena);
  } else {
    initBattleArena();
  }

})();
"""

content = "".join(top_lines) + tail

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Cleanly rebuilt battle_arena.js")
