import re, json

with open('scratch/canva_script.js', 'r', encoding='utf-8') as f:
    s = f.read()

# Let's find all string literals in s that are English sentences
# or let's find the JSON payload inside s
# Typically Canva embeds: window.bootstrap = { ... } or similar
json_match = re.search(r'\{.*"Manual of Effect Wordings".*\}', s)
if json_match:
    print("Found JSON match of length:", len(json_match.group(0)))
    # write to file
    with open('scratch/canva_design_data.json', 'w', encoding='utf-8') as jf:
        jf.write(json_match.group(0))

# Also extract all text strings by regex
all_texts = []
# Match unicode unescaped or raw strings
pattern = r'\"((?:[^\"\\]|\\.)*)\"'
for m in re.finditer(pattern, s):
    val = m.group(1)
    if any(k in val for k in ['effect', 'wording', 'Burst', 'Spirit', 'opposing', 'Trash', 'Void', 'Once per', 'Cannot', 'Hierarchy', 'Timing']):
        # unescape
        try:
            val_clean = json.loads(f'"{val}"')
            if len(val_clean.strip()) > 10:
                all_texts.append(val_clean.strip())
        except:
            pass

print(f"Extracted {len(all_texts)} meaningful rule text strings.")
# deduplicate keeping order
seen = set()
unique_texts = []
for t in all_texts:
    if t not in seen:
        seen.add(t)
        unique_texts.append(t)

with open('scratch/canva_manual_rules_full.txt', 'w', encoding='utf-8') as out:
    for t in unique_texts:
        out.write(t + '\n' + '-'*40 + '\n')

print(f"Wrote {len(unique_texts)} unique strings to scratch/canva_manual_rules_full.txt")
