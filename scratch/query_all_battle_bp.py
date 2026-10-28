import sqlite3, sys, re
sys.stdout.reconfigure(encoding='utf-8')

conn = sqlite3.connect('battle_spirits.db')
conn.row_factory = sqlite3.Row
c = conn.cursor()
c.execute("SELECT card_number, name, color, type, effect FROM cards WHERE effect LIKE '%BP%'")
rows = c.fetchall()

when_attacks_bp = []
when_blocks_bp = []
during_battle_bp = []

for r in rows:
    eff = r['effect'] or ''
    if re.search(r'\(When Attacks[^\)]*\)[^\.]*?(?:gains|gets|\+)\s*\d+[\s]*BP', eff, re.IGNORECASE) or re.search(r'『このスピリットのアタック時』[^\.]*?BP\+\d+', eff):
        when_attacks_bp.append((r['card_number'], r['name'], eff))
    if re.search(r'\(When Blocks[^\)]*\)[^\.]*?(?:gains|gets|\+)\s*\d+[\s]*BP', eff, re.IGNORECASE) or re.search(r'『このスピリットのブロック時』[^\.]*?BP\+\d+', eff):
        when_blocks_bp.append((r['card_number'], r['name'], eff))
    if re.search(r'During this battle[^\.]*?(?:gains|gets|\+)\s*\d+[\s]*BP', eff, re.IGNORECASE):
        during_battle_bp.append((r['card_number'], r['name'], eff))

print(f"Total cards in DB with When Attacks BP boost: {len(when_attacks_bp)}")
print(f"Total cards in DB with When Blocks BP boost: {len(when_blocks_bp)}")
print(f"Total cards in DB with During this battle BP boost: {len(during_battle_bp)}")
print(f"Total matching: {len(when_attacks_bp) + len(when_blocks_bp) + len(during_battle_bp)}")
