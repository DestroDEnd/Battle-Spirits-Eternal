import sqlite3
import re

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()
c.execute("SELECT name, effect FROM cards WHERE effect LIKE '%Advent%' OR effect LIKE '%煌臨%' LIMIT 50")
rows = c.fetchall()

def parse_advent_timing(effect):
    # Match timing in double or single parentheses or Japanese brackets right before or after Advent
    m = re.search(r'(?:\[Advent:[^\]]+\]|【煌臨:[^】]+】)\s*(?:\(?\s*\(([^)]+)\)\)?|\(([^)]+)\)|『([^』]+)』)', effect, re.I)
    if not m:
        # Check if timing appears right before [Advent: ...] or 【煌臨: ...】
        m_before = re.search(r'(?:\(?\s*\(([^)]+)\)\)?|\(([^)]+)\)|『([^』]+)』)\s*(?:\[Advent:|【煌臨:)', effect, re.I)
        if m_before:
            raw = (m_before.group(1) or m_before.group(2) or m_before.group(3) or '').strip().lower()
        else:
            raw = ''
    else:
        raw = (m.group(1) or m.group(2) or m.group(3) or '').strip().lower()

    if 'your main step' in raw:
        return 'your_main_step', 'Your Main Step'
    if 'your attack step' in raw or 'your turn' in raw:
        return 'your_attack_step', 'Your Attack Step'
    if 'opposing attack step' in raw or "opponent's attack step" in raw or '相手のアタックステップ' in raw:
        return 'opposing_attack_step', "Opponent's Attack Step"
    if 'start of either attack step' in raw:
        return 'start_either_attack_step', 'Start of Either Attack Step'
    if 'start of your attack step' in raw:
        return 'start_your_attack_step', 'Start of Your Attack Step'
    # Default Rule 10-2-5: Either Attack Step
    return 'either_attack_step', 'Either Attack Step'

for name, effect in rows:
    t, label = parse_advent_timing(effect)
    print(f"{name}: {label}")
