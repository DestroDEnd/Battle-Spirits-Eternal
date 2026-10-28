with open('battle_arena.js', 'r', encoding='utf-8') as f:
    c = f.read()

old_c = "${card.color.toLowerCase()}"
new_c = "${(card.color || 'red').toLowerCase()}"

if old_c in c:
    c = c.replace(old_c, new_c)
    with open('battle_arena.js', 'w', encoding='utf-8') as f:
        f.write(c)
    print("Guarded card.color safely!")
else:
    print("Warning: old_c not found")
