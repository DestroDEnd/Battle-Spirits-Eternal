const fs = require('fs');

// 1. UPDATE battle_arena.js
let js = fs.readFileSync('battle_arena.js', 'utf8');

// Replace renderFieldSpirit implementation
const oldRenderFieldSpiritStart = "function renderFieldSpirit(spirit, side) {";
const oldRenderFieldSpiritEnd = "let pendingSacrifice = null;";

const idxStart = js.indexOf(oldRenderFieldSpiritStart);
const idxEnd = js.indexOf(oldRenderFieldSpiritEnd);

if (idxStart === -1 || idxEnd === -1) {
  console.error('[ERROR] Could not find renderFieldSpirit boundaries');
  process.exit(1);
}

const newRenderFieldSpirit = `function renderFieldSpirit(spirit, side) {
    const isAttacker = DuelState.selectedAttacker && DuelState.selectedAttacker.uid === spirit.uid;
    let classes = \`field-spirit-card card-color-\${(spirit.color || "Red").toLowerCase()}\`;
    if (spirit.isExhausted) classes += ' is-exhausted';
    if (isAttacker) classes += ' is-selected-attacker';
    const hasSC = !!spirit.hasSoulCore;
    if (hasSC) classes += ' has-soul-core';

    const safeSpName = (spirit.name || '').replace(/'/g, "\\\\'");

    const isPlayer = side === 'player';
    const isMainStep = DuelState.activePlayer === 'player' && DuelState.phases[DuelState.phaseIndex] === 'MAIN';
    let soulCoreActionBtn = '';
    if (isPlayer && isMainStep) {
      if (hasSC) {
        soulCoreActionBtn = \`<button class="fsc-sc-btn remove" onclick="event.stopPropagation(); BattleArena.removeSoulCoreFromSpirit('\${spirit.uid}')" title="Return Soul Core to Reserve">🔥 Remove SC</button>\`;
      } else if (DuelState.player.soulCoreLocation === 'reserve') {
        soulCoreActionBtn = \`<button class="fsc-sc-btn place" onclick="event.stopPropagation(); BattleArena.placeSoulCoreOnSpirit('\${spirit.uid}')" title="Place Soul Core on this Spirit">🔥 Place SC</button>\`;
      } else if (DuelState.player.soulCoreLocation === 'field') {
        soulCoreActionBtn = \`<button class="fsc-sc-btn place" onclick="event.stopPropagation(); BattleArena.placeSoulCoreOnSpirit('\${spirit.uid}')" title="Transfer Soul Core to this Spirit">🔥 Transfer SC</button>\`;
      }
    }

    const normalCores = hasSC ? Math.max(0, spirit.currentCores - 1) : spirit.currentCores;
    const canAddCore = isPlayer && isMainStep && (DuelState.player.reserve > 0);
    const canRemoveCore = isPlayer && isMainStep && (normalCores > 0);

    const coresDisplay = hasSC
      ? \`<span class="fsc-hex-group">\${getHexCoreSvg('blue', 13)} <span class="fsc-core-num">\${normalCores}</span> + \${getHexCoreSvg('soul', 13)} <span class="fsc-sc-tag">SC</span></span>\`
      : \`<span class="fsc-hex-group">\${getHexCoreSvg('blue', 14)} <span class="fsc-core-num">\${spirit.currentCores}</span></span>\`;

    let coreStepperHtml = '';
    if (isPlayer && isMainStep) {
      coreStepperHtml = \`
        <div class="fsc-core-stepper">
          <button class="fsc-step-btn minus" onclick="event.stopPropagation(); BattleArena.removeCoreFromSpirit('\${spirit.uid}')" \${canRemoveCore ? '' : 'disabled'} title="\${canRemoveCore ? (spirit.currentCores <= 1 ? 'Deplete: Remove last core & send to Trash' : 'Return 1 normal core to Reserve') : 'No normal cores on spirit'}">−</button>
          <div class="fsc-cores-display" title="\${spirit.currentCores} Total Cores (\${normalCores} Normal + \${hasSC ? '1 Soul Core' : '0'})">\${coresDisplay}</div>
          <button class="fsc-step-btn plus" onclick="event.stopPropagation(); BattleArena.addCoreToSpirit('\${spirit.uid}')" \${canAddCore ? '' : 'disabled'} title="\${canAddCore ? 'Add 1 normal core from Reserve' : 'No cores left in Reserve'}">+</button>
        </div>
      \`;
    } else {
      coreStepperHtml = \`
        <div class="fsc-core-stepper readonly">
          <div class="fsc-cores-display full" title="\${spirit.currentCores} Cores on Spirit">\${coresDisplay}</div>
        </div>
      \`;
    }

    return \`
      <div class="\${classes}" id="spirit_\${spirit.uid}" onclick="BattleArena.handleSpiritClick('\${spirit.uid}', '\${side}')">
        \${hasSC ? \`<div class="spirit-soul-core-badge" title="Soul Core is placed on this Spirit!">\${getHexCoreSvg('soul', 13)} SOUL CORE</div>\` : ''}
        <button class="fsc-zoom-btn" onclick="event.stopPropagation(); openCardDetail('\${safeSpName}')" title="Inspect Card Details">🔍</button>
        <div class="fsc-header-row">
          <span class="fsc-level-tag">LV\${spirit.currentLevel}</span>
          <span class="fsc-bp-tag">\${spirit.currentBp} BP</span>
        </div>
        \${coreStepperHtml}
        <div class="fsc-img-wrap">
          <img src="\${spirit.image_url}" alt="\${spirit.name}" loading="lazy" referrerpolicy="no-referrer" onerror="if(!this.dataset.retried && this.src.startsWith('http')){this.dataset.retried='1'; this.src='/api/proxy-image?url=' + encodeURIComponent(this.src);} else { this.onerror=null; this.src='/assets/card_back.png'; }" />
        </div>
        <div class="fsc-name" title="\${spirit.name}">\${spirit.name}</div>
        <div class="fsc-status-pill">\${spirit.isExhausted ? 'EXHAUSTED' : 'READY'}</div>
        \${soulCoreActionBtn}
      </div>
    \`;
  }

  `;

