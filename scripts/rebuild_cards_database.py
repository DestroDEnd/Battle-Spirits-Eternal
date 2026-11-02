import sys
sys.stdout.reconfigure(encoding='utf-8')
import os
import sqlite3
import json
import re
import urllib.parse

BSP_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BSP_DIR, 'battle_spirits.db')
DATA_DIR = os.path.join(BSP_DIR, 'data')
EFFECTS_DIR = os.path.join(DATA_DIR, 'effects')

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(EFFECTS_DIR, exist_ok=True)

print("Starting Phase 1: Rebuilding Card Database & Data Sharding...")

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

cursor.execute("""
SELECT id, name, kanji, jpname, cost, color, type, family, symbol, levels, effect,
       rarity, flavor, image_filename, image_url, local_image_path, colors_json,
       families_json, sets_json, card_number
FROM cards
ORDER BY id ASC
""")
rows = cursor.fetchall()
print(f"Total raw cards from database: {len(rows)}")

# Regex patterns for card number extraction
card_num_re1 = re.compile(r'([A-Z0-9]{2,10}-[A-Z0-9]+)', re.I)
card_num_re2 = re.compile(r'([A-Z0-9]{2,6})_(?:[CRMX]+_)?(\d{2,3}|[A-Z0-9]+)', re.I)

# Mapping for CrossOver or specific game original cards
CROSSOVER_MAP = {
    'Doom Mercenary': 'BSCO-001',
    'Fixer, Izolder': 'BSCO-002',
    'The ApexDragonMarquis Palvisor': 'BSCO-003',
    'The ArtificialVampire Drakstein': 'BSCO-004',
    'The ChalkMothership Pannotia': 'BSCO-005',
    'The Criminal Sage': 'BSCO-006',
    'The EvilGentleman Zerenade': 'BSCO-007',
    'The GodSealingShield Atziluth': 'BSCO-008',
    'The MagicMirrorMan Necrog': 'BSCO-009',
    'The MobileMercuryHumanoid Argendid': 'BSCO-010',
    'The NightEmperor Voltissimo': 'BSCO-011',
    'The NightEmperor Voltissimo - Devil Form -': 'BSCO-012',
    'The PhantomThiefDevil Jeanluc': 'BSCO-013',
    'The RagingFireDragon Gamushalander': 'BSCO-014',
    'The SacredBeastDragon Gilzash Ritter Stance': 'BSCO-015',
    'The SacredBeastDragon Gilzash Wild Stance': 'BSCO-016',
    'The ThunderDragonKing Brightening': 'BSCO-017',
    'The ThunderDragonKing Brightening-Zero': 'BSCO-018',
    'The WaterPhantomPrincess La Mer': 'BSCO-019',
    'Vampire Dashing in the Night, Miaza': 'BSCO-020',
    'Argenic-One': 'BSCO-021',
    'Argenic-One Diffusion Rain': 'BSCO-022',
    'The BeastRuinDragon Bagin-Banka': 'BSCO-023',
    'The GiantDeityKing Ediara-Khan': 'BSCO-024',
    # Specific set cards with non-standard image names
    'No. 14 God Apple River': 'BS39-074',
    'The Seventh\'s MonkeyKing Valin': 'BS39-039',
    'The DragonFruitsel Pitajya': 'BS39-041',
    'The GourmetFairy Dolce': 'BS39-042',
    'The Dragon Emperor\'s Pirate Crew Hidden Harbor': 'BS42-078',
    'Freedom Gundam': 'SD52-X01',
    'Epigaulus': 'BS37-013',
    'Blibuster': 'BS39-012',
    'Isis\' Power': 'BS45-086',
    'Grandwalker Merlin': 'BS56-074',
    'The AccelHero Revol-Red': 'BS37-001',
    'The CleverMachineMusha E-Naomasa': 'BS37-033',
    'The EleventhSoldier Twinhead Collie': 'BS39-047',
    'The Fifth\'s WaterMonkey Susena': 'BS37-024',
    'The FlyingFirstArmoredDragon Steelhorn Dragon': 'BS37-006',
    'The Fourth\'s ExpulsionBeastShip Destrorix': 'BS39-058',
    'The Floating Jade Black Castle': 'BS42-085',
    'The Gigantic Thride-Gelm': 'BS37-063',
    'The GourmetFairyDeity Eclair-Chiffon': 'BS39-X05',
    'The GourmetFairy Amandine': 'BS37-046',
    'The NovaSixthMachineBeast Aero-Sheep': 'BS39-034',
    'The RatTwelveGodKing Mouchuu': 'BS38-X02',
    'The Reopened Hole in the Empty Sky': 'BS42-081',
    'The SixtiethBeast Disaster-Boar': 'BS39-026',
    'The TenthGrandKnight Eaglance': 'BS39-048',
    'The SyntheticBeast Chimeberus': 'BS40-023',
    'The TwinRowdyDinosaur Super Diranos': 'BS41-002',
    'The WindRabbitGodKing Anima-Bit': 'BS40-X03',
    'The Wonderland Trump Pentans': 'BS42-054',
}

