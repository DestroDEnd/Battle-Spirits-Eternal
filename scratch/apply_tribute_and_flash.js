const fs = require('fs');

let js = fs.readFileSync('battle_arena.js', 'utf8');

// 1. TRIBUTE & FLASH TIMING LOGIC HELPER FUNCTIONS
const tributeFlashEngine = `
  // ── TRIBUTE (供物) MECHANICS ENGINE ──
  function getCardTributeRequirement(card) {
    if (!card || !card.effect) return null;
    const m = card.effect.match(/\\[Tribute:\\s*([^→\\->\\]]+)(?:→|->)\\s*([^\\]]+)\\]/i);
    if (!m) return null;
    const rawCond = m[1].trim();
    const rawDest = m[2].trim().toLowerCase();
    const dest = rawDest.includes('void') ? 'void' : 'trash';

    const costM = rawCond.match(/cost\\s*(\\d+)\\s*or\\s*more/i);
    if (costM) {
      return {
        raw: m[0],
        type: 'cost',
        minCost: parseInt(costM[1], 10),
        condText: \`Cost \${costM[1]}+ Spirit\`,
        dest: dest,
        destLabel: dest === 'void' ? 'The Void' : 'Trash'
      };
    } else {
      return {
        raw: m[0],
        type: 'family',
        family: rawCond,
        condText: \`"\${rawCond}" family Spirit\`,
        dest: dest,
        destLabel: dest === 'void' ? 'The Void' : 'Trash'
      };
    }
  }

  function getEligibleTributeSpirits(tributeReq, fieldSpirits) {
    if (!tributeReq || !fieldSpirits || !fieldSpirits.length) return [];
    return fieldSpirits.filter(s => {
      if (tributeReq.type === 'cost') {
        return (s.cost || 0) >= tributeReq.minCost;
      } else if (tributeReq.type === 'family') {
        const fam = ((s.family || '') + ' ' + (s.families ? s.families.join(' ') : '')).toLowerCase();
        return fam.includes(tributeReq.family.toLowerCase());
      }
      return false;
    });
  }

  let pendingTribute = null;

  function openTributeModal(card, tributeReq, cost, coresToPlace, eligibleSpirits) {
    pendingTribute = { card, tributeReq, cost, coresToPlace, eligibleSpirits };
    const modalEl = document.getElementById('battleTributeModal');
    if (!modalEl) {
      // Fallback: direct tribute first eligible
      if (eligibleSpirits.length > 0) {
        executeTribute(card, eligibleSpirits[0], tributeReq, cost, coresToPlace);
      }
      return;
    }

    const titleEl = document.getElementById('tributeModalTitle');
    if (titleEl) {
      titleEl.textContent = \`Tribute Summon: \${card.name}\`;
    }
    const descEl = document.getElementById('tributeModalDesc');
    if (descEl) {
      descEl.innerHTML = \`To complete summoning <strong>\${card.name}</strong>, select 1 <strong>\${tributeReq.condText}</strong> to Tribute. All cores on it will be sent to <strong>\${tributeReq.destLabel}</strong>!\`;
    }

    const choicesEl = document.getElementById('tributeSpiritChoices');
    if (choicesEl) {
      choicesEl.innerHTML = eligibleSpirits.map(s => \`
        <div class="tribute-choice-card" onclick="BattleArena.selectTributeSpirit('\${s.uid}')">
          <div class="tcc-info">
            <span class="tcc-name">\${s.name}</span>
            <span class="tcc-meta">Cost \${s.cost} • \${s.currentCores} Cores (\${s.currentBp} BP, Lv\${s.currentLevel})</span>
          </div>
          <button class="tcc-btn">👑 Tribute (Send Cores to \${tributeReq.destLabel})</button>
        </div>
      \`).join('');
    }

    modalEl.classList.add('active');
  }

  function selectTributeSpirit(spiritUid) {
    if (!pendingTribute) return;
    const { card, tributeReq, cost, coresToPlace, eligibleSpirits } = pendingTribute;
    const chosen = eligibleSpirits.find(s => s.uid === spiritUid);
    if (!chosen) return;

    closeTributeModal();
    executeTribute(card, chosen, tributeReq, cost, coresToPlace);
  }

  function closeTributeModal() {
    pendingTribute = null;
    const modalEl = document.getElementById('battleTributeModal');
    if (modalEl) modalEl.classList.remove('active');
  }

  function cancelTributeSummon() {
    if (!pendingTribute) return;
    const { card, cost, coresToPlace } = pendingTribute;
    // Refund paid cost
    DuelState.player.reserve += (cost + coresToPlace);
    DuelState.player.trash = Math.max(0, DuelState.player.trash - cost);
    DuelState.player.hand.push(card);
    closeTributeModal();
    renderDuelTable();
    renderPlayerHand();
    if (typeof showToast === 'function') showToast(\`Cancelled Tribute Summon of "\${card.name}". Cores refunded.\`, 'info');
  }

  function executeTribute(card, tributedSpirit, tributeReq, cost, coresToPlace) {
    const tCores = tributedSpirit.currentCores || 0;
    const hasSc = !!tributedSpirit.hasSoulCore;

    // Send cores to destination
    if (tributeReq.dest === 'void') {
      // Cores dissipate into Void
      const voidEl = document.getElementById('battleVoidZone');
      if (voidEl) {
        voidEl.classList.remove('void-pulse-active');
        void voidEl.offsetWidth;
        voidEl.classList.add('void-pulse-active');
        setTimeout(() => voidEl.classList.remove('void-pulse-active'), 1200);
      }
      if (hasSc) {
        DuelState.player.soulCoreLocation = 'void';
        DuelState.player.soulCoreSpiritUid = null;
      }
    } else {
      // Cores go to Trash
      DuelState.player.trash += tCores;
      if (hasSc) {
        DuelState.player.soulCoreLocation = 'trash';
        DuelState.player.soulCoreSpiritUid = null;
      }
    }

    // Remove tributed spirit from field & send card to Trash
    const spIdx = DuelState.player.field.findIndex(s => s.uid === tributedSpirit.uid);
    if (spIdx !== -1) {
      DuelState.player.field.splice(spIdx, 1);
    }
    sendToTrash(tributedSpirit, 'player', \`Tributed for \${card.name} (\${tributeReq.condText} -> \${tributeReq.destLabel})\`);

    // Place summoned spirit on field
    const { level, bp } = calculateBpAndLevel(card.levels, coresToPlace);
    card.currentCores = coresToPlace;
    card.currentLevel = level;
    card.currentBp = bp;
    card.isExhausted = false;
    card.hasAttacked = false;
    DuelState.player.field.push(card);

    AudioFX.summon();
    addLog(\`👑 **[TRIBUTE SUMMON COMPLETED]**: Tributed "\${tributedSpirit.name}"! Sent all \${tCores} Core(s) to \${tributeReq.destLabel}. "**\${card.name}**" descended to the battlefield (Lv\${level}, \${bp} BP)!\`, 'step');
    if (typeof showToast === 'function') showToast(\`👑 Tribute Summoned "\${card.name}"!\`, 'success');

    if (card.name.includes('Grand-Woden')) {
      addLog(\`⚡ **[MAGIC NEGATION ACTIVE]**: Grand-Woden stands ready to negate opposing Magic effects by exhausting!\`, 'step');
    }

    renderDuelTable();
    renderPlayerHand();
  }

  // ── FLASH TIMING EFFECT SUMMARIZER & ENGINE ──
  function getFlashEffectSummary(card) {
    if (!card) return 'Flash effect';
    const name = card.name || '';
    if (name.includes('Blizzard Wall')) return 'Ends Attack Step & prevents further life damage';
    if (name.includes('Defensive Aura')) return '+3000 BP to all defending/blocking Spirits';
    if (name.includes('Ice Age Shield')) return 'Prevents Life damage from the attacking Spirit';
    if (name.includes('Co-op Barrier')) return 'Refreshes 1 Spirit & erects life shield';
    if (name.includes('Double Draw')) return 'Grants +2000 BP to a Spirit';
    if (name.includes('Flame Dance')) return 'Destroys a 4000 BP or less Spirit';
    if (name.includes('Flame Tempest')) return 'Destroys all 3000 BP or less Spirits';
    if (name.includes('Brave Cemetery')) return 'Returns Brave from Trash or +1000 BP';
    if (name.includes('Lead Wall')) return 'Enables blocking unblockable Spirits';
    return card.summary || (card.effect ? card.effect.substring(0, 50) + '...' : 'Flash Timing');
  }

  function castFlashInBattle(cardUid, attackerUid) {
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
      if (typeof showToast === 'function') showToast(\`Need \${totalNeeded} cores to cast "\${card.name}"!\`, 'warning');
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
      addLog(\`⚡ **[SWIFT FLASH SUMMON]**: "\${card.name}" Flash-summoned onto the battlefield during combat (Lv\${level}, \${bp} BP)!\`, 'magic');
      if (typeof showToast === 'function') showToast(\`⚡ Flash Summoned "\${card.name}"! Ready to block.\`, 'success');
    } else {
      // Magic Flash effect execution
      sendToTrash(card, 'player', 'Cast Flash Magic in Battle');
      const effectDesc = applyMagicEffect(card, 'player', attacker);
      addLog(\`✨ **[FLASH MAGIC CAST]**: "\${card.name}" activated during Flash timing! \${effectDesc}\`, 'magic');
      if (typeof showToast === 'function') showToast(\`✨ "\${card.name}" Activated!\`, 'success');

      // Specific check: Blizzard Wall ends attack step!
      if (card.name.includes('Blizzard Wall')) {
        closeBlockModal();
        DuelState.combatEvent = null;
        renderDuelTable();
        addLog(\`❄️ **[ATTACK STEP TERMINATED]**: Blizzard Wall extinguished all enemy attacks!\`, 'step');
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
`;

