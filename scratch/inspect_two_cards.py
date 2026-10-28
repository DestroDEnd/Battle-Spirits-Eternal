import sqlite3

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()
for name in ['The MakaiKnight Shazworth', "Purple Flash's Extreme"]:
    c.execute('SELECT name, type, cost, effect FROM cards WHERE name LIKE ?', (f'%{name}%',))
    for r in c.fetchall():
        print('=== ' + r[0] + ' (' + r[1] + ') ===')
        print(r[3])
        print()
