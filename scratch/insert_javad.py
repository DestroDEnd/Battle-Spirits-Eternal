import sys
sys.stdout.reconfigure(encoding='utf-8')
import sqlite3
import json
import time

conn = sqlite3.connect('battle_spirits.db')
cursor = conn.cursor()

# Check if already exists
cursor.execute("SELECT id FROM cards WHERE name = 'The PartnerDemonLord Javad' OR card_number = 'SD65-CX01'")
existing = cursor.fetchone()

effect_text = """[Summon Condition: Your Life is at two or more]

[Soul State][Contract Pre-Advent]/[Ultimate] [LV3][LV4]
(Can't Stack) When your cores or the opposing cores are sent to the Void/Trash from the Life/Field/Reserve/Trash by your "Evil God" family effects, your counters +2. Also, if that's a "DemonLord" effect, you can draw a card.

[Contract Pre-Advent]/[Ultimate] [LV3][LV4] Flash - (Either Attack Step)
Once per turn, you can send a core from your Field/Reserve to the Trash. When you've done so, send two cores from an opposing Spirit/Ultimate to the Reserve."""

flavor_text = "So you want power? Then contract with me. Let's enjoy the power of the four demon lords together."

if not existing:
    cursor.execute("""
    INSERT INTO cards (
        name, kanji, jpname, cost, color, type, family, symbol, levels, effect,
        rarity, flavor, image_filename, image_url, local_image_path, updated_at,
        colors_json, families_json, sets_json, card_number
    ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?
    )
    """, (
        'The PartnerDemonLord Javad',
        '相棒魔卿ジャバド',
        '相棒魔卿ジャバド',
        3,
        'Purple',
        'Contract Ultimate',
        'Hell Contract, Evil God',
        'Gold core',
        'Level 3: 1 core, 5000 BP\nLevel 4: 3 cores, 8000 BP\nOC: 2+, +4000 BP',
        effect_text,
        'Contract X-Rare',
        flavor_text,
        'SD65-CX01.png',
        'https://static.wikia.nocookie.net/battle-spirits/images/7/76/SD65-CX01.png/revision/latest?cb=20230331103004',
        'assets/cards/SD65-CX01.png',
        int(time.time()),
        json.dumps(['Purple']),
        json.dumps(['Hell Contract', 'Evil God']),
        json.dumps(['SD65']),
        'SD65-CX01'
    ))
    conn.commit()
    print("SUCCESSFULLY INSERTED The PartnerDemonLord Javad into battle_spirits.db!")
else:
    print("The PartnerDemonLord Javad already exists in battle_spirits.db with id:", existing[0])

# Verify Hell Contract count in DB
cursor.execute("SELECT COUNT(*) FROM cards WHERE family LIKE '%Hell Contract%' OR families_json LIKE '%Hell Contract%'")
count = cursor.fetchone()[0]
print(f"Verified Hell Contract count in battle_spirits.db: {count}")
conn.close()
