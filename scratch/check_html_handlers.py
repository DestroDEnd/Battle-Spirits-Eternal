import re

def extract_handlers(html_file):
    with open(html_file, 'r', encoding='utf-8') as f:
        html = f.read()

    # Find onclick="funcName(...)" or onchange="funcName(...)"
    raw_handlers = re.findall(r'on(?:click|change|submit|input)\s*=\s*["\']([^"\']+)["\']', html)
    functions_called = set()
    for h in raw_handlers:
        # Match function call e.g. BattleArena.startDuel() or doSearch()
        calls = re.findall(r'([a-zA-Z0-9_$.]+)\s*\(', h)
        for c in calls:
            functions_called.add(c)
    return functions_called

index_calls = extract_handlers('index.html')
deck_calls = extract_handlers('deck.html')

print(f"Functions called in index.html inline handlers ({len(index_calls)}):")
for c in sorted(index_calls):
    print(f"  {c}")

print(f"\nFunctions called in deck.html inline handlers ({len(deck_calls)}):")
for c in sorted(deck_calls):
    print(f"  {c}")
