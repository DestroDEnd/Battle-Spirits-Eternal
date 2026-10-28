import re, sys, shutil

sys.stdout.reconfigure(encoding='utf-8')
print("=== Starting Multi-Symbol & Symbol-Granting Engine Implementation ===")

shutil.copyfile('battle_arena.js', 'battle_arena.js.bak2')
print("Backed up battle_arena.js to battle_arena.js.bak2")

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    arena = f.read()

# -------------------------------------------------------------
# 1. Replace getAttackSymbols with full base + self + aura + extra parser
# -------------------------------------------------------------
old_sym_marker = 'function getAttackSymbols(spirit) {'
idx_sym = arena.find(old_sym_marker)
if idx_sym == -1:
    print("ERROR: function getAttackSymbols not found")
    sys.exit(1)

end_sym = arena.find('\n  }\n', idx_sym) + len('\n  }\n')

new_sym_fn = '''function getAttackSymbols(spirit, attackingSide = null) {
    if (!spirit) return 1;

    // 1. Base symbols from card symbol property
    const symStr = String(spirit.symbol || '').trim();
    let base = 1;
    const px20 = (symStr.match(/20px/g) || []).length;
    const px25 = (symStr.match(/25px/g) || []).length;
    if (px20 + px25 > 0) {
      base = px20 + px25;
    } else if (/^\\d+$/.test(symStr)) {
      base = parseInt(symStr, 10);
    } else if (symStr.includes(',') || symStr.includes('/')) {
      const tokens = symStr.split(/[,/]/).map(t => t.trim()).filter(Boolean);
      if (tokens.length > 1) base = tokens.length;
    }

    let total = base + (spirit.extraSymbols || 0);
    const eff = spirit.effect || '';
    const level = spirit.currentLevel || 1;

    // 2. Self-granted additional symbols from spirit.effect
    if (eff) {
      const blocks = getCardAbilityBlocks(eff);
      for (const b of blocks) {
        const lvlMatch = b.match(/^((?:\\[LV\\d+\\])+|LV\\d+[-~]LV\\d+|LV\\d+)/i);
        if (lvlMatch && !isEffectLevelMet(lvlMatch[1], level)) {
          continue;
        }
        // Check Soul Core condition
        if (/while this spirit has (?:\\[soul core\\]|soul core)/i.test(b) && !spirit.hasSoulCore) {
          continue;
        }

        // Check additions: gains / gets +N symbols
        if (/this spirit (?:gains|gets)\\s+(?:an?|one|\\+?1)\\s+(?:extra|additional)?\\s*(?:[a-zA-Z]+\\s+)?symbols?/i.test(b) ||
            /シンボル(?:1つ|\\+1|を\\+1)を追加/i.test(b)) {
          total += 1;
        } else if (/this spirit (?:gains|gets)\\s+(?:two|\\+?2)\\s+(?:extra|additional)?\\s*(?:[a-zA-Z]+\\s+)?symbols?/i.test(b) ||
                   /シンボル2つを追加/i.test(b)) {
          total += 2;
        } else if (/this spirit (?:gains|gets)\\s+(?:three|\\+?3)\\s+(?:extra|additional)?\\s*(?:[a-zA-Z]+\\s+)?symbols?/i.test(b)) {
          total += 3;
        }

        // Check direct symbol overrides: "this spirit has two symbols"
        if (/(?:has|becomes)\\s+two\\s+(?:[a-zA-Z]+\\s+)?symbols/i.test(b)) {
          total = Math.max(total, 2);
        } else if (/(?:has|becomes)\\s+three\\s+(?:[a-zA-Z]+\\s+)?symbols/i.test(b)) {
          total = Math.max(total, 3);
        } else if (/(?:has|becomes)\\s+four\\s+(?:[a-zA-Z]+\\s+)?symbols/i.test(b)) {
          total = Math.max(total, 4);
        }
      }
    }

    // 3. Team / allied field auras granting additional symbols
    if (attackingSide && DuelState[attackingSide]) {
      const field = DuelState[attackingSide].field || [];
      for (const ally of field) {
        if (ally.uid === spirit.uid || !ally.effect) continue;
        const allyBlocks = getCardAbilityBlocks(ally.effect);
        for (const ab of allyBlocks) {
          const lvlMatch = ab.match(/^((?:\\[LV\\d+\\])+|LV\\d+[-~]LV\\d+|LV\\d+)/i);
          if (lvlMatch && !isEffectLevelMet(lvlMatch[1], ally.currentLevel || 1)) {
            continue;
          }
          // Match: all your "Ancient Dragon" family Spirits gain an extra Red symbol
          const mFam = ab.match(/all your\\s+((?:["'][^"']+["']\\/?)+)\\s+family spirits (?:gain|get)\\s+(?:an?|one|\\+?1)\\s+(?:extra|additional)?\\s*(?:[a-zA-Z]+\\s+)?symbols?/i);
          if (mFam) {
            const fams = mFam[1].replace(/["']/g, '').split('/').map(f => f.trim().toLowerCase());
            const spiritFam = ((spirit.family || '') + ' ' + (spirit.families ? spirit.families.join(' ') : '') + ' ' + spirit.name).toLowerCase();
            if (fams.some(f => spiritFam.includes(f))) {
              total += 1;
            }
          }
          // Match: all your spirits gain an extra symbol
          if (/all your spirits (?:gain|get)\\s+(?:an?|one|\\+?1)\\s+(?:extra|additional)?\\s*(?:[a-zA-Z]+\\s+)?symbols?/i.test(ab)) {
            total += 1;
          }
        }
      }
    }

    return Math.max(1, total);
  }

  function grantExtraSymbols(spirit, count = 1) {
    if (!spirit) return;
    spirit.extraSymbols = (spirit.extraSymbols || 0) + count;
    AudioFX.coreChime();
    addLog(`✨ **[SYMBOL EMPOWERMENT: ${spirit.name}]**: Gained +${count} Symbol(s)! (Current Attack Symbols: ${getAttackSymbols(spirit)})`, 'magic');
    renderDuelTable();
  }
'''

