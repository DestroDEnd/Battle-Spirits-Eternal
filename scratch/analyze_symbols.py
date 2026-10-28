import sqlite3
import re

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()

# 1. Distinct symbol values
c.execute("SELECT DISTINCT symbol FROM cards WHERE symbol IS NOT NULL AND symbol != ''")
distinct_symbols = [r[0] for r in c.fetchall()]
print(f"Total distinct symbol strings: {len(distinct_symbols)}")
print("Sample distinct symbols:")
for s in distinct_symbols[:25]:
    print(" ", repr(s))

# 2. Check cards with multiple symbols
c.execute("SELECT name, symbol, color, effect FROM cards WHERE symbol IS NOT NULL")
multi_symbol_cards = []
for name, sym, col, eff in c.fetchall():
    # count symbols in sym string (e.g. "Red, Red", "Red / White", "2", "Red, Red, Red", etc.)
    tokens = [t.strip() for t in re.split(r'[,/]', sym) if t.strip()]
    if len(tokens) > 1 or any(c.isdigit() and int(c) > 1 for c in sym) or 'double' in sym.lower():
        multi_symbol_cards.append((name, sym, len(tokens)))

print(f"\nCards with naturally multiple symbols: {len(multi_symbol_cards)}")
for name, sym, cnt in multi_symbol_cards[:10]:
    print(f"  {name:40s} | Symbol: {sym} ({cnt} symbols)")

# 3. Cards that give additional symbols to itself or others
c.execute("SELECT name, effect FROM cards WHERE effect LIKE '%additional symbol%' OR effect LIKE '%additional % symbol%' OR effect LIKE '%more symbol%' OR effect LIKE '%gets +1 symbol%' OR effect LIKE '%gain%symbol%' OR effect LIKE '%シンボル%追加%'")
eff_symbol_cards = c.fetchall()
print(f"\nCards granting additional symbols: {len(eff_symbol_cards)}")
for name, eff in eff_symbol_cards[:10]:
    m = re.search(r'([^.\n]*?(?:additional|more|\+1)\s*(?:[a-zA-Z]+\s*)?symbols?[^.\n]*)', eff, re.I)
    summary = m.group(1).strip() if m else eff[:80]
    print(f"  {name:40s} | {summary}")

conn.close()
