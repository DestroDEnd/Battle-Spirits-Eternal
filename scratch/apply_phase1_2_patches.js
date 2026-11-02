const fs = require('fs');

let arena = fs.readFileSync('battle_arena.js', 'utf8');

// 1. Inject helpers before `function renderPlayerHand()`
const helperCode = `
  // =========================================================================
  // 🔮 SYMBOL COST REDUCTION & ULTIMATE SUMMON CONDITION ENGINE
  // =========================================================================

  function parseCardSymbols(target) {
    if (target === undefined || target === null) return 1;
    let symStr = '';
    if (typeof target === 'object') {
      symStr = String(target.symbol || '').trim();
      if (!symStr) {
        const type = String(target.type || '').toLowerCase();
        if (type.includes('magic')) return 0;
        return 1;
      }
    } else {
      symStr = String(target).trim();
    }
    if (symStr === '' || symStr === '-' || symStr === '0' || symStr.toLowerCase() === 'none') return 0;
    const px20 = (symStr.match(/20px/g) || []).length;
    const px25 = (symStr.match(/25px/g) || []).length;
    if (px20 + px25 > 0) return px20 + px25;
    if (/^\\d+$/.test(symStr)) return parseInt(symStr, 10);
    if (symStr.includes(',') || symStr.includes('/')) {
      const tokens = symStr.split(/[,/]/).map(t => t.trim()).filter(Boolean);
      if (tokens.length > 0) return tokens.length;
    }
    return 1;
  }

  function parseCardColors(card) {
    if (!card) return ['red'];
    const raw = card.colors || card.color || 'red';
    if (Array.isArray(raw)) return raw.map(c => String(c).toLowerCase().trim()).filter(Boolean);
    const str = String(raw).toLowerCase();
    if (str.includes(',')) return str.split(',').map(s => s.trim()).filter(Boolean);
    if (str.includes('/')) return str.split('/').map(s => s.trim()).filter(Boolean);
    return [str.trim()];
  }

  function getFriendlySymbols(side) {
    const friendlyState = (side === 'opponent') ? DuelState.opponent : DuelState.player;
    if (!friendlyState) return { total: 0, byColor: {}, rainbow: 0 };

    const byColor = { red: 0, purple: 0, green: 0, white: 0, yellow: 0, blue: 0 };
    let rainbow = 0;

    // 1. Spirits / Ultimates on field
    const field = friendlyState.field || [];
    for (const s of field) {
      let symCount = parseCardSymbols(s);
      if (s.extraSymbols) symCount += s.extraSymbols;
      if (symCount > 0) {
        const eff = (s.effect || '').toLowerCase();
        const isRainbow = eff.includes('treated as red/purple/green/yellow/blue') ||
                          eff.includes('treated as red/purple/green/white/yellow/blue') ||
                          eff.includes('treated as all colors') ||
                          eff.includes('all-color') ||
                          eff.includes('6 colors');

        if (isRainbow) {
          rainbow += symCount;
        } else {
          const colors = parseCardColors(s);
          for (const col of colors) {
            if (byColor[col] !== undefined) {
              byColor[col] += symCount;
            }
          }
        }
      }

      // Brave attached to spirit
      if (s.brave) {
        let bCount = parseCardSymbols(s.brave);
        if (bCount > 0) {
          const bEff = (s.brave.effect || '').toLowerCase();
          const bIsRainbow = bEff.includes('treated as red/purple/green/yellow/blue') ||
                             bEff.includes('treated as red/purple/green/white/yellow/blue') ||
                             bEff.includes('treated as all colors');
          if (bIsRainbow) {
            rainbow += bCount;
          } else {
            const bColors = parseCardColors(s.brave);
            for (const bCol of bColors) {
              if (byColor[bCol] !== undefined) {
                byColor[bCol] += bCount;
              }
            }
          }
        }
      }
    }

    // 2. Nexuses on field
    const nexuses = friendlyState.nexus || [];
    for (const n of nexuses) {
      let symCount = parseCardSymbols(n);
      if (symCount <= 0 && n.symbol !== '-' && n.symbol !== '0') {
        symCount = 1;
      }
      if (symCount > 0) {
        const nEff = (n.effect || '').toLowerCase();
        const isRainbow = nEff.includes('treated as red/purple/green/yellow/blue') ||
                          nEff.includes('treated as red/purple/green/white/yellow/blue') ||
                          nEff.includes('treated as all colors');

        if (isRainbow) {
          rainbow += symCount;
        } else {
          const colors = parseCardColors(n);
          for (const col of colors) {
            if (byColor[col] !== undefined) {
              byColor[col] += symCount;
            }
          }
        }
      }
    }

    const total = Object.values(byColor).reduce((a, b) => a + b, 0) + rainbow;
    return { total, byColor, rainbow };
  }

  function calculateSymbolReduction(card, side = 'player') {
    if (!card) return { reduction: 0, effectiveCost: 0, baseCost: 0, minCost: 0, maxReduction: 0, matchedSymbols: 0 };
    const baseCost = card.cost !== undefined ? Number(card.cost) : 0;
    if (baseCost <= 1) {
      return { reduction: 0, effectiveCost: baseCost, baseCost, minCost: baseCost, maxReduction: 0, matchedSymbols: 0 };
    }

    // Standard official Battle Spirits reduction curve
    let maxReduction = 0;
    let minCost = 1;
    if (baseCost === 2) {
      maxReduction = 1; minCost = 1;
    } else if (baseCost === 3) {
      maxReduction = 2; minCost = 1;
    } else if (baseCost === 4) {
      maxReduction = 2; minCost = 2;
    } else if (baseCost === 5) {
      maxReduction = 3; minCost = 2;
    } else if (baseCost === 6) {
      maxReduction = 3; minCost = 3;
    } else if (baseCost === 7) {
      maxReduction = 4; minCost = 3;
    } else if (baseCost === 8) {
      maxReduction = 4; minCost = 4;
    } else if (baseCost >= 9) {
      maxReduction = Math.min(6, Math.floor(baseCost * 0.55));
      minCost = Math.max(3, baseCost - maxReduction);
    }

    // Effect overrides for reduction
    const eff = (card.effect || '').toLowerCase();
    const redMatch = eff.match(/(?:reduction|軽減)(?:シンボル)?[:\\s]+(\\d+)/i);
    if (redMatch) {
      maxReduction = Math.min(baseCost - 1, parseInt(redMatch[1], 10));
      minCost = Math.max(1, baseCost - maxReduction);
    }
    if (card.reduction !== undefined && card.reduction !== null && !isNaN(Number(card.reduction))) {
      maxReduction = Math.min(baseCost - 1, Number(card.reduction));
      minCost = Math.max(1, baseCost - maxReduction);
    }

    // Card colors
    const cardColors = parseCardColors(card);
    const isCardRainbow = eff.includes('reduction symbols of this card') &&
      (eff.includes('treated as red/purple/green/white/yellow/blue') || eff.includes('all colors') || eff.includes('red/purple/green/yellow/blue'));

    const friendly = getFriendlySymbols(side);

    // Calculate matching friendly symbols
    let matchedSymbols = 0;
    if (isCardRainbow) {
      matchedSymbols = friendly.total;
    } else {
      let specificSymbols = 0;
      for (const col of cardColors) {
        if (friendly.byColor[col]) {
          specificSymbols += friendly.byColor[col];
        }
      }
      matchedSymbols = specificSymbols + friendly.rainbow;
    }

    const actualReduction = Math.min(matchedSymbols, maxReduction, Math.max(0, baseCost - minCost));
    const effectiveCost = Math.max(minCost, baseCost - actualReduction);

    return {
      reduction: actualReduction,
      effectiveCost,
      baseCost,
      minCost,
      maxReduction,
      matchedSymbols
    };
  }

  function getCardEffectiveCost(card, side = 'player') {
    return calculateSymbolReduction(card, side).effectiveCost;
  }

  function validateUltimateSummonCondition(card, side = 'player') {
    if (!card) return { allowed: true };
    const type = String(card.type || '');
    if (type !== 'Ultimate' && !type.includes('Ultimate')) {
      return { allowed: true };
    }

    const eff = card.effect || '';
    const m = eff.match(/(?:\[(?:Summon Condition|SuAdcon):?|【(?:召喚条件|召喚\\/煌臨条件)：?)\\s*([^\\]】\\n]+)/i);
    if (!m) return { allowed: true };

    const condText = m[1].trim();
    if (!condText || /^(?:none|なし|無し)\\.?$/i.test(condText)) {
      return { allowed: true, condText };
    }

    const friendlyState = (side === 'opponent') ? DuelState.opponent : DuelState.player;
    if (!friendlyState) return { allowed: true, condText };

    const field = friendlyState.field || [];
    const spirits = field.filter(s => s.type === 'Spirit' || (s.type || '').includes('Spirit'));
    const ultimates = field.filter(s => s.type === 'Ultimate' || (s.type || '').includes('Ultimate'));
    const life = friendlyState.life !== undefined ? friendlyState.life : 5;
    const counters = friendlyState.counters || friendlyState.counter || 0;

    const cl = condText.toLowerCase();

    function wordToNum(str) {
      const map = {
        'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4,
        'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
      };
      const s = String(str || '').toLowerCase().trim();
      if (map[s] !== undefined) return map[s];
      const n = parseInt(s, 10);
      return isNaN(n) ? 1 : n;
    }

    // 1. Counter conditions
    if (cl.includes('counter') || cl.includes('カウント')) {
      const cMatch = cl.match(/(?:at least|have)\\s+(\\w+|\\d+)\\s+counter/i) || cl.match(/(\\w+|\\d+)\\s+or more\\s+counter/i) || cl.match(/c(\\d+)\\s+or\\s+more/i);
      const req = cMatch ? wordToNum(cMatch[1]) : 1;
      if (counters < req) {
        return { allowed: false, reason: \`Requires \${req} or more Counters (Current: \${counters})\`, condText };
      }
      return { allowed: true, condText };
    }

    // 2. Life conditions
    if (cl.includes('life') || cl.includes('ライフ')) {
      const lessMatch = cl.match(/life\\s+is\\s+(?:at\\s+)?(\\w+|\\d+)\\s+or\\s+less/i) || cl.match(/(\\w+|\\d+)\\s+lives?\\s+or\\s+less/i);
      if (lessMatch) {
        const maxLife = wordToNum(lessMatch[1]);
        if (life > maxLife) {
          return { allowed: false, reason: \`Requires Life to be \${maxLife} or less (Current: \${life})\`, condText };
        }
        return { allowed: true, condText };
      }
      const moreMatch = cl.match(/life\\s+is\\s+(?:at\\s+)?(\\w+|\\d+)\\s+or\\s+more/i) || cl.match(/at\\s+least\\s+(\\w+|\\d+)\\s+lives?/i) || cl.match(/(\\w+|\\d+)\\s+lives?\\s+or\\s+more/i);
      if (moreMatch) {
        const minLife = wordToNum(moreMatch[1]);
        if (life < minLife) {
          return { allowed: false, reason: \`Requires Life to be \${minLife} or more (Current: \${life})\`, condText };
        }
        return { allowed: true, condText };
      }
    }

    // 3. Spirits & Trash empty check
    if (cl.includes('no spirits') || cl.includes('0 spirit cards in your trash')) {
      const trashSpirits = (friendlyState.trashCards || friendlyState.trash || []).filter(c => (c.type || '').includes('Spirit'));
      if (spirits.length > 0 || trashSpirits.length > 0) {
        return { allowed: false, reason: 'Requires controlling no Spirits and having 0 Spirits in Trash', condText };
      }
      return { allowed: true, condText };
    }

    // 4. Ultimates on field
    if (cl.includes('one or more ultimates') || cl.includes('1 or more ultimates') || cl.includes('at least one ultimate')) {
      if (ultimates.length < 1) {
        return { allowed: false, reason: 'Requires controlling at least 1 Ultimate on field', condText };
      }
      return { allowed: true, condText };
    }

    // 5. Cost N or higher Spirit / Unit
    const costMatch = cl.match(/cost\\s+(\\d+)\\s+or\\s+(?:higher|more)\\s+(?:spirit|ultimate)/i);
    if (costMatch) {
      const reqCost = parseInt(costMatch[1], 10);
      const countMatch = cl.match(/(?:control|have)\\s+(\\w+|\\d+)\\s+or\\s+more\\s+cost/i);
      const reqCount = countMatch ? wordToNum(countMatch[1]) : 1;
      const matching = field.filter(u => (u.cost || 0) >= reqCost);
      if (matching.length < reqCount) {
        return { allowed: false, reason: \`Requires controlling at least \${reqCount} Cost \${reqCost}+ Spirit/Ultimate\`, condText };
      }
      return { allowed: true, condText };
    }

    // 6. Color-specific Spirits
    const colorMatch = cl.match(/(?:have|control)\\s+(\\w+|\\d+)\\s+or\\s+more\\s+(red|purple|green|white|yellow|blue)\\s+spirit/i) ||
                       cl.match(/(\\w+|\\d+)\\s+or\\s+more\\s+(red|purple|green|white|yellow|blue)\\s+spirits?\\s+on\\s+your\\s+field/i);
    if (colorMatch) {
      const reqCount = wordToNum(colorMatch[1]);
      const reqColor = colorMatch[2].toLowerCase();
      const matching = spirits.filter(s => (s.color || '').toLowerCase().includes(reqColor));
      if (matching.length < reqCount) {
        return { allowed: false, reason: \`Requires controlling \${reqCount} or more \${colorMatch[2]} Spirits on field\`, condText };
      }
      return { allowed: true, condText };
    }

    // 7. Family-specific Spirit/Ultimate
    const famMatch = cl.match(/(?:control|have)\\s+(\\w+|\\d+)\\s+or\\s+more\\s+([a-zA-Z\\s]+?)\\s+(?:spirit|ultimate)/i);
    if (famMatch) {
      const reqCount = wordToNum(famMatch[1]);
      const fam = famMatch[2].trim().toLowerCase();
      if (!['red', 'purple', 'green', 'white', 'yellow', 'blue', 'cost'].includes(fam)) {
        const matching = field.filter(u => {
          const uFam = ((u.family || '') + ' ' + (u.families ? u.families.join(' ') : '')).toLowerCase();
          return uFam.includes(fam);
        });
        if (matching.length < reqCount) {
          return { allowed: false, reason: \`Requires controlling \${reqCount}+ "\${famMatch[2].trim()}" Spirits/Ultimates\`, condText };
        }
        return { allowed: true, condText };
      }
    }

    // 8. Named card / Partner
    const nameMatch = condText.match(/["'“‘]([^"'”’]+)["'”’]/);
    if (nameMatch) {
      const targetName = nameMatch[1].trim().toLowerCase();
      const hasOnField = field.some(u => (u.name || '').toLowerCase().includes(targetName));
      const isContractPartner = (friendlyState.contractCard && (friendlyState.contractCard.name || '').toLowerCase().includes(targetName));
      if (!hasOnField && !isContractPartner) {
        return { allowed: false, reason: \`Requires controlling "\${nameMatch[1].trim()}" on field or in Soul State\`, condText };
      }
      return { allowed: true, condText };
    }

    return { allowed: true, condText };
  }
`;

