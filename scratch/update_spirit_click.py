with open('battle_arena.js', 'r', encoding='utf-8') as f:
    code = f.read()

target = """  function handleSpiritClick(uid, side) {
    if (side === 'player') {
      const spirit = DuelState.player.field.find(s => s.uid === uid);
      if (!spirit) return;

      const phase = DuelState.phases[DuelState.phaseIndex];
      if (DuelState.activePlayer === 'player' && phase === 'ATTACK') {
        if (DuelState.turn === 1) {
          showToast('Official Rule: The first player cannot attack on Turn 1!', 'warning');
          return;
        }
        if (spirit.isExhausted) {
          showToast(`"${spirit.name}" is EXHAUSTED and cannot attack this turn!`, 'warning');
          return;
        }
        // Declare Attack with this spirit!
        executePlayerAttack(spirit);
      } else if (DuelState.activePlayer === 'player' && phase === 'MAIN') {
        // Offer Core addition to level up
        if (DuelState.player.reserve > 0) {
          DuelState.player.reserve -= 1;
          spirit.currentCores += 1;
          const { level, bp } = calculateBpAndLevel(spirit.levels, spirit.currentCores);
          spirit.currentLevel = level;
          spirit.currentBp = bp;
          AudioFX.coreChime();
          addLog(`💎 Moved 1 core to "${spirit.name}". Now Level ${level} with ${bp} BP!`, 'step');
          renderDuelTable();
        } else {
          DuelState.selectedPlayerCard = spirit;
          renderCardInspector();
          openCardDetail(spirit.name);
        }
      }
    } else if (side === 'opponent') {
      // Clicked opponent spirit - inspect full card details!
      const spirit = DuelState.opponent.field.find(s => s.uid === uid);
      if (spirit) {
        DuelState.selectedPlayerCard = spirit;
        renderCardInspector();
        openCardDetail(spirit.name);
      }
    }
  }"""

replacement = """  function handleSpiritClick(uid, side) {
    if (side === 'player') {
      const spirit = DuelState.player.field.find(s => s.uid === uid);
      if (!spirit) return;

      const phase = DuelState.phases[DuelState.phaseIndex];
      if (DuelState.activePlayer === 'player' && phase === 'ATTACK') {
        if (DuelState.turn === 1) {
          showToast('Official Rule: The first player cannot attack on Turn 1!', 'warning');
          return;
        }
        if (spirit.isExhausted) {
          showToast(`"${spirit.name}" is EXHAUSTED and cannot attack this turn!`, 'warning');
          return;
        }
        executePlayerAttack(spirit);
      } else {
        openCardDetail(spirit.name);
      }
    } else if (side === 'opponent') {
      const spirit = DuelState.opponent.field.find(s => s.uid === uid);
      if (spirit) {
        openCardDetail(spirit.name);
      }
    }
  }"""

assert target in code, "handleSpiritClick target not found"
code = code.replace(target, replacement, 1)

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("[OK] Updated handleSpiritClick: clicking cards directly opens card modal")
