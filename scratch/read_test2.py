import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('scratch/test_universal_card_database.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(''.join(lines[140:175]))
