import re

def word_to_num(w):
    mapping = {'a': 1, 'an': 1, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10}
    return mapping.get(str(w).lower(), int(w) if str(w).isdigit() else 1)

test_sentences = [
    "Discard three cards from your decktop",
    "Discard 3 cards from your decktop",
    "send three cards from your decktop to the trash",
    "Send a card from your decktop to the Trash",
    "Discard up to three cards from your decktop",
    "Discard two cards from opposing decktop",
    "Discard 4 cards from the opposing decktop",
    "send two cards from the opposing decktop to the trash",
    "Send three cards from the top of your deck to the trash"
]

pattern = r'(?:you can\s+)?(?:discard|send)\s+(?:up to\s+)?(a|an|one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+cards?\s+(?:but\s+up\s+to\s+as\s+many\s+as\s+possible\s+)?from\s+(?:the\s+|your\s+)?(?:top\s+of\s+(?:your\s+|the\s+)?)?(opposing\s+)?deck(?:top)?(?:\s+to\s+(?:the\s+)?trash)?'

for s in test_sentences:
    m = re.search(pattern, s, re.I)
    if m:
        cnt = word_to_num(m.group(1))
        is_opp = bool(m.group(2)) or 'opposing' in s.lower()
        target = 'opponent' if is_opp else 'self'
        print(f"MATCH: '{s}' -> count={cnt}, target={target}")
    else:
        print(f"NO MATCH: '{s}'")