const anchor1 = `  function renderPlayerHand() {`;
if (!arena.includes(anchor1)) throw new Error("Could not find anchor1");
arena = arena.replace(anchor1, helperCode + '\n' + anchor1);

// 2. Update renderPlayerHand body
const oldRenderHandBody = `    handEl.innerHTML = DuelState.player.hand.map(card => {
      const isSelected = DuelState.selectedPlayerCard && DuelState.selectedPlayerCard.uid === card.uid;
      const isBrave = card.type === 'Brave' || (card.type || '').includes('Brave');
      const isUltimate = card.type === 'Ultimate' || (card.type || '').includes('Ultimate');
      const isSpirit = (card.type === 'Spirit' || (card.type || '').includes('Spirit')) && !isBrave && !isUltimate;
      const isMagic = card.type === 'Magic';
      const isNexus = (card.type || '').includes('Nexus');
      const cost = card.cost || 0;
      const totalNeeded = (isSpirit || isBrave || isUltimate) ? cost + 1 : cost;

      // Strict Battle Spirits Rule: Attack step ONLY permits Flash cards!
      const canPlayStep = canPlayCardInCurrentPhase(card);
      const tributeReq = getCardTributeRequirement(card);
      const eligibleTributes = tributeReq ? getEligibleTributeSpirits(tributeReq, DuelState.player.field) : [];
      const hasTributeCondition = !tributeReq || (eligibleTributes.length > 0);
      const canAfford = canPlayStep && hasTributeCondition && (totalAvailableCores >= totalNeeded);
      const canAffordDirect = canPlayStep && (reserve >= totalNeeded);
      const needsSacrifice = canAfford && !canAffordDirect;

      let cls = \`hand-card-item card-theme-\${(card.color || 'red').toLowerCase()}\`;
      if (isSelected) cls += ' selected-hand-card';
      if (!canPlayStep) cls += ' cannot-play-step';
      else if (!canAfford) cls += ' cannot-afford';

      let actionBtnHtml = '';
      // Burst can only be set during the MAIN step (or replaced if one is already set)
      const isBurstCard = card.effect && card.effect.includes('[Burst:');
      const canSetBurst = isMainStep && isBurstCard;
      // Advent Action Button - ONLY active when step/turn timing requirements are met (Official Rule: Attack Step only, never Main Step)
      const adventReq = getCardAdventRequirement(card);
      const canAdvent = canPerformAdvent(card, 'player');
      const adventBtnHtml = canAdvent ? \`<button class="btn-quick-advent" onclick="event.stopPropagation(); BattleArena.openAdventPrompt('\${card.uid}')">🌟 [Advent]</button>\` : '';

      const burstBtnLabel = DuelState.player.burst ? '🔄 Replace Burst' : '🔒 Set as Burst';
      const burstBtnHtml = canSetBurst ? \`<button class="btn-set-burst" onclick="event.stopPropagation(); BattleArena.setBurst('\${card.uid}')">\${burstBtnLabel}</button>\` : '';

      if (canPlayStep && isBrave && isMainStep) {
        const eligibleHosts = DuelState.player.field.filter(s => !s.brave);
        let braveBtns = '';
        if (canAffordDirect) {
          braveBtns += \`<button class="btn-quick-summon" onclick="event.stopPropagation(); BattleArena.summonBraveAsSpirit('\${card.uid}')" title="Summon as Spirit (Cost \${cost} + 1 Core)">⚔️ Spirit</button>\`;
        } else if (needsSacrifice) {
          braveBtns += \`<button class="btn-quick-sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('\${card.uid}')">⚡ Sac</button>\`;
        }
        if (eligibleHosts.length > 0 && reserve >= cost) {
          braveBtns += \`<button class="btn-quick-brave" onclick="event.stopPropagation(); BattleArena.openBraveCombineModal('\${card.uid}', 'hand')" title="Combine with field Spirit (Cost \${cost})">🔗 Brave</button>\`;
        }
        actionBtnHtml = \`<div class="brave-actions-duo">\${braveBtns}</div>\`;
      } else if (canPlayStep && (isSpirit || isUltimate)) {
        const btnLabel = isAttackStep
          ? (isUltimate ? '⚡ Flash Summon' : '⚡ Flash Summon')
          : (isUltimate ? '⚔️ Summon' : '⚡ Summon');
        const btnStyle = isUltimate ? 'style="background:linear-gradient(135deg, #eab308, #ca8a04); border-color:#fde047;"' : '';
        if (canAffordDirect) {
          actionBtnHtml = \`<button class="btn-quick-summon" \${btnStyle} onclick="event.stopPropagation(); BattleArena.summonCard('\${card.uid}')">\${btnLabel}</button>\`;
        } else if (needsSacrifice) {
          actionBtnHtml = \`<button class="btn-quick-sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('\${card.uid}')">💀 Sacrifice &amp; \${isAttackStep ? 'Flash Summon' : 'Summon'} (\${cost})</button>\`;
        }
      } else if (canPlayStep && isMagic) {
        const btnLabel = isAttackStep ? '✨ Flash Cast' : '✨ Cast';
        if (canAffordDirect) {
          actionBtnHtml = \`<button class="btn-quick-magic" onclick="event.stopPropagation(); BattleArena.castMagic('\${card.uid}')">\${btnLabel} (\${cost})</button>\`;
        } else if (needsSacrifice) {
          actionBtnHtml = \`<button class="btn-quick-sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('\${card.uid}')">💀 Sacrifice &amp; \${isAttackStep ? 'Flash Cast' : 'Cast'} (\${cost})</button>\`;
        }
      } else if (canPlayStep && isNexus && isMainStep) {
        const btnLabel = '🏛️ Deploy';
        if (canAffordDirect) {
          actionBtnHtml = \`<button class="btn-quick-summon" style="background:linear-gradient(135deg, #0284c7, #0369a1); border-color:#38bdf8;" onclick="event.stopPropagation(); BattleArena.deployNexus('\${card.uid}')">\${btnLabel} (\${cost})</button>\`;
        } else if (needsSacrifice) {
          actionBtnHtml = \`<button class="btn-quick-sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('\${card.uid}')">💀 Sacrifice &amp; \${btnLabel} (\${cost})</button>\`;
        }
      }

      const safeCardName = (card.name || '').replace(/'/g, "\\\\'");
      return \`
        <div class="\${cls}" onclick="BattleArena.selectHandCard('\${card.uid}')">
          <button class="hc-zoom-btn" onclick="event.stopPropagation(); BattleArena.openCardDetailContext('\${safeCardName}', 'hand')" title="View Full Card Details">🔍</button>
          <div class="hc-cost-badge">\${card.cost}</div>`;

