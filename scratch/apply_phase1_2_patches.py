import os

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    arena = f.read()

helper_code = '''
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
        return { allowed: false, reason: `Requires ${req} or more Counters (Current: ${counters})`, condText };
      }
      return { allowed: true, condText };
    }

    // 2. Life conditions
    if (cl.includes('life') || cl.includes('ライフ')) {
      const lessMatch = cl.match(/life\\s+is\\s+(?:at\\s+)?(\\w+|\\d+)\\s+or\\s+less/i) || cl.match(/(\\w+|\\d+)\\s+lives?\\s+or\\s+less/i);
      if (lessMatch) {
        const maxLife = wordToNum(lessMatch[1]);
        if (life > maxLife) {
          return { allowed: false, reason: `Requires Life to be ${maxLife} or less (Current: ${life})`, condText };
        }
        return { allowed: true, condText };
      }
      const moreMatch = cl.match(/life\\s+is\\s+(?:at\\s+)?(\\w+|\\d+)\\s+or\\s+more/i) || cl.match(/at\\s+least\\s+(\\w+|\\d+)\\s+lives?/i) || cl.match(/(\\w+|\\d+)\\s+lives?\\s+or\\s+more/i);
      if (moreMatch) {
        const minLife = wordToNum(moreMatch[1]);
        if (life < minLife) {
          return { allowed: false, reason: `Requires Life to be ${minLife} or more (Current: ${life})`, condText };
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
        return { allowed: false, reason: `Requires controlling at least ${reqCount} Cost ${reqCost}+ Spirit/Ultimate`, condText };
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
        return { allowed: false, reason: `Requires controlling ${reqCount} or more ${colorMatch[2]} Spirits on field`, condText };
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
          return { allowed: false, reason: `Requires controlling ${reqCount}+ "${famMatch[2].trim()}" Spirits/Ultimates`, condText };
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
        return { allowed: false, reason: `Requires controlling "${nameMatch[1].trim()}" on field or in Soul State`, condText };
      }
      return { allowed: true, condText };
    }

    return { allowed: true, condText };
  }
'''

# 1. Inject helpers before renderPlayerHand
anchor1 = "  function renderPlayerHand() {"
assert anchor1 in arena, "anchor1 not found"
arena = arena.replace(anchor1, helper_code.strip() + "\n\n" + anchor1)

# 2. Replace renderPlayerHand card mapping
old_render_hand = '''      const cost = card.cost || 0;
      const totalNeeded = (isSpirit || isBrave || isUltimate) ? cost + 1 : cost;

      // Strict Battle Spirits Rule: Attack step ONLY permits Flash cards!
      const canPlayStep = canPlayCardInCurrentPhase(card);
      const tributeReq = getCardTributeRequirement(card);
      const eligibleTributes = tributeReq ? getEligibleTributeSpirits(tributeReq, DuelState.player.field) : [];
      const hasTributeCondition = !tributeReq || (eligibleTributes.length > 0);
      const canAfford = canPlayStep && hasTributeCondition && (totalAvailableCores >= totalNeeded);
      const canAffordDirect = canPlayStep && (reserve >= totalNeeded);
      const needsSacrifice = canAfford && !canAffordDirect;

      let cls = `hand-card-item card-theme-${(card.color || 'red').toLowerCase()}`;
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
      const adventBtnHtml = canAdvent ? `<button class="btn-quick-advent" onclick="event.stopPropagation(); BattleArena.openAdventPrompt('${card.uid}')">🌟 [Advent]</button>` : '';

      const burstBtnLabel = DuelState.player.burst ? '🔄 Replace Burst' : '🔒 Set as Burst';
      const burstBtnHtml = canSetBurst ? `<button class="btn-set-burst" onclick="event.stopPropagation(); BattleArena.setBurst('${card.uid}')">${burstBtnLabel}</button>` : '';

      if (canPlayStep && isBrave && isMainStep) {
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
      } else if (canPlayStep && (isSpirit || isUltimate)) {
        const btnLabel = isAttackStep
          ? (isUltimate ? '⚡ Flash Summon' : '⚡ Flash Summon')
          : (isUltimate ? '⚔️ Summon' : '⚡ Summon');
        const btnStyle = isUltimate ? 'style="background:linear-gradient(135deg, #eab308, #ca8a04); border-color:#fde047;"' : '';
        if (canAffordDirect) {
          actionBtnHtml = `<button class="btn-quick-summon" ${btnStyle} onclick="event.stopPropagation(); BattleArena.summonCard('${card.uid}')">${btnLabel}</button>`;
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
      } else if (canPlayStep && isNexus && isMainStep) {
        const btnLabel = '🏛️ Deploy';
        if (canAffordDirect) {
          actionBtnHtml = `<button class="btn-quick-summon" style="background:linear-gradient(135deg, #0284c7, #0369a1); border-color:#38bdf8;" onclick="event.stopPropagation(); BattleArena.deployNexus('${card.uid}')">${btnLabel} (${cost})</button>`;
        } else if (needsSacrifice) {
          actionBtnHtml = `<button class="btn-quick-sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('${card.uid}')">💀 Sacrifice &amp; ${btnLabel} (${cost})</button>`;
        }
      }

      const safeCardName = (card.name || '').replace(/'/g, "\\\\'");
      return `
        <div class="${cls}" onclick="BattleArena.selectHandCard('${card.uid}')">
          <button class="hc-zoom-btn" onclick="event.stopPropagation(); BattleArena.openCardDetailContext('${safeCardName}', 'hand')" title="View Full Card Details">🔍</button>
          <div class="hc-cost-badge">${card.cost}</div>'''

