import sys
sys.stdout.reconfigure(encoding='utf-8')
with open('scratch/test_turn_relocation.js', 'r', encoding='utf-8') as f:
    text = f.read()
print(text[:800])
