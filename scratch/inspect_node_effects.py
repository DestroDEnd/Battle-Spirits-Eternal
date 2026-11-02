with open('battle_arena.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('scratch/arena_node_effects.txt', 'w', encoding='utf-8') as out:
    for i in range(598, 626):
        out.write(f'{i+1}: {lines[i]}')
