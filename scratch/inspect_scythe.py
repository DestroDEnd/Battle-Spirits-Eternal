import sqlite3

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()
c.execute("SELECT name, cost, type, color, symbol, levels, effect FROM cards WHERE name LIKE '%PoisonSnakeScythe%'")
row = c.fetchone()
if row:
    print('Found:')
    print('Name:', row[0])
    print('Cost:', row[1])
    print('Type:', row[2])
    print('Color:', row[3])
    print('Symbol:', row[4])
    print('Levels:', repr(row[5]))
    print('Effect:\n', row[6])
else:
    print('Not found with PoisonSnakeScythe')
