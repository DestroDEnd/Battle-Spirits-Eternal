with open('battle_arena.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

lines[172:180] = ["  function getHexCoreSvg(type = 'blue', size = 18) {\n"]

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Fixed getHexCoreSvg declaration successfully!")
