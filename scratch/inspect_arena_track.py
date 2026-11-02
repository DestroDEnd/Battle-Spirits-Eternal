with open('battle_arena.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('scratch/arena_duelist_track_section.txt', 'w', encoding='utf-8') as out:
    for i in range(8770, min(8850, len(lines))):
        out.write(f'{i+1}: {lines[i]}')
