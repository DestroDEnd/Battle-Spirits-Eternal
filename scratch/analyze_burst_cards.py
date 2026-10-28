import sqlite3, sys, re
sys.stdout.reconfigure(encoding='utf-8')

conn = sqlite3.connect('battle_spirits.db')
conn.row_factory = sqlite3.Row
c = conn.cursor()
c.execute("SELECT card_number, name, color, cost, type, effect, levels FROM cards WHERE effect LIKE '%Burst%'")
rows = c.fetchall()
print(f"Cards mentioning Burst: {len(rows)}")

after_burst_cards = []
end_battle_burst_cards = []

for r in rows:
    eff = r['effect'] or ''
    if re.search(r'After (?:Your|a) Burst Activates', eff, re.IGNORECASE) or re.search(r'When (?:Your|a) Burst Activates', eff, re.IGNORECASE):
        after_burst_cards.append((r['card_number'], r['name'], eff))
    if re.search(r'discarding.*burst', eff, re.IGNORECASE) or re.search(r'discard.*burst.*refresh', eff, re.IGNORECASE) or re.search(r'end of battle.*burst', eff, re.IGNORECASE):
        end_battle_burst_cards.append((r['card_number'], r['name'], eff))

print(f"\n--- After Burst Activates ({len(after_burst_cards)} cards) ---")
for num, name, eff in after_burst_cards[:10]:
    print(f"[{num}] {name}:\n{eff}\n")

print(f"\n--- End of Battle Burst Discard ({len(end_battle_burst_cards)} cards) ---")
for num, name, eff in end_battle_burst_cards[:10]:
    print(f"[{num}] {name}:\n{eff}\n")
