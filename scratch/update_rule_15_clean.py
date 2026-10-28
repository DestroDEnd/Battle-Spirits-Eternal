import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    text = f.read()

target_rule_15_update = """      if (triggerName === 'ATTACK' || triggerName === 'BLOCK') {
        // Battle-duration BP boost: only active during this battle!
        if (!card.battleBpBoost) {
          card.battleBpBoost = boost;
          card.battleBp = (card.currentBp || 0) + boost;
          AudioFX.shield();
          addLog(`💥 **[BP BOOST: ${card.name}]**: Temporarily gained +${boost} BP for battle (fighting with ${card.battleBp} BP)!`, 'damage');
        }
      } else {"""

repl_rule_15_update = """      if (triggerName === 'ATTACK' || triggerName === 'BLOCK') {
        // Battle-duration BP boost: active during battle, reset at end of battle
        card.battleBpBoost = (card.battleBpBoost || 0) + boost;
        card.battleBp = (card.baseBp || card.currentBp || 0) + boost;
        card.currentBp = card.battleBp;
        AudioFX.shield();
        addLog(`💥 **[BP BOOST: ${card.name}]**: Temporarily gained +${boost} BP for battle (fighting with ${card.battleBp} BP)!`, 'damage');
      } else {"""

if target_rule_15_update in text:
    text = text.replace(target_rule_15_update, repl_rule_15_update, 1)
    with open('battle_arena.js', 'w', encoding='utf-8', newline='') as f:
        f.write(text)
    print("Successfully updated Rule 15 in battle_arena.js!")
else:
    print("target_rule_15_update not found!")
