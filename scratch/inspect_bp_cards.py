import sqlite3, re, sys
sys.stdout.reconfigure(encoding='utf-8')

conn = sqlite3.connect('battle_spirits.db')
cursor = conn.cursor()

cursor.execute("SELECT count(*) FROM cards")
total = cursor.fetchone()[0]
print(f"Total cards in battle_spirits.db: {total}")

cursor.execute("SELECT card_number, name, effect FROM cards WHERE effect IS NOT NULL")
rows = cursor.fetchall()

when_attacks_bp = []
when_blocks_bp = []
when_battles_bp = []
during_battle = []

for num, name, eff in rows:
    if not eff: continue
    if re.search(r'\(when attacks\)[^\.\n]*?(?:gets?|gains?|\+)\s*\d+[\s]*bp', eff, re.I):
        when_attacks_bp.append((num, name, eff[:90].replace('\n', ' ')))
    if re.search(r'\(when blocks\)[^\.\n]*?(?:gets?|gains?|\+)\s*\d+[\s]*bp', eff, re.I):
        when_blocks_bp.append((num, name, eff[:90].replace('\n', ' ')))
    if re.search(r'\(when battles\)[^\.\n]*?(?:gets?|gains?|\+)\s*\d+[\s]*bp', eff, re.I):
        when_battles_bp.append((num, name, eff[:90].replace('\n', ' ')))
    if re.search(r'during this battle', eff, re.I):
        during_battle.append((num, name, eff[:90].replace('\n', ' ')))

print(f"Cards with '(When Attacks) +BP': {len(when_attacks_bp)}")
print(f"Cards with '(When Blocks) +BP': {len(when_blocks_bp)}")
print(f"Cards with '(When Battles) +BP': {len(when_battles_bp)}")
print(f"Cards with 'During this battle': {len(during_battle)}")

print("\nSample (When Attacks) +BP cards:")
for item in when_attacks_bp[:10]:
    print(f"  [{item[0]}] {item[1]}: {item[2]}")

print("\nSample (When Blocks) +BP cards:")
for item in when_blocks_bp[:5]:
    print(f"  [{item[0]}] {item[1]}: {item[2]}")

print("\nSample (When Battles) +BP cards:")
for item in when_battles_bp[:5]:
    print(f"  [{item[0]}] {item[1]}: {item[2]}")
