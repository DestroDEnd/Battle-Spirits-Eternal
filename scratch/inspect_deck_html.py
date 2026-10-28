import re

with open('deck.html', 'r', encoding='utf-8') as f:
    deck_html = f.read()

print('Deck HTML length:', len(deck_html))
ids = re.findall(r'id=["\']([^"\']+)["\']', deck_html)
print('IDs found:', ids)

print('--- Sections in deck.html ---')
for line in deck_html.splitlines():
    if '<section' in line or '<div class="deck-' in line or '<div class="builder-' in line:
        print(line.strip())
