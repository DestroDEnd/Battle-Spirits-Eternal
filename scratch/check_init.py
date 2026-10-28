import sys, re
sys.stdout.reconfigure(encoding='utf-8')
with open('battle_arena.js', 'r', encoding='utf-8') as f:
    text = f.read()

for m in re.finditer(r'(function initBattleArena|DOMContentLoaded|window\.addEventListener\([\'"]load[\'"])', text):
    line_no = text[:m.start()].count('\n') + 1
    print(f'Line {line_no}: {m.group(0)}')
