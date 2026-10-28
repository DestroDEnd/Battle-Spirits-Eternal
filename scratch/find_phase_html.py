import re

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

for m in re.finditer(r'<div[^>]*class="[^"]*(?:phase|turn)[^"]*"[^>]*>', text, re.I):
    print(m.group(0))

print("\n--- IDs matching phase/turn ---")
for m in re.finditer(r'<div[^>]*id="[^"]*(?:phase|turn)[^"]*"[^>]*>', text, re.I):
    print(m.group(0))
