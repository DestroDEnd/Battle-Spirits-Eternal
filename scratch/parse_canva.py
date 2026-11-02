import re, json

with open('scratch/canva_design.html', 'r', encoding='utf-8') as f:
    text = f.read()

print('File size:', len(text))
title = re.search(r'<title>(.*?)</title>', text)
print('Title:', title.group(1) if title else 'No title')

# Look for embedded JSON or state
scripts = re.findall(r'<script[^>]*>(.*?)</script>', text, re.DOTALL)
print(f'Total script tags: {len(scripts)}')

# Look for card rule keywords like Spirit, Burst, Flash, Core, Void, Trash, Life, etc.
keywords = ['Spirit', 'Burst', 'Magic', 'Nexus', 'Brave', 'Ultimate', 'rules', 'effect', 'wording']
for kw in keywords:
    count = len(re.findall(re.escape(kw), text, re.IGNORECASE))
    print(f'Keyword "{kw}": {count}')

# Write any large json or bootstrap data to a file
for i, s in enumerate(scripts):
    if len(s) > 1000:
        print(f'Script {i} length: {len(s)}')
        # check if it has text elements
        found = re.findall(r'"([A-Za-z0-9\s\.,;:!?\-\(\)\[\]]{20,})"', s)
        print(f'  String fragments count: {len(found)}')
        for fragment in found[:10]:
            print('   >', fragment[:80])