arena = arena[:idx_sym] + new_sym_fn + arena[end_sym:]
print("✓ Replaced getAttackSymbols and added grantExtraSymbols")

# -------------------------------------------------------------
# 2. Update Life damage resolution in executePlayerAttack
# -------------------------------------------------------------
idx_epa_damage = arena.find('const symbols = getAttackSymbols(attacker);\n        DuelState.opponent.life = Math.max(0, DuelState.opponent.life - 1);')
if idx_epa_damage == -1:
    idx_epa_damage = arena.find('const symbols = getAttackSymbols(attacker);')
    print("Found getAttackSymbols at index:", idx_epa_damage)

end_epa_damage = arena.find('// [Holy Life / 聖命]:', idx_epa_damage)
if end_epa_damage == -1:
    print("ERROR: End of epa damage block not found")
    sys.exit(1)

new_epa_damage = '''const symbols = getAttackSymbols(attacker, 'player');
        const damageToDeal = Math.min(symbols, DuelState.opponent.life);
        for (let s = 0; s < damageToDeal; s++) {
          DuelState.opponent.life = Math.max(0, DuelState.opponent.life - 1);
          DuelState.opponent.reserve += 1;
        }

        if (symbols > 1) {
          const symName = symbols === 2 ? 'DOUBLE SYMBOL' : (symbols === 3 ? 'TRIPLE SYMBOL' : `${symbols}-SYMBOL`);
          addLog(`💥💥 **[${symName}: ${attacker.name}]**: Direct attack with ${symbols} Symbols inflicts ${damageToDeal} Life Damage! (Opponent Life: ${DuelState.opponent.life})`, 'damage');
          if (typeof showToast === 'function') {
            showToast(`💥 ${symName}: Inflicted ${damageToDeal} Life Damage!`, 'success');
          }
        } else {
          addLog(`💥 **DIRECT HIT**: Opponent loses 1 Life! (Life remaining: ${DuelState.opponent.life})`, 'damage');
        }

        '''

arena = arena[:idx_epa_damage] + new_epa_damage + arena[end_epa_damage:]
print("✓ Updated executePlayerAttack to inflict damage equal to full symbol count")

# -------------------------------------------------------------
# 3. Update Life damage resolution in runAiAttackStep
# -------------------------------------------------------------
idx_ai_damage = arena.find('const symbols = getAttackSymbols(attacker);\n        DuelState.player.life = Math.max(0, DuelState.player.life - 1);')
if idx_ai_damage == -1:
    print("ERROR: AI damage section not found")
    sys.exit(1)

end_ai_damage = arena.find('// [Holy Life / 聖命]: Opponent Trigger', idx_ai_damage)
if end_ai_damage == -1:
    print("ERROR: End of AI damage section not found")
    sys.exit(1)

new_ai_damage = '''const symbols = getAttackSymbols(attacker, 'opponent');
        const damageToDeal = Math.min(symbols, DuelState.player.life);
        for (let s = 0; s < damageToDeal; s++) {
          DuelState.player.life = Math.max(0, DuelState.player.life - 1);
          DuelState.player.reserve += 1;
        }

        if (symbols > 1) {
          const symName = symbols === 2 ? 'DOUBLE SYMBOL' : (symbols === 3 ? 'TRIPLE SYMBOL' : `${symbols}-SYMBOL`);
          addLog(`💥💥 **[${symName}: ${attacker.name}]**: Opponent attacked with ${symbols} Symbols inflicting ${damageToDeal} Life Damage! (Your Life: ${DuelState.player.life})`, 'damage');
          if (typeof showToast === 'function') {
            showToast(`⚠️ Took ${damageToDeal} Life Damage from ${symName}!`, 'warning');
          }
        } else {
          addLog(`💥 **DIRECT HIT**: Player loses 1 Life! (Remaining Life: ${DuelState.player.life})`, 'damage');
        }

        '''

