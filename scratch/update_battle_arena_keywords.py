import re

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    ba = f.read()

# 1. Add Fullscreen engine right above BATTLE ARENA CONTROLLER / LOBBY
fullscreen_code = """
  // ── FULLSCREEN ARENA CONTROLLER ──
  function enterFullscreen() {
    try {
      const arenaEl = document.getElementById('battleArena') || document.documentElement;
      if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
        if (arenaEl.requestFullscreen) {
          arenaEl.requestFullscreen().catch(err => {
            console.log('Fullscreen request bypassed by browser security policy:', err);
          });
        } else if (arenaEl.webkitRequestFullscreen) {
          arenaEl.webkitRequestFullscreen();
        } else if (arenaEl.msRequestFullscreen) {
          arenaEl.msRequestFullscreen();
        }
      }
    } catch (e) {
      console.log('Fullscreen error:', e);
    }
  }

  function exitFullscreen() {
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(err => {});
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      }
    } catch (e) {}
  }

  function toggleFullscreen() {
    if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }

  function updateFullscreenButtonState() {
    const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
    const btn = document.getElementById('btnDuelFullscreen');
    if (btn) {
      btn.innerHTML = isFs ? '⛶ Exit Fullscreen' : '⛶ Fullscreen';
      btn.title = isFs ? 'Exit Fullscreen Mode (Esc)' : 'Enter Immersive Fullscreen Mode';
      btn.classList.toggle('active-fullscreen', isFs);
    }
    const arenaEl = document.getElementById('battleArena');
    if (arenaEl) {
      arenaEl.classList.toggle('is-fullscreen-arena', isFs);
    }
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('fullscreenchange', updateFullscreenButtonState);
    document.addEventListener('webkitfullscreenchange', updateFullscreenButtonState);
  }
"""

if 'function enterFullscreen()' not in ba:
    # Insert right before // ── BATTLE LOBBY & PREVIEWS ──
    target = "  // ── BATTLE LOBBY & PREVIEWS ──"
    ba = ba.replace(target, fullscreen_code + "\n" + target, 1)
    print("[PASS] 1. Fullscreen engine added.")
else:
    print("[SKIP] 1. Fullscreen engine already present.")

# 2. Trigger enterFullscreen() inside executeStartDuel()
old_scroll = "    const arenaEl = document.getElementById('battleArena');\n    if (arenaEl && typeof arenaEl.scrollIntoView === 'function') arenaEl.scrollIntoView({ behavior: 'smooth' });"
new_scroll = "    // Enter fullscreen mode on entering battle\n    enterFullscreen();\n    const arenaEl = document.getElementById('battleArena');\n    if (arenaEl && typeof arenaEl.scrollIntoView === 'function') arenaEl.scrollIntoView({ behavior: 'smooth' });"

if 'enterFullscreen();' not in ba and old_scroll in ba:
    ba = ba.replace(old_scroll, new_scroll, 1)
    print("[PASS] 2. enterFullscreen() called in executeStartDuel.")
else:
    print("[INFO] 2. enterFullscreen() check...")

# 3. Update formatEffectKeywords
old_fmt_kw = """    safe = safe.replace(/\\[(Clash|Curse|Crush|Armor:[^\\]]+|Burst:[^\\]]+|Tribute:[^\\]]+|Flash|When Attacks|When Destroyed|When Summoned|Soul Core|Soul Core:[^\\]]+)\\]/gi, (match) => {
      let cls = 'kw-generic';
      const low = match.toLowerCase();
      if (low.includes('clash')) cls = 'kw-clash';
      else if (low.includes('curse')) cls = 'kw-curse';
      else if (low.includes('crush')) cls = 'kw-crush';
      else if (low.includes('burst')) cls = 'kw-burst';
      else if (low.includes('flash')) cls = 'kw-flash';
      else if (low.includes('tribute')) cls = 'kw-tribute';
      else if (low.includes('soul core')) cls = 'kw-soul-core';
      return `<span class=\"effect-keyword-pill ${cls}\">${match}</span>`;
    });"""

