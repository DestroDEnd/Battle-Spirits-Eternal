import sqlite3

conn = sqlite3.connect('battle_spirits.db')
cursor = conn.cursor()

# Check Hell Contract cards
cursor.execute("SELECT name, card_number, family, type, color, cost FROM cards WHERE family LIKE '%Hell Contract%'")
rows = cursor.fetchall()
print(f"Hell Contract cards in battle_spirits.db ({len(rows)}):")
for r in rows:
    print(r)

# Check Javad
cursor.execute("SELECT name, card_number, family, type, color, cost FROM cards WHERE name LIKE '%Javad%'")
rows2 = cursor.fetchall()
print(f"\nJavad cards in battle_spirits.db ({len(rows2)}):")
for r in rows2:
    print(r)

# Check SD65 cards
cursor.execute("SELECT name, card_number, family, type, color, cost FROM cards WHERE card_number LIKE '%SD65%'")
rows3 = cursor.fetchall()
print(f"\nSD65 cards in battle_spirits.db ({len(rows3)}):")
for r in rows3:
    print(r)

# Check cards where kanji includes ジャバド
cursor.execute("SELECT name, card_number, kanji, family, type, color, cost FROM cards WHERE kanji LIKE '%ジャバド%'")
rows4 = cursor.fetchall()
print(f"\nCards with ジャバド in kanji ({len(rows4)}):")
for r in rows4:
    print(r)
