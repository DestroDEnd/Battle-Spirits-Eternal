import sqlite3
import json

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()

c.execute("SELECT id, name, levels, effect FROM cards WHERE type IS NULL OR trim(type) = ''")
empty_cards = c.fetchall()
print(f"Cards to update: {len(empty_cards)}")

magic_names = {'golden counter', "king's downfall", 'rule reversal', 'world collapse', 'world release'}

def classify(name, levels, effect):
    lvl = (levels or '').lower()
    eff = (effect or '').lower()
    nm = (name or '').lower()
    
    # 1. Brave
    if 'brave' in lvl or '[brave condition' in eff or 'when braved' in eff:
        return 'Brave'
    # 2. Ultimate
    if '[summon condition:' in eff or ('level 3' in lvl and 'level 1' not in lvl):
        return 'Ultimate'
    # 3. Nexus: 0 core and no BP, or [nexus] without BP
    if ('0 core' in lvl and 'bp' not in lvl) or ('[nexus]' in eff and 'bp' not in lvl):
        return 'Nexus'
    # 4. Spirit
    if 'level 1' in lvl or 'bp' in lvl or '[lv1]' in eff:
        return 'Spirit'
    # 5. Magic
    if any(k in eff for k in ['[main]', 'main-', 'main -', '[flash]', 'flash-', 'flash -', '(your main phase)', '(flash step)', '[burst:']) or nm in magic_names:
        return 'Magic'
    # 6. Nexus
    if 'nexus' in eff or '[nexus]' in eff:
        return 'Nexus'
    # 7. Fallback
    return 'Spirit'

type_counts = {}
updates = []
for cid, name, levels, effect in empty_cards:
    ctype = classify(name, levels, effect)
    type_counts[ctype] = type_counts.get(ctype, 0) + 1
    updates.append((ctype, cid, name))

print("Classified counts:", type_counts)

# Update battle_spirits.db
for ctype, cid, name in updates:
    c.execute("UPDATE cards SET type = ? WHERE id = ?", (ctype, cid))

conn.commit()

# Verify 0 empty cards in battle_spirits.db
c.execute("SELECT COUNT(*) FROM cards WHERE type IS NULL OR trim(type) = ''")
remaining = c.fetchone()[0]
print(f"Remaining cards with empty/null type in battle_spirits.db: {remaining}")
conn.close()

# Update card_effects_db.json
with open('card_effects_db.json', 'r', encoding='utf-8') as f:
    card_effects = json.load(f)

effects_updated = 0
for ctype, cid, name in updates:
    if name in card_effects:
        old_type = card_effects[name].get('type')
        if old_type != ctype:
            card_effects[name]['type'] = ctype
            effects_updated += 1
    else:
        # If not present, create minimal entry
        card_effects[name] = {'type': ctype}
        effects_updated += 1

print(f"Updated {effects_updated} card types in card_effects_db.json")

with open('card_effects_db.json', 'w', encoding='utf-8') as f:
    json.dump(card_effects, f, indent=2, ensure_ascii=False)

print("Sanitization complete!")
