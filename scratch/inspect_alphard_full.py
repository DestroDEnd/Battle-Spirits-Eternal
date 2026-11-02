import sqlite3

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()
c.execute("SELECT name, kanji, jpname, levels, effect, flavor FROM cards WHERE name LIKE '%Alphard%'")
with open('scratch/alphard_full.txt', 'w', encoding='utf-8') as out:
    for r in c.fetchall():
        out.write(f"NAME: {r[0]}\n")
        out.write(f"KANJI: {r[1]}\n")
        out.write(f"JPNAME: {r[2]}\n")
        out.write(f"LEVELS: {repr(r[3])}\n")
        out.write(f"EFFECT:\n{r[4]}\n")
        out.write(f"FLAVOR:\n{r[5]}\n")
        out.write("=" * 50 + "\n")
print("Done writing alphard_full.txt")
