with open('battle_arena.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('scratch/arena_t7_lines.txt', 'w', encoding='utf-8') as out:
    for i in range(7814, min(7845, len(lines))):
        out.write(f'{i+1}: {repr(lines[i])}\n')
