with open('battle_arena.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('scratch/arena_exec_start.txt', 'w', encoding='utf-8') as out:
    for i in range(645, 680):
        out.write(f'{i+1}: {lines[i]}')
