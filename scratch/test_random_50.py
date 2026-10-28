import sqlite3, sys, re

sys.stdout.reconfigure(encoding='utf-8')
conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()

c.execute("SELECT id, name, cost, type, effect FROM cards WHERE effect IS NOT NULL AND length(trim(effect)) > 15 ORDER BY RANDOM() LIMIT 50")
rows = c.fetchall()

timing_regexes = {
    'SUMMON': r'\(When Summoned(?:[^)]*)\)|\(When [^)]*\/Summoned(?:[^)]*)\)|\(When Summoned\/[^\)]*\)',
    'ATTACK': r'\(When Attacks(?:[^)]*)\)|\(When [^)]*\/Attacks(?:[^)]*)\)|\(When Battles(?:[^)]*)\)|\(When Brave Attacks(?:[^)]*)\)',
    'BLOCK': r'\(When Blocks(?:[^)]*)\)|\(When Attacks\/Blocks(?:[^)]*)\)|\(When Battles(?:[^)]*)\)',
    'DESTROYED': r'\(When (?:(?:Depleted\/)?Destroyed(?:[^)]*)|[^)]*\/Destroyed(?:[^)]*))\)',
    'ADVENT': r'\(When Advents(?:[^)]*)\)|\(When [^)]*\/Advents(?:[^)]*)\)|\(When Advents\/[^\)]*\)',
    'BURST': r'\[Burst:',
    'FLASH': r'Flash -|\[Flash\]',
    'MIRAGE': r'\[Mirage:'
}

action_regexes = {
    'Destroy Opposing Spirit': r'destroy\s+(?:an?|one|all|\d+)?\s*(?:opposing|exhausted|depleted)?\s*(?:spirit|ultimate|brave)',
    'Core Removal (Deplete)': r'send\s+(?:up to\s+)?(?:\d+|a|an|one|two|three|\w+)?\s*cores?\s+from.*?to\s+the\s+(?:reserve|trash)',
    'Core Boost (Void)': r'cores?\s+from\s+(?:the\s+)?void\s+to\s+(?:this\s+spirit|your\s+reserve|your\s+life)',
    'Draw Card': r'draw\s+(?:\d+|a|an|one|two|three|\w+)?\s*cards?',
    'Exhaust Opponent': r'exhaust\s+(?:an?|one|all|\d+)?\s*(?:opposing\s+)?spirit',
    'Refresh Spirit': r'refresh\s+(?:this|an?|one|all|\d+)?\s*spirit',
    'Bounce to Hand/Deck': r'return\s+(?:an?|one|all|\d+)?\s*(?:opposing\s+)?spirit.*?to\s+(?:the\s+)?(?:hand|deck)',
    'BP Boost': r'(?:gets?|gains?)\s*\+\d+000\s*BP',
    'Unblockable': r'(?:can\'t|cannot)\s+be\s+blocked'
}

matched_timings = 0
matched_actions = 0

for cid, name, cost, ctype, eff in rows:
    card_timings = [t for t, pat in timing_regexes.items() if re.search(pat, eff, re.I)]
    card_actions = [a for a, pat in action_regexes.items() if re.search(pat, eff, re.I)]
    if card_timings:
        matched_timings += 1
    if card_actions:
        matched_actions += 1

print(f"Sample of 50 cards with effects:")
print(f"Cards with identifiable timing triggers: {matched_timings} / 50 ({matched_timings*2}%)")
print(f"Cards with identifiable action archetypes: {matched_actions} / 50 ({matched_actions*2}%)")