const newRenderHandBody = `    handEl.innerHTML = DuelState.player.hand.map(card => {
      const isSelected = DuelState.selectedPlayerCard && DuelState.selectedPlayerCard.uid === card.uid;
      const isBrave = card.type === 'Brave' || (card.type || '').includes('Brave');
      const isUltimate = card.type === 'Ultimate' || (card.type || '').includes('Ultimate');
      const isSpirit = (card.type === 'Spirit' || (card.type || '').includes('Spirit')) && !isBrave && !isUltimate;
      const isMagic = card.type === 'Magic';
      const isNexus = (card.type || '').includes('Nexus');

      const baseCost = card.cost !== undefined ? Number(card.cost) : 0;
      const reductionInfo = calculateSymbolReduction(card, 'player');
      const cost = reductionInfo.effectiveCost;
      const isReduced = cost < baseCost;
      const reductionText = isReduced ? \` [Reduced from \${baseCost}]\` : '';
      const totalNeeded = (isSpirit || isBrave || isUltimate) ? cost + 1 : cost;

      // Strict Battle Spirits Rule: Attack step ONLY permits Flash cards!
      const canPlayStep = canPlayCardInCurrentPhase(card);
      const tributeReq = getCardTributeRequirement(card);
      const eligibleTributes = tributeReq ? getEligibleTributeSpirits(tributeReq, DuelState.player.field) : [];
      const hasTributeCondition = !tributeReq || (eligibleTributes.length > 0);

      // Ultimate summon condition check
      const ultCheck = isUltimate ? validateUltimateSummonCondition(card, 'player') : { allowed: true };
      const meetsCondition = ultCheck.allowed;

      const canAfford = canPlayStep && hasTributeCondition && meetsCondition && (totalAvailableCores >= totalNeeded);
      const canAffordDirect = canPlayStep && meetsCondition && (reserve >= totalNeeded);
      const needsSacrifice = canAfford && !canAffordDirect;

      let cls = \`hand-card-item card-theme-\${(card.color || 'red').toLowerCase()}\`;
      if (isSelected) cls += ' selected-hand-card';
      if (!canPlayStep) cls += ' cannot-play-step';
      else if (!meetsCondition) cls += ' cannot-play-condition';
      else if (!canAfford) cls += ' cannot-afford';

      let actionBtnHtml = '';
      // Burst can only be set during the MAIN step (or replaced if one is already set)
      const isBurstCard = card.effect && card.effect.includes('[Burst:');
      const canSetBurst = isMainStep && isBurstCard;
      // Advent Action Button - ONLY active when step/turn timing requirements are met (Official Rule: Attack Step only, never Main Step)
      const adventReq = getCardAdventRequirement(card);
      const canAdvent = canPerformAdvent(card, 'player');
      const adventBtnHtml = canAdvent ? \`<button class="btn-quick-advent" onclick="event.stopPropagation(); BattleArena.openAdventPrompt('\${card.uid}')">🌟 [Advent]</button>\` : '';

      const burstBtnLabel = DuelState.player.burst ? '🔄 Replace Burst' : '🔒 Set as Burst';
      const burstBtnHtml = canSetBurst ? \`<button class="btn-set-burst" onclick="event.stopPropagation(); BattleArena.setBurst('\${card.uid}')">\${burstBtnLabel}</button>\` : '';

      if (isUltimate && !meetsCondition) {
        actionBtnHtml = \`<button class="btn-quick-disabled" disabled title="Summon Condition: \${ultCheck.reason}">🔒 \${ultCheck.reason || 'Summon Condition Not Met'}</button>\`;
      } else if (canPlayStep && isBrave && isMainStep) {
        const eligibleHosts = DuelState.player.field.filter(s => !s.brave);
        let braveBtns = '';
        if (canAffordDirect) {
          braveBtns += \`<button class="btn-quick-summon" onclick="event.stopPropagation(); BattleArena.summonBraveAsSpirit('\${card.uid}')" title="Summon as Spirit (Cost \${cost}\${reductionText} + 1 Core)">⚔️ Spirit (\${cost})</button>\`;
        } else if (needsSacrifice) {
          braveBtns += \`<button class="btn-quick-sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('\${card.uid}')">⚡ Sac (\${cost})</button>\`;
        }
        if (eligibleHosts.length > 0 && reserve >= cost) {
          braveBtns += \`<button class="btn-quick-brave" onclick="event.stopPropagation(); BattleArena.openBraveCombineModal('\${card.uid}', 'hand')" title="Combine with field Spirit (Cost \${cost}\${reductionText})">🔗 Brave (\${cost})</button>\`;
        }
        actionBtnHtml = \`<div class="brave-actions-duo">\${braveBtns}</div>\`;
      } else if (canPlayStep && (isSpirit || isUltimate)) {
        const btnLabel = isAttackStep
          ? (isUltimate ? '⚡ Flash Summon' : '⚡ Flash Summon')
          : (isUltimate ? '⚔️ Summon' : '⚡ Summon');
        const btnStyle = isUltimate ? 'style="background:linear-gradient(135deg, #eab308, #ca8a04); border-color:#fde047;"' : '';
        if (canAffordDirect) {
          actionBtnHtml = \`<button class="btn-quick-summon" \${btnStyle} onclick="event.stopPropagation(); BattleArena.summonCard('\${card.uid}')">\${btnLabel} (\${cost}\${reductionText})</button>\`;
        } else if (needsSacrifice) {
          actionBtnHtml = \`<button class="btn-quick-sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('\${card.uid}')">💀 Sac &amp; \${isAttackStep ? 'Flash Summon' : 'Summon'} (\${cost}\${reductionText})</button>\`;
        }
      } else if (canPlayStep && isMagic) {
        const btnLabel = isAttackStep ? '✨ Flash Cast' : '✨ Cast';
        if (canAffordDirect) {
          actionBtnHtml = \`<button class="btn-quick-magic" onclick="event.stopPropagation(); BattleArena.castMagic('\${card.uid}')">\${btnLabel} (\${cost}\${reductionText})</button>\`;
        } else if (needsSacrifice) {
          actionBtnHtml = \`<button class="btn-quick-sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('\${card.uid}')">💀 Sac &amp; \${isAttackStep ? 'Flash Cast' : 'Cast'} (\${cost}\${reductionText})</button>\`;
        }
      } else if (canPlayStep && isNexus && isMainStep) {
        const btnLabel = '🏛️ Deploy';
        if (canAffordDirect) {
          actionBtnHtml = \`<button class="btn-quick-summon" style="background:linear-gradient(135deg, #0284c7, #0369a1); border-color:#38bdf8;" onclick="event.stopPropagation(); BattleArena.deployNexus('\${card.uid}')">\${btnLabel} (\${cost}\${reductionText})</button>\`;
        } else if (needsSacrifice) {
          actionBtnHtml = \`<button class="btn-quick-sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('\${card.uid}')">💀 Sac &amp; \${btnLabel} (\${cost}\${reductionText})</button>\`;
        }
      }

      const costBadgeHtml = isReduced
        ? \`<div class="hc-cost-badge hc-cost-badge-reduced" title="Reduced from \${baseCost} to \${cost} by field symbols">\${cost}</div>\`
        : \`<div class="hc-cost-badge">\${baseCost}</div>\`;

      const safeCardName = (card.name || '').replace(/'/g, "\\\\'");
      return \`
        <div class="\${cls}" onclick="BattleArena.selectHandCard('\${card.uid}')">
          <button class="hc-zoom-btn" onclick="event.stopPropagation(); BattleArena.openCardDetailContext('\${safeCardName}', 'hand')" title="View Full Card Details">🔍</button>
          \${costBadgeHtml}\`;

if (!arena.includes(oldRenderHandBody)) throw new Error("Could not find oldRenderHandBody");
arena = arena.replace(oldRenderHandBody, newRenderHandBody);

// 3. Update renderCardInspector
const oldInspectorCostSection = `    const isSpirit = (card.type === 'Spirit' || (card.type || '').includes('Spirit')) && !isBrave && !isUltimate;
    const isMagic = card.type === 'Magic';
    const isNexus = (card.type || '').includes('Nexus');
    const cost = card.cost !== undefined ? card.cost : 0;
    const totalNeeded = (isSpirit || isBrave || isUltimate) ? cost + 1 : cost;

    const isPlayerTurn = DuelState.activePlayer === 'player';
    const phase = DuelState.phases[DuelState.phaseIndex];
    const canPlayStep = canPlayCardInCurrentPhase(card);

    const available = getPlayerAvailableCores();
    const canAffordDirect = canPlayStep && (available.reserve >= totalNeeded);
    const canAffordWithSacrifice = canPlayStep && (available.total >= totalNeeded);`;

const newInspectorCostSection = `    const isSpirit = (card.type === 'Spirit' || (card.type || '').includes('Spirit')) && !isBrave && !isUltimate;
    const isMagic = card.type === 'Magic';
    const isNexus = (card.type || '').includes('Nexus');

    const baseCost = card.cost !== undefined ? Number(card.cost) : 0;
    const reductionInfo = calculateSymbolReduction(card, 'player');
    const cost = reductionInfo.effectiveCost;
    const isReduced = cost < baseCost;
    const reductionText = isReduced ? \` [Reduced from \${baseCost}]\` : '';
    const totalNeeded = (isSpirit || isBrave || isUltimate) ? cost + 1 : cost;

    const isPlayerTurn = DuelState.activePlayer === 'player';
    const phase = DuelState.phases[DuelState.phaseIndex];
    const canPlayStep = canPlayCardInCurrentPhase(card);

    const isInspectUltimate = card.type === 'Ultimate' || (card.type || '').includes('Ultimate');
    const ultCheck = isInspectUltimate ? validateUltimateSummonCondition(card, 'player') : { allowed: true };
    const meetsCondition = ultCheck.allowed;

    const available = getPlayerAvailableCores();
    const canAffordDirect = canPlayStep && meetsCondition && (available.reserve >= totalNeeded);
    const canAffordWithSacrifice = canPlayStep && meetsCondition && (available.total >= totalNeeded);`;

