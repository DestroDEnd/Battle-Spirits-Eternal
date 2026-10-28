import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if '// 15. BP BOOST' in line:
        old_block = ''.join(lines[i:i+19])
        new_block = """    // 15. BP BOOST
    if (/(?:this spirit\\s+)?(?:gets?|gains?)\\s*\\+(\\d+)[\\s]*bp/i.test(bodyLower)) {
      const match = bodyLower.match(/(?:this spirit\\s+)?(?:gets?|gains?)\\s*\\+(\\d+)[\\s]*bp/i);
      const boost = parseInt(match[1], 10);
      if (triggerName === 'ATTACK' || triggerName === 'BLOCK') {
        // Battle-duration BP boost: active during battle, reset at end of battle
        card.battleBpBoost = (card.battleBpBoost || 0) + boost;
        card.battleBp = (card.baseBp || card.currentBp || 0) + boost;
        card.currentBp = card.battleBp;
        AudioFX.shield();
        addLog(`💥 **[BP BOOST: ${card.name}]**: Temporarily gained +${boost} BP for battle (fighting with ${card.battleBp} BP)!`, 'damage');
      } else {
        // Turn-duration or permanent boost
        card.turnBpBoost = (card.turnBpBoost || 0) + boost;
        recalculateSpiritBp(card);
        AudioFX.shield();
        addLog(`💥 **[BP BOOST: ${card.name}]**: Gained +${boost} BP (now ${card.currentBp} BP)!`, 'damage');
      }
    }
"""
        with open('battle_arena.js', 'r', encoding='utf-8') as f2:
            full_text = f2.read()
        full_text = full_text.replace(old_block, new_block, 1)
        with open('battle_arena.js', 'w', encoding='utf-8', newline='') as f3:
            f3.write(full_text)
        print("Successfully replaced Rule 15 BP boost!")
        break
