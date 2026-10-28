with open('battle_arena.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = '''  // ── CORE CHARGE ENGINE (Grandwalker Nexuses) ──
  function executeCoreCharge(nexus, side = 'player', trigger = 'DEPLOY', context = {}) {
    if (!nexus || !nexus.effect) return;
    const eff = nexus.effect;
    if (!eff.includes('[Core Charge:')) return;

    const sideState = side === 'player' ? DuelState.player : DuelState.opponent;

    if (trigger === 'DEPLOY') {
      if (sideState.deck && sideState.deck.length > 0) {
        const milled = sideState.deck.splice(0, Math.min(3, sideState.deck.length));
        let chargedCores = 0;

        milled.forEach(c => {
          sendToTrash(c, side, `Milled for [Core Charge] by ${nexus.name}`);
          const cFam = (c.family || '').toLowerCase();
          const cName = (c.name || '').toLowerCase();
          const cost = c.cost || 0;

          const isMatch = cFam.includes('makai') || cFam.includes('ogre wizard') || cFam.includes('worldswalker') || cFam.includes('avatar') || cName.includes('makai') || cost >= 3 || c.type === 'Spirit' || c.type === 'Ultimate';
          if (isMatch) {
            chargedCores++;
          }
        });

        if (chargedCores > 0) {
          nexus.currentCores = (nexus.currentCores || 0) + chargedCores;
          const pLevels = nexus.levels || parseLevels(nexus.levels || nexus.raw_levels);
          const lv2req = (pLevels[1] && pLevels[1].cores !== undefined) ? pLevels[1].cores : 999;
          nexus.currentLevel = (nexus.currentCores >= lv2req) ? 2 : 1;
          AudioFX.coreChime();
          addLog(`✨🔮 **[CORE CHARGE: ${nexus.name}]**: Sent 3 cards to Trash. Charged +${chargedCores} Core(s) from Void onto this Nexus! (Total: ${nexus.currentCores} cores, Lv${nexus.currentLevel})`, 'magic');
          if (side === 'player' && typeof showToast === 'function') {
            showToast(`✨ [Core Charge]: +${chargedCores} Core(s) onto ${nexus.name}!`, 'success');
          }
        }
      }
    } else if (trigger === 'SUMMON') {
      const summonedSpirit = context.spirit;
      if (summonedSpirit) {
        const sFam = (summonedSpirit.family || '').toLowerCase();
        const sName = (summonedSpirit.name || '').toLowerCase();
        const isMatch = sFam.includes('makai') || sFam.includes('ogre wizard') || sFam.includes('worldswalker') || sFam.includes('avatar') || sName.includes('makai') || (summonedSpirit.cost || 0) >= 3;
        if (isMatch) {
          nexus.currentCores = (nexus.currentCores || 0) + 1;
          const pLevels = nexus.levels || parseLevels(nexus.levels || nexus.raw_levels);
          const lv2req = (pLevels[1] && pLevels[1].cores !== undefined) ? pLevels[1].cores : 999;
          nexus.currentLevel = (nexus.currentCores >= lv2req) ? 2 : 1;
          AudioFX.coreChime();
          addLog(`✨🔮 **[CORE CHARGE: ${nexus.name}]**: Channeled summon of "${summonedSpirit.name}"! Added +1 Core from Void onto this Nexus (Total: ${nexus.currentCores} cores, Lv${nexus.currentLevel}).`, 'magic');
        }
      }
    }
  }'''

replacement = '''  function cardMatchesCoreCharge(card, nexusEffect) {
    if (!card || !nexusEffect) return false;
    const m = nexusEffect.match(/\\[Core Charge:\\s*([^\\]]+)\\]/i);
    if (!m) return false;
    const condStr = m[1];
    const parts = condStr.split('&').map(s => s.trim());

    const cFam = ((card.family || '') + ' ' + (Array.isArray(card.families) ? card.families.join(' ') : '')).toLowerCase();
    const cName = (card.name || '').toLowerCase();
    const cType = (card.type || '').toLowerCase();
    const cCost = card.cost || 0;

    for (const part of parts) {
      const pLower = part.toLowerCase();
      // Cost requirement: e.g. "cost 3 or more", "cost 4 or more"
      const costMatch = pLower.match(/cost\\s*(\\d+)\\s*(?:or more|\\+)/i);
      if (costMatch) {
        const minCost = parseInt(costMatch[1], 10);
        if (cCost < minCost) return false;
        continue;
      }

      // Family / Name keywords
      const cleanPart = part.replace(/[()"]/g, '');
      const tokens = cleanPart.split(/[\\/,]/).map(t => t.trim().toLowerCase()).filter(Boolean);

      let tokenMatched = false;
      for (const token of tokens) {
        if (token === 'spirit' && cType === 'spirit') { tokenMatched = true; break; }
        if (token === 'ultimate' && cType === 'ultimate') { tokenMatched = true; break; }
        if (token === 'brave' && cType === 'brave') { tokenMatched = true; break; }
        if (cFam.includes(token) || cName.includes(token)) { tokenMatched = true; break; }
      }
      if (!tokenMatched) return false;
    }

    return true;
  }

  // ── CORE CHARGE ENGINE (Grandwalker Nexuses) ──
  function executeCoreCharge(nexus, side = 'player', trigger = 'DEPLOY', context = {}) {
    if (!nexus || !nexus.effect) return;
    const eff = nexus.effect;
    if (!eff.includes('[Core Charge:')) return;

    const sideState = side === 'player' ? DuelState.player : DuelState.opponent;

    if (trigger === 'DEPLOY') {
      if (sideState.deck && sideState.deck.length > 0) {
        const milled = sideState.deck.splice(0, Math.min(3, sideState.deck.length));
        let chargedCores = 0;

        milled.forEach(c => {
          sendToTrash(c, side, `Milled for [Core Charge] by ${nexus.name}`);
          if (cardMatchesCoreCharge(c, eff)) {
            chargedCores++;
          }
        });

        if (chargedCores > 0) {
          nexus.currentCores = (nexus.currentCores || 0) + chargedCores;
          const pLevels = nexus.levels || parseLevels(nexus.levels || nexus.raw_levels);
          const lv2req = (pLevels[1] && pLevels[1].cores !== undefined) ? pLevels[1].cores : 999;
          nexus.currentLevel = (nexus.currentCores >= lv2req) ? 2 : 1;
          AudioFX.coreChime();
          addLog(`✨🔮 **[CORE CHARGE: ${nexus.name}]**: Sent 3 cards to Trash. Charged +${chargedCores} Core(s) from Void onto this Nexus! (Total: ${nexus.currentCores} cores, Lv${nexus.currentLevel})`, 'magic');
          if (side === 'player' && typeof showToast === 'function') {
            showToast(`✨ [Core Charge]: +${chargedCores} Core(s) onto ${nexus.name}!`, 'success');
          }
        }
      }
    } else if (trigger === 'SUMMON') {
      const summonedSpirit = context.spirit;
      if (summonedSpirit && cardMatchesCoreCharge(summonedSpirit, eff)) {
        nexus.currentCores = (nexus.currentCores || 0) + 1;
        const pLevels = nexus.levels || parseLevels(nexus.levels || nexus.raw_levels);
        const lv2req = (pLevels[1] && pLevels[1].cores !== undefined) ? pLevels[1].cores : 999;
        nexus.currentLevel = (nexus.currentCores >= lv2req) ? 2 : 1;
        AudioFX.coreChime();
        addLog(`✨🔮 **[CORE CHARGE: ${nexus.name}]**: Channeled summon of "${summonedSpirit.name}"! Added +1 Core from Void onto this Nexus (Total: ${nexus.currentCores} cores, Lv${nexus.currentLevel}).`, 'magic');
        if (side === 'player' && typeof showToast === 'function') {
          showToast(`✨ [Core Charge]: +1 Core onto ${nexus.name}!`, 'success');
        }
      }
    }
  }'''

content_norm = content.replace('\r\n', '\n')
target_norm = target.replace('\r\n', '\n')
assert target_norm in content_norm, 'Target not found in content!'
content_norm = content_norm.replace(target_norm, replacement)

if '\r\n' in content:
    content_norm = content_norm.replace('\n', '\r\n')

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(content_norm)
print('Successfully updated Core Charge parser in battle_arena.js!')
