with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for j in range(330, 360):
    print(f"{j+1}: {lines[j].strip()[:80]}")