arena = arena[:idx_ai_damage] + new_ai_damage + arena[end_ai_damage:]
print("✓ Updated runAiAttackStep to inflict damage equal to full symbol count")

# -------------------------------------------------------------
# 4. Update Life damage resolution in takeLifeDamage
# -------------------------------------------------------------
idx_tld = arena.find('function takeLifeDamage(attackerUid) {')
if idx_tld == -1:
    print("ERROR: takeLifeDamage function not found")
    sys.exit(1)

idx_tld_damage = arena.find('const symbols = getAttackSymbols(attacker);', idx_tld)
end_tld_damage = arena.find('DuelState.combatEvent = null;', idx_tld_damage)

new_tld_damage = '''const symbols = getAttackSymbols(attacker, 'opponent');
    const damageToDeal = Math.min(symbols, DuelState.player.life);
    for (let s = 0; s < damageToDeal; s++) {
      DuelState.player.life = Math.max(0, DuelState.player.life - 1);
      DuelState.player.reserve += 1;
    }

    if (symbols > 1) {
      const symName = symbols === 2 ? 'DOUBLE SYMBOL' : (symbols === 3 ? 'TRIPLE SYMBOL' : `${symbols}-SYMBOL`);
      addLog(`💥💥 **[${symName}: ${attacker ? attacker.name : 'Opponent'}]**: Direct attack with ${symbols} Symbols inflicts ${damageToDeal} Life Damage! (Your Life: ${DuelState.player.life})`, 'damage');
      if (typeof showToast === 'function') {
        showToast(`⚠️ Took ${damageToDeal} Life Damage (${symbols} Symbols)!`, 'warning');
      }
    } else {
      addLog(`💥 **DIRECT HIT**: Player loses 1 Life! (Remaining Life: ${DuelState.player.life})`, 'damage');
    }

    if (attacker && hasHolyLife(attacker)) {
      if (DuelState.opponent.life < 5) {
        DuelState.opponent.life += 1;
        AudioFX.coreChime();
        addLog(`✨ **[HOLY LIFE ACTIVATED: ${attacker.name}]**: Opponent restored +1 Life from Void!`, 'magic');
      }
    }

    '''

arena = arena[:idx_tld_damage] + new_tld_damage + arena[end_tld_damage:]
print("✓ Updated takeLifeDamage to inflict damage equal to full symbol count")

# -------------------------------------------------------------
# 5. Update showBlockPrompt to display symbol warnings & dynamic pass button
# -------------------------------------------------------------
idx_sbp = arena.find('function showBlockPrompt(attacker, readyBlockers) {')
idx_pass_btn = arena.find('<button class="btn-pass-block" onclick="BattleArena.takeLifeDamage(\'${attacker.uid}\')">💥 Take 1 Life Damage</button>', idx_sbp)
if idx_pass_btn != -1:
    new_pass_btn = '''const attSymbols = getAttackSymbols(attacker, 'opponent');
      if (attSymbols > 1) {
        blockerHtml = `
          <div style="padding:0.5rem; background:rgba(239,68,68,0.2); border:1px solid #ef4444; border-radius:0.4rem; color:#fca5a5; font-size:0.8rem; font-weight:800; text-align:center; margin-bottom:0.6rem;">
            ⚡ [MULTI-SYMBOL THREAT]: "${attacker.name}" attacks with ${attSymbols} Symbols! Passing will inflict ${attSymbols} Life Damage!
          </div>
        ` + blockerHtml;
      }
      blockerHtml += `
        <button class="btn-pass-block" onclick="BattleArena.takeLifeDamage('${attacker.uid}')">💥 Take ${attSymbols} Life Damage (${attSymbols} Symbol${attSymbols > 1 ? 's' : ''})</button>
      `;'''
    arena = arena[:idx_pass_btn] + new_pass_btn + arena[idx_pass_btn + len('<button class="btn-pass-block" onclick="BattleArena.takeLifeDamage(\'${attacker.uid}\')">💥 Take 1 Life Damage</button>'):]
    print("✓ Updated showBlockPrompt with multi-symbol threat banner and dynamic pass button")

# -------------------------------------------------------------
# 6. Export grantExtraSymbols on window.BattleArena
# -------------------------------------------------------------
idx_export = arena.rfind('window.BattleArena = {')
idx_export_end = arena.find('};', idx_export)
if 'grantExtraSymbols' not in arena[idx_export:idx_export_end]:
    arena = arena[:idx_export_end] + ',\n    grantExtraSymbols\n' + arena[idx_export_end:]
    print("✓ Exported grantExtraSymbols on window.BattleArena")

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(arena)

print("=== Multi-Symbol & Symbol-Granting Engine Applied Successfully ===")
