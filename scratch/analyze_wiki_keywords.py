import sqlite3, re, json

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()
c.execute("SELECT name, effect FROM cards WHERE effect IS NOT NULL AND effect != ''")
rows = c.fetchall()
print(f'Total cards with effects in DB: {len(rows)}')

wiki_keywords = [
  'A.T. Field', 'Accel', 'Advent', 'Amplify', 'Appeal', 'Armed Intervention',
  'Armor', 'Assault', 'Assemble', 'Awaken', 'Barrage', 'Bombardment', 'Brilliance',
  'Buddy', 'Bunshin', 'Burst', 'Bushido', 'Cast Off', 'Catalyze', 'Change',
  'Charge', 'Clash', 'Clock Up', 'Consecutive Blade', 'Contract Armor', 'Contract Awaken',
  'Contract Unleash', 'Core Charge', 'Count Break', 'Crush', 'Curse', 'Dispersion',
  'Diva Rush', 'Double Drive', 'Draw Lock', 'Emperor Road', 'Fast Draw', 'Fierce Windstorm',
  'Flashing Swift', 'Fortress', 'Friend', 'God Strike', 'Grand Assault', 'Grand Field',
  'Grand Ice Wall', 'Grand Skill', 'Grandphosis', 'Great Assault', 'Great Crush',
  'Heavenly Light', 'Heavy Armor', 'High Speed', 'Holy Life', 'Ice Wall', 'Immortality',
  'Infinite Blade', 'Infinite Flame', 'Kagemusha', 'Leap', 'Level Up', 'Manifest',
  'Mirage', 'My Unit', 'NT-D', 'On Stage', 'Plunder', 'Poison Blade', 'PS Armor',
  'Pursuit', 'Rebirth', 'Reload', 'Resonance', 'Revive', 'Rush', 'Seal',
  'Shamanism', 'Show Up', 'Six Heaven Rush', 'Soar', 'Solo Part', 'Soul Awaken',
  'Soul Drive', 'Soul Magic', 'Sound Speed', 'Spellbind', 'Spirit Soul', 'Stampede',
  'Super Boost', 'Super Unleash', 'Supreme Clash', 'Tribute', 'Trigger Counter',
  'True-Awaken', 'True-Clash', 'True-Curse', 'Twinkle', 'Ultra Armor', 'Ultra Holy Life',
  'Unleash', 'Unsheathe', 'Windstorm', 'Zero Counter'
]

counts = {}
for kw in wiki_keywords:
    # Match keyword with brackets or as stand-alone keyword
    pattern = re.compile(rf'\[{re.escape(kw)}[\:\]]|【{re.escape(kw)}|\[{re.escape(kw)}\]|\b{re.escape(kw)}\b', re.I)
    matched = [r[0] for r in rows if pattern.search(r[1])]
    counts[kw] = len(matched)

sorted_counts = sorted(counts.items(), key=lambda x: x[1], reverse=True)
print('\nTop Keywords in our 14,529-card Database:')
for kw, cnt in sorted_counts[:45]:
    if cnt > 0:
        print(f'  {kw:22s}: {cnt:4d} cards')

conn.close()
