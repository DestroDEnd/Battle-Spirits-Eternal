f = open('battle_arena.js', encoding='utf-8').read()
import re
print(re.findall(r'function \w*Effect\w*', f))
