import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

def find_line(pattern):
    for i, l in enumerate(lines):
        if pattern in l:
            return i + 1
    return -1

print("Rule 15 BP boost line:", find_line("// 15. BP BOOST"))
print("executePlayerAttack line:", find_line("function executePlayerAttack("))
print("resolveClash line:", find_line("function resolveClash("))
print("runAiAttackStep line:", find_line("function runAiAttackStep("))
print("takeLifeDamage line:", find_line("function takeLifeDamage("))
print("endTurn line:", find_line("function endTurn("))
print("renderFieldSpirit line:", find_line("function renderFieldSpirit("))
