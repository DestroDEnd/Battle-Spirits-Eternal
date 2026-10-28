with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for j in range(370, 400):
    print(f"{j+1}: {lines[j].strip()[:80]}")
