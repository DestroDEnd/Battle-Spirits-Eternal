with open('battle_arena.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('scratch/arena_standard_fallback.txt', 'w', encoding='utf-8') as out:
    for i, l in enumerate(lines):
        if 'standarddecks' in l.lower() or 'curse of hades' in l.lower():
            for j in range(max(0, i-2), min(len(lines), i+20)):
                out.write(f'{j+1}: {lines[j]}')
            break