new_render_hand = '''      const baseCost = card.cost !== undefined ? Number(card.cost) : 0;
      const reductionInfo = calculateSymbolReduction(card, 'player');
      const cost = reductionInfo.effectiveCost;
      const isReduced = cost < baseCost;
      const reductionText = isReduced ? ` [Reduced from ${baseCost}]` : '';
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

      let cls = `hand-card-item card-theme-${(card.color || 'red').toLowerCase()}`;
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
      const adventBtnHtml = canAdvent ? `<button class="btn-quick-advent" onclick="event.stopPropagation(); BattleArena.openAdventPrompt('${card.uid}')">🌟 [Advent]</button>` : '';

      const burstBtnLabel = DuelState.player.burst ? '🔄 Replace Burst' : '🔒 Set as Burst';
      const burstBtnHtml = canSetBurst ? `<button class="btn-set-burst" onclick="event.stopPropagation(); BattleArena.setBurst('${card.uid}')">${burstBtnLabel}</button>` : '';

      if (isUltimate && !meetsCondition) {
        actionBtnHtml = `<button class="btn-quick-disabled" disabled title="Summon Condition: ${ultCheck.reason}">🔒 ${ultCheck.reason || 'Summon Condition Not Met'}</button>`;
      } else if (canPlayStep && isBrave && isMainStep) {
        const eligibleHosts = DuelState.player.field.filter(s => !s.brave);
        let braveBtns = '';
        if (canAffordDirect) {
          braveBtns += `<button class="btn-quick-summon" onclick="event.stopPropagation(); BattleArena.summonBraveAsSpirit('${card.uid}')" title="Summon as Spirit (Cost ${cost}${reductionText} + 1 Core)">⚔️ Spirit (${cost})</button>`;
        } else if (needsSacrifice) {
          braveBtns += `<button class="btn-quick-sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('${card.uid}')">⚡ Sac (${cost})</button>`;
        }
        if (eligibleHosts.length > 0 && reserve >= cost) {
          braveBtns += `<button class="btn-quick-brave" onclick="event.stopPropagation(); BattleArena.openBraveCombineModal('${card.uid}', 'hand')" title="Combine with field Spirit (Cost ${cost}${reductionText})">🔗 Brave (${cost})</button>`;
        }
        actionBtnHtml = `<div class="brave-actions-duo">${braveBtns}</div>`;
      } else if (canPlayStep && (isSpirit || isUltimate)) {
        const btnLabel = isAttackStep
          ? (isUltimate ? '⚡ Flash Summon' : '⚡ Flash Summon')
          : (isUltimate ? '⚔️ Summon' : '⚡ Summon');
        const btnStyle = isUltimate ? 'style="background:linear-gradient(135deg, #eab308, #ca8a04); border-color:#fde047;"' : '';
        if (canAffordDirect) {
          actionBtnHtml = `<button class="btn-quick-summon" ${btnStyle} onclick="event.stopPropagation(); BattleArena.summonCard('${card.uid}')">${btnLabel} (${cost}${reductionText})</button>`;
        } else if (needsSacrifice) {
          actionBtnHtml = `<button class="btn-quick-sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('${card.uid}')">💀 Sac &amp; ${isAttackStep ? 'Flash Summon' : 'Summon'} (${cost}${reductionText})</button>`;
        }
      } else if (canPlayStep && isMagic) {
        const btnLabel = isAttackStep ? '✨ Flash Cast' : '✨ Cast';
        if (canAffordDirect) {
          actionBtnHtml = `<button class="btn-quick-magic" onclick="event.stopPropagation(); BattleArena.castMagic('${card.uid}')">${btnLabel} (${cost}${reductionText})</button>`;
        } else if (needsSacrifice) {
          actionBtnHtml = `<button class="btn-quick-sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('${card.uid}')">💀 Sac &amp; ${isAttackStep ? 'Flash Cast' : 'Cast'} (${cost}${reductionText})</button>`;
        }
      } else if (canPlayStep && isNexus && isMainStep) {
        const btnLabel = '🏛️ Deploy';
        if (canAffordDirect) {
          actionBtnHtml = `<button class="btn-quick-summon" style="background:linear-gradient(135deg, #0284c7, #0369a1); border-color:#38bdf8;" onclick="event.stopPropagation(); BattleArena.deployNexus('${card.uid}')">${btnLabel} (${cost}${reductionText})</button>`;
        } else if (needsSacrifice) {
          actionBtnHtml = `<button class="btn-quick-sacrifice" onclick="event.stopPropagation(); BattleArena.openSacrificeModal('${card.uid}')">💀 Sac &amp; ${btnLabel} (${cost}${reductionText})</button>`;
        }
      }

      const costBadgeHtml = isReduced
        ? `<div class="hc-cost-badge hc-cost-badge-reduced" title="Reduced from ${baseCost} to ${cost} by field symbols">${cost}</div>`
        : `<div class="hc-cost-badge">${baseCost}</div>`;

      const safeCardName = (card.name || '').replace(/'/g, "\\\\'");
      return `
        <div class="${cls}" onclick="BattleArena.selectHandCard('${card.uid}')">
          <button class="hc-zoom-btn" onclick="event.stopPropagation(); BattleArena.openCardDetailContext('${safeCardName}', 'hand')" title="View Full Card Details">🔍</button>
          ${costBadgeHtml}'''