if (!arena.includes(oldInspectorCostSection)) throw new Error("Could not find oldInspectorCostSection");
arena = arena.replace(oldInspectorCostSection, newInspectorCostSection);

// Update inspector action button when Ultimate condition fails
const oldInspectorBraveCheck = `      const isInspectBrave = card.type === 'Brave' || (card.type || '').includes('Brave');
      const isInspectUltimate = card.type === 'Ultimate' || (card.type || '').includes('Ultimate');
      const isInspectSpirit = (card.type === 'Spirit' || (card.type || '').includes('Spirit')) && !isInspectBrave && !isInspectUltimate;
      const isInspectUnit = isInspectSpirit || isInspectUltimate;
      if (canPlayStep && isInspectBrave) {`;

const newInspectorBraveCheck = `      const isInspectBrave = card.type === 'Brave' || (card.type || '').includes('Brave');
      const isInspectSpirit = (card.type === 'Spirit' || (card.type || '').includes('Spirit')) && !isInspectBrave && !isInspectUltimate;
      const isInspectUnit = isInspectSpirit || isInspectUltimate;
      if (isInspectUltimate && !meetsCondition) {
        actionBtnHtml = \`<button class="btn-inspector-action btn-inspect-disabled" disabled title="Summon Condition: \${ultCheck.reason}">🔒 \${ultCheck.reason || 'Summon Condition Not Met'}</button>\`;
      } else if (canPlayStep && isInspectBrave) {`;

