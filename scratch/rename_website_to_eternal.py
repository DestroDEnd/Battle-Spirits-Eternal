import os
import re

files_to_update = [
    'arena.html',
    'index.html',
    'deck.html',
    'browse.html',
    'family.html',
    'sets.html',
    'login.html',
    'register.html',
    'deck_view.html',
    'app.js',
    'battle_arena.js'
]

replacements = [
    ("Destro's Colosseum Battle Arena | Battle Spirits", "Battle Spirits Eternal | Battle Arena"),
    ("Destro's BATTLE SPIRITS Colosseum | Home", "Battle Spirits Eternal | Home"),
    ("Deck Builder | Destro's BATTLE SPIRITS Colosseum", "Deck Builder | Battle Spirits Eternal"),
    ("Browse Cards | Destro's BATTLE SPIRITS Colosseum", "Browse Cards | Battle Spirits Eternal"),
    ("Family Taxonomy | Destro's BATTLE SPIRITS Colosseum", "Family Taxonomy | Battle Spirits Eternal"),
    ("Card Sets & Themes | Destro's BATTLE SPIRITS Colosseum", "Card Sets & Themes | Battle Spirits Eternal"),
    ("Deck View | Destro's BATTLE SPIRITS Colosseum", "Deck View | Battle Spirits Eternal"),
    ("Login | Destro's BATTLE SPIRITS Colosseum", "Login | Battle Spirits Eternal"),
    ("Register | Destro's BATTLE SPIRITS Colosseum", "Register | Battle Spirits Eternal"),
    ("Destro's BATTLE SPIRITS Colosseum", "Battle Spirits Eternal"),
    ("Destro's Colosseum Battle Arena", "Battle Spirits Eternal Arena"),
    ("Enter The Colosseum Battle Arena", "Enter The Eternal Battle Arena"),
    ("Explore The Colosseum", "Explore Battle Spirits Eternal"),
    ("📜 Colosseum Combat Feed", "📜 Battle Spirits Eternal Feed"),
    ("Welcome to the Colosseum!", "Welcome to Battle Spirits Eternal!"),
    ("Colosseum Champion Defeated!", "Champion Defeated!"),
    ("proved your supremacy in the Colosseum!", "proved your supremacy in Battle Spirits Eternal!"),
    ("Battle Spirits Colosseum", "Battle Spirits Eternal"),
    ("active deck in the Colosseum", "active deck in Battle Spirits Eternal"),
    ("Active Battle Deck in Colosseum", "Active Battle Deck in Battle Spirits Eternal"),
    ("Active Battle Deck for the Colosseum!", "Active Battle Deck for Battle Spirits Eternal!"),
    ("Active Colosseum Battle Deck!", "Active Battle Deck for Battle Spirits Eternal!"),
    ("Available in Colosseum.", "Available in Battle Spirits Eternal."),
    ("Colosseum Battle Deck", "Battle Spirits Eternal Deck"),
    ("🔥 ENTER COLOSSEUM", "🔥 ENTER BATTLE"),
    ("Colosseum Champion (AI)", "Eternal Champion (AI)")
]

updated_count = 0

for filename in files_to_update:
    if not os.path.exists(filename):
        continue
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    orig = content
    for old_str, new_str in replacements:
        if old_str in content:
            content = content.replace(old_str, new_str)
    
    if content != orig:
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated branding in {filename}")
        updated_count += 1

print(f"\nBranding update complete! {updated_count} files updated with 'Battle Spirits Eternal'.")