def resolve_card_number(name, img_f, img_u):
    if name in CROSSOVER_MAP:
        return CROSSOVER_MAP[name]
        
    # Check img_f
    if img_f:
        m = card_num_re1.search(img_f)
        if m:
            return m.group(1).upper()
            
    # Check unquoted img_u
    if img_u:
        clean_u = urllib.parse.unquote(img_u)
        m = card_num_re1.search(clean_u)
        if m:
            return m.group(1).upper()
            
    # Check underscore pattern
    for target in [img_f, img_u]:
        if target:
            clean_t = urllib.parse.unquote(target)
            m = card_num_re2.search(clean_t)
            if m:
                s, c = m.group(1).upper(), m.group(2).upper()
                if not s.startswith('CARD') and not s.endswith('PX') and len(s) >= 2:
                    return f"{s}-{c}"
                    
    # Check name for parenthesized code
    m = card_num_re1.search(name)
    if m:
        return m.group(1).upper()
        
    return None

def parse_levels_dict(levels_str):
    if not levels_str:
        return {}
    res = {}
    lines = str(levels_str).replace('<br>', '\n').replace('<br/>', '\n').split('\n')
    for line in lines:
        line = line.strip()
        m = re.search(r'Level\s*(\d+)\s*:\s*(\d+)\s*cores?,\s*(\d+)\s*BP', line, re.I)
        if m:
            lv = f"LV{m.group(1)}"
            res[lv] = {
                "level": int(m.group(1)),
                "cost": int(m.group(2)),
                "bp": int(m.group(3))
            }
    return res

def parse_colors_list(color_str, colors_json):
    cols = []
    if colors_json:
        try:
            parsed = json.loads(colors_json)
            if isinstance(parsed, list):
                cols = [c.strip() for c in parsed if c.strip()]
        except Exception:
            pass
    if not cols and color_str:
        cols = [c.strip() for c in color_str.replace('/', ',').split(',') if c.strip()]
    if not cols:
        cols = ["Colorless"]
    return cols

def parse_families_list(family_str, families_json):
    fams = []
    if families_json:
        try:
            parsed = json.loads(families_json)
            if isinstance(parsed, list):
                fams = [f.strip() for f in parsed if f.strip()]
        except Exception:
            pass
    if not fams and family_str:
        fams = [f.strip() for f in family_str.replace('/', '\n').replace(',', '\n').split('\n') if f.strip()]
    return fams

def parse_sets_list(sets_json):
    if not sets_json:
        return []
    try:
        s = json.loads(sets_json)
        if isinstance(s, list):
            return [x.strip() for x in s if x.strip()]
    except Exception:
        pass
    return []

