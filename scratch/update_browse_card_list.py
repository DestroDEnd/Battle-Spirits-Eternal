with open('browse.html', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Update loadBrowseCards: store browseState.currentCards
c = c.replace(
    'const cards = data.cards || [];',
    'const cards = data.cards || [];\n    browseState.currentCards = cards.map(c => c.name);'
)

# 2. Update bindCardTileEvents: pass browseState.currentCards
c = c.replace(
    "openCardDetail(el.getAttribute('data-name'))",
    "openCardDetail(el.getAttribute('data-name'), browseState.currentCards)"
)

with open('browse.html', 'w', encoding='utf-8') as f:
    f.write(c)

print('Updated browse.html with card navigation list!')