if (!arena.includes(oldInspectorBraveCheck)) throw new Error("Could not find oldInspectorBraveCheck");
arena = arena.replace(oldInspectorBraveCheck, newInspectorBraveCheck);

// 4. Update summonCard
const oldSummonCardHead = `    if (phase === 'ATTACK' && !hasFlashTiming(card)) {
      if (typeof showToast === 'function') showToast(\`Official Rule: Normal Spirits & Ultimates cannot be summoned during the Attack Step! "\${card.name}" does not have [Flash] timing.\`, 'warning');
      return;
    }

    const cost = card.cost || 0;
    const coresToPlace = customCoresToPlace || 1; // Default 1 core to stay alive on field
    const totalNeeded = cost + coresToPlace;`;

const newSummonCardHead = `    if (phase === 'ATTACK' && !hasFlashTiming(card)) {
      if (typeof showToast === 'function') showToast(\`Official Rule: Normal Spirits & Ultimates cannot be summoned during the Attack Step! "\${card.name}" does not have [Flash] timing.\`, 'warning');
      return;
    }

    const isUltimate = card.type === 'Ultimate' || (card.type || '').includes('Ultimate');
    if (isUltimate) {
      const ultCheck = validateUltimateSummonCondition(card, 'player');
      if (!ultCheck.allowed) {
        if (typeof showToast === 'function') {
          showToast(\`Official Rule: Cannot summon Ultimate "\${card.name}"! Condition not met: \${ultCheck.reason}\`, 'warning');
        }
        return;
      }
    }

    const baseCost = card.cost || 0;
    const cost = getCardEffectiveCost(card, 'player');
    const isCostReduced = cost < baseCost;
    const coresToPlace = customCoresToPlace || 1; // Default 1 core to stay alive on field
    const totalNeeded = cost + coresToPlace;`;

