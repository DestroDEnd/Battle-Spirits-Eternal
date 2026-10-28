with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if 'battle-center-hub' in l:
        print(f"battle-center-hub is on line {i+1}")
        for j in range(i, min(len(lines), i+45)):
            if 'Player Field Row' in lines[j]:
                print(f"Player Field Row on line {j+1}")
                break
            print(f"{j+1}: {lines[j].strip()[:80]}")
