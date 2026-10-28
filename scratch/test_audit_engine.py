import sqlite3, sys, re

sys.stdout.reconfigure(encoding='utf-8')
conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()

def parse_word_number(word):
    word = str(word).lower().strip()
    mapping = {'a': 1, 'an': 1, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6}
    return mapping.get(word, int(word) if word.isdigit() else 1)

def simulate_card_actions(eff_text):
    body = eff_text.lower()
    actions_found = []

    # 1. Destroy exhausted
    if re.search(r'destroy\s+(?:an?|one|all|\d+)?\s*(?:opposing\s+)?exhausted\s+(?:spirit|ultimate)', body):
        actions_found.append('DESTROY_EXHAUSTED')

    # 2. Destroy by BP
    m_bp = re.search(r'destroy\s+(?:an?|one|\d+)?\s*opposing\s+(\d+)\s*bp\s+or\s+less\s+(?:spirit|ultimate)', body)
    if m_bp:
        actions_found.append(f'DESTROY_BP<={m_bp.group(1)}')

    # 3. Destroy by Cost
    m_cost = re.search(r'destroy\s+(?:an?|one|\d+)?\s*opposing\s+(?:cost\s*(\d+)\s*or\s*(less|more)\s+)?(?:spirit|ultimate)', body)
    if m_cost and m_cost.group(1):
        actions_found.append(f'DESTROY_COST_{m_cost.group(2).upper()}_{m_cost.group(1)}')

    # 4. Sacrifice
    if re.search(r'opponent destroys a (?:spirit|ultimate)', body):
        actions_found.append('OPPONENT_SACRIFICE')

    # 5. Core removal / depletion
    m_core = re.search(r'send\s+(?:up to\s+)?(a|an|one|two|three|\d+)\s+cores?\s+from.*?to\s+the\s+(reserve|trash)', body)
    if m_core:
        actions_found.append(f'CORE_DEPLETION_{parse_word_number(m_core.group(1))}_TO_{m_core.group(2).upper()}')

    # 6. Void to this spirit
    m_vthis = re.search(r'put\s+(a|an|one|two|three|\d+)\s+cores?\s+from\s+the\s+void\s+to\s+this\s+spirit', body)
    if m_vthis:
        actions_found.append(f'VOID_TO_THIS_{parse_word_number(m_vthis.group(1))}')

    # 7. Void to reserve
    m_vres = re.search(r'put\s+(a|an|one|two|three|\d+)\s+cores?\s+from\s+the\s+void\s+to\s+(?:your\s+)?reserve', body)
    if m_vres:
        actions_found.append(f'VOID_TO_RESERVE_{parse_word_number(m_vres.group(1))}')

    # 8. Void to life
    m_vlife = re.search(r'put\s+(a|an|one|two|\d+)\s+cores?\s+from\s+(?:the\s+)?(?:void|reserve)\s+to\s+(?:your\s+)?life', body)
    if m_vlife:
        actions_found.append(f'LIFE_RECOVERY_{parse_word_number(m_vlife.group(1))}')

    # 9. Draw cards
    m_draw = re.search(r'draw\s+(a|an|one|two|three|\d+)\s+cards?', body)
    if m_draw:
        actions_found.append(f'DRAW_{parse_word_number(m_draw.group(1))}')

    # 10. Exhaust opposing spirit
    if re.search(r'exhaust\s+(?:an?|one|all|\d+)?\s*(?:opposing\s+)?spirit', body):
        actions_found.append('EXHAUST_OPPONENT')

    # 11. Refresh spirit
    if re.search(r'refresh\s+(?:this|an?|one|all|\d+)?\s*spirit', body):
        actions_found.append('REFRESH_SPIRIT')

    # 12. Bounce to hand
    if re.search(r'return\s+(?:an?|one|all|\d+)?\s*(?:opposing\s+)?spirit.*?to\s+(?:the\s+)?hand', body):
        actions_found.append('BOUNCE_TO_HAND')

    # 13. Bounce to deck
    if re.search(r'return\s+(?:an?|one|all|\d+)?\s*(?:opposing\s+)?spirit.*?to\s+(?:the\s+)?(?:top|bottom\s+of\s+the\s+)?deck', body):
        actions_found.append('BOUNCE_TO_DECK')

    # 14. BP boost
    m_bpboost = re.search(r'(?:gets?|gains?)\s*\+(\d+)\s*bp', body)
    if m_bpboost:
        actions_found.append(f'BP_BOOST_+{m_bpboost.group(1)}')

    # 15. Unblockable
    if re.search(r'(?:can\'t|cannot)\s+be\s+blocked', body):
        actions_found.append('UNBLOCKABLE')

    return actions_found

# Test on 1000 cards with effects across DB
c.execute("SELECT id, name, type, effect FROM cards WHERE effect IS NOT NULL AND length(trim(effect)) > 15 LIMIT 1000")
sample = c.fetchall()

total_actions = 0
cards_with_actions = 0
compound_cards = 0

for _, name, ctype, eff in sample:
    acts = simulate_card_actions(eff)
    if acts:
        cards_with_actions += 1
        total_actions += len(acts)
        if len(acts) > 1:
            compound_cards += 1

print(f"Audit Results on 1,000 DB Cards:")
print(f"Cards with action triggers: {cards_with_actions} / 1000 ({cards_with_actions/10:.1f}%)")
print(f"Total actions identified: {total_actions}")
print(f"Cards with compound (multiple simultaneous) actions: {compound_cards} ({compound_cards/10:.1f}%)")