if (!arena.includes(oldSummonCardHead)) throw new Error("Could not find oldSummonCardHead");
arena = arena.replace(oldSummonCardHead, newSummonCardHead);

// Update summonCard log
const oldSummonLog = `addLog(\`✨ **SUMMONED**: "\${card.name}" (\${cardKind}) placed on field! Paid \${cost} cores, allocated \${coresToPlace} core (Lv\${level}, \${bp} BP).\`, 'step');`;
const newSummonLog = `addLog(\`✨ **SUMMONED**: "\${card.name}" (\${cardKind}) placed on field! Paid \${cost} cores\${isCostReduced ? \` (reduced from \${baseCost} via field symbols)\` : ''}, allocated \${coresToPlace} core (Lv\${level}, \${bp} BP).\`, 'step');`;
if (!arena.includes(oldSummonLog)) throw new Error("Could not find oldSummonLog");
arena = arena.replace(oldSummonLog, newSummonLog);

// 5. Update deployNexus
const oldDeployNexusCost = `    const cost = card.cost || 0;
    const coresOnNexus = customCoresToPlace || (card.levels && card.levels[0]?.cores !== undefined ? card.levels[0].cores : 0);
    const totalNeeded = cost + coresOnNexus;`;

const newDeployNexusCost = `    const baseCost = card.cost || 0;
    const cost = getCardEffectiveCost(card, 'player');
    const isCostReduced = cost < baseCost;
    const coresOnNexus = customCoresToPlace || (card.levels && card.levels[0]?.cores !== undefined ? card.levels[0].cores : 0);
    const totalNeeded = cost + coresOnNexus;`;

if (!arena.includes(oldDeployNexusCost)) throw new Error("Could not find oldDeployNexusCost");
arena = arena.replace(oldDeployNexusCost, newDeployNexusCost);

