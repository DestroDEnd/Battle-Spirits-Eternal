import re

new_handlers = '''      } else if (actType === 'CANNOT_BE_BLOCKED') {
        card.cannotBeBlocked = true;
        addLog(`💨 **[${card.name}]**: Became Unblockable for this battle!`, 'step');
      } else if (actType === 'BP_DEBUFF') {
        const amount = act.amount || 3000;
        const targetSp = (enemyState.field || [])[0];
        if (targetSp) {
          targetSp.battleBpBoost = (targetSp.battleBpBoost || 0) - amount;
          targetSp.battleBp = Math.max(0, (targetSp.baseBp || targetSp.currentBp) + targetSp.battleBpBoost);
          targetSp.currentBp = targetSp.battleBp;
          AudioFX.magic();
          addLog(`🔻 **[${card.name}]**: Weakened opposing "${targetSp.name}" by -${amount} BP (Current: ${targetSp.currentBp} BP).`, 'damage');
          if (targetSp.currentBp <= 0) {
            const spIdx = enemyState.field.findIndex(s => s.uid === targetSp.uid);
            if (spIdx !== -1) {
              const popped = enemyState.field.splice(spIdx, 1)[0];
              recycleSpiritCoresToReserve(popped, enemySide);
              sendToTrash(popped, enemySide, `BP reduced to 0 by ${card.name}`);
              AudioFX.destroy();
              addLog(`💥 **0-BP DEPLETED**: Opposing "${popped.name}" had its BP reduced to 0 and was destroyed to Trash!`, 'damage');
            }
          }
        }
      } else if (actType === 'DESTROY_SPIRIT_COST') {
        const maxCost = act.max_cost || 4;
        const count = act.count || 1;
        let destroyed = 0;
        const victims = (enemyState.field || []).filter(s => (s.cost || 0) <= maxCost);
        for (const vic of victims) {
          if (destroyed >= count) break;
          const vIdx = enemyState.field.findIndex(s => s.uid === vic.uid);
          if (vIdx !== -1) {
            const popped = enemyState.field.splice(vIdx, 1)[0];
            recycleSpiritCoresToReserve(popped, enemySide);
            sendToTrash(popped, enemySide, `Destroyed by ${card.name} (Cost ${maxCost} or less)`);
            AudioFX.destroy();
            addLog(`💥 **[${card.name}]**: Smashed opposing "${popped.name}" (Cost ${popped.cost} <= ${maxCost} limit)!`, 'damage');
            destroyed++;
          }
        }
      } else if (actType === 'DESTROY_SPIRIT_EXTREME_BP') {
        if (enemyState.field && enemyState.field.length > 0) {
          let chosen = enemyState.field[0];
          for (const s of enemyState.field) {
            const bp = s.battleBp || s.currentBp || 0;
            const chosenBp = chosen.battleBp || chosen.currentBp || 0;
            if (act.mode === 'lowest' ? bp < chosenBp : bp > chosenBp) {
              chosen = s;
            }
          }
          const vIdx = enemyState.field.findIndex(s => s.uid === chosen.uid);
          if (vIdx !== -1) {
            const popped = enemyState.field.splice(vIdx, 1)[0];
            recycleSpiritCoresToReserve(popped, enemySide);
            sendToTrash(popped, enemySide, `Destroyed by ${card.name} (${act.mode || 'highest'} BP)`);
            AudioFX.destroy();
            addLog(`💥 **[${card.name}]**: Obliterated opposing "${popped.name}" with the ${act.mode || 'highest'} BP (${popped.currentBp} BP)!`, 'damage');
          }
        }
      } else if (actType === 'RETURN_TO_DECKBOTTOM') {
        const count = act.count || 1;
        for (let i = 0; i < count; i++) {
          if (!enemyState.field || !enemyState.field.length) break;
          const popped = enemyState.field.shift();
          recycleSpiritCoresToReserve(popped, enemySide);
          enemyState.deck.push(popped);
          AudioFX.magic();
          addLog(`🌀 **[${card.name}]**: Banished opposing "${popped.name}" to the bottom of opponent's Deck!`, 'magic');
        }
      } else if (actType === 'HOLY_LIFE_HEAL') {
        const heal = act.amount || 1;
        if (friendlyState.life < 5) {
          friendlyState.life = Math.min(5, friendlyState.life + heal);
          AudioFX.coreChime();
          addLog(`✨ **[${card.name}]**: Channeled Holy Light! Restored +${heal} Life core from the Void! (Current Life: ${friendlyState.life})`, 'magic');
        } else {
          addLog(`✨ **[${card.name}]**: Holy Light shone, but Life is already at maximum (5).`, 'step');
        }
      } else if (actType === 'SEARCH_DECK') {
        const revealCount = act.count || 3;
        const revealed = [];
        for (let i = 0; i < revealCount && friendlyState.deck.length > 0; i++) {
          revealed.push(friendlyState.deck.shift());
        }
        if (revealed.length > 0) {
          const matchIdx = revealed.findIndex(c => (c.type || '').toLowerCase() === 'spirit' || (c.type || '').toLowerCase() === 'magic');
          const picked = matchIdx !== -1 ? revealed.splice(matchIdx, 1)[0] : revealed.shift();
          if (picked) {
            friendlyState.hand.push(picked);
            if (side === 'player') {
              AudioFX.playTone(440, 'sine', 0.2, 0.1);
              addLog(`🔍 **[${card.name}]**: Scried decktop! Added "${picked.name}" to hand.`, 'magic');
            }
          }
          for (const rem of revealed) {
            friendlyState.deck.push(rem);
          }
        }
      } else if (actType === 'SUMMON_FREE') {
        const pool = act.source === 'trash' ? (friendlyState.trashPile || []) : friendlyState.hand;
        const candIdx = pool.findIndex(c => (c.type || '').toLowerCase() === 'spirit' && c.uid !== card.uid);
        if (candIdx !== -1) {
          const summonedCard = pool.splice(candIdx, 1)[0];
          summonedCard.currentCores = 1;
          friendlyState.field = friendlyState.field || [];
          friendlyState.field.push(summonedCard);
          recalculateSpiritBp(summonedCard);
          AudioFX.summon();
          addLog(`⚡ **[${card.name}]**: Free Summon activation! Summoned "${summonedCard.name}" from ${act.source || 'hand'} without paying cost!`, 'magic');
          executeUniversalCardEffect(summonedCard, side, 'WHEN_SUMMONED');
        }
      } else if (actType === 'IMMUNITY') {
        card.isImmuneToOpposingEffects = true;
        AudioFX.shield();
        addLog(`🛡️ **[${card.name}]**: Divine Ward active! This card is completely unaffected by opposing effects.`, 'step');
      } else if (actType === 'BURST_DISCARD_REFRESH') {
        if (friendlyState.burstCard) {
          const disc = friendlyState.burstCard;
          friendlyState.burstCard = null;
          sendToTrash(disc, side, `Discarded to refresh ${card.name}`);
          card.isExhausted = false;
          AudioFX.shield();
          addLog(`🔄 **[${card.name}]**: Discarded Burst "${disc.name}" to refresh to Ready state!`, 'step');
        }
      } else if (actType === 'OPPONENT_CANNOT_ATTACK') {
        enemyState.cannotAttackThisTurn = true;
        AudioFX.shield();
        addLog(`🚫 **[${card.name}]**: Battle Stance! Opposing Spirits cannot declare attacks during this turn.`, 'step');
      } else if (actType === 'OPPONENT_CANNOT_BLOCK') {
        card.cannotBeBlocked = true;
        AudioFX.slash();
        addLog(`💨 **[${card.name}]**: Unstoppable Surge! Opposing Spirits cannot block this strike!`, 'step');
      } else if (actType === 'DRAW_UNTIL') {
        const targetHand = act.target_hand || 4;
        let drawnCount = 0;
        while (friendlyState.hand.length < targetHand && friendlyState.deck.length > 0) {
          const drawn = friendlyState.deck.shift();
          friendlyState.hand.push(drawn);
          drawnCount++;
        }
        if (drawnCount > 0) {
          AudioFX.playTone(390, 'sine', 0.15, 0.08);
          addLog(`🎴 **[${card.name}]**: Refilled Hand! Drew ${drawnCount} card(s) (Hand: ${friendlyState.hand.length}/${targetHand}).`, 'magic');
        }
      } else if (actType === 'SALVAGE') {
        const trashPile = friendlyState.trashPile || [];
        if (trashPile.length > 0) {
          const picked = trashPile.pop();
          friendlyState.hand.push(picked);
          AudioFX.magic();
          addLog(`♻️ **[${card.name}]**: Salvaged "${picked.name}" from Trash to Hand!`, 'magic');
        }
      } else if (actType === 'COUNTER_PLUS') {
        const amt = act.count || 1;
        friendlyState.counters = (friendlyState.counters || 0) + amt;
        AudioFX.coreChime();
        addLog(`💠 **[${card.name}]**: Counter +${amt}! (Total Counters: ${friendlyState.counters})`, 'step');
      } else if (actType === 'DAMAGE_CAP') {
        friendlyState.damageCap = 1;
        AudioFX.shield();
        addLog(`🛡️ **[${card.name}]**: Sacred Aegis! During this turn, your Life cannot be reduced by more than 1!`, 'step');
      } else if (actType === 'GRANT_SYMBOL') {
        card.bonusSymbols = (card.bonusSymbols || 0) + 1;
        AudioFX.coreChime();
        addLog(`💎 **[${card.name}]**: Empowered! Gained +1 ${act.color || ''} Symbol!`, 'step');'''

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = """      } else if (actType === 'CANNOT_BE_BLOCKED') {
        card.cannotBeBlocked = true;
        addLog(`💨 **[${card.name}]**: Became Unblockable for this battle!`, 'step');"""

if target in content:
    content = content.replace(target, new_handlers)
    with open('battle_arena.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS: battle_arena.js updated with all universal effect handlers!")
else:
    # Try normalizing \r\n
    content_norm = content.replace('\r\n', '\n')
    if target in content_norm:
        content_norm = content_norm.replace(target, new_handlers)
        with open('battle_arena.js', 'w', encoding='utf-8', newline='\r\n') as f:
            f.write(content_norm)
        print("SUCCESS (normalized CRLF): battle_arena.js updated!")
    else:
        print("ERROR: Target not found in battle_arena.js")
