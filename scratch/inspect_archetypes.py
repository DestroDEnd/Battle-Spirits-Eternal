import sqlite3

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()

# Search for Duke Kingtaurus
c.execute("SELECT name, cost, color, levels, effect FROM cards WHERE name LIKE '%Kingtaurus%'")
rows = c.fetchall()
print("--- KINGTAURUS IN DB ---")
for r in rows:
    print(r[0], '| Cost:', r[1], '| Color:', r[2])
    print("Levels:", r[3])
    print("Effect:\n", r[4])
    print("-" * 50)

# Search for other notable X-Rares or cards with When Summoned void core ramp
c.execute("SELECT name, effect FROM cards WHERE effect LIKE '%(When Summoned)%' AND effect LIKE '%from the Void%' LIMIT 5")
print("\n--- SAMPLE (WHEN SUMMONED) VOID CORE CARDS ---")
for r in c.fetchall():
    print(r[0], ":\n", r[1][:140])
    print("-" * 30)

# Search for cards with BP comparison
c.execute("SELECT name, effect FROM cards WHERE effect LIKE '%BP comparison%' LIMIT 5")
print("\n--- SAMPLE BP COMPARISON CARDS ---")
for r in c.fetchall():
    print(r[0], ":\n", r[1][:140])
    print("-" * 30)
