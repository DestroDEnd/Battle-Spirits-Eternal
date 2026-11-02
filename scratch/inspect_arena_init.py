with open('battle_arena.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('scratch/arena_init_lines.txt', 'w', encoding='utf-8') as out:
    for i in range(965, 985):
        out.write(f'{i+1}: {lines[i]}')
