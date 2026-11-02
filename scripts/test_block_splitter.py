import sys
sys.stdout.reconfigure(encoding='utf-8')
import json
import re

with open('data/cards_detailed.json', encoding='utf-8') as f:
    cards = json.load(f)

print(f"Analyzing ability blocks across {len(cards)} cards...")

# Regex for block splitting: matches [LV...], [During ...], [Flash], [Main], [Burst: ...], etc.
block_header_re = re.compile(
    r'(?:^|\n\s*\n|\n)(?='
    r'\[(?:LV\s*\d|During|When|Contract|Soul State|Flash|Main|Burst|Summon Condition|Team|Song|Mirage|Accel|A\.T\.|Grand|Rebirth)'
    r'|Flash\s*[-–]'
    r'|\(When\s+'
    r')',
    re.I
)

total_blocks = 0
block_types = {}

for cno, c in cards.items():
    effect = (c.get('effect') or '').strip()
    if not effect or c.get('is_vanilla'):
        continue
    chunks = block_header_re.split(effect)
    for ch in chunks:
        ch = ch.strip()
        if not ch:
            continue
        total_blocks += 1
        # extract header
        m = re.match(r'^(\[[^\]]+\](?:\s*\[[^\]]+\])*|\([^\)]+\)|Flash\s*[-–]\s*\[[^\]]+\]|Flash\s*[-–]|Main\s*[-–])', ch, re.I)
        h = m.group(1).strip() if m else 'PASSIVE_NO_HEADER'
        # normalize
        h_norm = re.sub(r'\[LV\d+\]', '[LV]', h)
        block_types[h_norm] = block_types.get(h_norm, 0) + 1

print(f"Total non-vanilla ability blocks found: {total_blocks}")
print(f"Top 30 block headers:")
sorted_h = sorted(block_types.items(), key=lambda x: x[1], reverse=True)
for h, cnt in sorted_h[:30]:
    print(f"  {cnt:5d}: {h}")
