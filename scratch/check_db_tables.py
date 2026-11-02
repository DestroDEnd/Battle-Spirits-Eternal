import sqlite3, glob
print("DB files:", glob.glob('*.db'))
for db_file in glob.glob('*.db'):
    conn = sqlite3.connect(db_file)
    tables = [r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
    print(f"{db_file} tables:", tables)
    if 'cards' in tables:
        for name in ['Curse of Hades', 'Bomburst', 'The NetherCorp Ajaccio', 'Camelot-Pawn']:
            res = conn.execute("SELECT name, image_url FROM cards WHERE name LIKE ?", (f'%{name}%',)).fetchall()
            print(f"  {name}:", res)
