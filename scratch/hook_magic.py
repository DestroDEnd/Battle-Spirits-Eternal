with open('battle_arena.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if 'Activated magic spell' in l:
        lines[i] = '        executeAbilityActions(card.effect, card, side, \'MAGIC\', { contextAttacker, targetSpiritUid });\n        effectDesc = `Cast "${card.name}" and unleashed its magical effects!`;\n'
        with open('battle_arena.js', 'w', encoding='utf-8') as f:
            f.writelines(lines)
        print('✅ Successfully replaced!')
        break