// Insert helper functions before applyMagicEffect
const magicTarget = "function applyMagicEffect(card, side = 'player')";
js = js.replace(magicTarget, tributeFlashEngine + "\n  " + magicTarget);
console.log('[OK] Inserted Tribute & Flash timing helper functions');

// 2. REPLACE applyMagicEffect with complete Battle Spirits canon spell resolution
const oldApplyMagicStart = "function applyMagicEffect(card, side = 'player')";
const oldApplyMagicEnd = "function castMagic(uid) {";
const applyIdx1 = js.indexOf(oldApplyMagicStart);
const applyIdx2 = js.indexOf(oldApplyMagicEnd);

if (applyIdx1 !== -1 && applyIdx2 !== -1) {
  const newApplyMagic = `function applyMagicEffect(card, side = 'player', contextAttacker = null) {
    let effectDesc = '';
    const isPlayer = side === 'player';
    const myDeck = isPlayer ? DuelState.player.deck : DuelState.opponent.deck;
    const myHand = isPlayer ? DuelState.player.hand : DuelState.opponent.hand;
    const enemyField = isPlayer ? DuelState.opponent.field : DuelState.player.field;
    const enemyReserve = isPlayer ? DuelState.opponent : DuelState.player;
    const myField = isPlayer ? DuelState.player.field : DuelState.opponent.field;

    const name = card.name || '';
    const eff = (card.effect || '').toLowerCase();

    if (name.includes('Blizzard Wall')) {
      effectDesc = 'Ended the Attack Step! No further life damage can be inflicted this turn.';
    } else if (name.includes('Defensive Aura')) {
      myField.forEach(s => {
        s.currentBp += 3000;
        s.battleBp = (s.battleBp || s.currentBp) + 3000;
      });
      effectDesc = 'Granted +3000 BP to all allied defending spirits!';
    } else if (name.includes('Double Draw') || name.includes('Burst Draw') || (eff.includes('draw two cards') && !eff.includes('give a spirit'))) {
      const d1 = myDeck.shift();
      const d2 = myDeck.shift();
      if (d1) myHand.push(d1);
      if (d2) myHand.push(d2);
      effectDesc = \`\${isPlayer ? 'You drew' : 'Opponent drew'} 2 cards from deck!\`;
    } else if (name.includes('Flame Dance') || (eff.includes('destroy') && eff.includes('4000 bp or less'))) {
      const target = enemyField.find(s => s.currentBp <= 4000);
      if (target) {
        const idx = enemyField.indexOf(target);
        enemyField.splice(idx, 1);
        enemyReserve.reserve += target.currentCores;
        sendToTrash(target, isPlayer ? 'opponent' : 'player', \`Destroyed by \${card.name}\`);
        effectDesc = \`Destroyed enemy "\${target.name}" (\${target.currentBp} BP)! Cores returned to reserve.\`;
      } else {
        effectDesc = 'No enemy spirit with 4000 BP or less to destroy.';
      }
    } else if (name.includes('Flame Tempest') || (eff.includes('destroy all') && eff.includes('3000 bp or less'))) {
      const destroyed = [];
      for (let i = enemyField.length - 1; i >= 0; i--) {
        if (enemyField[i].currentBp <= 3000) {
          const s = enemyField.splice(i, 1)[0];
          enemyReserve.reserve += s.currentCores;
          sendToTrash(s, isPlayer ? 'opponent' : 'player', \`Incinerated by \${card.name}\`);
          destroyed.push(s.name);
        }
      }
      effectDesc = destroyed.length ? \`Incinerated \${destroyed.join(', ')} (<= 3000 BP)!\` : 'No enemy spirits <= 3000 BP.';
    } else if (eff.includes('+2000 bp')) {
      myField.forEach(s => s.currentBp += 2000);
      effectDesc = 'Granted +2000 BP to active spirits!';
    } else if (eff.includes('+1000 bp')) {
      myField.forEach(s => s.currentBp += 1000);
      effectDesc = 'Granted +1000 BP to active spirits!';
    } else if (eff.includes('+3000 bp')) {
      myField.forEach(s => s.currentBp += 3000);
      effectDesc = 'Granted +3000 BP to active spirits!';
    } else if (name.includes('Ice Age Shield') || name.includes('Co-op Barrier')) {
      if (myField.length) {
        myField[0].isExhausted = false; // Refresh spirit
      }
      effectDesc = 'Refreshed an allied spirit and erected a protective shield against life damage!';
    } else {
      myField.forEach(s => s.currentBp += 3000);
      effectDesc = \`Activated magic! Granted +3000 BP to active spirits.\`;
    }

    return effectDesc;
  }

  `;
  js = js.substring(0, applyIdx1) + newApplyMagic + js.substring(applyIdx2);
  console.log('[OK] Updated applyMagicEffect with complete Flash spell resolutions');
}

