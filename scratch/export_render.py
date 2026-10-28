with open('battle_arena.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = """  window.BattleArena = {
    init: initBattleArena,
    startDuel,"""

replacement = """  window.BattleArena = {
    init: initBattleArena,
    startDuel,
    renderDuelTable,
    renderPlayerHand,"""

content_norm = content.replace('\r\n', '\n')
target_norm = target.replace('\r\n', '\n')
replacement_norm = replacement.replace('\r\n', '\n')

assert target_norm in content_norm
content_norm = content_norm.replace(target_norm, replacement_norm, 1)

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(content_norm)

print("Exported renderPlayerHand and renderDuelTable")
