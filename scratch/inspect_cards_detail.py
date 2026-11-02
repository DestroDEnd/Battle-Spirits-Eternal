import sqlite3, sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()
names = [
    "The DestroyerDragonEmperor Siegfried-Rudra",
    "Blizzard Wall",
    "50th Kamen Rider Geiz",
    "Cupid"
]
for n in names:
    c.execute("SELECT name, type, effect FROM cards WHERE name = ?", (n,))
    row = c.fetchone()
    if row:
        print(f"=== {row[0]} ({row[1]}) ===")
        print(row[2])
        print()
