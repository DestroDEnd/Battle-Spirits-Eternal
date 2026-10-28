import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

def show(label, start, count):
    print(f"=== {label} (lines {start}-{start+count}) ===")
    print(''.join(lines[start-1:start-1+count]))

show("OPPONENT LIFE", 1245, 10)
show("FORMAT EFFECT KEYWORDS", 1795, 20)
show("ACTIVATE BURST END", 4435, 15)
show("PLAYER ATTACK LIFE DAMAGE", 4635, 15)
show("RESOLVE CLASH END", 4710, 20)
show("BATTLE ARENA EXPORT", len(lines)-40, 40)