assert old_render_hand in arena, "old_render_hand not found"
arena = arena.replace(old_render_hand, new_render_hand)

# 3. Update renderCardInspector
old_inspector_cost = '''    const isSpirit = (card.type === 'Spirit' || (card.type || '').includes('Spirit')) && !isBrave && !isUltimate;
    const isMagic = card.type === 'Magic';
    const isNexus = (card.type || '').includes('Nexus');
    const cost = card.cost !== undefined ? card.cost : 0;
    const totalNeeded = (isSpirit || isBrave || isUltimate) ? cost + 1 : cost;

    const isPlayerTurn = DuelState.activePlayer === 'player';
    const phase = DuelState.phases[DuelState.phaseIndex];
    const canPlayStep = canPlayCardInCurrentPhase(card);

    const available = getPlayerAvailableCores();
    const canAffordDirect = canPlayStep && (available.reserve >= totalNeeded);
    const canAffordWithSacrifice = canPlayStep && (available.total >= totalNeeded);'''

new_inspector_cost = '''    const isSpirit = (card.type === 'Spirit' || (card.type || '').includes('Spirit')) && !isBrave && !isUltimate;
    const isMagic = card.type === 'Magic';
    const isNexus = (card.type || '').includes('Nexus');

    const baseCost = card.cost !== undefined ? Number(card.cost) : 0;
    const reductionInfo = calculateSymbolReduction(card, 'player');
    const cost = reductionInfo.effectiveCost;
    const isReduced = cost < baseCost;
    const reductionText = isReduced ? ` [Reduced from ${baseCost}]` : '';
    const totalNeeded = (isSpirit || isBrave || isUltimate) ? cost + 1 : cost;

    const isPlayerTurn = DuelState.activePlayer === 'player';
    const phase = DuelState.phases[DuelState.phaseIndex];
    const canPlayStep = canPlayCardInCurrentPhase(card);

    const isInspectUltimate = card.type === 'Ultimate' || (card.type || '').includes('Ultimate');
    const ultCheck = isInspectUltimate ? validateUltimateSummonCondition(card, 'player') : { allowed: true };
    const meetsCondition = ultCheck.allowed;

    const available = getPlayerAvailableCores();
    const canAffordDirect = canPlayStep && meetsCondition && (available.reserve >= totalNeeded);
    const canAffordWithSacrifice = canPlayStep && meetsCondition && (available.total >= totalNeeded);'''

