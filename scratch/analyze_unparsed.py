import sqlite3, re, sys, os
from collections import Counter

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), 'scratch'))
from test_parser_upgrade import parse_card_effects

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()
c.execute("SELECT name, type, effect FROM cards WHERE effect IS NOT NULL AND length(trim(effect)) > 5")
rows = c.fetchall()

unparsed_clauses = Counter()
for name, ctype, eff in rows:
    p = parse_card_effects(name, ctype, eff)
    if not p:
        lines = eff.split('\n')
        for l in lines:
            l = l.strip()
            # extract phrases
            for sent in re.split(r'[\.;]\s*', l):
                sent_clean = ' '.join(re.sub(r'\[[^\]]+\]|\([^\)]+\)', '', sent).split()).lower()
                if len(sent_clean) > 10:
                    words = sent_clean.split()
                    if len(words) >= 3:
                        unparsed_clauses[' '.join(words[:4])] += 1

print("Top unparsed clause starts:")
for k, v in unparsed_clauses.most_common(40):
    print(f"{v:4d} : {k}")
