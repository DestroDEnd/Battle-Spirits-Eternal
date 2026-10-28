import os

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Marker to find start: // ── FLASH TIMING EFFECT SUMMARIZER & ENGINE ──
start_marker = '// ── FLASH TIMING EFFECT SUMMARIZER & ENGINE ──'
end_marker = '  // ── CORE SACRIFICE MODAL CONTROLLER ──'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print(f"Error: Markers not found! start_idx={start_idx}, end_idx={end_idx}")
    exit(1)

new_section = """// ── FLASH TIMING EFFECT SUMMARIZER & ENGINE ──
  function getFlashEffectSummary(card) {
    if (!card) return 'Flash effect';
    const name = card.name || '';
    if (name.includes('Blizzard Wall')) return 'Ends Attack Step & prevents further life damage';
    if (name.includes('Defensive Aura')) return '+3000 BP to all defending/blocking Spirits';
    if (name.includes('Ice Age Shield')) return 'Prevents Life damage from the attacking Spirit';
    if (name.includes('Co-op Barrier')) return 'Refreshes 1 Spirit & erects life shield';
    if (name.includes('Insect Aura')) return '+2000 BP to a Spirit during this turn';
    if (name.includes('Carry Cores')) return '+1 Core from Void to Reserve & +1000 BP to a Spirit';
    if (name.includes('Buster Phalanx')) return '+4000 BP to a Spirit during this turn';
    if (name.includes('Double Draw')) return 'Grants +2000 BP to a Spirit';
    if (name.includes('Flame Dance')) return 'Destroys a 4000 BP or less Spirit';
    if (name.includes('Flame Tempest')) return 'Destroys all 3000 BP or less Spirits';
    if (name.includes('Brave Cemetery')) return 'Returns Brave from Trash or +1000 BP to a Spirit';
    if (name.includes('Lead Wall')) return 'Enables blocking unblockable Spirits';

    const bpMatch = (card.effect || '').match(/(?:\\+|plus\\s*)(\\d+)\\s*bp/i) || (card.effect || '').match(/bp\\s*(?:\\+|plus\\s*)(\\d+)/i);
    if (bpMatch) {
      const isTeam = (card.effect || '').toLowerCase().includes('all');
      return `+${bpMatch[1]} BP to ${isTeam ? 'all Spirits' : 'a Spirit'}`;
    }
    return card.summary || (card.effect ? card.effect.substring(0, 50) + '...' : 'Flash Timing');
  }

  function isSingleTargetBpBuff(card) {
    if (!card) return false;
    const name = card.name || '';
    if (name.includes('Defensive Aura')) return false; // Defensive Aura affects all blocking spirits
    const eff = (card.effect || '').toLowerCase();
    const hasBpBoost = /(?:\\+|plus\\s*)\\d+\\s*bp/i.test(eff) || /bp\\s*(?:\\+|plus\\s*)\\d+/i.test(eff);
    if (!hasBpBoost) return false;
    if (eff.includes('all your spirits') || eff.includes('all spirits') || eff.includes('all your blocking') || eff.includes('すべてのスピリット') || eff.includes('全スピリット')) {
      return false;
    }
    return true;
  }

  function getMagicBpBoostAmount(card) {
    if (!card || !card.effect) return 2000;
    const eff = card.effect.toLowerCase();
    const m = eff.match(/(?:\\+|plus\\s*)(\\d+)\\s*bp/i) || eff.match(/bp\\s*(?:\\+|plus\\s*)(\\d+)/i);
    return m ? parseInt(m[1], 10) : 2000;
  }

  // ── TARGET SPIRIT SELECTION CONTROLLER ──
  let pendingTargetSelection = null;

  function openTargetModal(card, mode = 'magic', attackerUid = null) {
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
            <span class="tcc-meta">Lv${s.currentLevel} • ${s.currentBp} BP • ${s.currentCores} Core${s.currentCores === 1 ? '' : 's'}${s.isExhausted ? ' (Exhausted)' : ' (Ready)'}</span>
          </div>
          <button class="target-choice-btn">🎯 Target (+${bpAmount} BP)</button>
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
  }

  function closeTargetModal() {
    pendingTargetSelection = null;
    const modalEl = document.getElementById('battleTargetModal');
    if (modalEl) modalEl.classList.remove('active');
  }

  function cancelTargetSelection() {
    const saved = pendingTargetSelection;
    closeTargetModal();
    if (saved && saved.mode === 'flash_battle' && saved.attackerUid) {
      const attacker = DuelState.opponent.field.find(s => s.uid === saved.attackerUid);
      if (attacker) {
        const readyBlockers = DuelState.player.field.filter(s => !s.isExhausted);
        showBlockPrompt(attacker, readyBlockers);
      }
    }
  }

  function castFlashInBattle(cardUid, attackerUid, targetSpiritUid = null) {
    const card = DuelState.player.hand.find(c => c.uid === cardUid);
    if (!card) return;

    const attacker = DuelState.opponent.field.find(s => s.uid === attackerUid) || DuelState.selectedAttacker;
    const isSpirit = card.type === 'Spirit';
    const cost = card.cost || 0;
    const totalNeeded = isSpirit ? cost + 1 : cost;

    // Check affordability
    if (DuelState.player.reserve < totalNeeded) {
      const { total } = getPlayerAvailableCores();
      if (total >= totalNeeded) {
        openSacrificeModal(cardUid);
        return;
      }
      if (typeof showToast === 'function') showToast(`Need ${totalNeeded} cores to cast "${card.name}"!`, 'warning');
      return;
    }

    // Single-target BP buff check: if player has > 1 spirit and no target specified yet, open target selector!
    if (!isSpirit && isSingleTargetBpBuff(card) && DuelState.player.field.length > 1 && !targetSpiritUid) {
      openTargetModal(card, 'flash_battle', attackerUid);
      return;
    }

    // Direct pay from reserve
    DuelState.player.reserve -= totalNeeded;
    DuelState.player.trash += cost;
    const cardIdx = DuelState.player.hand.findIndex(c => c.uid === cardUid);
    if (cardIdx !== -1) DuelState.player.hand.splice(cardIdx, 1);

    AudioFX.coreChime();

    if (isSpirit) {
      // Swift / Flash Spirit summon
      const coresToPlace = 1;
      const { level, bp } = calculateBpAndLevel(card.levels, coresToPlace);
      card.currentCores = coresToPlace;
      card.currentLevel = level;
      card.currentBp = bp;
      card.isExhausted = false;
      card.hasAttacked = false;
      DuelState.player.field.push(card);
      AudioFX.summon();
      addLog(`⚡ **[SWIFT FLASH SUMMON]**: "${card.name}" Flash-summoned onto the battlefield during combat (Lv${level}, ${bp} BP)!`, 'magic');
      if (typeof showToast === 'function') showToast(`⚡ Flash Summoned "${card.name}"! Ready to block.`, 'success');
    } else {
      // Magic Flash effect execution
      sendToTrash(card, 'player', 'Cast Flash Magic in Battle');
      const effectDesc = applyMagicEffect(card, 'player', attacker, targetSpiritUid);
      addLog(`✨ **[FLASH MAGIC CAST]**: "${card.name}" activated during Flash timing! ${effectDesc}`, 'magic');
      if (typeof showToast === 'function') showToast(`✨ "${card.name}" Activated!`, 'success');

      // Specific check: Blizzard Wall ends attack step!
      if (card.name.includes('Blizzard Wall')) {
        closeBlockModal();
        DuelState.combatEvent = null;
        renderDuelTable();
        addLog(`❄️ **[ATTACK STEP TERMINATED]**: Blizzard Wall extinguished all enemy attacks!`, 'step');
        safeTimeout(endTurn, 1000);
        return;
      }
    }

    renderDuelTable();

    // Re-render the block prompt so updated BP or newly summoned Swift spirit appears!
    const readyBlockers = DuelState.player.field.filter(s => !s.isExhausted);
    if (attacker) {
      showBlockPrompt(attacker, readyBlockers);
    }
  }

  function applyMagicEffect(card, side = 'player', contextAttacker = null, targetSpiritUid = null) {
    let effectDesc = '';
    const isPlayer = side === 'player';
    const myDeck = isPlayer ? DuelState.player.deck : DuelState.opponent.deck;
    const myHand = isPlayer ? DuelState.player.hand : DuelState.opponent.hand;
    const enemyField = isPlayer ? DuelState.opponent.field : DuelState.player.field;
    const enemyReserve = isPlayer ? DuelState.opponent : DuelState.player;
    const myField = isPlayer ? DuelState.player.field : DuelState.opponent.field;

    const name = card.name || '';
    const eff = (card.effect || '').toLowerCase();
    const currentPhase = DuelState.phases[DuelState.phaseIndex] || 'MAIN';
    const isCombat = (currentPhase === 'ATTACK') || (DuelState.combatEvent !== null);

    if (name.includes('Blizzard Wall')) {
      effectDesc = 'Ended the Attack Step! No further life damage can be inflicted this turn.';
    } else if (name.includes('Defensive Aura') || (eff.includes('all your blocking spirits') && eff.includes('+3000 bp'))) {
      // Team-wide blocking buff (official text: "give all your blocking Spirits +3000 BP")
      myField.forEach(s => {
        s.currentBp += 3000;
        s.battleBp = (s.battleBp || s.currentBp) + 3000;
      });
      effectDesc = 'Granted +3000 BP to all allied defending spirits!';
    } else if (name.includes('Double Draw') && !isCombat) {
      // Main Step: Draw 2 cards
      const d1 = myDeck.shift();
      const d2 = myDeck.shift();
      if (d1) myHand.push(d1);
      if (d2) myHand.push(d2);
      effectDesc = `${isPlayer ? 'You drew' : 'Opponent drew'} 2 cards from deck!`;
    } else if ((name.includes('Burst Draw') || eff.includes('draw two cards')) && !eff.includes('give a spirit') && !isCombat) {
      const d1 = myDeck.shift();
      const d2 = myDeck.shift();
      if (d1) myHand.push(d1);
      if (d2) myHand.push(d2);
      effectDesc = `${isPlayer ? 'You drew' : 'Opponent drew'} 2 cards from deck!`;
    } else if (name.includes('Flame Dance') || (eff.includes('destroy') && eff.includes('4000 bp or less'))) {
      const target = enemyField.find(s => s.currentBp <= 4000);
      if (target) {
        const idx = enemyField.indexOf(target);
        enemyField.splice(idx, 1);
        enemyReserve.reserve += target.currentCores;
        sendToTrash(target, isPlayer ? 'opponent' : 'player', `Destroyed by ${card.name}`);
        effectDesc = `Destroyed enemy "${target.name}" (${target.currentBp} BP)! Cores returned to reserve.`;
      } else {
        effectDesc = 'No enemy spirit with 4000 BP or less to destroy.';
      }
    } else if (name.includes('Flame Tempest') || (eff.includes('destroy all') && eff.includes('3000 bp or less'))) {
      const destroyed = [];
      for (let i = enemyField.length - 1; i >= 0; i--) {
        if (enemyField[i].currentBp <= 3000) {
          const s = enemyField.splice(i, 1)[0];
          enemyReserve.reserve += s.currentCores;
          sendToTrash(s, isPlayer ? 'opponent' : 'player', `Incinerated by ${card.name}`);
          destroyed.push(s.name);
        }
      }
      effectDesc = destroyed.length ? `Incinerated ${destroyed.join(', ')} (<= 3000 BP)!` : 'No enemy spirits <= 3000 BP.';
    } else if (name.includes('Ice Age Shield') || name.includes('Co-op Barrier')) {
      if (myField.length) {
        myField[0].isExhausted = false; // Refresh spirit
      }
      effectDesc = 'Refreshed an allied spirit and erected a protective shield against life damage!';
    } else {
      // Dynamic BP Boost or general effect resolution
      const hasBpBoost = /(?:\\+|plus\\s*)\\d+\\s*bp/i.test(eff) || /bp\\s*(?:\\+|plus\\s*)\\d+/i.test(eff) || name.includes('Double Draw') || name.includes('Insect Aura');
      const isTeamWide = eff.includes('all your spirits') || eff.includes('all spirits') || eff.includes('all your blocking') || eff.includes('すべてのスピリット') || eff.includes('全スピリット');

      if (hasBpBoost) {
        const bpMatch = eff.match(/(?:\\+|plus\\s*)(\\d+)\\s*bp/i) || eff.match(/bp\\s*(?:\\+|plus\\s*)(\\d+)/i);
        const bpAmount = bpMatch ? parseInt(bpMatch[1], 10) : 2000;

        if (isTeamWide) {
          myField.forEach(s => {
            s.currentBp += bpAmount;
            s.battleBp = (s.battleBp || s.currentBp) + bpAmount;
          });
          effectDesc = `Granted +${bpAmount} BP to all allied spirits!`;
        } else {
          // SINGLE-TARGET BP BUFF (e.g. Insect Aura, Double Draw flash, Carry Cores, etc.)
          if (!myField.length) {
            effectDesc = `Magic activated, but no allied Spirits were on the field to receive +${bpAmount} BP.`;
          } else {
            let target = null;
            if (targetSpiritUid) {
              target = myField.find(s => s.uid === targetSpiritUid);
            }
            if (!target) {
              // Smart resolution:
              // 1. If in combat, prioritize the battling spirit
              if (DuelState.combatEvent) {
                if (DuelState.combatEvent.attacker && myField.some(s => s.uid === DuelState.combatEvent.attacker.uid)) {
                  target = DuelState.combatEvent.attacker;
                } else if (DuelState.combatEvent.blocker && myField.some(s => s.uid === DuelState.combatEvent.blocker.uid)) {
                  target = DuelState.combatEvent.blocker;
                }
              }
              // 2. If contextAttacker provided and on friendly field
              if (!target && contextAttacker && myField.some(s => s.uid === contextAttacker.uid)) {
                target = contextAttacker;
              }
              // 3. Fallback: highest BP spirit
              if (!target) {
                target = [...myField].sort((a, b) => (b.currentBp || 0) - (a.currentBp || 0))[0];
              }
            }

            if (target) {
              target.currentBp += bpAmount;
              if (target.battleBp !== undefined) {
                target.battleBp += bpAmount;
              } else {
                target.battleBp = target.currentBp;
              }

              // Handle Carry Cores extra effect if present
              if (name.includes('Carry Cores') || eff.includes('void to your reserve')) {
                (isPlayer ? DuelState.player : DuelState.opponent).reserve += 1;
                effectDesc = `Transferred 1 Core from Void to Reserve and granted +${bpAmount} BP to "${target.name}" (now ${target.currentBp} BP)!`;
              } else {
                effectDesc = `Granted +${bpAmount} BP to "${target.name}" (now ${target.currentBp} BP)!`;
              }
            }
          }
        }
      } else {
        effectDesc = `Activated magic spell "${card.name}"!`;
      }
    }

    return effectDesc;
  }

  function castMagic(uid, targetSpiritUid = null) {
    const cardIdx = DuelState.player.hand.findIndex(c => c.uid === uid);
    if (cardIdx === -1) return;
    const card = DuelState.player.hand[cardIdx];

    const phase = DuelState.phases[DuelState.phaseIndex];
    if (phase !== 'MAIN' && phase !== 'ATTACK') {
      showToast("Magic can only be cast during MAIN or ATTACK (Flash) steps!", 'warning');
      return;
    }

    if (phase === 'ATTACK' && !hasFlashTiming(card)) {
      if (typeof showToast === 'function') showToast(`Official Rule: "${card.name}" does not have [Flash] timing and can only be cast during the MAIN step!`, 'warning');
      return;
    }

    // Single-target BP buff check: if player has > 1 spirit and no target specified yet, open target selector!
    if (isSingleTargetBpBuff(card) && DuelState.player.field.length > 1 && !targetSpiritUid) {
      openTargetModal(card, 'magic');
      return;
    }

    if (DuelState.player.reserve < card.cost) {
      const { total } = getPlayerAvailableCores();
      if (total >= card.cost) {
        openSacrificeModal(uid);
        return;
      }
      if (typeof showToast === 'function') showToast(`Need ${card.cost} cores to cast "${card.name}", but only have ${total} across Reserve and Field!`, 'warning');
      return;
    }

    DuelState.player.reserve -= card.cost;
    DuelState.player.trash += card.cost;
    DuelState.player.hand.splice(cardIdx, 1);
    sendToTrash(card, 'player', 'Cast Magic from Hand');

    AudioFX.coreChime();
    const effectDesc = applyMagicEffect(card, 'player', null, targetSpiritUid);
    addLog(`🔮 **MAGIC CAST**: "${card.name}" activated! ${effectDesc}`, 'magic');
    renderDuelTable();
  }

  """

# Check CRLF
if '\r\n' in content:
    new_section = new_section.replace('\n', '\r\n')

updated = content[:start_idx] + new_section + content[end_idx:]

# Also update the exports in window.BattleArena
export_marker = 'getHexCoreSvg'
new_exports = """getHexCoreSvg,
    isSingleTargetBpBuff,
    getMagicBpBoostAmount,
    openTargetModal,
    selectTargetSpirit,
    closeTargetModal,
    cancelTargetSelection,
    applyMagicEffect"""

if '\r\n' in content:
    new_exports = new_exports.replace('\n', '\r\n')

if export_marker in updated:
    updated = updated.replace(export_marker, new_exports)

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(updated)

print("Successfully updated battle_arena.js!")
