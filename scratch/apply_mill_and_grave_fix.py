import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update markLegacyHandled to include DECK_DISCARD
old_mark = "if (/this spirit can't be blocked|this spirit cannot be blocked|cannot be blocked by opposing|can't be blocked by opposing/i.test(bodyLower)) types.add('CANNOT_BE_BLOCKED');"
new_mark = """if (/this spirit can't be blocked|this spirit cannot be blocked|cannot be blocked by opposing|can't be blocked by opposing/i.test(bodyLower)) types.add('CANNOT_BE_BLOCKED');
    if (/(?:discard|send)\s+(?:up to\s+)?(?:a|an|one|two|three|four|five|\d+)\s+cards?\s+from\s+(?:the\s+|your\s+)?deck(?:top)?/i.test(bodyLower)) types.add('DECK_DISCARD');"""

if old_mark in content:
    content = content.replace(old_mark, new_mark, 1)
    print("1. markLegacyHandled updated with DECK_DISCARD.")
else:
    print("ERROR 1: old_mark not found!")

# 2. Update SUMMON_FREE to check trashCards
old_summon_free = "const pool = act.source === 'trash' ? (friendlyState.trashPile || []) : friendlyState.hand;"
new_summon_free = "const pool = act.source === 'trash' ? (friendlyState.trashCards || friendlyState.trashPile || []) : friendlyState.hand;"
if old_summon_free in content:
    content = content.replace(old_summon_free, new_summon_free, 1)
    print("2. SUMMON_FREE updated to check trashCards.")
else:
    print("ERROR 2: old_summon_free not found!")

# 3. Update SALVAGE to check trashCards, filter target, and render table/hand
old_salvage = """      } else if (actType === 'SALVAGE') {
        const trashPile = friendlyState.trashPile || [];
        if (trashPile.length > 0) {
          const picked = trashPile.pop();
          friendlyState.hand.push(picked);
          AudioFX.magic();
          addLog(`♻️ **[${card.name}]**: Salvaged "${picked.name}" from Trash to Hand!`, 'magic');
        }"""

new_salvage = """      } else if (actType === 'SALVAGE') {
        const trashList = friendlyState.trashCards || friendlyState.trashPile || [];
        if (trashList.length > 0) {
          let pickedIdx = -1;
          const targetDesc = (act.target_desc || act.desc || '').toLowerCase();
          if (targetDesc.includes('[advent]') || targetDesc.includes('advent')) {
            pickedIdx = trashList.findIndex(c => (c.type === 'Spirit' || (c.type || '').includes('Spirit')) && ((c.effect || '').includes('[Advent') || (c.effect || '').includes('煌臨') || (c.levels && String(c.levels).includes('Advent'))));
          } else if (targetDesc.includes('spirit')) {
            pickedIdx = trashList.findIndex(c => c.type === 'Spirit' || (c.type || '').includes('Spirit'));
          } else if (targetDesc.includes('magic')) {
            pickedIdx = trashList.findIndex(c => c.type === 'Magic');
          } else if (targetDesc.includes('nexus')) {
            pickedIdx = trashList.findIndex(c => (c.type || '').includes('Nexus'));
          } else if (targetDesc.includes('brave')) {
            pickedIdx = trashList.findIndex(c => (c.type || '').includes('Brave'));
          }
          if (pickedIdx === -1) pickedIdx = 0; // fallback to most recently discarded card
          const picked = trashList.splice(pickedIdx, 1)[0];
          if (picked) {
            friendlyState.hand.push(picked);
            AudioFX.magic();
            addLog(`♻️ **[${card.name}]**: Salvaged "${picked.name}" from Trash to Hand!`, 'magic');
            renderDuelTable();
            if (side === 'player') renderPlayerHand();
          }
        }"""

if old_salvage in content:
    content = content.replace(old_salvage, new_salvage, 1)
    print("3. SALVAGE updated with trashCards and target filters.")
else:
    print("ERROR 3: old_salvage not found!")

# 4. Update DECK_DISCARD to support both self-mill and opposing-mill
old_discard = """      } else if (actType === 'DECK_DISCARD') {
        const count = act.count || 1;
        let discarded = 0;
        for (let i = 0; i < count; i++) {
          if (!enemyState.deck || enemyState.deck.length === 0) break;
          const milled = enemyState.deck.shift();
          sendToTrash(milled, enemySide, `Milled by ${card.name}`);
          discarded++;
        }
        if (discarded > 0) {
          AudioFX.magic();
          addLog(`📚 **[${card.name}]**: Sent ${discarded} card(s) from opposing deck to Trash!`, 'magic');
        }"""

