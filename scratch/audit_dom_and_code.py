import re
import os

with open('index.html', 'r', encoding='utf-8') as f:
    index_html = f.read()

with open('deck.html', 'r', encoding='utf-8') as f:
    deck_html = f.read()

html_ids_index = set(re.findall(r'id=["\']([a-zA-Z0-9_\-]+)["\']', index_html))
html_ids_deck = set(re.findall(r'id=["\']([a-zA-Z0-9_\-]+)["\']', deck_html))
all_html_ids = html_ids_index | html_ids_deck

print(f"Total HTML IDs in index.html: {len(html_ids_index)}")
print(f"Total HTML IDs in deck.html: {len(html_ids_deck)}")
print(f"Combined unique HTML IDs: {len(all_html_ids)}")

def audit_file(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        js = f.read()

    # Look for getElementById calls
    ids = re.findall(r'getElementById\(["\']([a-zA-Z0-9_\-]+)["\']\)', js)
    unique_ids = sorted(list(set(ids)))
    print(f"\n--- Auditing {filename} ({len(ids)} lookups, {len(unique_ids)} unique) ---")

    missing = []
    for elem_id in unique_ids:
        if elem_id not in all_html_ids:
            # Check how it's used in the file
            # e.g., is it guarded with `if (elem) ...` or called directly `document.getElementById(...).addEventListener`?
            direct_calls = re.findall(rf'getElementById\(["\']{elem_id}["\']\)\.([a-zA-Z0-9_]+)', js)
            missing.append((elem_id, direct_calls))

    if not missing:
        print("  All looked-up IDs exist in HTML!")
    else:
        print(f"  {len(missing)} IDs not found in HTML:")
        for elem_id, direct_calls in missing:
            if direct_calls:
                print(f"    [CRITICAL UNGUARDED] #{elem_id} -> directly calls .{direct_calls}")
            else:
                print(f"    [INFO/GUARDED or DYNAMIC] #{elem_id}")

audit_file('app.js')
audit_file('battle_arena.js')
