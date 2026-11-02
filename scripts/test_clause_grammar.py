import sys
sys.stdout.reconfigure(encoding='utf-8')
import json
import re

with open('data/cards_detailed.json', encoding='utf-8') as f:
    cards = json.load(f)

# Connectors:
# 1. "Then,"
# 2. "After this effect resolves,"
# 3. "By doing so," / "When you've done so,"
# 4. "Or,"
# 5. "Also,"
# 6. "instead,"
# 7. "If ...,"

actions_count = {
    'draw': 0,
    'core_void': 0,
    'core_reserve': 0,
    'core_trash': 0,
    'destroy_bp': 0,
    'destroy_cost': 0,
    'destroy_direct': 0,
    'bp_boost': 0,
    'refresh': 0,
    'exhaust': 0,
    'bounce_hand': 0,
    'bounce_deck': 0,
    'mill_decktop': 0,
    'reveal_decktop': 0,
    'summon_free': 0,
    'cannot_be_blocked': 0,
    'cannot_block': 0,
    'cannot_refresh': 0,
    'cannot_attack': 0,
    'counter_plus': 0,
    'burst_lock': 0,
    'armor': 0
}

connectors_count = {
    'then': 0,
    'after_resolves': 0,
    'by_doing': 0,
    'or': 0,
    'also': 0,
    'instead': 0,
    'you_can': 0
}

total_clauses = 0

for c in cards.values():
    e = c.get('effect') or ''
    if not e:
        continue
    e_low = e.lower()
    
    for c_k in connectors_count:
        if c_k == 'then' and 'then,' in e_low:
            connectors_count['then'] += 1
        elif c_k == 'after_resolves' and 'after this effect resolves' in e_low:
            connectors_count['after_resolves'] += 1
        elif c_k == 'by_doing' and ('by doing so' in e_low or "when you've done so" in e_low):
            connectors_count['by_doing'] += 1
        elif c_k == 'or' and ('. or,' in e_low or ' or, ' in e_low):
            connectors_count['or'] += 1
        elif c_k == 'also' and 'also,' in e_low:
            connectors_count['also'] += 1
        elif c_k == 'instead' and 'instead,' in e_low:
            connectors_count['instead'] += 1
        elif c_k == 'you_can' and 'you can' in e_low:
            connectors_count['you_can'] += 1
            
    # Sample basic actions
    if 'draw' in e_low:
        actions_count['draw'] += 1
    if 'from the void' in e_low or 'from void' in e_low:
        actions_count['core_void'] += 1
    if 'destroy' in e_low and 'bp' in e_low:
        actions_count['destroy_bp'] += 1
    elif 'destroy' in e_low and 'cost' in e_low:
        actions_count['destroy_cost'] += 1
    elif 'destroy' in e_low:
        actions_count['destroy_direct'] += 1
    if re.search(r'\+\d+\s*bp', e_low):
        actions_count['bp_boost'] += 1
    if 'refresh' in e_low:
        actions_count['refresh'] += 1
    if 'exhaust' in e_low:
        actions_count['exhaust'] += 1
    if 'return' in e_low and 'hand' in e_low:
        actions_count['bounce_hand'] += 1
    if 'return' in e_low and 'deck' in e_low:
        actions_count['bounce_deck'] += 1
    if 'counter' in e_low and ('+' in e_low or 'add' in e_low):
        actions_count['counter_plus'] += 1

print("Grammar connectors observed in cards:")
for k, v in connectors_count.items():
    print(f"  {k:15s}: {v}")

print("\nCommon action verbs observed in cards:")
for k, v in actions_count.items():
    print(f"  {k:20s}: {v}")
