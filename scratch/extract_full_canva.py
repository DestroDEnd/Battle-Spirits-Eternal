import re, json

with open('scratch/canva_design.html', 'r', encoding='utf-8') as f:
    text = f.read()

# In Canva designs, text objects usually have structure like:
# "a":{"C":{"A":["..."]}} or similar text blocks in the bootstrap json
# Let's search for "A":["..."] arrays where strings have length > 5
results = []
for m in re.finditer(r'"A":\[(".*?")\]', text):
    content = m.group(1)
    # decode json string array
    try:
        arr = json.loads(f'[{content}]')
        for item in arr:
            if isinstance(item, str) and len(item.strip()) > 3:
                results.append(item.strip())
    except Exception:
        pass

print(f'Total text strings found: {len(results)}')
with open('scratch/canva_all_rules.txt', 'w', encoding='utf-8') as out:
    for r in results:
        out.write(r + '\n')

print('Written to scratch/canva_all_rules.txt')
