with open('battle_arena.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('scratch/arena_block_combat.txt', 'w', encoding='utf-8') as out:
    for i in range(7770, min(7850, len(lines))):
        out.write(f'{i+1}: {lines[i]}')
