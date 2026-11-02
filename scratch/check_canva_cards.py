import sqlite3, sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

canva_cards = [
    'Deadly Balance',
    'Thorn Prison',
    'Flame Tempest',
    'The ShiningSacredSword Shining-Sword X',
    'Legend Gundam',
    'The AbsoluteDragonDeity Amaterasu-Dragon',
    'The SpacePirateShip BoneShark',
    'Dark-Gadphant',
    'Forest of the Giant Faced Stones',
    'Arche Gundam',
    'Limited Barrier',
    'No. 26 Capital Capital',
    'The Red World',
    'The HeroEmperor DeitySword',
    'The DarkStones SandseaPirateDeity Pharaom',
    'The GalaxyStarblade Grand Chariot',
    'Drone Ladybug',
    'Deadly Hex',
    'The InfiniteMachine Wergen-Zeit',
    'The InfernalDragon Zon-Tharg',
    'The AbyssalTwinDragon Hasturk',
    'The TwinkleStarDragon Chondrite Dragon',
    'Buffalong-Bill',
    'The Bal-Masque Grand Duke Saegebracht -Holy Devil Form-',
    'The Phanto-Magia Hermit-Ritter Badgerdulles',
    'Racing Pentan',
    'The RabbitTwelveGodKing Mistral-Bit',
    'Evil Cherubimon',
    'The MoonlightDragon Strike-Siegwurm X',
    'Burst Wall',
    'Penetrate Flame',
    'The CursedCorpseOrgeMusha Zetsumei',
    'The Grandwalker Hephaestus',
    'Grandwalker Lakshmi',
    'The ShootingStardragonArcher Lykeios',
    'The CleverMachineBeast Yoroiphant',
    'The BlueMoonDragon Strike-Siegwurm',
    'Red Field',
    'Gundam Exia Repair',
    'The DarkKnight Lancelot X',
    'The GunDragon Phoenix-Cannon',
    'The OxTwelveGodKing Avalanche-Bison',
    'The MagicianWarMachine Lughaid',
    'Gift of the Nile',
    'The ChosenSearcher Alex',
    'The ShellGodKnight Knight-of-Gladius',
    'The SpacetimeDragon Chrono-Dragon',
    'Chihyu',
    'The GrandTransformer Hammer-Arms',
    'The SuperCentaurusDeity Grand-Sagitto-Nova',
    'Matsuda Takato',
    'The ConvictionDownfallDragon Judgment-Dragonis',
    'Neo Zeong',
    'The Thundercloud Plain',
    'The SpacePirateOperator Lisitsa',
    'Ichibanspear',
    'The HeavenlyDemonKing God-Sechs',
    'The PoisonSnakeScythe Alphard'
]

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()

found = 0
for name in canva_cards:
    c.execute("SELECT name, type, color, cost, effect FROM cards WHERE name LIKE ? LIMIT 1", (f'%{name}%',))
    row = c.fetchone()
    if row:
        found += 1
        print(f"Found: {row[0]} ({row[1]}): {repr((row[4] or '')[:60])}...")
    else:
        print(f"NOT FOUND: {name}")

print(f"\nFound {found}/{len(canva_cards)} reference cards in database.")
