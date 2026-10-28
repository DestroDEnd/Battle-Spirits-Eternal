with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

idx_main = text.find('duel-battlefield-main')
print("--- Top of duel-battlefield-main ---")
print(text[idx_main:idx_main+400])

idx_hub = text.find('burstCenterTurnSlot')
print("\n--- burstCenterTurnSlot ---")
print(text[idx_hub-100:idx_hub+400])
