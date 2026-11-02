with open('scratch/nlp_card_effect_engine.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print('Total lines in nlp_card_effect_engine.py:', len(lines))
for i in range(min(50, len(lines))):
    print(f'{i+1}: {lines[i]}', end='')
