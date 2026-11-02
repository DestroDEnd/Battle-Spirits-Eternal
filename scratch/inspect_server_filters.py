with open('server.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open('scratch/server_filters.txt', 'w', encoding='utf-8') as out:
    for i in range(420, min(500, len(lines))):
        out.write(f'{i+1}: {lines[i]}')
