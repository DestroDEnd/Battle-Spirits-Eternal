import sqlite3
import re

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()

c.execute("SELECT name, cost, type, effect FROM cards WHERE type='Spirit' AND effect IS NOT NULL")
spirits = c.fetchall()

def parse_levels(tag_str):
    if not tag_str:
        return [1, 2, 3]
    matches = re.findall(r'\[LV(\d+)\]', tag_str, re.I)
    if matches:
        return [int(m) for m in matches]
    m_range = re.search(r'LV(\d+)[-~]LV(\d+)', tag_str, re.I)
    if m_range:
        return list(range(int(m_range.group(1)), int(m_range.group(2)) + 1))
    m_single = re.search(r'LV(\d+)', tag_str, re.I)
    if m_single:
        return [int(m_single.group(1))]
    return [1, 2, 3]

count_when_summoned_actions = 0
count_when_attacks_actions = 0
count_bp_comparison_actions = 0

sample_summoned = []
sample_attacks = []
sample_bp_comp = []

for name, cost, ctype, eff in spirits:
    # 1. When Summoned
    m_sum = re.search(r'((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+)?\s*\(When Summoned\)\s*([\s\S]*?)(?=\n\s*\n|\[LV|$)', eff, re.I)
    if m_sum:
        body = m_sum.group(2).lower()
        if any(kw in body for kw in ['put a core from the void', 'put two cores from the void', 'draw', 'destroy', 'exhaust', 'return', 'send a core']):
            count_when_summoned_actions += 1
            if len(sample_summoned) < 5:
                sample_summoned.append((name, m_sum.group(1), m_sum.group(2).strip()[:80]))

    # 2. When Attacks
    m_att = re.search(r'((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+)?\s*\(When Attacks\)\s*([\s\S]*?)(?=\n\s*\n|\[LV|$)', eff, re.I)
    if m_att:
        body = m_att.group(2).lower()
        if any(kw in body for kw in ['gains +', 'gets +', 'draw', 'destroy', 'exhaust', 'put a core', 'bp comparison']):
            count_when_attacks_actions += 1
            if len(sample_attacks) < 5:
                sample_attacks.append((name, m_att.group(1), m_att.group(2).strip()[:80]))

    # 3. BP comparison
    if 'bp comparison' in eff.lower():
        count_bp_comparison_actions += 1
        if len(sample_bp_comp) < 5:
            sample_bp_comp.append((name, eff[:100]))

print(f"Total Spirits analyzed: {len(spirits)}")
print(f"Spirits with executable When Summoned action: {count_when_summoned_actions}")
print(f"Spirits with executable When Attacks action: {count_when_attacks_actions}")
print(f"Spirits with BP Comparison: {count_bp_comparison_actions}")

print("\n--- SAMPLE WHEN SUMMONED MATCHES ---")
for s in sample_summoned:
    print(f"{s[0]} ({s[1]}): {ascii(s[2])}")

print("\n--- SAMPLE WHEN ATTACKS MATCHES ---")
for s in sample_attacks:
    print(f"{s[0]} ({s[1]}): {ascii(s[2])}")

print("\n--- SAMPLE BP COMPARISON MATCHES ---")
for s in sample_bp_comp:
    print(f"{s[0]}: {ascii(s[1])}")