const oldDeployLog = `addLog(\`🏛️ **DEPLOYED**: Nexus "\${card.name}" placed in the Center Field Nexus Zone! Paid \${cost} cores (Lv\${card.currentLevel}, \${card.currentCores} cores).\`, 'step');`;
const newDeployLog = `addLog(\`🏛️ **DEPLOYED**: Nexus "\${card.name}" placed in the Center Field Nexus Zone! Paid \${cost} cores\${isCostReduced ? \` (reduced from \${baseCost} via field symbols)\` : ''} (Lv\${card.currentLevel}, \${card.currentCores} cores).\`, 'step');`;
if (!arena.includes(oldDeployLog)) throw new Error("Could not find oldDeployLog");
arena = arena.replace(oldDeployLog, newDeployLog);

// 6. Update summonBraveAsSpirit
const oldBraveAsSpiritCost = `    const cost = card.cost || 0;
    const coresToPlace = customCoresToPlace || 1;
    const totalNeeded = cost + coresToPlace;`;

const newBraveAsSpiritCost = `    const baseCost = card.cost || 0;
    const cost = getCardEffectiveCost(card, 'player');
    const coresToPlace = customCoresToPlace || 1;
    const totalNeeded = cost + coresToPlace;`;

if (!arena.includes(oldBraveAsSpiritCost)) throw new Error("Could not find oldBraveAsSpiritCost");
arena = arena.replace(oldBraveAsSpiritCost, newBraveAsSpiritCost);

// 7. Update combineBrave
const oldCombineBraveHand = `    if (source === 'hand') {
      const cost = braveCard.cost || 0;`;

const newCombineBraveHand = `    if (source === 'hand') {
      const baseCost = braveCard.cost || 0;
      const cost = getCardEffectiveCost(braveCard, 'player');`;

if (!arena.includes(oldCombineBraveHand)) throw new Error("Could not find oldCombineBraveHand");
arena = arena.replace(oldCombineBraveHand, newCombineBraveHand);

// 8. Update castFlashInBattle
const oldCastFlashCost = `    const isSpirit = card.type === 'Spirit';
    const cost = card.cost || 0;
    const totalNeeded = isSpirit ? cost + 1 : cost;`;

const newCastFlashCost = `    const isSpirit = card.type === 'Spirit';
    const baseCost = card.cost || 0;
    const cost = getCardEffectiveCost(card, 'player');
    const totalNeeded = isSpirit ? cost + 1 : cost;`;

if (!arena.includes(oldCastFlashCost)) throw new Error("Could not find oldCastFlashCost");
arena = arena.replace(oldCastFlashCost, newCastFlashCost);

// 9. Update castMagic
const oldCastMagicCost = `    const cost = card.cost || 0;
    const payingWithSc = (useSoulCore === true) && hasSoulCoreInReserve;
    const availableReserve = DuelState.player.reserve + (hasSoulCoreInReserve ? 1 : 0);

    if ((payingWithSc ? availableReserve : DuelState.player.reserve) < cost) {
      const { total } = getPlayerAvailableCores();
      if (total >= cost) {
        openSacrificeModal(uid);
        return;
      }
      if (typeof showToast === 'function') showToast(\`Need \${cost} cores to cast "\${card.name}", but only have \${total} across Reserve and Field!\`, 'warning');
      return;
    }`;

const newCastMagicCost = `    const baseCost = card.cost || 0;
    const cost = getCardEffectiveCost(card, 'player');
    const payingWithSc = (useSoulCore === true) && hasSoulCoreInReserve;
    const availableReserve = DuelState.player.reserve + (hasSoulCoreInReserve ? 1 : 0);

    if ((payingWithSc ? availableReserve : DuelState.player.reserve) < cost) {
      const { total } = getPlayerAvailableCores();
      if (total >= cost) {
        openSacrificeModal(uid);
        return;
      }
      if (typeof showToast === 'function') showToast(\`Need \${cost} cores to cast "\${card.name}"\${cost < baseCost ? \` (reduced from \${baseCost})\` : ''}, but only have \${total} across Reserve and Field!\`, 'warning');
      return;
    }`;

if (!arena.includes(oldCastMagicCost)) throw new Error("Could not find oldCastMagicCost");
arena = arena.replace(oldCastMagicCost, newCastMagicCost);

// 10. Update openSacrificeModal
const oldOpenSacCost = `    const { reserve, fieldCores, total: totalAvailable } = getPlayerAvailableCores();
    const isUnit = card.type === 'Spirit' || card.type === 'Ultimate' || (card.type || '').includes('Spirit') || (card.type || '').includes('Ultimate') || (card.type || '').includes('Brave');
    const cost = card.cost || 0;
    const totalNeeded = isUnit ? cost + 1 : cost;`;

const newOpenSacCost = `    const { reserve, fieldCores, total: totalAvailable } = getPlayerAvailableCores();
    const isUnit = card.type === 'Spirit' || card.type === 'Ultimate' || (card.type || '').includes('Spirit') || (card.type || '').includes('Ultimate') || (card.type || '').includes('Brave');
    const cost = getCardEffectiveCost(card, 'player');
    const totalNeeded = isUnit ? cost + 1 : cost;`;

if (!arena.includes(oldOpenSacCost)) throw new Error("Could not find oldOpenSacCost");
arena = arena.replace(oldOpenSacCost, newOpenSacCost);

// 11. Update getAttackSymbols for Brave symbol addition
const oldGetAttackSymbolsBase = `    let total = base + (spirit.extraSymbols || 0);
    const eff = spirit.effect || '';
    const level = spirit.currentLevel || 1;`;

const newGetAttackSymbolsBase = `    let total = base + (spirit.extraSymbols || 0);

    // 1b. Brave symbols addition: if spirit.brave, parse and add the Brave card's symbol count
    if (spirit.brave) {
      const bSymStr = String(spirit.brave.symbol || '').trim();
      let braveSymbols = 0;
      if (bSymStr === '-' || bSymStr.toLowerCase() === 'none' || bSymStr === '0') {
        braveSymbols = 0;
      } else {
        const bPx20 = (bSymStr.match(/20px/g) || []).length;
        const bPx25 = (bSymStr.match(/25px/g) || []).length;
        if (bPx20 + bPx25 > 0) {
          braveSymbols = bPx20 + bPx25;
        } else if (/^\\d+$/.test(bSymStr)) {
          braveSymbols = parseInt(bSymStr, 10);
        } else if (bSymStr.includes(',') || bSymStr.includes('/')) {
          braveSymbols = bSymStr.split(/[,/]/).map(t => t.trim()).filter(Boolean).length;
        } else if (spirit.brave.symbol !== undefined && spirit.brave.symbol !== null && !isNaN(Number(spirit.brave.symbol))) {
          braveSymbols = Number(spirit.brave.symbol);
        } else {
          braveSymbols = 1;
        }
      }
      total += braveSymbols;
    }

    const eff = spirit.effect || '';
    const level = spirit.currentLevel || 1;`;

