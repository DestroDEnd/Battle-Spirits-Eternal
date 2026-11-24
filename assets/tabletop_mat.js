/**
 * assets/tabletop_mat.js (v1.4)
 *
 * Secondary "Tabletop Mat" arena view with full Classic-system gameplay parity:
 * - Classic faceted hexagonal SVG cores & glowing yellow Life crystals
 * - Inline Main-Step core steppers (- / N / +), 1-click Core Transference (Spirit/Nexus/Reserve),
 *   and Soul Core placement/transfer/removal
 * - Deployed Nexuses rendered directly on the battle line (always visible, never clipped)
 * - Clickable Graveyard, Trash Cores, Count, Open Zone, Mirage, Soul Core, Burst, Void, Nexuses
 * - Click-to-attack & target selection, Brave/De-Brave, Advent, Mirage, Accel, Soul Drive, Grand Skill
 * - Turn-1 Starting Hand / Mulligan + Contract Partner overlay
 * - Live Hover Card Inspector + Battle-Mode Home Menu + Chat & Battle Log drawer
 */
(function () {
  const STORAGE_KEY = 'bsp_arena_view_mode';
  const FALLBACK_ART = './assets/card_back.png';
  const DEFAULT_PHASES = ['START', 'CORE', 'DRAW', 'REFRESH', 'MAIN', 'ATTACK', 'END'];
  let svgSeq = 0;
  let activeDrawerTab = 'chat';
  let drawerOpen = false;
  // Core transfer state: { sourceType: 'spirit'|'nexus'|'reserve', sourceUid: string|null, sourceName: string }
  let coreTransferState = null;

  const chatMessages = [
    { sender: 'System', text: 'Welcome to Battle Spirits Eternal! Use Chat to message your opponent or switch to Battle Log to inspect every step.', time: '', isSystem: true }
  ];

  function escHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escJs(str) {
    return String(str || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  }

  function resolveCardImg(card) {
    if (!card) return FALLBACK_ART;
    if (typeof window !== 'undefined' && typeof window.cleanCardImageUrl === 'function') {
      return window.cleanCardImageUrl(card.image_url) || FALLBACK_ART;
    }
    return card.image_url || FALLBACK_ART;
  }

  function getArenaState() {
    if (typeof window === 'undefined' || !window.BattleArena || typeof window.BattleArena.getState !== 'function') {
      return null;
    }
    return window.BattleArena.getState();
  }

  function calcTotalAvailableCores(p) {
    if (!p) return 0;
    const reserve = Number(p.reserve || 0);
    const fieldCores = (p.field || []).reduce((sum, u) => sum + Number(u.currentCores || 0), 0);
    const nexusCores = (p.nexus || []).reduce((sum, n) => sum + Number(n.currentCores || 0), 0);
    return reserve + fieldCores + nexusCores;
  }

  function formatSoulCoreLoc(loc) {
    const map = { reserve: 'Reserve', field: 'Field', trash: 'Trash', void: 'Void', life: 'Life' };
    return map[loc] || 'Reserve';
  }

  // ── 1-CLICK CORE TRANSFERENCE ENGINE ──
  function startCoreTransfer(sourceType, sourceUid, sourceName) {
    const state = getArenaState();
    const phase = state && state.phases ? state.phases[state.phaseIndex] : '';
    if (!state || state.activePlayer !== 'player' || phase !== 'MAIN') {
      coreTransferState = null;
      return false;
    }
    if (coreTransferState && coreTransferState.sourceType === sourceType && coreTransferState.sourceUid === (sourceUid || null)) {
      coreTransferState = null;
      render();
      return false;
    }
    coreTransferState = {
      sourceType,
      sourceUid: sourceUid || null,
      sourceName: sourceName || (sourceType === 'reserve' ? 'Your Reserve' : 'Card')
    };
    render();
    return true;
  }

  function cancelCoreTransfer() {
    coreTransferState = null;
    render();
  }

  function completeCoreTransfer(targetType, targetUid) {
    if (!coreTransferState || typeof window === 'undefined' || !window.BattleArena) return false;
    const ba = window.BattleArena;
    const src = coreTransferState;
    if (src.sourceType === targetType && src.sourceUid === (targetUid || null)) {
      cancelCoreTransfer();
      return false;
    }

    // Step 1: Take 1 normal core from source (unless source is Reserve)
    if (src.sourceType === 'spirit' && src.sourceUid && typeof ba.removeCoreFromSpirit === 'function') {
      ba.removeCoreFromSpirit(src.sourceUid);
    } else if (src.sourceType === 'nexus' && src.sourceUid && typeof ba.removeCoreFromNexus === 'function') {
      ba.removeCoreFromNexus(src.sourceUid);
    }

    // Step 2: Place 1 normal core onto target (unless target is Reserve, where Step 1 already returned it)
    if (targetType === 'spirit' && targetUid && typeof ba.addCoreToSpirit === 'function') {
      ba.addCoreToSpirit(targetUid);
    } else if (targetType === 'nexus' && targetUid && typeof ba.addCoreToNexus === 'function') {
      ba.addCoreToNexus(targetUid);
    }

    // Validate if source still exists & has normal cores left; otherwise exit transfer mode
    const fresh = getArenaState();
    const p = fresh && fresh.player ? fresh.player : null;
    if (!p || fresh.activePlayer !== 'player' || fresh.phases[fresh.phaseIndex] !== 'MAIN') {
      coreTransferState = null;
    } else if (src.sourceType === 'reserve' && Number(p.reserve || 0) <= 0) {
      coreTransferState = null;
    } else if (src.sourceType === 'spirit') {
      const sp = (p.field || []).find(s => s.uid === src.sourceUid);
      const norm = sp ? (sp.hasSoulCore ? Math.max(0, sp.currentCores - 1) : sp.currentCores) : 0;
      if (!sp || norm <= 0) coreTransferState = null;
    } else if (src.sourceType === 'nexus') {
      const nx = (p.nexus || []).find(n => n.uid === src.sourceUid);
      if (!nx || Number(nx.currentCores || 0) <= 0) coreTransferState = null;
    }

    render();
    return true;
  }

  /**
   * Classic faceted hexagonal SVG crystals matching battle_arena.js
   */
  function renderHexSvg(type, size = 18) {
    const id = `tmHex_${type}_${++svgSeq}`;
    const h = Math.round(size * 1.15);

    if (type === 'life-active') {
      return `<span class="tm-hex-wrap life-active" title="Life Core"><svg class="hex-core-svg hex-life-active" viewBox="0 0 24 28" width="${size}" height="${h}" aria-label="Active Life"><defs><linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fef08a"/><stop offset="48%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#d97706"/></linearGradient></defs><polygon points="12,1 22.5,7 22.5,21 12,27 1.5,21 1.5,7" fill="url(#${id})" stroke="#fef9c3" stroke-width="1.5"/><polygon points="12,4.8 19,8.8 19,19.2 12,23.2 5,19.2 5,8.8" fill="rgba(255,255,255,0.22)"/><circle cx="12" cy="14" r="2.7" fill="#fffbeb"/></svg></span>`;
    }
    if (type === 'life-empty') {
      return `<span class="tm-hex-wrap life-empty" title="Lost Life"><svg class="hex-core-svg hex-life-empty" viewBox="0 0 24 28" width="${size}" height="${h}" aria-label="Lost Life"><polygon points="12,1 22.5,7 22.5,21 12,27 1.5,21 1.5,7" fill="rgba(30,41,59,0.55)" stroke="rgba(148,163,184,0.45)" stroke-width="1.4" stroke-dasharray="2.5 2"/></svg></span>`;
    }
    if (type === 'soul') {
      return `<span class="tm-hex-wrap soul" title="Soul Core"><svg class="hex-core-svg hex-soul-core" viewBox="0 0 24 28" width="${size}" height="${h}" aria-label="Soul Core"><defs><linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fca5a5"/><stop offset="45%" stop-color="#ef4444"/><stop offset="100%" stop-color="#991b1b"/></linearGradient></defs><polygon points="12,1 22.5,7 22.5,21 12,27 1.5,21 1.5,7" fill="url(#${id})" stroke="#fecaca" stroke-width="1.5"/><polygon points="12,5 18.8,9 18.8,19 12,23 5.2,19 5.2,9" fill="rgba(255,255,255,0.2)"/><polygon points="12,9.2 15.6,14 12,18.8 8.4,14" fill="#fff1f2"/></svg></span>`;
    }
    return `<span class="tm-hex-wrap blue" title="Core"><svg class="hex-core-svg hex-blue-core" viewBox="0 0 24 28" width="${size}" height="${h}" aria-label="Blue Core"><defs><linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#e0f2fe"/><stop offset="42%" stop-color="#38bdf8"/><stop offset="100%" stop-color="#0369a1"/></linearGradient></defs><polygon points="12,1 22.5,7 22.5,21 12,27 1.5,21 1.5,7" fill="url(#${id})" stroke="#bae6fd" stroke-width="1.4"/><polygon points="12,5 18.8,9 18.8,19 12,23 5.2,19 5.2,9" fill="rgba(255,255,255,0.22)"/><circle cx="12" cy="14" r="2.2" fill="#f0f9ff"/></svg></span>`;
  }

  function renderLifeCrystals(lifeCount, hasSoulInLife = false, size = 20) {
    const count = Math.max(0, Number(lifeCount) || 0);
    const totalSlots = Math.max(5, count);
    const maxDraw = Math.min(totalSlots, 8);
    let html = '';
    for (let i = 0; i < maxDraw; i++) {
      if (i < count) {
        html += (hasSoulInLife && i === count - 1)
          ? renderHexSvg('soul', size)
          : renderHexSvg('life-active', size);
      } else {
        html += renderHexSvg('life-empty', size);
      }
    }
    if (count > maxDraw) {
      html += `<span class="tm-core-more">+${count - maxDraw}</span>`;
    }
    return html;
  }

  function renderCoreGems(count, hasSoul = false, size = 16, maxVisible = 9) {
    const n = Math.max(0, Number(count) || 0);
    const normalCount = hasSoul ? Math.max(0, n - 1) : n;
    const drawNormal = Math.min(normalCount, maxVisible);
    let html = '';
    for (let i = 0; i < drawNormal; i++) {
      html += renderHexSvg('blue', size);
    }
    if (hasSoul) {
      html += renderHexSvg('soul', size);
    }
    if (normalCount > drawNormal) {
      html += `<span class="tm-core-more">+${normalCount - drawNormal}</span>`;
    }
    return html || `<span class="tm-empty-zero">0</span>`;
  }

  function renderFieldSpirits(units, owner, state) {
    if (!Array.isArray(units) || units.length === 0) return '';
    const activeUnits = units.filter(u => u && !u.isSoulState);
    if (!activeUnits.length) return '';
    const isPlayer = owner === 'player';
    const phase = (state.phases && state.phases[state.phaseIndex]) || '';
    const isPlayerTurn = state.activePlayer === 'player';
    const isMain = isPlayer && isPlayerTurn && phase === 'MAIN';
    const isAttack = isPlayer && isPlayerTurn && phase === 'ATTACK';
    const p = state.player || {};
    const ba = (typeof window !== 'undefined' && window.BattleArena) ? window.BattleArena : {};

    return activeUnits.map(u => {
      const exhaustedCls = u.isExhausted ? 'exhausted' : '';
      const hasSC = Boolean(u.hasSoulCore);
      const soulCls = hasSC ? 'has-soul' : '';
      const isSelectedAttacker = Boolean(state.selectedAttacker && state.selectedAttacker.uid === u.uid);
      const canAtk = isAttack && !u.isExhausted && (typeof ba.canUnitAttack === 'function' ? ba.canUnitAttack(u) : true);
      const atkCls = isSelectedAttacker ? 'is-selected-attacker' : (canAtk ? 'can-attack' : '');

      const isTransferSrc = isMain && coreTransferState && coreTransferState.sourceType === 'spirit' && coreTransferState.sourceUid === u.uid;
      const isTransferTarget = isMain && coreTransferState && !isTransferSrc;
      const transferCls = isTransferSrc ? 'is-transfer-source' : (isTransferTarget ? 'is-transfer-target' : '');

      const lv = u.currentLevel || 1;
      const bp = u.currentBp || 0;
      const cores = Number(u.currentCores || 0);
      const normalCores = hasSC ? Math.max(0, cores - 1) : cores;
      const safeName = escJs(u.name || '');
      const safeUid = escJs(u.uid || '');
      const zoneArg = `${owner}-field`;
      const imgUrl = resolveCardImg(u);

      let badges = '';
      if (u.underlyingCards && u.underlyingCards.length > 0) {
        badges += `<span class="tm-unit-badge advent">🌟 ×${u.underlyingCards.length + 1}</span>`;
      }
      if (/\[(?:Clash|CLASH)\]|【激突】/i.test(u.effect || '')) {
        badges += `<span class="tm-unit-badge clash">⚔️ CLASH</span>`;
      }
      const totalBuff = Number(u.turnBpBoost || 0) + Number(u.temporaryBpBuff || 0);
      if (totalBuff > 0) {
        badges += `<span class="tm-unit-badge buff">+${totalBuff} BP</span>`;
      }
      if (u.brave) {
        badges += `<span class="tm-unit-badge brave">🔗 +${u.brave.bpBonus || 1000}</span>`;
      } else if (u.type === 'Brave' || u.isBraveCard) {
        badges += `<span class="tm-unit-badge brave">⚔️ BRAVE</span>`;
      }

      let controls = '';
      if (isMain) {
        if (isTransferTarget) {
          controls += `<button type="button" class="tm-ctrl-btn transfer-active" onclick="event.stopPropagation(); window.TabletopMat.completeCoreTransfer('spirit', '${safeUid}')">+1 Receive Core</button>`;
        } else {
          const canAdd = Number(p.reserve || 0) > 0;
          const canRem = normalCores > 0;
          controls += `
            <span class="tm-core-stepper">
              <button type="button" class="tm-ctrl-btn" ${canRem ? '' : 'disabled'} onclick="event.stopPropagation(); BattleArena.removeCoreFromSpirit('${safeUid}')" title="Return 1 core to Reserve">−</button>
              <span class="tm-stepper-val">${cores}c</span>
              <button type="button" class="tm-ctrl-btn" ${canAdd ? '' : 'disabled'} onclick="event.stopPropagation(); BattleArena.addCoreToSpirit('${safeUid}')" title="Add 1 core from Reserve">+</button>
            </span>
          `;
          if (canRem) {
            controls += `<button type="button" class="tm-ctrl-btn transfer" onclick="event.stopPropagation(); window.TabletopMat.startCoreTransfer('spirit', '${safeUid}', '${safeName}')" title="Transfer cores from this Spirit to another Spirit, Nexus, or Reserve">⇄</button>`;
          }
          if (hasSC) {
            controls += `<button type="button" class="tm-ctrl-btn sc" onclick="event.stopPropagation(); BattleArena.removeSoulCoreFromSpirit('${safeUid}')" title="Return Soul Core to Reserve">−SC</button>`;
          } else if (p.soulCoreLocation === 'reserve' || p.soulCoreLocation === 'field') {
            controls += `<button type="button" class="tm-ctrl-btn sc" onclick="event.stopPropagation(); BattleArena.placeSoulCoreOnSpirit('${safeUid}')" title="Place/Transfer Soul Core">+SC</button>`;
          }
          if (u.brave) {
            controls += `<button type="button" class="tm-ctrl-btn brave" onclick="event.stopPropagation(); BattleArena.separateBrave('${safeUid}')" title="Separate Brave">De-Brave</button>`;
          } else if (u.type === 'Brave' || u.isBraveCard) {
            controls += `<button type="button" class="tm-ctrl-btn brave" onclick="event.stopPropagation(); BattleArena.openBraveCombineModal('${safeUid}', 'field')" title="Combine Brave">🔗 Brave</button>`;
          }
        }
      }
      if (canAtk) {
        controls += `<button type="button" class="tm-ctrl-btn attack" onclick="event.stopPropagation(); BattleArena.handleSpiritClick('${safeUid}', 'player')" title="Attack with this Spirit">⚔️ Attack</button>`;
      }
      if (isPlayer && /\[Soul Drive\]|【ソウルドライブ】/i.test(u.effect || '') && !p.soulDriveUsed) {
        controls += `<button type="button" class="tm-ctrl-btn sc" onclick="event.stopPropagation(); BattleArena.activateSoulDrive('${safeUid}', 'player')" title="Activate Soul Drive">🔥 SD</button>`;
      }

      const clickHandler = isTransferTarget
        ? `window.TabletopMat.completeCoreTransfer('spirit', '${safeUid}')`
        : `BattleArena.handleSpiritClick ? BattleArena.handleSpiritClick('${safeUid}', '${owner}') : BattleArena.openCardDetailContext('${safeName}', '${zoneArg}', '${safeUid}')`;

      const dragAttrs = isPlayer
        ? `draggable="true" ondragstart="BattleArena.handleFieldDragStart && BattleArena.handleFieldDragStart(event, '${safeUid}')" ondragover="BattleArena.handleFieldDragOver && BattleArena.handleFieldDragOver(event, '${safeUid}')" ondragleave="BattleArena.handleFieldDragLeave && BattleArena.handleFieldDragLeave(event, '${safeUid}')" ondrop="BattleArena.handleFieldDrop && BattleArena.handleFieldDrop(event, '${safeUid}')" ondragend="BattleArena.handleFieldDragEnd && BattleArena.handleFieldDragEnd(event)"`
        : '';

      return `
        <div class="tm-field-unit" ${dragAttrs} onclick="${clickHandler}" onmouseenter="window.TabletopMat && window.TabletopMat.showHoverPreview('${zoneArg}', '${safeUid}')" onmouseleave="window.TabletopMat && window.TabletopMat.hideHoverPreview()">
          <div class="tm-unit-frame ${exhaustedCls} ${soulCls} ${atkCls} ${transferCls}">
            ${badges ? `<div class="tm-unit-badges">${badges}</div>` : ''}
            <button type="button" class="tm-unit-zoom" onclick="event.stopPropagation(); BattleArena.openCardDetailContext('${safeName}', '${zoneArg}', '${safeUid}')" title="Inspect Card Details">🔍</button>
            <img src="${escHtml(imgUrl)}" alt="${escHtml(u.name)}" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${FALLBACK_ART}';" />
            <div class="tm-unit-cores">
              ${renderCoreGems(cores, hasSC, 13, 6)}
            </div>
          </div>
          <div class="tm-unit-stats">
            <span>LV${lv}</span>
            <span class="bp">${bp} BP</span>
          </div>
          <div class="tm-unit-name-status" title="${escHtml(u.name)} (${u.isExhausted ? 'Exhausted' : 'Ready'})">
            <span class="tm-status-dot ${u.isExhausted ? 'exhausted' : ''}"></span>
            <span>${escHtml((u.name || '').slice(0, 16))}</span>
          </div>
          ${controls ? `<div class="tm-unit-controls">${controls}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  function renderFieldNexusesInline(nexuses, owner, state) {
    if (!Array.isArray(nexuses) || nexuses.length === 0) return '';
    const isPlayer = owner === 'player';
    const phase = (state.phases && state.phases[state.phaseIndex]) || '';
    const isPlayerTurn = state.activePlayer === 'player';
    const isMain = isPlayer && isPlayerTurn && phase === 'MAIN';
    const p = state.player || {};

    return nexuses.map(n => {
      const lv = n.currentLevel || 1;
      const cores = Number(n.currentCores || 0);
      const safeName = escJs(n.name || '');
      const safeUid = escJs(n.uid || '');
      const zoneArg = `${owner}-nexus`;
      const imgUrl = resolveCardImg(n);
      const isGrandwalker = /Grandwalker/i.test(String(n.type || '') + ' ' + String(n.family || ''));
      const hasGrandSkill = /\[Grand Skill/i.test(n.effect || '');

      const isTransferSrc = isMain && coreTransferState && coreTransferState.sourceType === 'nexus' && coreTransferState.sourceUid === n.uid;
      const isTransferTarget = isMain && coreTransferState && !isTransferSrc && !isGrandwalker;
      const transferCls = isTransferSrc ? 'is-transfer-source' : (isTransferTarget ? 'is-transfer-target' : '');

      let controls = '';
      if (isMain && !isGrandwalker) {
        if (isTransferTarget) {
          controls += `<button type="button" class="tm-ctrl-btn transfer-active" onclick="event.stopPropagation(); window.TabletopMat.completeCoreTransfer('nexus', '${safeUid}')">+1 Receive Core</button>`;
        } else {
          const canAdd = Number(p.reserve || 0) > 0;
          const canRem = cores > 0;
          controls += `
            <span class="tm-core-stepper">
              <button type="button" class="tm-ctrl-btn" ${canRem ? '' : 'disabled'} onclick="event.stopPropagation(); BattleArena.removeCoreFromNexus('${safeUid}')" title="Return 1 core to Reserve">−</button>
              <span class="tm-stepper-val">${cores}c</span>
              <button type="button" class="tm-ctrl-btn" ${canAdd ? '' : 'disabled'} onclick="event.stopPropagation(); BattleArena.addCoreToNexus('${safeUid}')" title="Add 1 core from Reserve">+</button>
            </span>
          `;
          if (canRem) {
            controls += `<button type="button" class="tm-ctrl-btn transfer" onclick="event.stopPropagation(); window.TabletopMat.startCoreTransfer('nexus', '${safeUid}', '${safeName}')" title="Transfer core from this Nexus">⇄</button>`;
          }
        }
      }
      if (isPlayer && hasGrandSkill) {
        controls += `<button type="button" class="tm-ctrl-btn gs" onclick="event.stopPropagation(); BattleArena.activateGrandSkill && BattleArena.activateGrandSkill('${safeUid}')" title="Activate Grand Skill">⚡ GS</button>`;
      }

      const clickHandler = isTransferTarget
        ? `window.TabletopMat.completeCoreTransfer('nexus', '${safeUid}')`
        : `BattleArena.openCardDetailContext('${safeName}', '${zoneArg}', '${safeUid}')`;

      return `
        <div class="tm-field-unit" onclick="${clickHandler}" onmouseenter="window.TabletopMat && window.TabletopMat.showHoverPreview('${zoneArg}', '${safeUid}')" onmouseleave="window.TabletopMat && window.TabletopMat.hideHoverPreview()">
          <div class="tm-unit-frame is-nexus ${transferCls}">
            <div class="tm-unit-badges"><span class="tm-unit-badge advent">🏛️ NEXUS</span></div>
            <button type="button" class="tm-unit-zoom" onclick="event.stopPropagation(); BattleArena.openCardDetailContext('${safeName}', '${zoneArg}', '${safeUid}')" title="Inspect Nexus">🔍</button>
            <img src="${escHtml(imgUrl)}" alt="${escHtml(n.name)}" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${FALLBACK_ART}';" />
            <div class="tm-unit-cores">${renderCoreGems(cores, Boolean(n.hasSoulCore), 12, 5)}</div>
          </div>
          <div class="tm-unit-stats">
            <span>LV${lv}</span>
            <span class="bp">${escHtml((n.name || 'Nexus').slice(0, 12))}</span>
          </div>
          ${controls ? `<div class="tm-unit-controls">${controls}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  function renderSoulStateCards(soulCards, owner) {
    if (!Array.isArray(soulCards) || soulCards.length === 0) return '';
    const zoneArg = `${owner}-soul`;
    return soulCards.map(c => {
      if (!c) return '';
      const safeName = escJs(c.name || '');
      const safeUid = escJs(c.uid || '');
      const imgUrl = resolveCardImg(c);
      return `
        <div class="tm-field-unit" onclick="BattleArena.openCardDetailContext('${safeName}', 'soul-state', '${safeUid}')" onmouseenter="window.TabletopMat && window.TabletopMat.showHoverPreview('${zoneArg}', '${safeUid}')" onmouseleave="window.TabletopMat && window.TabletopMat.hideHoverPreview()" title="${escHtml(c.name)} — Soul State (Ready for Contract Advent)">
          <div class="tm-unit-frame is-soul-state">
            <div class="tm-unit-badges"><span class="tm-unit-badge soul-state">👻 SOUL STATE</span></div>
            <button type="button" class="tm-unit-zoom" onclick="event.stopPropagation(); BattleArena.openCardDetailContext('${safeName}', 'soul-state', '${safeUid}')" title="Inspect Soul State Partner">🔍</button>
            <img src="${escHtml(imgUrl)}" alt="${escHtml(c.name)}" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${FALLBACK_ART}';" />
          </div>
          <div class="tm-unit-stats">
            <span>SOUL</span>
            <span class="bp">PARTNER</span>
          </div>
          <div class="tm-unit-name-status" title="${escHtml(c.name)} (Soul State)">
            <span>${escHtml((c.name || 'Partner').slice(0, 16))}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderPlayerHand(state) {
    const p = state.player || {};
    const hand = p.hand || [];
    if (!hand.length) {
      return `<div class="tm-empty-hint">Hand is empty</div>`;
    }
    const partnerUid = p.contractCard ? p.contractCard.uid : null;
    const isPlayerTurn = state.activePlayer === 'player';
    const phase = (state.phases && state.phases[state.phaseIndex]) || '';
    const isMain = phase === 'MAIN';
    const isAttack = phase === 'ATTACK';
    const handConfirmed = p.hasConfirmedHand !== false;
    const reserve = Number(p.reserve || 0);
    const totalCores = calcTotalAvailableCores(p);

    return hand.map(card => {
      const cost = (typeof window !== 'undefined' && window.BattleArena && typeof window.BattleArena.getCardEffectiveCost === 'function')
        ? window.BattleArena.getCardEffectiveCost(card, 'player')
        : Number(card.cost || 0);
      const type = String(card.type || '');
      const eff = String(card.effect || '');
      const isMagic = type.includes('Magic');
      const isNexus = type.includes('Nexus');
      const isBrave = type.includes('Brave');
      const isSpiritOrUlt = !isMagic && !isNexus && !isBrave;
      const isBurst = /\[(?:Burst|BURST):?|【バースト】/i.test(eff);
      const hasMainTiming = /\[(?:Main|MAIN)\]|【メイン】/i.test(eff);
      const hasFlashTiming = /\[(?:Flash|FLASH)\]|【フラッシュ】/i.test(eff);
      const hasAdvent = /\[(?:Contract )?Advent:|【(?:契約)?煌臨/i.test(eff);
      const hasMirage = /\[Mirage:|【ミラージュ/i.test(eff);
      const hasAccel = /\[Accel:|【アクセル/i.test(eff);
      const isPartner = Boolean(partnerUid && card.uid === partnerUid);

      const totalNeeded = (isSpiritOrUlt || isBrave) ? (cost + 1) : cost;
      const canAffordDirect = reserve >= totalNeeded;
      const canAffordWithSac = !canAffordDirect && totalCores >= totalNeeded;

      const safeUid = escJs(card.uid || '');
      const safeName = escJs(card.name || '');
      const imgUrl = resolveCardImg(card);

      let btns = '';
      if (handConfirmed && isPlayerTurn && (isMain || isAttack)) {
        if (isMagic) {
          if (isAttack && hasFlashTiming) {
            if (canAffordDirect) {
              btns += `<button type="button" class="tm-hand-act-btn magic" onclick="event.stopPropagation(); BattleArena.castMagic('${safeUid}', null, null, 'flash')">⚡ Flash (${cost})</button>`;
            } else if (canAffordWithSac) {
              btns += `<button type="button" class="tm-hand-act-btn sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('${safeUid}', 'flash')">💀 Sac Flash (${cost})</button>`;
            }
          } else if (isMain) {
            if (hasMainTiming && hasFlashTiming) {
              if (canAffordDirect) {
                btns += `<button type="button" class="tm-hand-act-btn magic" onclick="event.stopPropagation(); BattleArena.castMagic('${safeUid}', null, null, 'main')">✨ Main (${cost})</button>`;
                btns += `<button type="button" class="tm-hand-act-btn magic" onclick="event.stopPropagation(); BattleArena.castMagic('${safeUid}', null, null, 'flash')">⚡ Flash (${cost})</button>`;
              } else if (canAffordWithSac) {
                btns += `<button type="button" class="tm-hand-act-btn sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('${safeUid}', 'main')">💀 Sac Cast (${cost})</button>`;
              }
            } else {
              const mode = hasFlashTiming && !hasMainTiming ? 'flash' : 'main';
              if (canAffordDirect) {
                btns += `<button type="button" class="tm-hand-act-btn magic" onclick="event.stopPropagation(); BattleArena.castMagic('${safeUid}', null, null, '${mode}')">${mode === 'flash' ? '⚡ Flash' : '✨ Cast'} (${cost})</button>`;
              } else if (canAffordWithSac) {
                btns += `<button type="button" class="tm-hand-act-btn sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('${safeUid}', '${mode}')">💀 Sac (${cost})</button>`;
              }
            }
          }
        } else if (isNexus && isMain) {
          if (canAffordDirect) {
            btns += `<button type="button" class="tm-hand-act-btn" onclick="event.stopPropagation(); BattleArena.deployNexus('${safeUid}')">🏛️ Deploy (${cost})</button>`;
          } else if (canAffordWithSac) {
            btns += `<button type="button" class="tm-hand-act-btn sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('${safeUid}')">💀 Sac Deploy (${cost})</button>`;
          }
        } else if (isBrave && isMain) {
          if (canAffordDirect) {
            btns += `<button type="button" class="tm-hand-act-btn" onclick="event.stopPropagation(); BattleArena.summonBraveAsSpirit('${safeUid}')">⚔️ Spirit (${cost})</button>`;
          } else if (canAffordWithSac) {
            btns += `<button type="button" class="tm-hand-act-btn sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('${safeUid}')">💀 Sac (${cost})</button>`;
          }
          if ((p.field || []).length > 0 && reserve >= cost) {
            btns += `<button type="button" class="tm-hand-act-btn accel" onclick="event.stopPropagation(); BattleArena.openBraveCombineModal('${safeUid}', 'hand')">🔗 Brave (${cost})</button>`;
          }
        } else if (isSpiritOrUlt && isMain) {
          if (canAffordDirect) {
            btns += `<button type="button" class="tm-hand-act-btn" onclick="event.stopPropagation(); BattleArena.summonCard('${safeUid}')">⚡ Summon (${cost})</button>`;
          } else if (canAffordWithSac) {
            btns += `<button type="button" class="tm-hand-act-btn sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('${safeUid}')">💀 Sac Summon (${cost})</button>`;
          }
        }

        if (isAttack && hasAdvent) {
          btns += `<button type="button" class="tm-hand-act-btn advent" onclick="event.stopPropagation(); BattleArena.openAdventPrompt('${safeUid}')">🌟 Advent</button>`;
        }
        if (isMain && hasMirage) {
          btns += `<button type="button" class="tm-hand-act-btn mirage" onclick="event.stopPropagation(); BattleArena.setMirage('${safeUid}')">🔮 Mirage</button>`;
        }
        if (hasAccel && (isMain || isAttack)) {
          btns += `<button type="button" class="tm-hand-act-btn accel" onclick="event.stopPropagation(); BattleArena.castAccel('${safeUid}')">⚡ Accel</button>`;
        }
        if (isMain && isBurst) {
          btns += `<button type="button" class="tm-hand-act-btn burst" onclick="event.stopPropagation(); BattleArena.setBurst('${safeUid}')">🔒 Burst</button>`;
        }
      }

      const playableCls = btns ? 'is-playable' : (handConfirmed && isPlayerTurn && (isMain || isAttack) ? 'is-dimmed' : '');

      return `
        <div class="tm-hand-card ${playableCls} ${isPartner ? 'is-partner' : ''}" onclick="BattleArena.openCardDetailContext('${safeName}', 'hand', '${safeUid}')" onmouseenter="window.TabletopMat && window.TabletopMat.showHoverPreview('hand', '${safeUid}')" onmouseleave="window.TabletopMat && window.TabletopMat.hideHoverPreview()" title="${escHtml(card.name)} (${escHtml(card.type)})">
          <span class="tm-hand-cost">${cost}</span>
          ${isPartner ? '<span class="tm-partner-tag">Partner</span>' : ''}
          <img src="${escHtml(imgUrl)}" alt="${escHtml(card.name)}" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${FALLBACK_ART}';" />
          ${btns ? `<div class="tm-hand-actions">${btns}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  function renderPhaseTrack(state) {
    const phases = Array.isArray(state.phases) && state.phases.length ? state.phases : DEFAULT_PHASES;
    const idx = Math.max(0, Number(state.phaseIndex || 0));
    const turn = state.turn || 1;
    const pips = phases.map((step, i) => {
      const cls = i === idx ? 'active' : (i < idx ? 'done' : '');
      return `<span class="tm-step-pip ${cls}">${escHtml(step)}</span>`;
    }).join('');
    return `
      <div class="tm-phase-track" aria-label="Turn phase tracker">
        <span class="tm-turn-chip">TURN ${turn}</span>
        ${pips}
      </div>
    `;
  }

  function renderCenterBar(state) {
    const turn = state.turn || 1;
    const phase = (state.phases && state.phases[state.phaseIndex]) || 'MAIN';
    const isPlayerTurn = state.activePlayer === 'player';
    const p = state.player || {};

    if (!p.hasConfirmedHand && turn === 1) {
      const isOppFirst = state.firstPlayer === 'opponent';
      const subText = isOppFirst
        ? 'Opponent won the coin toss and takes Turn 1. Redraw 4 cards once or Keep Hand to start.'
        : 'You go first! Review your opening 4 cards — redraw once or keep your hand.';
      const keepLabel = isOppFirst ? '✓ Keep Hand & Begin Match' : '✓ Keep Hand';
      const partnerHtml = p.contractCard
        ? `
          <div class="tm-partner-row">
            <span class="tm-partner-badge">🌟 Contract Partner: ${escHtml(p.contractCard.name)}</span>
            <button type="button" class="tm-cb-btn gold" onclick="event.stopPropagation(); BattleArena.openPartnerSelectionModal && BattleArena.openPartnerSelectionModal()">🔄 Choose Partner</button>
          </div>
        `
        : '';

      return `
        <div class="tm-mulligan-card" id="tmStartingHandCard">
          <div class="tm-mulligan-info">
            <div class="tm-mulligan-title">🃏 Starting Hand &amp; Mulligan</div>
            <div class="tm-mulligan-sub">${subText}</div>
            ${partnerHtml}
          </div>
          <div class="tm-mulligan-actions">
            ${!p.hasMulliganed ? `<button type="button" class="tm-cb-btn indigo" id="tmBtnMulligan" onclick="event.stopPropagation(); BattleArena.performMulligan && BattleArena.performMulligan()">🔄 Redraw 4 Cards</button>` : ''}
            <button type="button" class="tm-cb-btn primary" id="tmBtnKeepHand" onclick="event.stopPropagation(); BattleArena.keepStartingHand && BattleArena.keepStartingHand()">${keepLabel}</button>
          </div>
        </div>
      `;
    }

    if (coreTransferState && isPlayerTurn && phase === 'MAIN') {
      return `
        <div class="tm-center-bar" id="tmCoreTransferBanner">
          <span class="tm-cb-phase">💎 CORE TRANSFER</span>
          <span class="tm-cb-status">Moving core from <strong>${escHtml(coreTransferState.sourceName)}</strong> — click any highlighted Spirit, Nexus, or Your Reserve</span>
          <button type="button" class="tm-cb-btn primary" onclick="window.TabletopMat.cancelCoreTransfer()">Done</button>
        </div>
      `;
    }

    if (state.winner) {
      return `
        <div class="tm-center-bar">
          <span class="tm-cb-phase">MATCH OVER</span>
          <span class="tm-cb-status">${state.winner === 'player' ? 'Victory!' : 'Defeat'}</span>
          <button type="button" class="tm-cb-btn gold" onclick="BattleArena.startDuel()">Play Again</button>
        </div>
      `;
    }

    if (!isPlayerTurn) {
      return `
        <div class="tm-center-bar">
          <span class="tm-cb-phase">${escHtml(phase)} · TURN ${turn}</span>
          <span class="tm-cb-status">Opponent's turn</span>
          <button type="button" class="tm-cb-btn primary" onclick="BattleArena.advanceOpponentAction && BattleArena.advanceOpponentAction()">Advance AI</button>
          <button type="button" class="tm-cb-btn gold" onclick="BattleArena.autoPlayOpponentTurn && BattleArena.autoPlayOpponentTurn()">Auto-Play Turn</button>
        </div>
      `;
    }

    const stepCopy = {
      START: { status: 'Start of turn — ready to begin', cta: 'Begin Turn' },
      CORE: { status: 'Gain +1 Core from The Void into Reserve', cta: 'Draw +1 Core' },
      DRAW: { status: 'Draw 1 card from your Deck', cta: 'Draw Card' },
      REFRESH: { status: 'Return Trash cores & ready all Spirits', cta: 'Refresh All' },
      MAIN: { status: 'Summon, deploy, adjust (−/+) or transfer (⇄) cores', cta: 'Enter Attack Step' },
      ATTACK: { status: 'Click any Ready Spirit to Attack or cast Flash', cta: 'End Turn' },
      END: { status: 'Wrap up end-of-turn triggers', cta: 'Pass Turn' }
    };
    const info = stepCopy[phase] || { status: 'Your turn — play cards or advance', cta: 'Next Step' };

    return `
      <div class="tm-center-bar">
        <span class="tm-cb-phase">${escHtml(phase)} · TURN ${turn}</span>
        <span class="tm-cb-status">${info.status}</span>
        <button type="button" class="tm-cb-btn" onclick="BattleArena.nextPhase()">${info.cta}</button>
        ${phase === 'MAIN' ? `<button type="button" class="tm-cb-btn primary" onclick="BattleArena.endTurn && BattleArena.endTurn()">End Turn</button>` : ''}
      </div>
    `;
  }

  function findCardForPreview(zone, uid) {
    const state = getArenaState();
    if (!state || !uid) return null;
    const pools = {
      hand: (state.player && state.player.hand) || [],
      'player-field': (state.player && state.player.field) || [],
      'player-nexus': (state.player && state.player.nexus) || [],
      'player-soul': (state.player && state.player.soulStateCards) || [],
      'opponent-field': (state.opponent && state.opponent.field) || [],
      'opponent-nexus': (state.opponent && state.opponent.nexus) || [],
      'opponent-soul': (state.opponent && state.opponent.soulStateCards) || []
    };
    const list = pools[zone] || [];
    return list.find(c => c && c.uid === uid) || null;
  }

  function showHoverPreview(zone, uid) {
    if (typeof document === 'undefined') return;
    const el = document.getElementById('tmHoverInspector');
    if (!el) return;
    const card = findCardForPreview(zone, uid);
    if (!card) return;
    const meta = [
      card.type || 'Card',
      card.color || '',
      card.cost !== undefined ? `Cost ${card.cost}` : '',
      card.currentBp ? `LV${card.currentLevel || 1} · ${card.currentBp} BP` : ''
    ].filter(Boolean).join(' • ');

    el.innerHTML = `
      <img class="tm-hi-art" src="${escHtml(resolveCardImg(card))}" alt="${escHtml(card.name)}" referrerpolicy="no-referrer" />
      <div class="tm-hi-info">
        <div class="tm-hi-name">${escHtml(card.name)}</div>
        <div class="tm-hi-meta">${escHtml(meta)}</div>
        <div class="tm-hi-effect">${escHtml(card.effect || 'No card text.')}</div>
      </div>
    `;
    el.classList.add('visible');
  }

  function hideHoverPreview() {
    if (typeof document === 'undefined') return;
    const el = document.getElementById('tmHoverInspector');
    if (el) el.classList.remove('visible');
  }

  function syncBattleModeBodyClass(inDuel) {
    if (typeof document !== 'undefined' && document.body && document.body.classList) {
      document.body.classList.toggle('in-battle-mode', Boolean(inDuel));
    }
  }

  function toggleHomeMenu() {
    if (typeof document === 'undefined') return;
    const menu = document.getElementById('arenaHomeMenu');
    if (menu) menu.classList.toggle('open');
  }

  function closeHomeMenu() {
    if (typeof document === 'undefined') return;
    const menu = document.getElementById('arenaHomeMenu');
    if (menu) menu.classList.remove('open');
  }

  function renderChatDrawer() {
    if (typeof document === 'undefined') return;
    const bodyEl = document.getElementById('arenaChatDrawerBody');
    const formEl = document.getElementById('arenaChatForm');
    const tabChat = document.getElementById('acdTabChat');
    const tabLog = document.getElementById('acdTabLog');
    if (tabChat) tabChat.classList.toggle('active', activeDrawerTab === 'chat');
    if (tabLog) tabLog.classList.toggle('active', activeDrawerTab === 'log');
    if (formEl) formEl.style.display = activeDrawerTab === 'chat' ? 'flex' : 'none';
    if (!bodyEl) return;

    if (activeDrawerTab === 'chat') {
      bodyEl.innerHTML = chatMessages.map(m => `
        <div class="acd-chat-msg ${m.isSelf ? 'self' : ''}">
          <div class="acd-chat-meta">
            <strong>${escHtml(m.sender)}</strong>
            <span>${escHtml(m.time || '')}</span>
          </div>
          <div>${escHtml(m.text)}</div>
        </div>
      `).join('');
    } else {
      const logList = document.getElementById('battleLogList');
      const items = logList && logList.children ? Array.from(logList.children) : [];
      if (!items.length) {
        bodyEl.innerHTML = `<div class="acd-log-entry">No battle log entries yet.</div>`;
      } else {
        bodyEl.innerHTML = items.map(el => `<div class="acd-log-entry">${el.innerHTML || escHtml(el.textContent || '')}</div>`).join('');
      }
    }
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  function toggleChatDrawer(forceState) {
    drawerOpen = forceState !== undefined ? Boolean(forceState) : !drawerOpen;
    if (typeof document !== 'undefined') {
      const drawer = document.getElementById('arenaChatLogDrawer');
      const btn = document.getElementById('btnArenaChatLogToggle');
      if (drawer) drawer.classList.toggle('open', drawerOpen);
      if (btn) btn.classList.toggle('active', drawerOpen);
    }
    if (drawerOpen) renderChatDrawer();
    return drawerOpen;
  }

  function setChatTab(tab) {
    activeDrawerTab = tab === 'chat' ? 'chat' : 'log';
    if (!drawerOpen) toggleChatDrawer(true);
    else renderChatDrawer();
  }

  function sendChatMessage(textOverride) {
    let text = textOverride;
    let inputEl = null;
    if (typeof document !== 'undefined') {
      inputEl = document.getElementById('arenaChatInput');
      if (text === undefined && inputEl) text = inputEl.value;
    }
    const clean = String(text || '').trim();
    if (!clean) return false;
    activeDrawerTab = 'chat';
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    chatMessages.push({ sender: 'You', text: clean, time, isSelf: true });
    if (inputEl) inputEl.value = '';
    if (typeof window !== 'undefined' && window.MultiplayerService && typeof window.MultiplayerService.sendAction === 'function') {
      try {
        window.MultiplayerService.sendAction('CHAT_MESSAGE', { text: clean });
      } catch {}
    }
    renderChatDrawer();
    return true;
  }

  function addIncomingChat(sender, text) {
    const clean = String(text || '').trim();
    if (!clean) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    chatMessages.push({ sender: sender || 'Opponent', text: clean, time, isSelf: false });
    if (drawerOpen && activeDrawerTab === 'chat') renderChatDrawer();
  }

  function getMode() {
    try {
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      return saved === 'tabletop' ? 'tabletop' : 'classic';
    } catch {
      return 'classic';
    }
  }

  function setMode(mode) {
    const normalized = mode === 'tabletop' ? 'tabletop' : 'classic';
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, normalized);
    } catch {}

    if (typeof document !== 'undefined') {
      const table = document.getElementById('battleDuelTable');
      const btnClassic = document.getElementById('btnArenaViewClassic');
      const btnTabletop = document.getElementById('btnArenaViewTabletop');
      if (table) table.classList.toggle('view-mode-tabletop', normalized === 'tabletop');
      if (btnClassic) btnClassic.classList.toggle('active', normalized === 'classic');
      if (btnTabletop) btnTabletop.classList.toggle('active', normalized === 'tabletop');
    }

    if (normalized === 'tabletop') {
      render();
    }
    return normalized;
  }

  function toggle() {
    return setMode(getMode() === 'tabletop' ? 'classic' : 'tabletop');
  }

  function render() {
    if (typeof document === 'undefined' || typeof window === 'undefined') return false;
    const state = getArenaState();

    syncBattleModeBodyClass(Boolean(state && state.inDuel));

    const container = document.getElementById('tabletopMatArena');
    if (!container || !state || !state.inDuel) return false;

    const p = state.player || {};
    const o = state.opponent || {};
    const isPlayerTurn = state.activePlayer === 'player';
    const phase = (state.phases && state.phases[state.phaseIndex]) || '';
    const isMain = isPlayerTurn && phase === 'MAIN';
    if (!isMain && coreTransferState) coreTransferState = null;

    const oppHandCount = (o.hand || []).length;
    const oppHandBacks = Array.from({ length: Math.min(oppHandCount, 10) })
      .map(() => `<div class="tm-card-back-mini" title="Opponent hand card">BS</div>`)
      .join('');

    const oppTrashTop = (o.trashCards && o.trashCards.length) ? o.trashCards[o.trashCards.length - 1] : null;
    const pTrashTop = (p.trashCards && p.trashCards.length) ? p.trashCards[p.trashCards.length - 1] : null;

    // Render Spirits, Soul State Partners, and deployed Nexuses side-by-side on the battle line
    const oppBoardHtml = renderFieldSpirits(o.field, 'opponent', state)
      + renderSoulStateCards(o.soulStateCards, 'opponent')
      + renderFieldNexusesInline(o.nexus, 'opponent', state);
    const pBoardHtml = renderFieldSpirits(p.field, 'player', state)
      + renderSoulStateCards(p.soulStateCards, 'player')
      + renderFieldNexusesInline(p.nexus, 'player', state);

    const modeTagEl = document.getElementById('hudMatchModeTag');
    const modeLabel = modeTagEl ? modeTagEl.textContent : 'VS AI';
    const totalNexuses = (p.nexus ? p.nexus.length : 0) + (o.nexus ? o.nexus.length : 0);

    const reserveIsTransferTarget = isMain && coreTransferState && coreTransferState.sourceType !== 'reserve';

    container.innerHTML = `
      <div class="tm-shell">
        <div class="tm-top-strip">
          <div class="tm-top-left">
            <span>${escHtml(modeLabel)}</span>
            <span class="tm-turn-owner-pill ${isPlayerTurn ? '' : 'opp'}">${isPlayerTurn ? 'Your Turn' : "Opponent's Turn"}</span>
          </div>
          ${renderPhaseTrack(state)}
          <div class="tm-top-actions">
            ${isMain && Number(p.reserve || 0) > 0 ? `<button type="button" class="tm-mini-btn accent" onclick="window.TabletopMat.startCoreTransfer('reserve', null, 'Your Reserve')" title="Place Reserve cores onto a Spirit or Nexus">💎 Move Cores</button>` : ''}
            <button type="button" class="tm-mini-btn" onclick="BattleArena.openZoneModal('void')">🌌 Void</button>
            <button type="button" class="tm-mini-btn" onclick="BattleArena.openZoneModal('player-nexus')">🏛️ Nexuses (${totalNexuses})</button>
            <button type="button" class="tm-mini-btn" onclick="BattleArena.openZoneModal('player-trash')">🪦 Graveyard (${(p.trashCards || []).length})</button>
            <button type="button" class="tm-mini-btn" onclick="BattleArena.toggleAutoDuel && BattleArena.toggleAutoDuel()">⚡ Auto Duel</button>
            <button type="button" class="tm-mini-btn" onclick="BattleArena.toggleFullscreen && BattleArena.toggleFullscreen()">⛶ Full</button>
          </div>
        </div>

        <div class="tm-board-grid">
          <!-- LEFT RAIL -->
          <div class="tm-rail">
            <div class="tm-rail-group">
              <div class="tm-piles-row">
                <div class="tm-pile-box deck-pile" title="Opponent Deck">
                  <div class="tm-pile-label">Opp Deck</div>
                  <div class="tm-pile-count">${(o.deck || []).length}</div>
                </div>
                <div class="tm-pile-box" onclick="BattleArena.openZoneModal('opponent-trash')" title="Click to inspect Opponent Graveyard">
                  ${oppTrashTop ? `<img class="tm-pile-top-art" src="${escHtml(resolveCardImg(oppTrashTop))}" alt="" referrerpolicy="no-referrer" />` : ''}
                  <div class="tm-pile-label">Opp Grave</div>
                  <div class="tm-pile-count">${(o.trashCards || []).length}</div>
                </div>
              </div>
              <div class="tm-core-panel">
                <div class="tm-rail-heading"><span>Opp Trash Cores</span><strong>${o.trash || 0}</strong></div>
                <div class="tm-core-gems">${renderCoreGems(o.trash || 0, o.soulCoreLocation === 'trash', 15, 7)}</div>
              </div>
              <div class="tm-stat-chips">
                <div class="tm-stat-chip" title="Opponent Count"><span>🔹 Count</span><strong>${o.count || 0}</strong></div>
                <div class="tm-stat-chip" style="cursor:pointer;" onclick="BattleArena.openZoneModal('opponent-open')" title="Opponent Open Zone"><span>📖 Open</span><strong>${(o.openCards || []).length}</strong></div>
              </div>
            </div>

            <div class="tm-rail-group">
              <div class="tm-core-panel life-panel">
                <div class="tm-rail-heading"><span>Your Life</span><strong>${p.life || 0}/5</strong></div>
                <div class="tm-core-gems">${renderLifeCrystals(p.life || 0, p.soulCoreLocation === 'life', 20)}</div>
              </div>
              <div class="tm-core-panel ${reserveIsTransferTarget ? 'is-transfer-target' : ''}" ${reserveIsTransferTarget ? `onclick="window.TabletopMat.completeCoreTransfer('reserve', null)" title="Click to return 1 Core to Reserve"` : ''}>
                <div class="tm-rail-heading">
                  <span>${reserveIsTransferTarget ? '➕ Return to Reserve' : 'Your Reserve'}</span>
                  <strong>${p.reserve || 0}</strong>
                </div>
                <div class="tm-core-gems">${renderCoreGems(p.reserve || 0, p.soulCoreLocation === 'reserve', 16, 8)}</div>
              </div>
              <div class="tm-stat-chips">
                <div class="tm-stat-chip" title="Your Count"><span>🔹 Count</span><strong>${p.count || 0}</strong></div>
                <div class="tm-stat-chip" style="cursor:pointer;" onclick="BattleArena.openZoneModal('player-open')" title="Click to inspect Open Zone"><span>📖 Open</span><strong>${(p.openCards || []).length}</strong></div>
              </div>
              <div class="tm-burst-box" onclick="BattleArena.inspectSoulCore && BattleArena.inspectSoulCore()" title="Soul Core Status">
                🔥 Soul Core: <strong>${escHtml(formatSoulCoreLoc(p.soulCoreLocation))}</strong>
              </div>
            </div>
          </div>

          <!-- CENTER PLAYMAT -->
          <div class="tm-center-arena">
            <div class="tm-opp-hand-row">
              <span class="tm-opp-hand-pill">Opp Hand: ${oppHandCount}</span>
              ${oppHandBacks}
            </div>

            <div class="tm-field-half opp-half">
              <span class="tm-field-zone-tag">Opponent Battle Line &amp; Nexuses</span>
              <div class="tm-field-row">
                ${oppBoardHtml || `<span class="tm-empty-hint">No Spirits or Nexuses on opponent field</span>`}
              </div>
            </div>

            <div class="tm-divider">
              ${renderCenterBar(state)}
            </div>

            <div class="tm-field-half player-half">
              <span class="tm-field-zone-tag">Your Battle Line &amp; Nexuses</span>
              <div class="tm-field-row">
                ${pBoardHtml || `<span class="tm-empty-hint">Your battle line is clear — summon a Spirit or deploy a Nexus from your hand</span>`}
              </div>
            </div>

            <div class="tm-player-hand-row">
              ${renderPlayerHand(state)}
            </div>
          </div>

          <!-- RIGHT RAIL -->
          <div class="tm-rail">
            <div class="tm-rail-group">
              <div class="tm-core-panel">
                <div class="tm-rail-heading"><span>Opp Reserve</span><strong>${o.reserve || 0}</strong></div>
                <div class="tm-core-gems">${renderCoreGems(o.reserve || 0, o.soulCoreLocation === 'reserve', 16, 8)}</div>
              </div>
              <div class="tm-core-panel life-panel">
                <div class="tm-rail-heading"><span>Opp Life</span><strong>${o.life || 0}/5</strong></div>
                <div class="tm-core-gems">${renderLifeCrystals(o.life || 0, o.soulCoreLocation === 'life', 20)}</div>
              </div>
              <div class="tm-burst-box ${o.burst ? 'is-set' : ''}" onclick="BattleArena.inspectOpponentBurst && BattleArena.inspectOpponentBurst()" title="Opponent Burst Slot">
                ${o.burst ? '🔥 Opponent Burst Set' : '🔒 Opp Burst: Empty'}
              </div>
            </div>

            <div class="tm-rail-group">
              <div class="tm-burst-box ${p.burst ? 'is-set' : ''}" onclick="BattleArena.inspectBurst && BattleArena.inspectBurst()" title="Click to inspect your Set Burst">
                ${p.burst ? `🔥 Burst: ${escHtml(p.burst.name || 'Set')}` : '🔒 Your Burst: Empty'}
              </div>
              ${p.mirage ? `<div class="tm-burst-box is-set" onclick="BattleArena.openCardDetailContext('${escJs(p.mirage.name || '')}', 'mirage', '${escJs(p.mirage.uid || '')}')" title="Active Mirage">🔮 Mirage: ${escHtml(p.mirage.name || 'Set')}</div>` : ''}
              <div class="tm-piles-row">
                <div class="tm-pile-box deck-pile" title="Your Deck">
                  <div class="tm-pile-label">Your Deck</div>
                  <div class="tm-pile-count">${(p.deck || []).length}</div>
                </div>
                <div class="tm-pile-box" onclick="BattleArena.openZoneModal('player-trash')" title="Click to inspect Your Graveyard (Trash Cards)">
                  ${pTrashTop ? `<img class="tm-pile-top-art" src="${escHtml(resolveCardImg(pTrashTop))}" alt="" referrerpolicy="no-referrer" />` : ''}
                  <div class="tm-pile-label">Graveyard</div>
                  <div class="tm-pile-count">${(p.trashCards || []).length}</div>
                </div>
              </div>
              <div class="tm-core-panel">
                <div class="tm-rail-heading"><span>Trash Cores</span><strong>${p.trash || 0}</strong></div>
                <div class="tm-core-gems">${renderCoreGems(p.trash || 0, p.soulCoreLocation === 'trash', 15, 7)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="tm-hover-inspector" id="tmHoverInspector" aria-hidden="true"></div>
    `;
    return true;
  }

  // ── UNIVERSAL "VIEW BOARD" MODAL PEEK CONTROLLER (Classic + Tabletop) ──
  function hasActiveChoiceModal() {
    if (typeof document === 'undefined' || typeof document.querySelectorAll !== 'function') return false;
    const modals = document.querySelectorAll('.battle-modal-overlay, .engine-prompt-overlay, #enginePromptModal');
    for (const m of modals) {
      if (!m || m.id === 'battleCoinModal' || m.id === 'battleResultModal') continue;
      const isActiveClass = m.classList && m.classList.contains('active');
      const disp = m.style ? String(m.style.display || '').trim() : '';
      if (isActiveClass || disp === 'flex' || disp === 'block') {
        return true;
      }
    }
    return false;
  }

  let _syncingPeek = false;
  function syncBoardPeekButton() {
    if (_syncingPeek || typeof document === 'undefined') return false;
    _syncingPeek = true;
    try {
      const btn = document.getElementById('btnArenaPeekBoard');
      const active = hasActiveChoiceModal();
      if (!active && document.body && document.body.classList && document.body.classList.contains('arena-peeking-board')) {
        document.body.classList.remove('arena-peeking-board');
      }
      const isPeeking = Boolean(document.body && document.body.classList && document.body.classList.contains('arena-peeking-board'));
      if (btn) {
        if (btn.classList.contains('visible') !== active) btn.classList.toggle('visible', active);
        const shouldPeek = active && isPeeking;
        if (btn.classList.contains('peeking') !== shouldPeek) btn.classList.toggle('peeking', shouldPeek);
        const nextText = isPeeking ? '↩️ Return to Choice' : '👁️ View Board';
        if (btn.textContent !== nextText) btn.textContent = nextText;
      }
      return active;
    } finally {
      _syncingPeek = false;
    }
  }

  function toggleBoardPeek(forceState) {
    if (typeof document === 'undefined' || !document.body || !document.body.classList) return false;
    if (!hasActiveChoiceModal()) {
      document.body.classList.remove('arena-peeking-board');
      syncBoardPeekButton();
      return false;
    }
    const next = forceState !== undefined
      ? Boolean(forceState)
      : !document.body.classList.contains('arena-peeking-board');
    document.body.classList.toggle('arena-peeking-board', next);
    syncBoardPeekButton();
    return next;
  }

  function init() {
    setMode(getMode());
    syncBoardPeekButton();
    if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
      document.addEventListener('click', (e) => {
        const wrap = document.getElementById('arenaHomeWrap');
        if (wrap && e.target && typeof wrap.contains === 'function' && !wrap.contains(e.target)) {
          closeHomeMenu();
        }
      });
    }
    if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined' && document.body) {
      try {
        const obs = new MutationObserver(() => syncBoardPeekButton());
        obs.observe(document.body, {
          subtree: true,
          childList: true,
          attributes: true,
          attributeFilter: ['class', 'style']
        });
      } catch {}
    }
  }

  if (typeof window !== 'undefined') {
    window.TabletopMat = {
      getMode,
      setMode,
      toggle,
      render,
      init,
      syncBattleModeBodyClass,
      toggleHomeMenu,
      closeHomeMenu,
      toggleChatDrawer,
      setChatTab,
      sendChatMessage,
      addIncomingChat,
      renderChatDrawer,
      showHoverPreview,
      hideHoverPreview,
      startCoreTransfer,
      completeCoreTransfer,
      cancelCoreTransfer,
      toggleBoardPeek,
      syncBoardPeekButton,
      getChatMessages: () => [...chatMessages]
    };
    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
      } else {
        init();
      }
    }
  }
})();