assert old_inspector_cost in arena, "old_inspector_cost not found"
arena = arena.replace(old_inspector_cost, new_inspector_cost)

old_inspector_brave_check = '''      const isInspectBrave = card.type === 'Brave' || (card.type || '').includes('Brave');
      const isInspectUltimate = card.type === 'Ultimate' || (card.type || '').includes('Ultimate');
      const isInspectSpirit = (card.type === 'Spirit' || (card.type || '').includes('Spirit')) && !isInspectBrave && !isInspectUltimate;
      const isInspectUnit = isInspectSpirit || isInspectUltimate;
      if (canPlayStep && isInspectBrave) {'''

new_inspector_brave_check = '''      const isInspectBrave = card.type === 'Brave' || (card.type || '').includes('Brave');
      const isInspectSpirit = (card.type === 'Spirit' || (card.type || '').includes('Spirit')) && !isInspectBrave && !isInspectUltimate;
      const isInspectUnit = isInspectSpirit || isInspectUltimate;
      if (isInspectUltimate && !meetsCondition) {
        actionBtnHtml = `<button class="btn-inspector-action btn-inspect-disabled" disabled title="Summon Condition: ${ultCheck.reason}">🔒 ${ultCheck.reason || 'Summon Condition Not Met'}</button>`;
      } else if (canPlayStep && isInspectBrave) {'''

assert old_inspector_brave_check in arena, "old_inspector_brave_check not found"
arena = arena.replace(old_inspector_brave_check, new_inspector_brave_check)

# 4. Update summonCard
old_summon_head = '''    if (phase === 'ATTACK' && !hasFlashTiming(card)) {
      if (typeof showToast === 'function') showToast(`Official Rule: Normal Spirits & Ultimates cannot be summoned during the Attack Step! "${card.name}" does not have [Flash] timing.`, 'warning');
      return;
    }

    const cost = card.cost || 0;
    const coresToPlace = customCoresToPlace || 1; // Default 1 core to stay alive on field
    const totalNeeded = cost + coresToPlace;'''

new_summon_head = '''    if (phase === 'ATTACK' && !hasFlashTiming(card)) {
      if (typeof showToast === 'function') showToast(`Official Rule: Normal Spirits & Ultimates cannot be summoned during the Attack Step! "${card.name}" does not have [Flash] timing.`, 'warning');
      return;
    }

    const isUltimate = card.type === 'Ultimate' || (card.type || '').includes('Ultimate');
    if (isUltimate) {
      const ultCheck = validateUltimateSummonCondition(card, 'player');
      if (!ultCheck.allowed) {
        if (typeof showToast === 'function') {
          showToast(`Official Rule: Cannot summon Ultimate "${card.name}"! Condition not met: ${ultCheck.reason}`, 'warning');
        }
        return;
      }
    }

    const baseCost = card.cost || 0;
    const cost = getCardEffectiveCost(card, 'player');
    const isCostReduced = cost < baseCost;
    const coresToPlace = customCoresToPlace || 1; // Default 1 core to stay alive on field
    const totalNeeded = cost + coresToPlace;'''

