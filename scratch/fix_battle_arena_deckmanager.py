with open('battle_arena.js', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('window.DeckManager ? DeckManager.', 'window.DeckManager ? window.DeckManager.')
text = text.replace('if (window.DeckManager) DeckManager.', 'if (window.DeckManager) window.DeckManager.')
text = text.replace('await DeckManager.registerStandardDeck', 'await window.DeckManager.registerStandardDeck')
text = text.replace('DeckManager.setBattleDeckId', 'window.DeckManager.setBattleDeckId')

with open('battle_arena.js', 'wb') as f:
    f.write(text.encode('utf-8'))

print('Fixed battle_arena.js DeckManager references!')