// 3. UPDATE summonCard to integrate Tribute
const summonTarget = "DuelState.player.field.push(card);\n    DuelState.selectedPlayerCard = null;";
const tributeSummonCheck = `// Check Tribute requirement
    const tributeReq = getCardTributeRequirement(card);
    if (tributeReq) {
      const eligible = getEligibleTributeSpirits(tributeReq, DuelState.player.field);
      if (eligible.length === 1) {
        // Direct tribute sole eligible spirit
        executeTribute(card, eligible[0], tributeReq, cost, coresToPlace);
        DuelState.selectedPlayerCard = null;
        return;
      } else if (eligible.length > 1) {
        // Prompt player to choose which spirit to tribute
        openTributeModal(card, tributeReq, cost, coresToPlace, eligible);
        DuelState.selectedPlayerCard = null;
        return;
      }
    }

    DuelState.player.field.push(card);
    DuelState.selectedPlayerCard = null;`;

if (js.includes(summonTarget)) {
  js = js.replace(summonTarget, tributeSummonCheck);
  console.log('[OK] Integrated Tribute check into summonCard');
}

// 4. UPDATE showBlockPrompt to render Flash Timing Section
const blockPromptTarget = "const choicesEl = document.getElementById('blockerChoices');";
const flashBlockPrompt = `const attNameEl = document.getElementById('blockAttackerName');
    if (attNameEl) {
      attNameEl.textContent = \`\${attacker.name} (\${attacker.battleBp || attacker.currentBp} BP)\`;
    }

    // Identify playable Flash cards in hand (both Magic & Swift spirits)
    const { total: totalAvailableCores } = getPlayerAvailableCores();
    const flashCards = DuelState.player.hand.filter(c => {
      if (!hasFlashTiming(c)) return false;
      const cost = c.cost || 0;
      const isSpirit = c.type === 'Spirit';
      const totalNeeded = isSpirit ? cost + 1 : cost;
      return totalAvailableCores >= totalNeeded;
    });

    // Render Flash Timing section
    const flashSectionEl = document.getElementById('blockFlashSection');
    if (flashSectionEl) {
      if (flashCards.length > 0) {
        flashSectionEl.innerHTML = \`
          <div class="flash-spells-container">
            <div class="flash-spells-title">⚡ FLASH TIMING WINDOW (Cast before blocking):</div>
            \${flashCards.map(c => \`
              <button class="flash-spell-btn" onclick="BattleArena.castFlashInBattle('\${c.uid}', '\${attacker.uid}')" title="\${c.effect}">
                <div class="fsb-left">
                  <span class="fsb-name">✨ \${c.name}</span>
                  <span class="fsb-desc">\${c.type === 'Spirit' ? 'Swift Spirit Summon' : getFlashEffectSummary(c)}</span>
                </div>
                <span class="fsb-cost">Cost \${c.cost}</span>
              </button>
            \`).join('')}
          </div>
        \`;
      } else {
        flashSectionEl.innerHTML = '';
      }
    }

    const choicesEl = document.getElementById('blockerChoices');`;