assert old_summon_head in arena, "old_summon_head not found"
arena = arena.replace(old_summon_head, new_summon_head)

old_summon_log = '''addLog(`✨ **SUMMONED**: "${card.name}" (${cardKind}) placed on field! Paid ${cost} cores, allocated ${coresToPlace} core (Lv${level}, ${bp} BP).`, 'step');'''
new_summon_log = '''addLog(`✨ **SUMMONED**: "${card.name}" (${cardKind}) placed on field! Paid ${cost} cores${isCostReduced ? ` (reduced from ${baseCost} via field symbols)` : ''}, allocated ${coresToPlace} core (Lv${level}, ${bp} BP).`, 'step');'''
assert old_summon_log in arena, "old_summon_log not found"
arena = arena.replace(old_summon_log, new_summon_log)

# 5. Update deployNexus
old_deploy_cost = '''    const cost = card.cost || 0;
    const coresOnNexus = customCoresToPlace || (card.levels && card.levels[0]?.cores !== undefined ? card.levels[0].cores : 0);
    const totalNeeded = cost + coresOnNexus;'''

new_deploy_cost = '''    const baseCost = card.cost || 0;
    const cost = getCardEffectiveCost(card, 'player');
    const isCostReduced = cost < baseCost;
    const coresOnNexus = customCoresToPlace || (card.levels && card.levels[0]?.cores !== undefined ? card.levels[0].cores : 0);
    const totalNeeded = cost + coresOnNexus;'''

assert old_deploy_cost in arena, "old_deploy_cost not found"
arena = arena.replace(old_deploy_cost, new_deploy_cost)

old_deploy_log = '''addLog(`🏛️ **DEPLOYED**: Nexus "${card.name}" placed in the Center Field Nexus Zone! Paid ${cost} cores (Lv${card.currentLevel}, ${card.currentCores} cores).`, 'step');'''
new_deploy_log = '''addLog(`🏛️ **DEPLOYED**: Nexus "${card.name}" placed in the Center Field Nexus Zone! Paid ${cost} cores${isCostReduced ? ` (reduced from ${baseCost} via field symbols)` : ''} (Lv${card.currentLevel}, ${card.currentCores} cores).`, 'step');'''
assert old_deploy_log in arena, "old_deploy_log not found"
arena = arena.replace(old_deploy_log, new_deploy_log)

# 6. Update summonBraveAsSpirit
old_brave_as_spirit_cost = '''    const cost = card.cost || 0;
    const coresToPlace = customCoresToPlace || 1;
    const totalNeeded = cost + coresToPlace;'''

new_brave_as_spirit_cost = '''    const baseCost = card.cost || 0;
    const cost = getCardEffectiveCost(card, 'player');
    const coresToPlace = customCoresToPlace || 1;
    const totalNeeded = cost + coresToPlace;'''

assert old_brave_as_spirit_cost in arena, "old_brave_as_spirit_cost not found"
arena = arena.replace(old_brave_as_spirit_cost, new_brave_as_spirit_cost)

# 7. Update combineBrave
old_combine_brave = '''    if (source === 'hand') {
      const cost = braveCard.cost || 0;'''

new_combine_brave = '''    if (source === 'hand') {
      const baseCost = braveCard.cost || 0;
      const cost = getCardEffectiveCost(braveCard, 'player');'''

assert old_combine_brave in arena, "old_combine_brave not found"
arena = arena.replace(old_combine_brave, new_combine_brave)

# 8. Update castFlashInBattle
old_cast_flash = '''    const isSpirit = card.type === 'Spirit';
    const cost = card.cost || 0;
    const totalNeeded = isSpirit ? cost + 1 : cost;'''

