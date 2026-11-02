import sqlite3, json, sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

with open('card_effects_db.json', 'r', encoding='utf-8') as f:
    db = json.load(f)

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()
c.execute("SELECT name, effect FROM cards WHERE effect IS NOT NULL AND length(trim(effect)) > 5")
all_effects = c.fetchall()

missing = []
for name, eff in all_effects:
    if name not in db or not db[name].get('triggers'):
        missing.append((name, eff))

print(f"Total cards with effects: {len(all_effects)}")
print(f"Parsed in db with triggers: {len(all_effects) - len(missing)}")
print(f"Missing triggers: {len(missing)}")
print("\nSample 20 missing card effects:")
for name, eff in missing[:20]:
    clean_eff = " ".join(eff.split())
    print(f"[{name}]: {clean_eff[:160]}")
