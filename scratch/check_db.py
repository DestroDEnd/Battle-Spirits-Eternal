import sqlite3

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()
c.execute("SELECT id, name, levels, effect FROM cards WHERE type IS NULL OR trim(type) = ''")
cards = c.fetchall()

def classify_smart(name, levels, effect):
    lvl = (levels or '').lower()
    eff = (effect or '').lower()
    nm = (name or '').lower()
    magic_names = {'golden counter', "king's downfall", 'rule reversal', 'world collapse', 'world release'}
    
    # 1. Brave
    if 'brave' in lvl or '[brave condition' in eff or 'when braved' in eff:
        return 'Brave'
    # 2. Ultimate
    if '[summon condition:' in eff or ('level 3' in lvl and 'level 1' not in lvl):
        return 'Ultimate'
    # 3. Nexus check: Nexuses have 0 core at Lv1 and NO bp, or [nexus] in effect without bp
    if ('0 core' in lvl and 'bp' not in lvl) or ('[nexus]' in eff and 'bp' not in lvl):
        return 'Nexus'
    # 4. Spirit
    if 'level 1' in lvl or 'bp' in lvl or '[lv1]' in eff:
        return 'Spirit'
    # 5. Magic
    if any(k in eff for k in ['[main]', 'main-', 'main -', '[flash]', 'flash-', 'flash -', '(your main phase)', '(flash step)', '[burst:']) or nm in magic_names:
        return 'Magic'
    # 6. Nexus
    if 'nexus' in eff or '[nexus]' in eff:
        return 'Nexus'
    # 7. Fallback
    return 'Spirit'

results = [classify_smart(name, levels, effect) for cid, name, levels, effect in cards]
from collections import Counter
print("Smart classification:", Counter(results))

conn.close()