def classify_card_type(raw_type, name, effect, levels_dict, families):
    t = str(raw_type or '').strip()
    e_low = (effect or '').lower()
    n_low = name.lower()
    
    # Contract cards
    if 'contract' in t.lower():
        if 'nexus' in t.lower():
            return 'Contract Nexus'
        if 'ultimate' in t.lower():
            return 'Contract Ultimate'
        return 'Contract Spirit'
        
    if '[soul state]' in e_low or 'contract' in n_low or 'partner' in n_low:
        if 'nexus' in t.lower():
            return 'Contract Nexus'
        if 'spirit' in t.lower() or not t:
            return 'Contract Spirit'
            
    # Token cards
    if 'token' in t.lower() or 'token' in n_low:
        return 'Token Spirit'
        
    # Standard types
    if 'ultimate' in t.lower():
        return 'Ultimate'
    if 'brave' in t.lower():
        return 'Brave'
    if 'magic' in t.lower():
        return 'Magic'
    if 'nexus' in t.lower():
        return 'Nexus'
    if 'spirit' in t.lower():
        return 'Spirit'
        
    # Infer if type is empty
    if not t:
        if 'bp' in str(levels_dict).lower():
            if 'brave' in e_low:
                return 'Brave'
            return 'Spirit'
        if 'deploy' in e_low or 'nexus' in e_low:
            return 'Nexus'
        if 'flash' in e_low or 'main' in e_low:
            return 'Magic'
        return 'Spirit'
        
    return t

def parse_symbols_list(card_type, colors, raw_symbol, effect):
    if card_type == 'Magic':
        return []
    if card_type in ('Ultimate', 'Contract Ultimate'):
        return ['Gold']
        
    raw = str(raw_symbol or '').strip()
    primary_color = colors[0] if colors else 'Red'
    
    # Count occurrences of 20px or 25px
    c20 = raw.count('20px')
    c25 = raw.count('25px')
    total_count = c20 + c25
    if total_count == 0:
        if raw in ('-', '0', ''):
            if card_type in ('Spirit', 'Nexus', 'Brave', 'Contract Spirit', 'Contract Nexus'):
                total_count = 1
            else:
                total_count = 0
        else:
            total_count = 1
            
    # If card has multiple colors and 2 symbols, assign colors if matching
    if total_count == 2 and len(colors) >= 2:
        return [colors[0], colors[1]]
    return [primary_color] * max(1, total_count)

def calculate_canonical_reduction(cost, card_type, colors, effect):
    # Reduction calculation conforming to Battle Spirits Eternal rules
    if cost is None or cost == 0:
        return {"total": 0, "by_color": {}}
        
    primary_color = colors[0] if colors else "Red"
    
    # Official standard reduction curves:
    # Cost 1 -> 1 reduction
    # Cost 2 -> 1 to 2 reduction
    # Cost 3 -> 2 reduction
    # Cost 4 -> 2 to 3 reduction
    # Cost 5 -> 3 reduction
    # Cost 6 -> 3 to 4 reduction
    # Cost 7 -> 4 reduction
    # Cost 8+ -> 4 to 6 reduction
    if cost == 1:
        max_red = 1
    elif cost == 2:
        max_red = 2 if card_type == 'Magic' else 1
    elif cost == 3:
        max_red = 2
    elif cost == 4:
        max_red = 3 if card_type in ('Magic', 'Nexus') else 2
    elif cost == 5:
        max_red = 3
    elif cost == 6:
        max_red = 4 if card_type in ('Ultimate', 'Magic') else 3
    elif cost == 7:
        max_red = 4
    elif cost == 8:
        max_red = 5
    elif cost >= 9:
        max_red = 6
    else:
        max_red = max(0, cost - 1)
        
    by_color = {}
    if len(colors) > 1 and max_red >= len(colors):
        per_col = max_red // len(colors)
        rem = max_red % len(colors)
        for i, c in enumerate(colors):
            by_color[c] = per_col + (1 if i < rem else 0)
    else:
        by_color[primary_color] = max_red
        
    return {
        "total": max_red,
        "by_color": by_color
    }

# Process all cards
processed_cards = []
cards_index = {}
cards_detailed = {}
sharded_effects = {}

