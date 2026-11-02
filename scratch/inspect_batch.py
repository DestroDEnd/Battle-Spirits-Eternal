with open('battle_arena.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('scratch/arena_fetch_cards.txt', 'w', encoding='utf-8') as out:
    for i, l in enumerate(lines):
        if 'getbatchcards' in l.lower() or 'batch' in l.lower() or 'fillcard' in l.lower() or 'resolvecard' in l.lower() or 'builddeck' in l.lower():
            out.write(f'{i+1}: {l}')
