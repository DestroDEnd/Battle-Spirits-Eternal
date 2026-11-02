with open('battle_arena.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('scratch/effects_engine_actions.txt', 'w', encoding='utf-8') as out:
    for i in range(680, 850):
        out.write(f'{i+1}: {lines[i]}')
