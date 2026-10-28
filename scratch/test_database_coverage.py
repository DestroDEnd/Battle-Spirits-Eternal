import sqlite3
import re

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()
c.execute("SELECT name, effect FROM cards WHERE effect IS NOT NULL AND effect != ''")
cards = c.fetchall()

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

word_to_num = {'a': 1, 'an': 1, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5}

def parse_num(val_str):
    if not val_str:
        return 1
    val_str = val_str.lower().strip()
    if val_str.isdigit():
        return int(val_str)
    return word_to_num.get(val_str, 1)

matched_summoned = 0
matched_attacks = 0
matched_bp_comp = 0

for name, eff in cards:
    # 1. When Summoned
    m_sum = re.search(r'((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+)?\s*\(When Summoned\)\s*([\s\S]*?)(?=\n\s*\n|\[LV|$)', eff, re.I)
    if m_sum:
        matched_summoned += 1

    # 2. When Attacks
    m_att = re.search(r'((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+)?\s*\(When Attacks\)\s*([\s\S]*?)(?=\n\s*\n|\[LV|$)', eff, re.I)
    if m_att:
        matched_attacks += 1

    # 3. BP comparison
    if 'bp comparison' in eff.lower():
        matched_bp_comp += 1

print(f"Total cards analyzed: {len(cards)}")
print(f"Cards with (When Summoned): {matched_summoned}")
print(f"Cards with (When Attacks): {matched_attacks}")
print(f"Cards with BP Comparison: {matched_bp_comp}")
