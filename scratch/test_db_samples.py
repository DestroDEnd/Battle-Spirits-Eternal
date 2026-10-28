import sqlite3, sys, re

sys.stdout.reconfigure(encoding='utf-8')
conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()

# Query cards that have various effects
queries = [
    ("When Summoned with Core Boost", "SELECT name, cost, effect FROM cards WHERE effect LIKE '%(When Summoned)%' AND effect LIKE '%cores from the void%' LIMIT 3"),
    ("When Attacks with Destroy Exhausted", "SELECT name, cost, effect FROM cards WHERE effect LIKE '%(When Attacks)%' AND effect LIKE '%exhausted%spirit%' LIMIT 3"),
    ("When Attacks/Blocks with BP Boost", "SELECT name, cost, effect FROM cards WHERE effect LIKE '%(When Attacks/Blocks)%' AND effect LIKE '%BP%' LIMIT 3"),
    ("When Battles", "SELECT name, cost, effect FROM cards WHERE effect LIKE '%(When Battles)%' LIMIT 3"),
    ("When Destroyed with Draw or Core", "SELECT name, cost, effect FROM cards WHERE effect LIKE '%(When Destroyed)%' LIMIT 3"),
    ("When Destroyed by Opponent", "SELECT name, cost, effect FROM cards WHERE effect LIKE '%(When Destroyed by the Opponent)%' LIMIT 3"),
    ("When Advents/Attacks", "SELECT name, cost, effect FROM cards WHERE effect LIKE '%(When Advents/Attacks)%' LIMIT 3"),
    ("Return to Hand / Deck", "SELECT name, cost, effect FROM cards WHERE effect LIKE '%return%opposing spirit%hand%' OR effect LIKE '%return%opposing spirit%deck%' LIMIT 3")
]

for title, q in queries:
    print(f"\n=== {title} ===")
    c.execute(q)
    for row in c.fetchall():
        name, cost, eff = row
        clean_eff = re.sub(r'\s+', ' ', eff)[:140]
        print(f"  • {name} (Cost {cost}): {clean_eff}...")
