import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('battle_arena.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print("--- AI ATTACK LIFE DAMAGE ---")
print(''.join(lines[5230:5265]))

print("--- TAKE LIFE DAMAGE (from chooseBlocker decline) ---")
print(''.join(lines[5450:5490]))
