with open('deck.html', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Update renderVisualDeckGrid
target_grid = '''  // Sort by Cost ascending, then Name
  filtered.sort(([a], [b]) => {
    const cA = deckCardCache[a] ? (deckCardCache[a].cost ?? 99) : 99;
    const cB = deckCardCache[b] ? (deckCardCache[b].cost ?? 99) : 99;
    if (cA !== cB) return cA - cB;
    return a.localeCompare(b);
  });'''

replacement_grid = target_grid + '\n  window.__deckVisibleCards = filtered.map(([name]) => name);'
assert target_grid in c, 'target_grid not found'
c = c.replace(target_grid, replacement_grid)

# Update the tile onclick
c = c.replace(
    "onclick=\"openCardDetail('${escapeJsStr(name)}')\"",
    "onclick=\"openCardDetail('${escapeJsStr(name)}', window.__deckVisibleCards)\""
)

# 2. Update renderDeckRowsList
target_rows = '''  // Sort rows by Cost then Name
  entries.sort(([a], [b]) => {
    const cA = deckCardCache[a] ? (deckCardCache[a].cost ?? 99) : 99;
    const cB = deckCardCache[b] ? (deckCardCache[b].cost ?? 99) : 99;
    if (cA !== cB) return cA - cB;
    return a.localeCompare(b);
  });'''

replacement_rows = target_rows + '\n  window.__deckRowsCards = entries.map(([name]) => name);'
assert target_rows in c, 'target_rows not found'
c = c.replace(target_rows, replacement_rows)

c = c.replace(
    "<div class=\"deck-row-info\" onclick=\"openCardDetail('${escapeJsStr(name)}')\">",
    "<div class=\"deck-row-info\" onclick=\"openCardDetail('${escapeJsStr(name)}', window.__deckRowsCards)\">"
)

with open('deck.html', 'w', encoding='utf-8') as f:
    f.write(c)

print('Updated deck.html with card navigation list!')
