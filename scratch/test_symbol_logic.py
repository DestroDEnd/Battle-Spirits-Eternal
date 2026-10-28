import re

def parse_symbols(spirit, attack_field=None):
    sym_str = str(spirit.get('symbol', '')).strip()
    # 1. Base symbols
    px_count = len(re.findall(r'20px|25px', sym_str))
    if px_count > 0:
        base = px_count
    elif sym_str.isdigit():
        base = int(sym_str)
    elif ',' in sym_str or '/' in sym_str:
        base = len([t for t in re.split(r'[,/]', sym_str) if t.strip()])
    else:
        base = 1

    total = base + spirit.get('extraSymbols', 0)
    eff = spirit.get('effect', '')
    level = spirit.get('currentLevel', 1)

    # 2. Ability blocks
    blocks = re.split(r'\n(?=\[LV)', eff)
    for b in blocks:
        # Check level tag
        lvl_m = re.match(r'^((?:\[LV\d+\])+|LV\d+[-~]LV\d+|LV\d+)', b.strip(), re.I)
        if lvl_m:
            req_lvls = [int(x) for x in re.findall(r'\d+', lvl_m.group(1))]
            if level not in req_lvls and not any(level >= x for x in req_lvls if '-' in lvl_m.group(1)):
                continue
        # Soul core condition
        if re.search(r'while this spirit has (?:\[soul core\]|soul core)', b, re.I):
            if not spirit.get('hasSoulCore', False):
                continue

        # Additions
        if re.search(r'this Spirit (?:gains|gets)\s+(?:an?|one|\+?1)\s+(?:extra|additional)?\s*(?:[a-zA-Z]+\s+)?symbols?', b, re.I):
            total += 1
        elif re.search(r'this Spirit (?:gains|gets)\s+(?:two|\+?2)\s+(?:extra|additional)?\s*(?:[a-zA-Z]+\s+)?symbols?', b, re.I):
            total += 2
        elif re.search(r'this Spirit (?:gains|gets)\s+(?:three|\+?3)\s+(?:extra|additional)?\s*(?:[a-zA-Z]+\s+)?symbols?', b, re.I):
            total += 3
        # Direct assignments
        if re.search(r'(?:has|becomes)\s+two\s+(?:[a-zA-Z]+\s+)?symbols', b, re.I):
            total = max(total, 2)
        elif re.search(r'(?:has|becomes)\s+three\s+(?:[a-zA-Z]+\s+)?symbols', b, re.I):
            total = max(total, 3)

    # 3. Field auras
    if attack_field:
        for ally in attack_field:
            if ally.get('uid') == spirit.get('uid'): continue
            ally_eff = ally.get('effect', '')
            for ab in re.split(r'\n(?=\[LV)', ally_eff):
                m_fam = re.search(r'all your\s+((?:["\'][^"\']+["\']\/?)+)\s+family spirits (?:gain|get)\s+(?:an?|one|\+?1)\s+(?:extra|additional)?\s*(?:[a-zA-Z]+\s+)?symbols?', ab, re.I)
                if m_fam:
                    fams = [f.strip(' "\'').lower() for f in m_fam.group(1).split('/')]
                    spirit_fam = (spirit.get('family', '') + ' ' + ' '.join(spirit.get('families', []))).lower()
                    if any(f in spirit_fam for f in fams):
                        total += 1

    return max(1, total)

# Tests
card_double_base = {'name': 'Double Dragon', 'symbol': '20px20px', 'currentLevel': 1}
print('Double base symbols:', parse_symbols(card_double_base))

card_sengoku = {
    'name': 'Sengoku Siegfried',
    'symbol': '20px',
    'currentLevel': 2,
    'hasSoulCore': True,
    'effect': '[LV2][LV3] While this Spirit has [Soul Core] on it, this Spirit gains an extra Red symbol.'
}
print('Sengoku Siegfried (LV2 with Soul Core):', parse_symbols(card_sengoku))
print('Sengoku Siegfried (LV2 without Soul Core):', parse_symbols({**card_sengoku, 'hasSoulCore': False}))
print('Sengoku Siegfried (LV1 with Soul Core):', parse_symbols({**card_sengoku, 'currentLevel': 1}))

aura_nexus = {
    'uid': 'aura_1',
    'name': 'Dragon Sanctuary',
    'effect': 'All your "Ancient Dragon" family Spirits gain an extra Red symbol.'
}
ancient_dragon = {
    'uid': 'ad_1',
    'name': 'Fire Drake',
    'symbol': '20px',
    'family': 'Ancient Dragon',
    'currentLevel': 1
}
print('Ancient Dragon with aura:', parse_symbols(ancient_dragon, [aura_nexus, ancient_dragon]))
