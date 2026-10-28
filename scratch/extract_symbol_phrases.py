import sqlite3, re, sys

sys.stdout.reconfigure(encoding='utf-8')
conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()

c.execute("SELECT name, effect FROM cards WHERE effect LIKE '%symbol%' OR effect LIKE '%シンボル%'")
rows = c.fetchall()

phrases = set()
for name, eff in rows:
    # Find sentences or clauses containing symbol
    sentences = re.split(r'[\.\n。]', eff)
    for s in sentences:
        if ('additional' in s.lower() or 'extra' in s.lower() or 'more' in s.lower() or '+1' in s or '+2' in s or 'two' in s.lower() or 'three' in s.lower() or '追加' in s) and ('symbol' in s.lower() or 'シンボル' in s):
            s_clean = s.strip()
            if len(s_clean) < 140:
                phrases.add(s_clean)

print(f"Total matching symbol phrasing clauses: {len(phrases)}")
for p in sorted(list(phrases))[:30]:
    print("  *", p)

conn.close()
