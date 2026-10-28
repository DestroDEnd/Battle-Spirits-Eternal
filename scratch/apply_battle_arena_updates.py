import re

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update DuelState initial object to include nexus and nexusCards
duelstate_pattern = r"(player:\s*\{[\s\S]*?voidCards:\s*\[\],)"
duelstate_repl = r"\1\n      nexus: [],\n      nexusCards: [],"
code = re.sub(duelstate_pattern, duelstate_repl, code, count=1)

opp_pattern = r"(opponent:\s*\{[\s\S]*?voidCards:\s*\[\],)"
opp_repl = r"\1\n      nexus: [],\n      nexusCards: [],"
code = re.sub(opp_pattern, opp_repl, code, count=1)

# 2. Update executeStartDuel reset object
startduel_p_pattern = r"(DuelState\.player\s*=\s*\{[\s\S]*?voidCards:\s*\[\],)"
startduel_p_repl = r"\1\n      nexus: [],\n      nexusCards: [],"
code = re.sub(startduel_p_pattern, startduel_p_repl, code, count=1)

startduel_o_pattern = r"(DuelState\.opponent\s*=\s*\{[\s\S]*?voidCards:\s*\[\],)"
startduel_o_repl = r"\1\n      nexus: [],\n      nexusCards: [],"
code = re.sub(startduel_o_pattern, startduel_o_repl, code, count=1)

# 3. Enhance parseLevels to support Nexus levels (Level 1: 0 cores, etc.)
parselevels_old = """  function parseLevels(levelsStr) {
    if (!levelsStr || typeof levelsStr !== 'string') {
      return [{ level: 1, cores: 1, bp: 2000 }];
    }
    const results = [];
    const re = /Level\\s*(\\d+)[:\\s]+(\\d+)\\s*cores?,\\s*(\\d+)\\s*BP/gi;
    let m;
    while ((m = re.exec(levelsStr)) !== null) {
      results.push({
        level: parseInt(m[1], 10),
        cores: parseInt(m[2], 10),
        bp: parseInt(m[3], 10)
      });
    }
    return results.length ? results : [{ level: 1, cores: 1, bp: 2000 }];
  }"""

parselevels_new = """  function parseLevels(levelsStr) {
    if (!levelsStr || typeof levelsStr !== 'string') {
      return [{ level: 1, cores: 1, bp: 2000 }];
    }
    const results = [];
    const re = /Level\\s*(\\d+)[:\\s]+(\\d+)\\s*cores?,\\s*(\\d+)\\s*BP/gi;
    let m;
    while ((m = re.exec(levelsStr)) !== null) {
      results.push({
        level: parseInt(m[1], 10),
        cores: parseInt(m[2], 10),
        bp: parseInt(m[3], 10)
      });
    }
    if (results.length) return results;

    const reNoBp = /Level\\s*(\\d+)[:\\s]+(\\d+)\\s*cores?/gi;
    while ((m = reNoBp.exec(levelsStr)) !== null) {
      results.push({
        level: parseInt(m[1], 10),
        cores: parseInt(m[2], 10),
        bp: 0
      });
    }
    return results.length ? results : [{ level: 1, cores: 0, bp: 0 }];
  }"""

code = code.replace(parselevels_old, parselevels_new)

# 4. Enhance calculateBpAndLevel to preserve 0 BP for Nexuses
calcbp_old = "let bp = (best && best.bp) ? best.bp : 2000;"
calcbp_new = "let bp = (best && best.bp !== undefined) ? best.bp : 2000;"
code = code.replace(calcbp_old, calcbp_new)