if (!arena.includes(oldGetAttackSymbolsBase)) throw new Error("Could not find oldGetAttackSymbolsBase");
arena = arena.replace(oldGetAttackSymbolsBase, newGetAttackSymbolsBase);

// 12. Update runAiMainStep
const oldAiSummonFilter = `      const summonable = DuelState.opponent.hand.filter(c => {
        if (c.type !== 'Spirit' || availableReserve < ((c.cost || 0) + 1)) return false;
        const req = getCardTributeRequirement(c);
        if (req && !getEligibleTributeSpirits(req, DuelState.opponent.field).length) return false;
        return true;
      });`;

const newAiSummonFilter = `      const summonable = DuelState.opponent.hand.filter(c => {
        const isUlt = c.type === 'Ultimate' || (c.type || '').includes('Ultimate');
        if (isUlt) {
          const ultCheck = validateUltimateSummonCondition(c, 'opponent');
          if (!ultCheck.allowed) return false;
        } else if (c.type !== 'Spirit' && !(c.type || '').includes('Spirit')) {
          return false;
        }
        const effCost = getCardEffectiveCost(c, 'opponent');
        if (availableReserve < (effCost + 1)) return false;
        const req = getCardTributeRequirement(c);
        if (req && !getEligibleTributeSpirits(req, DuelState.opponent.field).length) return false;
        return true;
      });`;

if (!arena.includes(oldAiSummonFilter)) throw new Error("Could not find oldAiSummonFilter");
arena = arena.replace(oldAiSummonFilter, newAiSummonFilter);

const oldAiCostEval = `      for (const c of summonable) {
        const cost = c.cost || 0;`;

const newAiCostEval = `      for (const c of summonable) {
        const cost = getCardEffectiveCost(c, 'opponent');`;

if (!arena.includes(oldAiCostEval)) throw new Error("Could not find oldAiCostEval");
arena = arena.replace(oldAiCostEval, newAiCostEval);

const oldAiExecSummonCost = `      const cost = bestCard.cost || 0;
      DuelState.opponent.reserve -= (cost + bestCoresToPlace);
      DuelState.opponent.trash += cost;`;

const newAiExecSummonCost = `      const baseCost = bestCard.cost || 0;
      const cost = getCardEffectiveCost(bestCard, 'opponent');
      DuelState.opponent.reserve -= (cost + bestCoresToPlace);
      DuelState.opponent.trash += cost;`;

if (!arena.includes(oldAiExecSummonCost)) throw new Error("Could not find oldAiExecSummonCost");
arena = arena.replace(oldAiExecSummonCost, newAiExecSummonCost);

// 13. Update Flash timing in block prompt
const oldFlashStepCheck = `        const need = (c.cost || 0) + (c.type === 'Spirit' ? 1 : 0);
        return total >= need;`;

const newFlashStepCheck = `        const need = getCardEffectiveCost(c, 'player') + (c.type === 'Spirit' ? 1 : 0);
        return total >= need;`;

if (!arena.includes(oldFlashStepCheck)) throw new Error("Could not find oldFlashStepCheck");
arena = arena.replace(oldFlashStepCheck, newFlashStepCheck);

const oldFlashCardsFilter = `    const flashCards = DuelState.player.hand.filter(c => {
      if (!hasFlashTiming(c)) return false;
      const cost = c.cost || 0;
      const isSpirit = c.type === 'Spirit';
      const totalNeeded = isSpirit ? cost + 1 : cost;
      return totalAvailableCores >= totalNeeded;
    });`;

const newFlashCardsFilter = `    const flashCards = DuelState.player.hand.filter(c => {
      if (!hasFlashTiming(c)) return false;
      const cost = getCardEffectiveCost(c, 'player');
      const isSpirit = c.type === 'Spirit';
      const totalNeeded = isSpirit ? cost + 1 : cost;
      return totalAvailableCores >= totalNeeded;
    });`;

if (!arena.includes(oldFlashCardsFilter)) throw new Error("Could not find oldFlashCardsFilter");
arena = arena.replace(oldFlashCardsFilter, newFlashCardsFilter);

// 14. Update auto duel step
const oldAutoDuel = `const card = DuelState.player.hand.find(c => c.type === 'Spirit' && DuelState.player.reserve >= (c.cost + 1));`;
const newAutoDuel = `const card = DuelState.player.hand.find(c => c.type === 'Spirit' && DuelState.player.reserve >= (getCardEffectiveCost(c, 'player') + 1));`;

if (!arena.includes(oldAutoDuel)) throw new Error("Could not find oldAutoDuel");
arena = arena.replace(oldAutoDuel, newAutoDuel);

// 15. Export newly added functions
const oldExports = `    getWhenAttacksBpBoost,
    getAttackSymbols,`;

const newExports = `    getWhenAttacksBpBoost,
    getAttackSymbols,
    calculateSymbolReduction,
    getCardEffectiveCost,
    validateUltimateSummonCondition,
    getFriendlySymbols,`;

if (!arena.includes(oldExports)) throw new Error("Could not find oldExports");
arena = arena.replace(oldExports, newExports);

fs.writeFileSync('battle_arena.js', arena, 'utf8');
console.log('Successfully patched battle_arena.js!');

// Update styles.css with .hc-cost-badge-reduced and .cannot-play-condition
let css = fs.readFileSync('styles.css', 'utf8');
if (!css.includes('.hc-cost-badge-reduced')) {
  const cssAdditions = `
.hc-cost-badge-reduced {
  background: linear-gradient(135deg, #10b981, #059669) !important;
  color: #fff !important;
  border: 1px solid #34d399;
}
.cannot-play-condition {
  opacity: 0.55;
  filter: grayscale(0.5);
}
`;
  css += cssAdditions;
  fs.writeFileSync('styles.css', css, 'utf8');
  console.log('Successfully updated styles.css!');
} else {
  console.log('styles.css already contains .hc-cost-badge-reduced');
}
