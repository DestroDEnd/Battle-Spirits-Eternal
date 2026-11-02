with open('scratch/nlp_card_effect_engine.py', 'r', encoding='utf-8') as f:
    text = f.read()

with open('scratch/nlp_card_effect_engine_clean.txt', 'w', encoding='utf-8') as out:
    out.write(text)

print('Clean copy saved, total length:', len(text))