new_fmt_kw = """    safe = safe.replace(/\\[(Clash|True-Clash|Supreme Clash|Curse|True-Curse|Grudging Curse|Crush|Great Crush|Wave Crush|Holy Life|Ultra Holy Life|Heavenly Light|Windstorm(?::\\s*\\d+)?|Fierce Windstorm|Assault(?::\\s*\\d+)?|Great Assault|High Speed|Violent High Speed|Flashing Swift|Awaken|True-Awaken|Dragon Awaken|Immortality(?::[^\\]]+)?|Revive|Soul Drive|Ice Wall(?::[^\\]]+)?|Armor(?::[^\\]]+)?|Heavy Armor(?::[^\\]]+)?|Ultra Armor(?::[^\\]]+)?|A\\.T\\.\\s*Field|Burst(?::[^\\]]+)?|Tribute(?::[^\\]]+)?|Flash|Consecutive Blade|Rekka Consecutive Blade|Mirage(?::[^\\]]+)?|Spellbind|When Attacks|When Destroyed|When Summoned|When Blocks|Soul Core|Soul Core:[^\\]]+)\\]/gi, (match) => {
      let cls = 'kw-generic';
      const low = match.toLowerCase();
      if (low.includes('clash')) cls = 'kw-clash';
      else if (low.includes('curse')) cls = 'kw-curse';
      else if (low.includes('crush')) cls = 'kw-crush';
      else if (low.includes('holy life') || low.includes('heavenly light')) cls = 'kw-holylife';
      else if (low.includes('windstorm') || low.includes('whirlwind')) cls = 'kw-windstorm';
      else if (low.includes('assault')) cls = 'kw-assault';
      else if (low.includes('high speed') || low.includes('swift')) cls = 'kw-highspeed';
      else if (low.includes('awaken')) cls = 'kw-awaken';
      else if (low.includes('immortality') || low.includes('revive')) cls = 'kw-immortality';
      else if (low.includes('soul drive')) cls = 'kw-souldrive';
      else if (low.includes('ice wall')) cls = 'kw-icewall';
      else if (low.includes('armor') || low.includes('field')) cls = 'kw-armor';
      else if (low.includes('burst')) cls = 'kw-burst';
      else if (low.includes('flash')) cls = 'kw-flash';
      else if (low.includes('tribute')) cls = 'kw-tribute';
      else if (low.includes('consecutive blade')) cls = 'kw-consecutive';
      else if (low.includes('mirage')) cls = 'kw-mirage';
      else if (low.includes('spellbind')) cls = 'kw-spellbind';
      else if (low.includes('soul core')) cls = 'kw-soul-core';
      return `<span class=\"effect-keyword-pill ${cls}\">${match}</span>`;
    });"""

if old_fmt_kw in ba:
    ba = ba.replace(old_fmt_kw, new_fmt_kw, 1)
    print("[PASS] 3. formatEffectKeywords updated with complete Wiki keywords.")
else:
    print("[INFO] 3. formatEffectKeywords pattern check...")

# 4. Expanded keyword detection functions
old_kw_engine = """  // ── BATTLE SPIRITS KEYWORD MECHANICS ENGINE ──
  function hasClash(spirit) {
    if (!spirit || !spirit.effect) return false;
    const eff = spirit.effect.toLowerCase();
    return eff.includes('clash') || eff.includes('confront') || eff.includes('true-clash') || eff.includes('激突');
  }

  function hasCurse(spirit) {
    if (!spirit || !spirit.effect) return false;
    const eff = spirit.effect.toLowerCase();
    return eff.includes('curse') || eff.includes('jugeki') || eff.includes('呪撃');
  }

  function hasCrush(spirit) {
    if (!spirit || !spirit.effect) return false;
    const eff = spirit.effect.toLowerCase();
    return eff.includes('crush') || eff.includes('funsai') || eff.includes('粉砕');
  }

  function hasArmor(spirit, color) {
    if (!spirit || !spirit.effect) return false;
    const eff = spirit.effect.toLowerCase();
    return eff.includes(`armor: ${color.toLowerCase()}`) || eff.includes(`heavy armor: ${color.toLowerCase()}`) || eff.includes('armor: all');
  }"""

