import re, json

with open('scratch/canva_design.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Let's find all occurrences of "wording" or "Spirit" or sentences
matches = []
# Find JSON objects or text spans
for m in re.finditer(r'([^\\]{0,100}(?:wording|How to Read|Burst|Spirit|Magic|Nexus|Ultimate|Flash|Core)[^\\]{0,100})', text, re.IGNORECASE):
    matches.append(m.group(0).strip())

print(f'Total matches: {len(matches)}')
# filter unique interesting ones
seen = set()
with open('scratch/canva_extracted_text.txt', 'w', encoding='utf-8') as out:
    for m in matches:
        clean = re.sub(r'[\s\n\r]+', ' ', m)
        if len(clean) > 20 and clean not in seen:
            seen.add(clean)
            out.write(clean + '\n')

print(f'Wrote {len(seen)} unique text snippets to scratch/canva_extracted_text.txt')
