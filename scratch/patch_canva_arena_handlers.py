import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add When Braved gating
brave_target = '    for (const act of actions) {\n      if (act.min_level && curLevel < act.min_level) continue;'
brave_replacement = '''    for (const act of actions) {
      if (act.min_level && curLevel < act.min_level) continue;
      // Canva Rule: When Braved condition gating
      if ((act.is_braved || act.require_braved) && !card.isBraved && !card.brave && !card.braveCard && !context.isBraved) {
        continue;
      }'''

if brave_target in content:
    content = content.replace(brave_target, brave_replacement, 1)
    print("1. Successfully inserted When Braved condition gating into executeUniversalCardEffect!")
else:
    print("Warning: brave_target not found or already applied.")

# 2. Add Canva action handlers after GRANT_SYMBOL
canva_actions = """      } else if (actType === 'GRANT_SYMBOL') {
        card.bonusSymbols = (card.bonusSymbols || 0) + 1;
        AudioFX.coreChime();
        addLog(`💎 **[${card.name}]**: Empowered! Gained +1 ${act.color || ''} Symbol!`, 'step');
      } else if (actType === 'DECK_DISCARD') {
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
        }
      } else if (actType === 'CRUSH') {
        const millCount = curLevel;
        let discarded = 0;
        for (let i = 0; i < millCount; i++) {
          if (!enemyState.deck || enemyState.deck.length === 0) break;
          const milled = enemyState.deck.shift();
          sendToTrash(milled, enemySide, `Crush by ${card.name}`);
          discarded++;
        }
        if (discarded > 0) {
          AudioFX.destroy();
          addLog(`🔨 **[${card.name}] [Crush LV${curLevel}]**: Smashed ${discarded} card(s) from opposing deck into Trash!`, 'damage');
        }
      } else if (actType === 'BURST_LOCK') {
        const targetRule = (act.canva_rules && act.canva_rules.burst_lock_target) || 'PLAYER';
        if (targetRule === 'PLAYER') {
          enemyState.cannotActivateBurstEffects = true;
          addLog(`🔒 **[${card.name}]**: Absolute Lock! Opposing player cannot activate Burst effects!`, 'step');
        } else {
          enemyState.burstCardsLocked = true;
          addLog(`🔒 **[${card.name}]**: Lock! Opposing Burst cannot activate!`, 'step');
        }
      } else if (actType === 'ARMOR' || actType === 'HEAVY ARMOR') {
        const colors = act.colors || ['Red', 'Purple', 'Green', 'White', 'Yellow', 'Blue'];
        card.armorColors = (card.armorColors || []).concat(colors);
        AudioFX.shield();
        addLog(`🛡️ **[${card.name}] [${actType}]**: Divine barrier active against [${colors.join(', ')}] effects!`, 'step');
      } else if (actType === 'SPECIAL_EFFECT') {
        if (act.desc && act.desc.length > 3 && !act.desc.startsWith('[LV') && !act.desc.startsWith('(')) {
          addLog(`✨ **[${card.name}]**: ${act.desc}`, 'step');
        }"""

symbol_target = """      } else if (actType === 'GRANT_SYMBOL') {
        card.bonusSymbols = (card.bonusSymbols || 0) + 1;
        AudioFX.coreChime();
        addLog(`💎 **[${card.name}]**: Empowered! Gained +1 ${act.color || ''} Symbol!`, 'step');"""

if symbol_target in content:
    content = content.replace(symbol_target, canva_actions, 1)
    print("2. Successfully inserted Canva action handlers into executeUniversalCardEffect!")
else:
    print("Warning: symbol_target not found or already applied.")

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: battle_arena.js saved.")