new_kw_engine = """  // ── BATTLE SPIRITS KEYWORD MECHANICS ENGINE ──
  function hasClash(spirit) {
    if (!spirit || !spirit.effect) return false;
    const eff = spirit.effect.toLowerCase();
    return eff.includes('clash') || eff.includes('confront') || eff.includes('true-clash') || eff.includes('supreme clash') || eff.includes('ultra clash') || eff.includes('激突') || eff.includes('真・激突');
  }

  function hasCurse(spirit) {
    if (!spirit || !spirit.effect) return false;
    const eff = spirit.effect.toLowerCase();
    return eff.includes('curse') || eff.includes('true-curse') || eff.includes('grudging curse') || eff.includes('jugeki') || eff.includes('呪撃') || eff.includes('真・呪撃');
  }

  function hasCrush(spirit) {
    if (!spirit || !spirit.effect) return false;
    const eff = spirit.effect.toLowerCase();
    return eff.includes('crush') || eff.includes('great crush') || eff.includes('wave crush') || eff.includes('xv crush') || eff.includes('funsai') || eff.includes('粉砕') || eff.includes('大粉砕');
  }

  function hasArmor(spirit, color) {
    if (!spirit || !spirit.effect) return false;
    const eff = spirit.effect.toLowerCase();
    const col = (color || '').toLowerCase();
    return eff.includes(`armor: ${col}`) || eff.includes(`heavy armor: ${col}`) || eff.includes(`ultra armor: ${col}`) || eff.includes('armor: all') || eff.includes('a.t. field') || eff.includes('ps armor');
  }

  function hasHolyLife(spirit) {
    if (!spirit || !spirit.effect) return false;
    const eff = spirit.effect.toLowerCase();
    return eff.includes('holy life') || eff.includes('ultra holy life') || eff.includes('heavenly light') || eff.includes('divine holy life') || eff.includes('聖命') || eff.includes('極聖命');
  }

  function hasWindstorm(spirit) {
    if (!spirit || !spirit.effect) return 0;
    const m = spirit.effect.match(/\\[(?:Windstorm|Fierce Windstorm|Whirlwind)(?::\\s*(\\d+))?\\]/i) ||
              spirit.effect.match(/暴風(?::\\s*(\\d+))?/i);
    if (m) return parseInt(m[1] || '1', 10);
    const low = spirit.effect.toLowerCase();
    if (low.includes('windstorm') || low.includes('boufuu') || low.includes('暴風')) return 1;
    return 0;
  }

  function hasAssault(spirit) {
    if (!spirit || !spirit.effect) return 0;
    const m = spirit.effect.match(/\\[(?:Assault|Great Assault|Grand Assault)(?::\\s*(\\d+))?\\]/i) ||
              spirit.effect.match(/強襲(?::\\s*(\\d+))?/i);
    if (m) return parseInt(m[1] || '1', 10);
    if (spirit.effect.toLowerCase().includes('assault') || spirit.effect.includes('強襲')) return 1;
    return 0;
  }

  function hasAwaken(spirit) {
    if (!spirit || !spirit.effect) return false;
    const eff = spirit.effect.toLowerCase();
    return eff.includes('awaken') || eff.includes('true-awaken') || eff.includes('dragon awaken') || eff.includes('覚醒') || eff.includes('真・覚醒');
  }

  function hasConsecutiveBlade(spirit) {
    if (!spirit || !spirit.effect) return false;
    const eff = spirit.effect.toLowerCase();
    return eff.includes('consecutive blade') || eff.includes('rekka consecutive blade') || eff.includes('連刃') || eff.includes('烈火連刃');
  }"""

if old_kw_engine in ba:
    ba = ba.replace(old_kw_engine, new_kw_engine, 1)
    print("[PASS] 4. Expanded keyword engine functions added.")
