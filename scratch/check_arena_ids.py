import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('scratch/extracted_arena_section.html', 'r', encoding='utf-8') as f:
    text = f.read()

for m in re.finditer(r'id=["\']([^"\']+)["\']', text):
    id_val = m.group(1)
    if any(k in id_val.lower() for k in ['table', 'field', 'step', 'nav', 'turn', 'clash']):
        print(id_val)
