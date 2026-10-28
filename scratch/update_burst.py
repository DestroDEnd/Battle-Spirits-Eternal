with open('battle_arena.js', 'r', encoding='utf-8') as f:
    c = f.read()

is_crlf = '\r\n' in c
nl = '\r\n' if is_crlf else '\n'

old_text = 'addLog(`✨ **BURST SUMMON**: "${burstCard.name}" summoned to the battle line for free (Lv${level}, ${bp} BP)!`, \'step\');'
new_text = old_text + nl + '        executeWhenSummonedEffects(burstCard, side);'

if old_text in c:
    c = c.replace(old_text, new_text, 1)
    with open('battle_arena.js', 'w', encoding='utf-8') as f:
        f.write(c)
    print("Updated activateBurst successfully!")
else:
    print("Warning: old_text not found in activateBurst")
