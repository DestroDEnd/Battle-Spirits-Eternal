import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    text = f.read()

keywords = ['Advent', 'Burst', 'Crush', 'Clash', 'Curse', 'Holy Life', 'Immunity', 'Armor', 'Heavy Armor', 'Windstorm', 'Assault', 'Tribute', 'Charge', 'Soul Core', 'Rebirth']

for kw in keywords:
    count = len(re.findall(r'\b' + re.escape(kw) + r'\b', text, re.IGNORECASE))
    print(f"Keyword '{kw}': {count} references")