new_cast_flash = '''    const isSpirit = card.type === 'Spirit';
    const baseCost = card.cost || 0;
    const cost = getCardEffectiveCost(card, 'player');
    const totalNeeded = isSpirit ? cost + 1 : cost;'''

assert old_cast_flash in arena, "old_cast_flash not found"
arena = arena.replace(old_cast_flash, new_cast_flash)

# 9. Update castMagic
old_cast_magic = '''    const cost = card.cost || 0;
    const payingWithSc = (useSoulCore === true) && hasSoulCoreInReserve;
    const availableReserve = DuelState.player.reserve + (hasSoulCoreInReserve ? 1 : 0);

    if ((payingWithSc ? availableReserve : DuelState.player.reserve) < cost) {
      const { total } = getPlayerAvailableCores();
      if (total >= cost) {
        openSacrificeModal(uid);
        return;
      }
      if (typeof showToast === 'function') showToast(`Need ${cost} cores to cast "${card.name}", but only have ${total} across Reserve and Field!`, 'warning');
      return;
    }'''

new_cast_magic = '''    const baseCost = card.cost || 0;
    const cost = getCardEffectiveCost(card, 'player');
    const payingWithSc = (useSoulCore === true) && hasSoulCoreInReserve;
    const availableReserve = DuelState.player.reserve + (hasSoulCoreInReserve ? 1 : 0);

    if ((payingWithSc ? availableReserve : DuelState.player.reserve) < cost) {
      const { total } = getPlayerAvailableCores();
      if (total >= cost) {
        openSacrificeModal(uid);
        return;
      }
      if (typeof showToast === 'function') showToast(`Need ${cost} cores to cast "${card.name}"${cost < baseCost ? ` (reduced from ${baseCost})` : ''}, but only have ${total} across Reserve and Field!`, 'warning');
      return;
    }'''

assert old_cast_magic in arena, "old_cast_magic not found"
arena = arena.replace(old_cast_magic, new_cast_magic)

# 10. Update openSacrificeModal
old_open_sac = '''    const { reserve, fieldCores, total: totalAvailable } = getPlayerAvailableCores();
    const isUnit = card.type === 'Spirit' || card.type === 'Ultimate' || (card.type || '').includes('Spirit') || (card.type || '').includes('Ultimate') || (card.type || '').includes('Brave');
    const cost = card.cost || 0;
    const totalNeeded = isUnit ? cost + 1 : cost;'''

new_open_sac = '''    const { reserve, fieldCores, total: totalAvailable } = getPlayerAvailableCores();
    const isUnit = card.type === 'Spirit' || card.type === 'Ultimate' || (card.type || '').includes('Spirit') || (card.type || '').includes('Ultimate') || (card.type || '').includes('Brave');
    const cost = getCardEffectiveCost(card, 'player');
    const totalNeeded = isUnit ? cost + 1 : cost;'''

assert old_open_sac in arena, "old_open_sac not found"
arena = arena.replace(old_open_sac, new_open_sac)

# 11. Update getAttackSymbols for Brave symbol addition
old_symbols = '''    let total = base + (spirit.extraSymbols || 0);
    const eff = spirit.effect || '';
    const level = spirit.currentLevel || 1;'''

new_symbols = '''    let total = base + (spirit.extraSymbols || 0);

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
    const level = spirit.currentLevel || 1;'''

assert old_symbols in arena, "old_symbols not found"
arena = arena.replace(old_symbols, new_symbols)

# 12. Update runAiMainStep
old_ai_filter = '''      const summonable = DuelState.opponent.hand.filter(c => {
        if (c.type !== 'Spirit' || availableReserve < ((c.cost || 0) + 1)) return false;
        const req = getCardTributeRequirement(c);
        if (req && !getEligibleTributeSpirits(req, DuelState.opponent.field).length) return false;
        return true;
      });'''

new_ai_filter = '''      const summonable = DuelState.opponent.hand.filter(c => {
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
      });'''