# 5. Add safeEndOpponentTurn helper and update AI Watchdog
watchdog_old = """  // ── AI TURN WATCHDOG (Prevents Opponent Hangs/Freezes) ──
  let aiWatchdogTimer = null;
  function resetAiWatchdog() {
    if (aiWatchdogTimer) {
      clearTimeout(aiWatchdogTimer);
      aiWatchdogTimer = null;
    }
    if (DuelState.activePlayer === 'opponent') {
      const stepAtCheck = DuelState.phaseIndex;
      const turnAtCheck = DuelState.turn;
      aiWatchdogTimer = setTimeout(() => {
        if (DuelState.activePlayer === 'opponent' && DuelState.turn === turnAtCheck && DuelState.phaseIndex === stepAtCheck) {
          console.warn(`[AI Watchdog] Opponent AI delayed at phase ${DuelState.phases[stepAtCheck]} (Turn ${turnAtCheck}). Resuming flow...`);
          if (stepAtCheck >= 5) {
            endTurn();
          } else {
            DuelState.phaseIndex = Math.min(6, stepAtCheck + 1);
            renderDuelTable();
            safeTimeout(advanceOpponentStep, 400);
          }
        }
      }, 4000);
    }
  }"""

watchdog_new = """  // ── SAFE END OPPONENT TURN HELPER (Guarantees turn is NEVER ended on player's behalf) ──
  function safeEndOpponentTurn(delay = 800) {
    safeTimeout(() => {
      if (DuelState.activePlayer === 'opponent') {
        endTurn();
      }
    }, delay);
  }

  // ── AI TURN WATCHDOG (Prevents Opponent Hangs/Freezes without interrupting player) ──
  let aiWatchdogTimer = null;
  function resetAiWatchdog() {
    if (aiWatchdogTimer) {
      clearTimeout(aiWatchdogTimer);
      aiWatchdogTimer = null;
    }
    if (DuelState.activePlayer === 'opponent') {
      const stepAtCheck = DuelState.phaseIndex;
      const turnAtCheck = DuelState.turn;
      aiWatchdogTimer = setTimeout(() => {
        if (DuelState.activePlayer === 'opponent' && DuelState.turn === turnAtCheck && DuelState.phaseIndex === stepAtCheck) {
          const hasModal = typeof document !== 'undefined' && document.querySelector && 
            (document.querySelector('.battle-modal-overlay.active, .battle-modal-overlay[style*="display: flex"]') ||
             document.getElementById('battleBlockModal')?.classList.contains('active') ||
             document.getElementById('battleBurstPromptModal')?.classList.contains('active'));
          if (hasModal || DuelState.combatEvent || DuelState.activeBurstTrigger) {
            resetAiWatchdog();
            return;
          }
          console.warn(`[AI Watchdog] Opponent AI delayed at phase ${DuelState.phases[stepAtCheck]} (Turn ${turnAtCheck}). Resuming flow...`);
          if (stepAtCheck >= 5) {
            safeEndOpponentTurn(200);
          } else {
            DuelState.phaseIndex = Math.min(6, stepAtCheck + 1);
            renderDuelTable();
            safeTimeout(advanceOpponentStep, 400);
          }
        }
      }, 12000);
    }
  }"""

code = code.replace(watchdog_old, watchdog_new)

# 6. Fix takeLifeDamage continueOpponent callback (removes buggy else { safeTimeout(endTurn, 900); })
continue_old = """      const continueOpponent = () => {
        if (DuelState.activePlayer === 'opponent') {
          const profile = getActiveAiProfile('opponent');
          const remaining = DuelState.opponent.field.filter(s => !s.isExhausted && !s.hasAttacked);
          const viable = remaining.filter(s => evaluateAiAttackExpectimax(s, DuelState.player.field, DuelState.player.life, profile) >= (profile.aggro_threshold || 0.45));
          if (viable.length > 0) {
            safeTimeout(runAiAttackStep, 1000);
          } else {
            safeTimeout(endTurn, 900);
          }
        } else {
          safeTimeout(endTurn, 900);
        }
      };"""

continue_new = """      const continueOpponent = () => {
        if (DuelState.activePlayer === 'opponent') {
          const profile = getActiveAiProfile('opponent');
          const remaining = DuelState.opponent.field.filter(s => !s.isExhausted && !s.hasAttacked);
          const viable = remaining.filter(s => evaluateAiAttackExpectimax(s, DuelState.player.field, DuelState.player.life, profile) >= (profile.aggro_threshold || 0.45));
          if (viable.length > 0) {
            safeTimeout(runAiAttackStep, 1000);
          } else {
            safeEndOpponentTurn(900);
          }
        }
      };"""

code = code.replace(continue_old, continue_new)

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Applied part 1 of battle_arena updates.")
