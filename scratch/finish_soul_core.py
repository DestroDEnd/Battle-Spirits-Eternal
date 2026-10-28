with open('battle_arena.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add handleDestroyedSpiritCores helper before resolveClash
target_before_clash = """  function resolveClash(att, blk, attSide, defSide) {"""

replacement_before_clash = """  function handleDestroyedSpiritCores(spirit, side) {
    if (!spirit) return;
    const isPlayer = side === 'player';
    const targetState = isPlayer ? DuelState.player : DuelState.opponent;
    if (spirit.hasSoulCore) {
      spirit.hasSoulCore = false;
      targetState.soulCoreLocation = 'reserve';
      targetState.soulCoreSpiritUid = null;
      if (isPlayer) {
        addLog(`🔥 **SOUL CORE SALVAGED**: Soul Core returned safely to Reserve from fallen "${spirit.name}".`, 'step');
      }
    }
  }

  function resolveClash(att, blk, attSide, defSide) {"""

assert target_before_clash in code, "target_before_clash not found"
code = code.replace(target_before_clash, replacement_before_clash, 1)

# 2. Add handleDestroyedSpiritCores calls in resolveClash
target_att_wins = """        const dest = defList.splice(idx, 1)[0];
        if (defSide === 'player') DuelState.player.reserve += dest.currentCores;
        else DuelState.opponent.reserve += dest.currentCores;
        sendToTrash(dest, defSide, `Destroyed in combat by ${att.name} (${attBp} vs ${blkBp} BP)`);"""

replacement_att_wins = """        const dest = defList.splice(idx, 1)[0];
        if (defSide === 'player') DuelState.player.reserve += dest.currentCores;
        else DuelState.opponent.reserve += dest.currentCores;
        handleDestroyedSpiritCores(dest, defSide);
        sendToTrash(dest, defSide, `Destroyed in combat by ${att.name} (${attBp} vs ${blkBp} BP)`);"""

assert target_att_wins in code, "target_att_wins not found"
code = code.replace(target_att_wins, replacement_att_wins, 1)

target_curse_att = """          const destAtt = attList.splice(attIdx, 1)[0];
          if (attSide === 'player') DuelState.player.reserve += destAtt.currentCores;
          else DuelState.opponent.reserve += destAtt.currentCores;
          sendToTrash(destAtt, attSide, `Dragged to Trash by [Curse] of ${blk.name}`);"""

replacement_curse_att = """          const destAtt = attList.splice(attIdx, 1)[0];
          if (attSide === 'player') DuelState.player.reserve += destAtt.currentCores;
          else DuelState.opponent.reserve += destAtt.currentCores;
          handleDestroyedSpiritCores(destAtt, attSide);
          sendToTrash(destAtt, attSide, `Dragged to Trash by [Curse] of ${blk.name}`);"""

assert target_curse_att in code, "target_curse_att not found"
code = code.replace(target_curse_att, replacement_curse_att, 1)

target_blk_wins = """        const dest = attList.splice(idx, 1)[0];
        if (attSide === 'player') DuelState.player.reserve += dest.currentCores;
        else DuelState.opponent.reserve += dest.currentCores;
        sendToTrash(dest, attSide, `Destroyed in combat by ${blk.name} (${blkBp} vs ${attBp} BP)`);"""

replacement_blk_wins = """        const dest = attList.splice(idx, 1)[0];
        if (attSide === 'player') DuelState.player.reserve += dest.currentCores;
        else DuelState.opponent.reserve += dest.currentCores;
        handleDestroyedSpiritCores(dest, attSide);
        sendToTrash(dest, attSide, `Destroyed in combat by ${blk.name} (${blkBp} vs ${attBp} BP)`);"""

assert target_blk_wins in code, "target_blk_wins not found"
code = code.replace(target_blk_wins, replacement_blk_wins, 1)

target_curse_blk = """          const destBlk = defList.splice(blkIdx, 1)[0];
          if (defSide === 'player') DuelState.player.reserve += destBlk.currentCores;
          else DuelState.opponent.reserve += destBlk.currentCores;
          sendToTrash(destBlk, defSide, `Dragged to Trash by [Curse] of ${att.name}`);"""

replacement_curse_blk = """          const destBlk = defList.splice(blkIdx, 1)[0];
          if (defSide === 'player') DuelState.player.reserve += destBlk.currentCores;
          else DuelState.opponent.reserve += destBlk.currentCores;
          handleDestroyedSpiritCores(destBlk, defSide);
          sendToTrash(destBlk, defSide, `Dragged to Trash by [Curse] of ${att.name}`);"""

assert target_curse_blk in code, "target_curse_blk not found"
code = code.replace(target_curse_blk, replacement_curse_blk, 1)

target_mutual = """        const d1 = attList.splice(idx1, 1)[0];
        if (attSide === 'player') DuelState.player.reserve += d1.currentCores;
        else DuelState.opponent.reserve += d1.currentCores;
        sendToTrash(d1, attSide, `Mutual destruction in clash with ${blk.name}`);
      }
      const idx2 = defList.findIndex(s => s.uid === blk.uid);
      if (idx2 !== -1) {
        const d2 = defList.splice(idx2, 1)[0];
        if (defSide === 'player') DuelState.player.reserve += d2.currentCores;
        else DuelState.opponent.reserve += d2.currentCores;
        sendToTrash(d2, defSide, `Mutual destruction in clash with ${att.name}`);"""

replacement_mutual = """        const d1 = attList.splice(idx1, 1)[0];
        if (attSide === 'player') DuelState.player.reserve += d1.currentCores;
        else DuelState.opponent.reserve += d1.currentCores;
        handleDestroyedSpiritCores(d1, attSide);
        sendToTrash(d1, attSide, `Mutual destruction in clash with ${blk.name}`);
      }
      const idx2 = defList.findIndex(s => s.uid === blk.uid);
      if (idx2 !== -1) {
        const d2 = defList.splice(idx2, 1)[0];
        if (defSide === 'player') DuelState.player.reserve += d2.currentCores;
        else DuelState.opponent.reserve += d2.currentCores;
        handleDestroyedSpiritCores(d2, defSide);
        sendToTrash(d2, defSide, `Mutual destruction in clash with ${att.name}`);"""

assert target_mutual in code, "target_mutual not found"
code = code.replace(target_mutual, replacement_mutual, 1)

# 3. AI Main Step Soul Core attach
target_ai_main = """        DuelState.opponent.field.push(best);
        AudioFX.summon();
        addLog(`💀 Opponent summoned "${best.name}" (Paid ${cost} cores, ${coresToPlace} placed for Lv${level} with ${bp} BP. Remaining reserve: ${DuelState.opponent.reserve})!`, 'step');
        renderDuelTable();"""

replacement_ai_main = """        DuelState.opponent.field.push(best);
        AudioFX.summon();
        addLog(`💀 Opponent summoned "${best.name}" (Paid ${cost} cores, ${coresToPlace} placed for Lv${level} with ${bp} BP. Remaining reserve: ${DuelState.opponent.reserve})!`, 'step');
        
        // AI equips Soul Core if currently available in Reserve
        if (DuelState.opponent.soulCoreLocation === 'reserve' && DuelState.opponent.field.length > 0) {
          const topSpirit = [...DuelState.opponent.field].sort((a, b) => b.currentBp - a.currentBp)[0];
          topSpirit.hasSoulCore = true;
          topSpirit.currentCores += 1;
          const { level: scLvl, bp: scBp } = calculateBpAndLevel(topSpirit.levels, topSpirit.currentCores, true, topSpirit.effect);
          topSpirit.currentLevel = scLvl;
          topSpirit.currentBp = scBp;
          DuelState.opponent.soulCoreLocation = 'field';
          DuelState.opponent.soulCoreSpiritUid = topSpirit.uid;
          addLog(`🔥 Opponent placed their **Soul Core** onto "${topSpirit.name}" (Empowered to ${scBp} BP)!`, 'step');
        }

        renderDuelTable();"""

assert target_ai_main in code, "target_ai_main not found"
code = code.replace(target_ai_main, replacement_ai_main, 1)

# 4. formatEffectKeywords: Add Soul Core keyword support
target_kw = """    safe = safe.replace(/\[(Clash|Curse|Crush|Armor:[^\]]+|Burst:[^\]]+|Flash|When Attacks|When Destroyed|When Summoned)\]/gi, (match) => {"""

replacement_kw = """    safe = safe.replace(/\[(Clash|Curse|Crush|Armor:[^\]]+|Burst:[^\]]+|Flash|When Attacks|When Destroyed|When Summoned|Soul Core|Soul Core:[^\]]+)\]/gi, (match) => {"""

assert target_kw in code, "target_kw not found"
code = code.replace(target_kw, replacement_kw, 1)

target_kw_cls = """      else if (low.includes('flash')) cls = 'kw-flash';"""
replacement_kw_cls = """      else if (low.includes('flash')) cls = 'kw-flash';
      else if (low.includes('soul core')) cls = 'kw-soul-core';"""

assert target_kw_cls in code, "target_kw_cls not found"
code = code.replace(target_kw_cls, replacement_kw_cls, 1)

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("[OK] finish_soul_core.py executed successfully")
