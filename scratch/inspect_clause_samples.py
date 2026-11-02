import sqlite3, re, sys, os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), 'scratch'))
from test_parser_upgrade import parse_card_effects

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()
c.execute("SELECT name, type, effect FROM cards WHERE effect IS NOT NULL AND length(trim(effect)) > 5")
rows = c.fetchall()

keywords = ["put a core from", "you can return an", "destroy any number", "target an opposing", "summon this card without", "your counter +"]

samples = {k: [] for k in keywords}

for name, ctype, eff in rows:
    p = parse_card_effects(name, ctype, eff)
    if not p:
        lower = eff.lower()
        for k in keywords:
            if k in lower and len(samples[k]) < 3:
                # Find line
                for l in eff.split('\n'):
                    if k in l.lower():
                        samples[k].append((name, l.strip()))

for k, list_s in samples.items():
    print(f"=== Keyword: '{k}' ===")
    for name, line in list_s:
        print(f"  [{name}]: {line}")
    print()
