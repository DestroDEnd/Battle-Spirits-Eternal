import re

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
  'Unleash', 'Unsheathe', 'Windstorm', 'Zero Counter', 'Twinkle Necromancy'
]

# Sort keywords by length descending so multi-word variants match before single words
sorted_kws = sorted(wiki_keywords, key=lambda x: len(x), reverse=True)

# Generate regex pattern
kw_escaped = [re.escape(k) for k in sorted_kws]
pattern = r'(?:' + '|'.join(kw_escaped) + r')(?::[^\]]+)?'

print(f"Generated pattern with {len(sorted_kws)} keywords.")
