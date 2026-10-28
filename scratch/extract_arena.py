import sys
sys.stdout.reconfigure(encoding='utf-8')
with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

arena_lines = lines[90:866]
print(f"Extracted {len(arena_lines)} lines of battle arena section.")
with open('scratch/extracted_arena_section.html', 'w', encoding='utf-8') as f:
    f.writelines(arena_lines)

print("Saved to scratch/extracted_arena_section.html")
