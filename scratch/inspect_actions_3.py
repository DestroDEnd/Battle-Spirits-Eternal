with open('battle_arena.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('scratch/effects_engine_actions_3.txt', 'w', encoding='utf-8') as out:
    for i in range(920, min(970, len(lines))):
        out.write(f'{i+1}: {lines[i]}')
