import sqlite3
import re

conn = sqlite3.connect('battle_spirits.db')
c = conn.cursor()
rows = c.execute("SELECT name, effect FROM cards WHERE effect LIKE '%[Burst:%' OR effect LIKE '%【バースト%'").fetchall()

def parse_burst_trigger(eff):
    if not eff:
        return 'UNKNOWN', ''

    # Look for [Burst: ...] followed by optional (Condition)
    # or [Burst: Condition]
    # or Japanese 【バースト：条件】
    eff_lower = eff.lower()
    
    # 1. Search [Burst: <something>]
    m = re.search(r'\[Burst:\s*([^\]]+)\](?:\s*\(([^)]+)\))?', eff, re.IGNORECASE)
    trigger_text = ''
    if m:
        raw1 = m.group(1).strip()
        raw2 = m.group(2).strip() if m.group(2) else ''
        if len(raw1) > 2:
            trigger_text = raw1
        elif raw2:
            trigger_text = raw2
        else:
            trigger_text = raw1
    else:
        jm = re.search(r'【バースト[：:]([^】]+)】', eff)
        if jm:
            trigger_text = jm.group(1).strip()

    t_lower = trigger_text.lower()
    full_lower = eff_lower

    # 1. AFTER_LIFE_DECREASED:
    # "After your Life is reduced" / "After your Life is decreased" / 自分のライフ減少後 / ライフ減少後
    if 'life is reduced' in t_lower or 'life is decreased' in t_lower or '自分のライフ減少後' in full_lower or 'ライフ減少後' in full_lower or 'life is reduced' in full_lower:
        # Check if the burst specifically has "life is reduced" in the burst declaration
        # Wait, some cards have "(When Attacks) ... if life is reduced", so make sure it's near burst
        if 'life is reduced' in t_lower or 'life is decreased' in t_lower or re.search(r'\[burst:[^\]]*\]\s*\(?[^)]*life is reduced', full_lower) or 'ライフ減少後' in trigger_text:
            return 'AFTER_LIFE_DECREASED', trigger_text

    # 2. AFTER_OPPONENT_SUMMON_EFFECT:
    # "After an opposing Spirit's (When Summoned/Advents) effect resolves"
    # "After an opposing Spirit/Brave's (When Summoned) effect resolves"
    # "After an opposing Spirit/Nexus's (When Summoned/Deployed) effect resolves"
    # 相手の『このスピリットの召喚時』発揮後 / 相手の『このスピリットの召喚時/煌臨時』発揮後 / 相手の召喚時
    if (any(k in t_lower for k in ['when summoned', 'summoned/advents', 'summoned/deployed', 'summoned/reborn', 'summoned/advent', 'summoned via an opposing effect']) or
        re.search(r'\[burst:[^\]]*\]\s*\(?[^)]*(?:when summoned|召喚時|煌臨時|配置時)', full_lower) or
        any(k in trigger_text for k in ['召喚時', '煌臨時', '配置時'])):
        return 'AFTER_OPPONENT_SUMMON_EFFECT', trigger_text

    # 3. AFTER_OPPONENT_ATTACKS:
    # "After an opposing Spirit/Ultimate attacks" / "After an opposing Spirit attacks"
    # 相手のスピリットのアタック後 / 相手のアタック後 / アタック後
    if (('attack' in t_lower or 'attacks' in t_lower) and ('opposing' in t_lower or 'opponent' in t_lower)) or \
       re.search(r'\[burst:[^\]]*\]\s*\(?[^)]*(?:opposing spirit.*attacks|opposing spirit/ultimate.*attacks)', full_lower) or \
       any(k in trigger_text for k in ['相手のアタック後', '相手のスピリットのアタック後', 'アタック後']):
        return 'AFTER_OPPONENT_ATTACKS', trigger_text

    # 4. AFTER_YOUR_SPIRIT_DESTROYED:
    # "After your Spirit is destroyed by the Opponent"
    # "After your Spirit is depleted/destroyed by the Opponent"
    # "After your Spirit/Nexus has left the Field due to the Opponent"
    # 自分のスピリット消滅/破壊後 / 自分のスピリット破壊後 / 相手による自分のスピリット
    if (any(k in t_lower for k in ['destroyed by the opponent', 'depleted/destroyed', 'left the field', 'leaves the field']) or
        re.search(r'\[burst:[^\]]*\]\s*\(?[^)]*(?:destroyed by the opponent|depleted/destroyed|left the field)', full_lower) or
        any(k in trigger_text for k in ['破壊後', '消滅/破壊後', 'フィールドを離れた後', 'フィールドから離れた後'])):
        return 'AFTER_YOUR_SPIRIT_DESTROYED', trigger_text

    # 5. AFTER_OPPONENT_HAND_INCREASED:
    # "After the opposing Hand increases via an opposing effect" / 相手の手札が増加後
    if ('hand increase' in t_lower or 'hand increases' in t_lower or 'hand increased' in t_lower or
        re.search(r'\[burst:[^\]]*\]\s*\(?[^)]*opposing hand increases', full_lower) or
        any(k in trigger_text for k in ['手札が増加後', '手札増加後', '手札が増えた後'])):
        return 'AFTER_OPPONENT_HAND_INCREASED', trigger_text

    return 'OTHER', trigger_text

categories = {}
others = []
for name, eff in rows:
    cat, trig = parse_burst_trigger(eff)
    categories[cat] = categories.get(cat, 0) + 1
    if cat == 'OTHER':
        others.append((name, trig, eff[:140]))

print("Classification results with refined parser:")
for cat, count in sorted(categories.items(), key=lambda x: -x[1]):
    print(f"  {cat}: {count}")

print(f"\nRemaining OTHER count: {len(others)}")
for n, t, snippet in others[:15]:
    print(f"  [{n}] trigger='{t}' snippet={snippet.strip()}")
