import sqlite3, sys, re
from collections import Counter
sys.stdout.reconfigure(encoding='utf-8')

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()

c.execute("SELECT name, type, color, cost, effect FROM cards WHERE effect IS NOT NULL AND trim(effect) != ''")
cards = c.fetchall()
print(f'Total cards with effect: {len(cards)}')

# 1. Timings & Triggers
timings = Counter()
keywords = Counter()
actions = Counter()

# Common keywords list in Battle Spirits
known_keywords = [
    'Advent', 'Burst', 'Flash', 'Mirage', 'Armor', 'Heavy Armor', 'Ultra Armor',
    'Rebirth', 'Clash', 'Curse', 'Crush', 'Great Crush', 'Immortal', 'Confront',
    'Charge', 'Rush', 'Soul Core', 'Awaken', 'Icewall', 'Consecutive Attack',
    'Grand Skill', 'Grand Field', 'Twinkle', 'Twinkle Necromancy', 'Brave',
    'Selection', 'Holy Life', 'Bloodthirsty', 'Suppression', 'Draw', 'Refresh',
    'Exhaust', 'Destroy', 'Void', 'Reserve', 'Trash', 'Life'
]

for name, ctype, color, cost, eff in cards:
    # Find bracketed patterns
    brackets = re.findall(r'\[([^\]]+)\]', eff)
    for b in brackets:
        b_clean = b.strip()
        if re.match(r'^(LV\d+)+$', b_clean):
            continue
        if b_clean.startswith('Burst:'):
            timings['[Burst]'] += 1
        elif b_clean.startswith('Advent:'):
            timings['[Advent]'] += 1
        elif b_clean.startswith('Mirage:'):
            timings['[Mirage]'] += 1
        elif b_clean.startswith('When '):
            timings[f'[{b_clean}]'] += 1
        elif 'At the ' in b_clean or 'During ' in b_clean:
            timings[f'[{b_clean}]'] += 1
        else:
            keywords[f'[{b_clean}]'] += 1

print('\n=== Top 25 Timings / Triggers across 14k+ cards ===')
for k, v in timings.most_common(25):
    print(f'  {k}: {v}')

print('\n=== Top 25 Bracketed Keywords across 14k+ cards ===')
for k, v in keywords.most_common(25):
    print(f'  {k}: {v}')

# Effect Action Patterns
patterns = {
    'Core Boost (from Void to Reserve/Spirit)': r'(?:take|put|send|place|add)\s+(?:\d+|one|two|three|\w+)?\s*cores?\s+(?:from\s+(?:the\s+)?void)?\s+to\s+(?:your\s+)?(?:reserve|spirit|field)',
    'Draw Cards': r'draw\s+(?:\d+|one|two|three|\w+)?\s*cards?',
    'Destroy Opposing Spirit': r'destroy\s+(?:any\s+|an\s+|one\s+|all\s+|\d+\s+)?(?:opposing|target|exhausted|depleted)?\s*(?:spirit|brave|nexus|ultimate)',
    'Core Removal / Depletion': r'(?:send|move|remove|put)\s+(?:\d+|one|two|three|\w+)?\s*cores?\s+(?:from\s+(?:an?\s+)?opposing|from\s+all\s+opposing|on\s+an?\s+opposing)\s*(?:spirit|brave|nexus)?\s*(?:to\s+(?:their|the|reserve|trash))',
    'Return to Hand/Deck': r'return\s+(?:an?\s+|one\s+|all\s+|\d+\s+)?(?:opposing|spirit|magic|card)\s+to\s+(?:the\s+)?(?:hand|deck|top\s+of\s+the\s+deck|bottom\s+of\s+the\s+deck)',
    'BP Boost': r'(?:gets?|gains?)\s*\+\d+000\s*BP',
    'Exhaust Opponent': r'exhaust\s+(?:an?\s+|one\s+|all\s+|\d+\s+)?(?:opposing\s+)?spirit',
    'Refresh Spirit': r'refresh\s+(?:this|one|all|\d+)?\s*spirit',
    'Extra Symbol Grant': r'(?:gets?|gains?|has)\s+(?:an?\s+extra|one\s+more|\d+)\s*(?:red|white|purple|green|yellow|blue)?\s*symbols?',
    'Life Damage / Burn': r'(?:send|move|decrease|reduce)\s+(?:\d+|one|two)?\s*(?:core|cores|life)\s+from\s+(?:the\s+opposing|your\s+opponent\'?s?)\s*life',
    'Life Recovery': r'(?:send|move|take|put)\s+(?:\d+|one|two)?\s*cores?\s+(?:from\s+(?:your\s+)?(?:void|reserve|trash))\s+to\s+(?:your\s+)?life',
    'Trash Reanimation / Retrieval': r'(?:summon|reanimate|return|put)\s+(?:an?\s+|one\s+|\d+\s+)?(?:spirit|magic|card)\s+(?:from\s+(?:your\s+)?trash)'
}

print('\n=== Major Action Archetypes across 14k+ cards ===')
action_counts = {}
for pat_name, regex in patterns.items():
    cnt = sum(1 for _, _, _, _, eff in cards if re.search(regex, eff, re.IGNORECASE))
    action_counts[pat_name] = cnt
    print(f'  {pat_name}: {cnt} cards ({cnt/len(cards)*100:.1f}%)')
