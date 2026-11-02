with open('battle_arena.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('scratch/burst_prompt_and_ai.txt', 'w', encoding='utf-8') as out:
    for i in range(6480, 6680):
        out.write(f'{i+1}: ' + lines[i])
print('Done writing burst_prompt_and_ai.txt')
