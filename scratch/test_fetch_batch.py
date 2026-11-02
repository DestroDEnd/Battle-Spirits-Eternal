import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.stdout.reconfigure(encoding='utf-8')
import fetch_card
import database
import json

test_titles = ['The Extreme Partner, Zetter', 'The PartnerDragon Glow']
print("Fetching test cards:", test_titles)
results = fetch_card.fetch_cards_batch(test_titles)
print("Fetched results:", len(results))
for c in results:
    print(c.get('name'), c.get('card_number'), c.get('type'), c.get('family'))
    # Save to db
    database.save_card_db(c)
    print("Saved to DB!")
