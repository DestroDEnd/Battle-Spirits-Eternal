import sqlite3, re, sys
sys.stdout.reconfigure(encoding='utf-8')

conn = sqlite3.connect('battle_spirits.db')
cursor = conn.cursor()

cursor.execute("SELECT card_number, name, effect FROM cards WHERE effect LIKE '%during this battle%'")
rows = cursor.fetchall()

print(f"Total 'during this battle' cards: {len(rows)}")

categories = {
    'bp_boost': [],
    'bp_reduction': [],
    'unblockable': [],
    'cannot_be_destroyed': [],
    'symbol_boost': [],
    'other': []
}

for num, name, eff in rows:
    eff_lower = eff.lower()
    if re.search(r'during this battle.*?\+\d+[\s]*bp', eff_lower) or re.search(r'(?:gets?|gains?)\s*\+\d+[\s]*bp.*?during this battle', eff_lower):
        categories['bp_boost'].append((num, name, eff[:80].replace('\n', ' ')))
    elif re.search(r'during this battle.*?\-\d+[\s]*bp', eff_lower) or re.search(r'(?:gives?|gets?)\s*\-\d+[\s]*bp.*?during this battle', eff_lower):
        categories['bp_reduction'].append((num, name, eff[:80].replace('\n', ' ')))
    elif 'can\'t be blocked' in eff_lower or 'cannot be blocked' in eff_lower:
        categories['unblockable'].append((num, name, eff[:80].replace('\n', ' ')))
    elif 'cannot be destroyed' in eff_lower or 'can\'t be destroyed' in eff_lower:
        categories['cannot_be_destroyed'].append((num, name, eff[:80].replace('\n', ' ')))
    elif 'symbol' in eff_lower:
        categories['symbol_boost'].append((num, name, eff[:80].replace('\n', ' ')))
    else:
        categories['other'].append((num, name, eff[:80].replace('\n', ' ')))

for k, v in categories.items():
    print(f"{k}: {len(v)}")
    for item in v[:3]:
        print(f"   [{item[0]}] {item[1]}: {item[2]}")
