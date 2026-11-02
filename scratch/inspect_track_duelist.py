with open('battle_arena.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('scratch/arena_track_duelist.txt', 'w', encoding='utf-8') as out:
    for i, l in enumerate(lines):
        if 'TRACK & CHALLENGE DUELIST' in l or 'TRACK & CHALLENGE' in l:
            for j in range(max(0, i-5), min(len(lines), i+35)):
                out.write(f'{j+1}: {lines[j]}')
            break
