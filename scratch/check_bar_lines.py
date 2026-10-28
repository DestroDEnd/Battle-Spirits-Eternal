with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if 'phase-track-bar' in l:
        print(f"phase-track-bar is on line {i+1}")
        for j in range(max(0, i-4), min(len(lines), i+18)):
            print(f"{j+1}: {repr(lines[j])}")