js = js.substring(0, idxStart) + newRenderFieldSpirit + js.substring(idxEnd);
console.log('[OK] Updated renderFieldSpirit with interactive core stepper (+ / -)');

// Add addCoreToSpirit and removeCoreFromSpirit functions
const addRemoveFuncs = `
  // ── CORE MANAGEMENT ON FIELD SPIRITS (MAIN STEP) ──
  function addCoreToSpirit(spiritUid) {
    if (DuelState.activePlayer !== 'player') {
      showToast("You can only move cores on your turn!", 'warning');
      return;
    }
    const phase = DuelState.phases[DuelState.phaseIndex];
    if (phase !== 'MAIN') {
      showToast("Cores can only be moved between Reserve and Spirits during MAIN Step!", 'warning');
      return;
    }
    if (DuelState.player.reserve <= 0) {
      showToast("No cores left in Reserve to add!", 'warning');
      return;
    }

    const spirit = DuelState.player.field.find(s => s.uid === spiritUid);
    if (!spirit) return;

    DuelState.player.reserve -= 1;
    spirit.currentCores += 1;

    // Recalculate level and BP
    const { level, bp } = calculateBpAndLevel(spirit.levels, spirit.currentCores, !!spirit.hasSoulCore, spirit.effect);
    const oldLevel = spirit.currentLevel;
    spirit.currentLevel = level;
    spirit.currentBp = bp;

    AudioFX.coreChime();
    if (level > oldLevel) {
      AudioFX.summon();
      addLog(\`✨ **LEVEL UP!** "\${spirit.name}" gained +1 Core (Total: \${spirit.currentCores}) and ascended to **LV\${level}** (\${bp} BP)!\`, 'step');
      showToast(\`✨ \${spirit.name} Level Up! Now LV\${level} (\${bp} BP)\`, 'success');
    } else {
      addLog(\`💎 Moved +1 Core from Reserve to "\${spirit.name}" (Total: \${spirit.currentCores} Cores, \${bp} BP).\`, 'normal');
    }

    renderDuelTable();
    renderPlayerHand();
  }

  function removeCoreFromSpirit(spiritUid) {
    if (DuelState.activePlayer !== 'player') {
      showToast("You can only move cores on your turn!", 'warning');
      return;
    }
    const phase = DuelState.phases[DuelState.phaseIndex];
    if (phase !== 'MAIN') {
      showToast("Cores can only be moved between Reserve and Spirits during MAIN Step!", 'warning');
      return;
    }

    const spirit = DuelState.player.field.find(s => s.uid === spiritUid);
    if (!spirit) return;

    const normalCores = spirit.hasSoulCore ? Math.max(0, spirit.currentCores - 1) : spirit.currentCores;
    if (normalCores <= 0) {
      showToast(\`No normal cores on "\${spirit.name}" to remove! Only Soul Core remains.\`, 'warning');
      return;
    }

    // Official BS Rule: A spirit with 0 cores is destroyed by depletion
    if (spirit.currentCores <= 1) {
      const confirmDeplete = (typeof window !== 'undefined' && window.confirm)
        ? window.confirm(\`Removing the last core from "\${spirit.name}" will deplete it (0 cores) and send it to the Trash.\\n\\nDo you want to deplete "\${spirit.name}"?\`)
        : true;
      if (!confirmDeplete) return;

      // Send to Trash and return the core to reserve
      DuelState.player.reserve += 1;
      const idx = DuelState.player.field.indexOf(spirit);
      if (idx !== -1) {
        DuelState.player.field.splice(idx, 1);
        sendToTrash(spirit, 'player', 'Depleted (0 cores on field)');
      }
      AudioFX.coreChime();
      addLog(\`💀 "\${spirit.name}" was depleted of all cores and sent to Trash. 1 Core returned to Reserve.\`, 'kill');
      renderDuelTable();
      renderPlayerHand();
      return;
    }

    // Normal core removal
    spirit.currentCores -= 1;
    DuelState.player.reserve += 1;

    const { level, bp } = calculateBpAndLevel(spirit.levels, spirit.currentCores, !!spirit.hasSoulCore, spirit.effect);
    const oldLevel = spirit.currentLevel;
    spirit.currentLevel = level;
    spirit.currentBp = bp;

    AudioFX.coreChime();
    if (level < oldLevel) {
      addLog(\`⚠️ "\${spirit.name}" lost a core and dropped to **LV\${level}** (\${bp} BP). 1 Core returned to Reserve.\`, 'warning');
    } else {
      addLog(\`💎 Returned 1 Core from "\${spirit.name}" to Reserve (\${spirit.currentCores} Cores remaining).\`, 'normal');
    }

    renderDuelTable();
    renderPlayerHand();
  }
`;

