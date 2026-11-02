with open('battle_arena.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('scratch/arena_hand_img.txt', 'w', encoding='utf-8') as out:
    for i, l in enumerate(lines):
        if 'card-img' in l or 'renderhand' in l.lower() or 'image_url' in l:
            if 'hand' in l.lower() or 'render' in l.lower() or 'src=' in l:
                out.write(f'{i+1}: {l}')
