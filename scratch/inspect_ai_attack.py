with open('battle_arena.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('scratch/arena_ai_attack_burst.txt', 'w', encoding='utf-8') as out:
    for i in range(7510, min(7620, len(lines))):
        out.write(f'{i+1}: {lines[i]}')