const inspectTarget = "function inspectSoulCore() {";
js = js.replace(inspectTarget, addRemoveFuncs + "\n  " + inspectTarget);
console.log('[OK] Added addCoreToSpirit and removeCoreFromSpirit logic');

// Add to window.BattleArena
const arenaExport = "removeSoulCoreFromSpirit,";
js = js.replace(arenaExport, `removeSoulCoreFromSpirit,
    addCoreToSpirit,
    removeCoreFromSpirit,`);
console.log('[OK] Exported addCoreToSpirit and removeCoreFromSpirit on window.BattleArena');

fs.writeFileSync('battle_arena.js', js, 'utf8');

// 2. UPDATE styles.css
let css = fs.readFileSync('styles.css', 'utf8');

// Update field-zone and field-spirit-card dimensions
css = css.replace(/min-height:\s*140px;(\s*background:\s*rgba\(0,\s*0,\s*0,\s*0\.3\);)/, 'min-height: 200px;$1');
css = css.replace(/width:\s*110px;\s*height:\s*145px;/, 'width: 128px; min-height: 180px; height: auto;');
css = css.replace(/height:\s*72px;(\s*border-radius:\s*0\.35rem;\s*overflow:\s*hidden;\s*margin:\s*0\.2rem\s*0;)/, 'height: 62px;$1');

const newStepperCss = `
/* Field Spirit Header & Stepper */
.fsc-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 24px; /* room for zoom button */
  margin-bottom: 0.22rem;
}
.fsc-level-tag {
  font-size: 0.72rem;
  font-weight: 900;
  color: #fbbf24;
}
.fsc-bp-tag {
  font-size: 0.7rem;
  font-weight: 800;
  color: #f87171;
}

.fsc-core-stepper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(56, 189, 248, 0.35);
  border-radius: 6px;
  padding: 2px 4px;
  margin-bottom: 0.25rem;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.5);
}
.fsc-core-stepper.readonly {
  justify-content: center;
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.4);
}
.fsc-step-btn {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: none;
  font-weight: 900;
  font-size: 0.88rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  padding: 0;
  user-select: none;
}
.fsc-step-btn.plus {
  background: linear-gradient(135deg, #0284c7, #38bdf8);
  color: #ffffff;
  box-shadow: 0 1px 4px rgba(2, 132, 199, 0.5);
}
.fsc-step-btn.plus:hover:not(:disabled) {
  transform: scale(1.15);
  box-shadow: 0 2px 8px rgba(56, 189, 248, 0.8);
}
.fsc-step-btn.minus {
  background: rgba(239, 68, 68, 0.25);
  border: 1px solid rgba(239, 68, 68, 0.5);
  color: #fca5a5;
}
.fsc-step-btn.minus:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.5);
  color: #ffffff;
  transform: scale(1.15);
}
.fsc-step-btn:disabled {
  opacity: 0.2;
  cursor: not-allowed;
  pointer-events: none;
}
.fsc-cores-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  font-size: 0.72rem;
  font-weight: 800;
  color: #38bdf8;
  flex: 1;
  text-align: center;
}
.fsc-cores-display.full {
  width: 100%;
}
`;

css += "\n" + newStepperCss;
fs.writeFileSync('styles.css', css, 'utf8');
console.log('[OK] Appended core stepper styles to styles.css');
console.log('[DONE] All updates applied successfully!');
