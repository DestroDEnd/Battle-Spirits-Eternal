with open('battle_arena.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('scratch/ai_main_and_attack.txt', 'w', encoding='utf-8') as out:
    for i in range(7339, 7600):
        out.write(f'{i+1}: ' + lines[i])
print('Done writing ai_main_and_attack.txt')
