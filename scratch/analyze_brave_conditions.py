import sqlite3, re

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()
c.execute("SELECT name, effect FROM cards WHERE type='Brave'")
rows = c.fetchall()
has_brave_kw = 0
has_when_braved = 0
has_condition_kw = 0
samples_with_condition = []
samples_without_condition = []

for name, eff in rows:
    eff_lower = eff.lower()
    if 'brave' in eff_lower or 'braved' in eff_lower:
        has_brave_kw += 1
    if '[when braved]' in eff_lower or '[during brave]' in eff_lower:
        has_when_braved += 1
    if 'condition' in eff_lower or 'cost ' in eff_lower or '合体' in eff:
        has_condition_kw += 1
        if len(samples_with_condition) < 5:
            samples_with_condition.append((name, eff[:150]))
    else:
        if len(samples_without_condition) < 5:
            samples_without_condition.append((name, eff[:150]))

print(f"Total Braves: {len(rows)}")
print(f"Has 'brave' in effect: {has_brave_kw}")
print(f"Has '[When Braved]' or '[During Brave]': {has_when_braved}")
print(f"Has condition-like text: {has_condition_kw}")
print("\nSamples with condition-like text:")
for s in samples_with_condition:
    print(s[0], "->", repr(s[1]))
print("\nSamples without condition-like text:")
for s in samples_without_condition:
    print(s[0], "->", repr(s[1]))