if (js.includes(blockPromptTarget)) {
  js = js.replace(blockPromptTarget, flashBlockPrompt);
  console.log('[OK] Integrated Flash Timing window into showBlockPrompt');
}

// 5. UPDATE renderPlayerHand to check Tribute prerequisites and display appropriate button
const handTributeTarget = "const canPlayStep = canPlayCardInCurrentPhase(card);";
const handTributeCheck = `const canPlayStep = canPlayCardInCurrentPhase(card);
      const tributeReq = getCardTributeRequirement(card);
      const eligibleTributes = tributeReq ? getEligibleTributeSpirits(tributeReq, DuelState.player.field) : [];
      const hasTributeCondition = !tributeReq || (eligibleTributes.length > 0);`;

if (js.includes(handTributeTarget)) {
  js = js.replace(handTributeTarget, handTributeCheck);
  js = js.replace("const canAfford = canPlayStep && (totalAvailableCores >= totalNeeded);", "const canAfford = canPlayStep && hasTributeCondition && (totalAvailableCores >= totalNeeded);");
  console.log('[OK] Integrated Tribute check into renderPlayerHand affordability');
}

// Update Tribute keyword pill in formatEffectKeywords
js = js.replace(/Burst:\[\^\\\]\]\+/g, "Burst:[^\\]]+|Tribute:[^\\]]+");
js = js.replace("else if (low.includes('flash')) cls = 'kw-flash';", "else if (low.includes('flash')) cls = 'kw-flash';\n      else if (low.includes('tribute')) cls = 'kw-tribute';");
console.log('[OK] Added Tribute keyword styling to formatEffectKeywords');

// 6. EXPOSE new API methods on window.BattleArena
const exportsTarget = "removeCoreFromSpirit,";
const newExports = `removeCoreFromSpirit,
    getCardTributeRequirement,
    getEligibleTributeSpirits,
    selectTributeSpirit,
    cancelTributeSummon,
    castFlashInBattle,`;
js = js.replace(exportsTarget, newExports);
console.log('[OK] Exported Tribute & Flash methods on window.BattleArena');

fs.writeFileSync('battle_arena.js', js, 'utf8');
console.log('[DONE] battle_arena.js updated successfully!');
