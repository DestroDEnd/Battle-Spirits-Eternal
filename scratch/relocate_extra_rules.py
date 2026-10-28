import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    text = f.read()

# First, extract the extra_rules block from executeWhenSummonedEffects
start_marker = "    // 18. DESPERADO CORE STRIP & VOID HARVEST (When Summoned)"
end_marker = "    renderDuelTable();\n    if (side === 'player') renderPlayerHand();\n\n    const enemySide = side === 'player' ? 'opponent' : 'player';"

idx_start = text.find(start_marker)
idx_end = text.find(end_marker)

if idx_start != -1 and idx_end != -1:
    extra_block = text[idx_start:idx_end].strip()
    # Remove from current location
    text = text[:idx_start] + text[idx_end:]
    
    # Place right before the closing brace of executeAbilityActions
    target_pos = "        executeWhenSummonedEffects(reanimatedSpirit, side);\n      }\n    }"
    insert_point = text.find(target_pos)
    if insert_point != -1:
        insert_idx = insert_point + len(target_pos)
        text = text[:insert_idx] + "\n\n" + extra_block + text[insert_idx:]
        with open('battle_arena.js', 'w', encoding='utf-8', newline='') as f:
            f.write(text)
        print("Successfully moved extra_rules into executeAbilityActions!")
    else:
        print("target_pos not found!")
else:
    print(f"Markers not found! idx_start={idx_start}, idx_end={idx_end}")