card_no_counts = {}

for r in rows:
    cid, name, kanji, jpname, cost, color, raw_type, family, raw_sym, levels_raw, effect, \
    rarity, flavor, img_f, img_u, local_path, colors_json, fams_json, sets_json, raw_card_no = r
    
    # 1. Resolve canonical card number
    card_no = resolve_card_number(name, img_f, img_u)
    if not card_no and raw_card_no:
        card_no = raw_card_no.strip().upper()
    if not card_no:
        # Fallback using set code or card ID
        sets_list = parse_sets_list(sets_json)
        prefix = sets_list[0] if sets_list else 'PROMO'
        card_no = f"{prefix}-{cid:03d}"
        
    # Uniquify if multiple distinct card names share a number (alternate forms)
    base_no = card_no
    if base_no in card_no_counts and card_no_counts[base_no] != name:
        card_no = f"{base_no}-A{cid}"
    card_no_counts[card_no] = name
    
    # 2. Parse core attributes
    colors = parse_colors_list(color, colors_json)
    families = parse_families_list(family, fams_json)
    sets = parse_sets_list(sets_json)
    levels = parse_levels_dict(levels_raw)
    
    cost_val = 0
    try:
        if cost is not None:
            cost_val = int(str(cost).strip())
    except Exception:
        cost_val = 0
        
    # 3. Classify type strictly
    card_type = classify_card_type(raw_type, name, effect, levels, families)
    
    # 4. Check Contract Partner & Vanilla
    is_contract = (card_type in ('Contract Spirit', 'Contract Nexus', 'Contract Ultimate') or
                   'partner' in name.lower() or '[soul state]' in (effect or '').lower())
    is_vanilla = bool(not effect or len(effect.strip()) <= 3 or effect.strip() in ('-', 'None'))
    
    # 5. Parse Symbols & Reductions
    symbols = parse_symbols_list(card_type, colors, raw_sym, effect)
    reduction = calculate_canonical_reduction(cost_val, card_type, colors, effect)
    
    # Ensure image_url is high fidelity
    image_url = img_u or f"https://static.wikia.nocookie.net/battle-spirits/images/{img_f}" if img_f else ""
    
    card_obj = {
        "id": cid,
        "card_number": card_no,
        "name": name,
        "kanji": kanji or "",
        "type": card_type,
        "cost": cost_val,
        "color": colors[0] if colors else "Red",
        "colors": colors,
        "family": families[0] if families else "",
        "families": families,
        "symbols": symbols,
        "reduction": reduction,
        "levels": levels,
        "effect": effect or "",
        "rarity": rarity or "Common",
        "flavor": flavor or "",
        "sets": sets,
        "is_vanilla": is_vanilla,
        "is_contract_partner": is_contract,
        "image_url": image_url
    }
    
    processed_cards.append(card_obj)
    
    # Index object for ultra-fast browsing (around ~150 bytes per card)
    cards_index[card_no] = {
        "id": cid,
        "card_number": card_no,
        "name": name,
        "type": card_type,
        "cost": cost_val,
        "colors": colors,
        "family": card_obj["family"],
        "families": families,
        "rarity": card_obj["rarity"],
        "sets": sets,
        "symbols": symbols,
        "reduction": reduction["total"],
        "is_contract": is_contract,
        "image_url": image_url
    }
    
    cards_detailed[card_no] = card_obj
    
    # Partition effects by primary set prefix for clean lazy-loading
    set_prefix = "MISC"
    if sets:
        p_match = re.match(r'([A-Z0-9]+)', sets[0], re.I)
        if p_match:
            set_prefix = p_match.group(1).upper()
            
    if set_prefix not in sharded_effects:
        sharded_effects[set_prefix] = {}
        
    sharded_effects[set_prefix][card_no] = {
        "name": name,
        "type": card_type,
        "levels": levels,
        "effect": effect or "",
        "is_vanilla": is_vanilla
    }