assert old_ai_filter in arena, "old_ai_filter not found"
arena = arena.replace(old_ai_filter, new_ai_filter)

old_ai_cost_loop = '''      for (const c of summonable) {
        const cost = c.cost || 0;'''

new_ai_cost_loop = '''      for (const c of summonable) {
        const cost = getCardEffectiveCost(c, 'opponent');'''

assert old_ai_cost_loop in arena, "old_ai_cost_loop not found"
arena = arena.replace(old_ai_cost_loop, new_ai_cost_loop)

old_ai_exec = '''      const cost = bestCard.cost || 0;
      DuelState.opponent.reserve -= (cost + bestCoresToPlace);
      DuelState.opponent.trash += cost;'''

new_ai_exec = '''      const baseCost = bestCard.cost || 0;
      const cost = getCardEffectiveCost(bestCard, 'opponent');
      DuelState.opponent.reserve -= (cost + bestCoresToPlace);
      DuelState.opponent.trash += cost;'''

assert old_ai_exec in arena, "old_ai_exec not found"
arena = arena.replace(old_ai_exec, new_ai_exec)

# 13. Update Flash timing in block prompt
old_flash_step = '''        const need = (c.cost || 0) + (c.type === 'Spirit' ? 1 : 0);
        return total >= need;'''

new_flash_step = '''        const need = getCardEffectiveCost(c, 'player') + (c.type === 'Spirit' ? 1 : 0);
        return total >= need;'''

assert old_flash_step in arena, "old_flash_step not found"
arena = arena.replace(old_flash_step, new_flash_step)

old_flash_filter = '''    const flashCards = DuelState.player.hand.filter(c => {
      if (!hasFlashTiming(c)) return false;
      const cost = c.cost || 0;
      const isSpirit = c.type === 'Spirit';
      const totalNeeded = isSpirit ? cost + 1 : cost;
      return totalAvailableCores >= totalNeeded;
    });'''

new_flash_filter = '''    const flashCards = DuelState.player.hand.filter(c => {
      if (!hasFlashTiming(c)) return false;
      const cost = getCardEffectiveCost(c, 'player');
      const isSpirit = c.type === 'Spirit';
      const totalNeeded = isSpirit ? cost + 1 : cost;
      return totalAvailableCores >= totalNeeded;
    });'''

assert old_flash_filter in arena, "old_flash_filter not found"
arena = arena.replace(old_flash_filter, new_flash_filter)

# 14. Update auto duel step
old_auto_duel = '''const card = DuelState.player.hand.find(c => c.type === 'Spirit' && DuelState.player.reserve >= (c.cost + 1));'''
new_auto_duel = '''const card = DuelState.player.hand.find(c => c.type === 'Spirit' && DuelState.player.reserve >= (getCardEffectiveCost(c, 'player') + 1));'''

assert old_auto_duel in arena, "old_auto_duel not found"
arena = arena.replace(old_auto_duel, new_auto_duel)

# 15. Export newly added functions
old_exports = '''    getWhenAttacksBpBoost,
    getAttackSymbols,'''

new_exports = '''    getWhenAttacksBpBoost,
    getAttackSymbols,
    calculateSymbolReduction,
    getCardEffectiveCost,
    validateUltimateSummonCondition,
    getFriendlySymbols,'''

assert old_exports in arena, "old_exports not found"
arena = arena.replace(old_exports, new_exports)

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(arena)

print("battle_arena.js successfully updated!")

with open('styles.css', 'r', encoding='utf-8') as f:
    css = f.read()

if '.hc-cost-badge-reduced' not in css:
    css_additions = """
.hc-cost-badge-reduced {
  background: linear-gradient(135deg, #10b981, #059669) !important;
  color: #fff !important;
  border: 1px solid #34d399;
}
.cannot-play-condition {
  opacity: 0.55;
  filter: grayscale(0.5);
}
"""
    css += css_additions
    with open('styles.css', 'w', encoding='utf-8') as f:
        f.write(css)
    print("styles.css successfully updated!")
else:
    print("styles.css already has .hc-cost-badge-reduced")
