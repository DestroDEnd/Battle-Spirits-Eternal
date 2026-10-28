import sqlite3, json, sys
sys.stdout.reconfigure(encoding='utf-8')

conn = sqlite3.connect('battle_spirits.db')
cursor = conn.cursor()

cursor.execute("SELECT id, name, cards_json FROM decks")
decks = cursor.fetchall()

deck_card_names = set()
for d_id, d_name, cards_json in decks:
    cards = json.loads(cards_json) if cards_json else []
    for c in cards:
        if c.get('name'):
            deck_card_names.add(c['name'])

print(f"Total unique card names across all decks: {len(deck_card_names)}")

# Look up each in cards table
found = 0
not_found = []
cards_by_type = {}

for name in sorted(deck_card_names):
    cursor.execute("SELECT card_number, name, type, color, cost, effect FROM cards WHERE name = ? COLLATE NOCASE", (name,))
    row = cursor.fetchone()
    if not row:
        # Try LIKE
        cursor.execute("SELECT card_number, name, type, color, cost, effect FROM cards WHERE name LIKE ? LIMIT 1", (f"%{name}%",))
        row = cursor.fetchone()
    if row:
        found += 1
        num, cname, ctype, color, cost, eff = row
        ctype = ctype or 'Unknown'
        cards_by_type.setdefault(ctype, []).append((num, cname, color, cost, eff or ''))
    else:
        not_found.append(name)

print(f"Found in cards table: {found} / {len(deck_card_names)}")
if not_found:
    print("Not found in db:", not_found)

print("\n--- CARDS IN STARTER DECKS & USER DECKS ---")
for ctype, clist in sorted(cards_by_type.items()):
    print(f"\n=== {ctype} ({len(clist)}) ===")
    for num, cname, color, cost, eff in clist:
        eff_summary = (eff.replace('\n', ' ')[:90] + '...') if eff else 'Vanilla (No Effect)'
        print(f"  [{num or 'NO-NUM'}] {cname} ({color}, Cost {cost}) -> {eff_summary}")
