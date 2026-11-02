with open('battle_arena.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('scratch/arena_init_deck.txt', 'w', encoding='utf-8') as out:
    for i, l in enumerate(lines):
        if 'initduel' in l.lower() or 'loaddeck' in l.lower() or 'standard-decks' in l:
            for j in range(max(0, i-2), min(len(lines), i+30)):
                out.write(f'{j+1}: {lines[j]}')
            break