else:
    print("[INFO] 4. Keyword engine pattern check...")

# 5. Hook Holy Life into direct life hits (Player hitting Opponent)
old_player_life_hit = """        if (symbols > 1 && DuelState.opponent.life > 0) {
          DuelState.opponent.life = Math.max(0, DuelState.opponent.life - 1);
          DuelState.opponent.reserve += 1;
          addLog(`💥💥 **[DOUBLE SYMBOL]**: Direct attack with 2 Symbols inflicts 2 Life Damage! (Opponent Life: ${DuelState.opponent.life})`, 'damage');
        } else {
          addLog(`💥 **DIRECT HIT**: Opponent loses 1 Life! (Life remaining: ${DuelState.opponent.life})`, 'damage');
        }
        DuelState.combatEvent = null;"""

new_player_life_hit = """        if (symbols > 1 && DuelState.opponent.life > 0) {
          DuelState.opponent.life = Math.max(0, DuelState.opponent.life - 1);
          DuelState.opponent.reserve += 1;
          addLog(`💥💥 **[DOUBLE SYMBOL]**: Direct attack with 2 Symbols inflicts 2 Life Damage! (Opponent Life: ${DuelState.opponent.life})`, 'damage');
        } else {
          addLog(`💥 **DIRECT HIT**: Opponent loses 1 Life! (Life remaining: ${DuelState.opponent.life})`, 'damage');
        }

        // [Holy Life / 聖命]: When this Spirit's attack reduces opponent's Life, put 1 Core from Void to your Life!
        if (hasHolyLife(attacker)) {
          if (DuelState.player.life < 5) {
            DuelState.player.life += 1;
            AudioFX.coreChime();
            addLog(`✨ **[HOLY LIFE ACTIVATED: ${attacker.name}]**: Channeled sacred light from the Void! Restored +1 Core to your Life! (Current Life: ${DuelState.player.life})`, 'magic');
            if (typeof showToast === 'function') {
              showToast(`✨ [Holy Life]: +1 Life Restored from Void!`, 'success');
            }
          } else {
            addLog(`✨ **[HOLY LIFE: ${attacker.name}]**: Life is already at maximum (5); divine radiance protects your boundary.`, 'step');
          }
        }
        DuelState.combatEvent = null;"""

if old_player_life_hit in ba:
    ba = ba.replace(old_player_life_hit, new_player_life_hit, 1)
    print("[PASS] 5a. Holy Life hooked into Player direct hit.")
else:
    print("[INFO] 5a. Player direct hit check...")

# Hook Holy Life into Opponent hitting Player
old_opp_life_hit = """        if (symbols > 1 && DuelState.player.life > 0) {
          DuelState.player.life = Math.max(0, DuelState.player.life - 1);
          DuelState.player.reserve += 1;
          addLog(`💥💥 **[DOUBLE SYMBOL]**: Direct hit inflicts 2 Life Damage! (Remaining Life: ${DuelState.player.life})`, 'damage');
        } else {
          addLog(`💥 **DIRECT HIT**: Player loses 1 Life! (Remaining Life: ${DuelState.player.life})`, 'damage');
        }
        DuelState.combatEvent = null;"""

new_opp_life_hit = """        if (symbols > 1 && DuelState.player.life > 0) {
          DuelState.player.life = Math.max(0, DuelState.player.life - 1);
          DuelState.player.reserve += 1;
          addLog(`💥💥 **[DOUBLE SYMBOL]**: Direct hit inflicts 2 Life Damage! (Remaining Life: ${DuelState.player.life})`, 'damage');
        } else {
          addLog(`💥 **DIRECT HIT**: Player loses 1 Life! (Remaining Life: ${DuelState.player.life})`, 'damage');
        }

        // [Holy Life / 聖命]: Opponent Trigger
        if (hasHolyLife(attacker)) {
          if (DuelState.opponent.life < 5) {
            DuelState.opponent.life += 1;
            AudioFX.coreChime();
            addLog(`✨ **[HOLY LIFE ACTIVATED: ${attacker.name}]**: Opponent channeled sacred light from the Void! Restored +1 Core to their Life! (Opponent Life: ${DuelState.opponent.life})`, 'magic');
          }
        }
        DuelState.combatEvent = null;"""