new_discard = """      } else if (actType === 'DECK_DISCARD') {
        const count = act.count || 1;
        const isSelf = (act.target === 'self');
        const targetSide = isSelf ? side : enemySide;
        const targetState = isSelf ? friendlyState : enemyState;
        let discarded = 0;
        for (let i = 0; i < count; i++) {
          if (!targetState.deck || targetState.deck.length === 0) break;
          const milled = targetState.deck.shift();
          sendToTrash(milled, targetSide, `Discarded from decktop by ${card.name}`);
          discarded++;
        }
        if (discarded > 0) {
          AudioFX.magic();
          addLog(`📚 **[${card.name}]**: Sent ${discarded} card(s) from ${isSelf ? 'your' : 'opposing'} decktop to Trash (Graveyard)!`, 'magic');
          renderDuelTable();
          if (targetSide === 'player') renderPlayerHand();
        }"""

if old_discard in content:
    content = content.replace(old_discard, new_discard, 1)
    print("4. DECK_DISCARD updated with self/opponent targeting.")
else:
    print("ERROR 4: old_discard not found!")

# 5. Update SPECIAL_EFFECT fallback
old_special = """      } else if (actType === 'SPECIAL_EFFECT') {
        if (act.desc && act.desc.length > 3 && !act.desc.startsWith('[LV') && !act.desc.startsWith('(')) {
          addLog(`✨ **[${card.name}]**: ${act.desc}`, 'step');
        }"""

new_special = """      } else if (actType === 'SPECIAL_EFFECT') {
        const descText = (act.raw_text || act.desc || '').toLowerCase();
        const millMatch = descText.match(/(?:discard|send)\s+(?:up to\s+)?(a|an|one|two|three|four|five|six|\d+)\s+cards?\s+from\s+(?:the\s+|your\s+)?(?:top\s+of\s+(?:your\s+)?)?(opposing\s+)?decktop(?:\s+to\s+(?:the\s+)?trash)?/i);
        if (millMatch) {
          const mCount = parseWordNumber(millMatch[1]);
          const isOpp = Boolean(millMatch[2]) || descText.includes('opposing');
          const targetSide = isOpp ? enemySide : side;
          const targetState = isOpp ? enemyState : friendlyState;
          let discarded = 0;
          for (let i = 0; i < mCount; i++) {
            if (!targetState.deck || targetState.deck.length === 0) break;
            const milled = targetState.deck.shift();
            sendToTrash(milled, targetSide, `Discarded from decktop by ${card.name}`);
            discarded++;
          }
          if (discarded > 0) {
            AudioFX.magic();
            addLog(`📚 **[${card.name}]**: Sent ${discarded} card(s) from ${isOpp ? 'opposing' : 'your'} decktop to Trash (Graveyard)!`, 'magic');
            renderDuelTable();
            if (targetSide === 'player') renderPlayerHand();
          }
        } else if (act.desc && act.desc.length > 3 && !act.desc.startsWith('[LV') && !act.desc.startsWith('(')) {
          addLog(`✨ **[${card.name}]**: ${act.desc}`, 'step');
        }"""

if old_special in content:
    content = content.replace(old_special, new_special, 1)
    print("5. SPECIAL_EFFECT fallback updated for unparsed mill.")
else:
    print("ERROR 5: old_special not found!")

# 6. Update executeWhenDeployedEffects to handle decktop discard directly
old_dep_eff = """      if (/destroy\s+(?:an|one|\d+)?\s*opposing\s+spirit/i.test(eff)) {"""
new_dep_eff = """      const discardMatch = eff.match(/(?:discard|send)\s+(\d+|a|an|one|two|three|four|five)\s+cards?\s+from\s+(?:the\s+|your\s+)?decktop(?:\s+to\s+(?:the\s+)?trash)?/i);
      if (discardMatch) {
        markLegacyHandled(nexusCard, eff.toLowerCase());
        const count = parseWordNumber(discardMatch[1]);
        let discarded = 0;
        for (let i = 0; i < count; i++) {
          if (!sideState.deck || sideState.deck.length === 0) break;
          const milled = sideState.deck.shift();
          sendToTrash(milled, side, `Discarded from decktop by ${nexusCard.name}`);
          discarded++;
        }
        if (discarded > 0) {
          AudioFX.magic();
          addLog(`📚 **[WHEN DEPLOYED: ${nexusCard.name}]**: Sent ${discarded} card(s) from your decktop to Trash (Graveyard)!`, 'magic');
          renderDuelTable();
        }
      }

      if (/destroy\s+(?:an|one|\d+)?\s*opposing\s+spirit/i.test(eff)) {"""

if old_dep_eff in content:
    content = content.replace(old_dep_eff, new_dep_eff, 1)
    print("6. executeWhenDeployedEffects updated with discardMatch.")
else:
    print("ERROR 6: old_dep_eff not found!")

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("SUCCESS: battle_arena.js saved.")
