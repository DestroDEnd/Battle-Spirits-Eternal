import sqlite3, json, sys
sys.stdout.reconfigure(encoding='utf-8')

conn = sqlite3.connect('battle_spirits.db')
cursor = conn.cursor()

cursor.execute("SELECT id, name, cards_json FROM decks")
decks = cursor.fetchall()

print(f"Total decks in database: {len(decks)}\n")
for d_id, name, cards_json in decks:
    cards = json.loads(cards_json) if cards_json else []
    print(f"Deck [{d_id}] '{name}': {len(cards)} card types, total copies = {sum(c.get('count', 1) for c in cards)}")
    card_names = [f"{c.get('name', 'Unknown')} x{c.get('count', 1)}" for c in cards[:8]]
    print("   Sample cards:", ", ".join(card_names))
