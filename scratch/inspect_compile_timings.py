with open('scratch/compile_universal_card_effects.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('scratch/compile_timing_lines.txt', 'w', encoding='utf-8') as out:
    for i in range(410, 465):
        out.write(f'{i+1}: {lines[i]}')