if old_opp_life_hit in ba:
    ba = ba.replace(old_opp_life_hit, new_opp_life_hit, 1)
    print("[PASS] 5b. Holy Life hooked into Opponent direct hit.")
else:
    print("[INFO] 5b. Opponent direct hit check...")

# 6. Hook Windstorm & Assault into executeWhenAttacksEffects
old_when_attacks = "  function executeWhenAttacksEffects(attacker, side = 'player') {\n    if (!attacker || !attacker.effect) return;"
new_when_attacks = """  function executeWhenAttacksEffects(attacker, side = 'player') {
    if (!attacker || !attacker.effect) return;
    const isPlayer = side === 'player';
    const enemyField = isPlayer ? DuelState.opponent.field : DuelState.player.field;

    // [Windstorm / 暴風]: Exhaust N opposing Spirits on Attack declaration
    const windCount = hasWindstorm(attacker);
    if (windCount > 0) {
      const readyEnemies = enemyField.filter(s => !s.isExhausted);
      if (readyEnemies.length > 0) {
        readyEnemies.sort((a, b) => (b.currentBp || 0) - (a.currentBp || 0));
        const toExhaust = readyEnemies.slice(0, windCount);
        toExhaust.forEach(s => { s.isExhausted = true; });
        AudioFX.shield();
        const names = toExhaust.map(s => `"${s.name}"`).join(', ');
        addLog(`🌪️ **[WINDSTORM ACTIVATED: ${attacker.name}]**: Tempest exhausted ${toExhaust.length} opposing defense Spirit(s): ${names}!`, 'damage');
        if (isPlayer && typeof showToast === 'function') {
          showToast(`🌪️ [Windstorm]: Exhausted ${names}!`, 'info');
        }
      }
    }

    // [Assault / 強襲]: By exhausting another allied Spirit/Nexus, re-ready this Spirit to attack again
    const assaultTier = hasAssault(attacker);
    if (assaultTier > 0 && !(attacker._assaultCount >= assaultTier)) {
      const myField = isPlayer ? DuelState.player.field : DuelState.opponent.field;
      const allies = myField.filter(s => s.uid !== attacker.uid && !s.isExhausted);
      if (allies.length > 0) {
        const ally = allies[0];
        ally.isExhausted = true;
        attacker.isExhausted = false; // re-ready for assault!
        attacker.hasAttacked = false;
        attacker._assaultCount = (attacker._assaultCount || 0) + 1;
        AudioFX.slash();
        addLog(`⚓ **[ASSAULT ACTIVATED: ${attacker.name}]**: Exhausted allied "${ally.name}" to re-ready and prepare a second assault!`, 'magic');
        if (isPlayer && typeof showToast === 'function') {
          showToast(`⚓ [Assault]: "${attacker.name}" re-readied for another strike!`, 'success');
        }
      }
    }"""

if old_when_attacks in ba:
    ba = ba.replace(old_when_attacks, new_when_attacks, 1)
    print("[PASS] 6. Windstorm & Assault hooked into executeWhenAttacksEffects.")
else:
    print("[INFO] 6. executeWhenAttacksEffects pattern check...")

# 7. Update Window.BattleArena exports
old_exports_end = """    triggerAiTraining,
    addStandardDeckToRegistered
  };"""

new_exports_end = """    triggerAiTraining,
    addStandardDeckToRegistered,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
    hasHolyLife,
    hasWindstorm,
    hasAssault,
    hasAwaken,
    hasConsecutiveBlade
  };"""

if old_exports_end in ba:
    ba = ba.replace(old_exports_end, new_exports_end, 1)
    print("[PASS] 7. window.BattleArena exports updated with Fullscreen & Keyword helpers.")
else:
    print("[INFO] 7. Exports pattern check...")

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(ba)

print("\nbattle_arena.js updated successfully!")