print(f"Successfully processed {len(processed_cards)} cards.")
print(f"Cards Index entries: {len(cards_index)}")
print(f"Sharded sets count: {len(sharded_effects)}")

# Write data artifacts
index_path = os.path.join(DATA_DIR, 'cards_index.json')
detailed_path = os.path.join(DATA_DIR, 'cards_detailed.json')

with open(index_path, 'w', encoding='utf-8') as f:
    json.dump(cards_index, f, ensure_ascii=False, indent=1)

with open(detailed_path, 'w', encoding='utf-8') as f:
    json.dump(cards_detailed, f, ensure_ascii=False, indent=1)

for s_code, chunk in sharded_effects.items():
    shard_file = os.path.join(EFFECTS_DIR, f"{s_code}.json")
    with open(shard_file, 'w', encoding='utf-8') as f:
        json.dump(chunk, f, ensure_ascii=False, indent=1)

print(f"Wrote cards_index.json ({os.path.getsize(index_path) / (1024*1024):.2f} MB)")
print(f"Wrote cards_detailed.json ({os.path.getsize(detailed_path) / (1024*1024):.2f} MB)")
print(f"Wrote {len(sharded_effects)} effect shards in data/effects/")

# Rebuild / update SQLite database with new structured columns and indexed card_number
cursor.execute("DROP TABLE IF EXISTS cards_v2")
cursor.execute("""
CREATE TABLE cards_v2 (
    id INTEGER PRIMARY KEY,
    card_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    kanji TEXT,
    cost INTEGER NOT NULL,
    color TEXT NOT NULL,
    colors_json TEXT NOT NULL,
    type TEXT NOT NULL,
    family TEXT,
    families_json TEXT NOT NULL,
    sets_json TEXT NOT NULL,
    symbols_json TEXT NOT NULL,
    reduction_json TEXT NOT NULL,
    levels_json TEXT NOT NULL,
    effect TEXT,
    rarity TEXT,
    flavor TEXT,
    is_vanilla INTEGER NOT NULL,
    is_contract_partner INTEGER NOT NULL,
    image_url TEXT NOT NULL
)
""")

for c in processed_cards:
    cursor.execute("""
    INSERT INTO cards_v2 (
        id, card_number, name, kanji, cost, color, colors_json, type, family,
        families_json, sets_json, symbols_json, reduction_json, levels_json,
        effect, rarity, flavor, is_vanilla, is_contract_partner, image_url
    ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
    """, (
        c["id"], c["card_number"], c["name"], c["kanji"], c["cost"], c["color"],
        json.dumps(c["colors"]), c["type"], c["family"], json.dumps(c["families"]),
        json.dumps(c["sets"]), json.dumps(c["symbols"]), json.dumps(c["reduction"]),
        json.dumps(c["levels"]), c["effect"], c["rarity"], c["flavor"],
        1 if c["is_vanilla"] else 0, 1 if c["is_contract_partner"] else 0, c["image_url"]
    ))

cursor.execute("CREATE INDEX IF NOT EXISTS idx_cards_v2_card_number ON cards_v2(card_number)")
cursor.execute("CREATE INDEX IF NOT EXISTS idx_cards_v2_name ON cards_v2(name)")
cursor.execute("CREATE INDEX IF NOT EXISTS idx_cards_v2_type ON cards_v2(type)")
cursor.execute("CREATE INDEX IF NOT EXISTS idx_cards_v2_color ON cards_v2(color)")
cursor.execute("CREATE INDEX IF NOT EXISTS idx_cards_v2_cost ON cards_v2(cost)")

# Update original cards table to sync card_number and valid type
cursor.execute("SELECT card_number, type, id FROM cards_v2")
v2_rows = cursor.fetchall()
for cn, ct, cid in v2_rows:
    cursor.execute("UPDATE cards SET card_number = ?, type = ? WHERE id = ?", (cn, ct, cid))

conn.commit()
conn.close()

print("\nDatabase cards_v2 rebuilt and indexed successfully!")
print("Updated canonical card_number and type in main 'cards' table.")
