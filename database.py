import sqlite3
import os
import json
import time
import re
import hashlib
import uuid
import secrets
import family_taxonomy

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'battle_spirits.db')
WIKI_COUNTS_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'wiki_counts.json')

def get_wiki_counts():
    """Load cached official Wiki card counts for all sets and families."""
    if os.path.exists(WIKI_COUNTS_PATH):
        try:
            with open(WIKI_COUNTS_PATH, encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    return {'sets': {}, 'families': {}}

def get_connection():
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA busy_timeout=30000")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        kanji TEXT,
        jpname TEXT,
        cost INTEGER,
        color TEXT,
        colors_json TEXT,
        type TEXT,
        family TEXT,
        families_json TEXT,
        sets_json TEXT,
        symbol TEXT,
        levels TEXT,
        effect TEXT,
        rarity TEXT,
        flavor TEXT,
        image_filename TEXT,
        image_url TEXT,
        local_image_path TEXT,
        updated_at INTEGER
    )
    ''')

    for col, coltype in [
        ('colors_json', 'TEXT'),
        ('families_json', 'TEXT'),
        ('sets_json', 'TEXT'),
        ('card_number', 'TEXT'),
    ]:
        try:
            cursor.execute(f'ALTER TABLE cards ADD COLUMN {col} {coltype}')
        except Exception:
            pass

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS decks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        cards_json TEXT NOT NULL,
        created_at INTEGER,
        updated_at INTEGER
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        login TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        created_at INTEGER
    )
    ''')

    conn.commit()
    conn.close()

def clean_set_name(s):
    """Normalize and filter Battle Spirits card sets, excluding tournament prize and snack notes."""
    if not s or not isinstance(s, str):
        return None
    s = s.strip()
    s = re.sub(r'</?tabber>', '', s, flags=re.IGNORECASE)
    s = re.sub(r'Original\s*=\s*', '', s, flags=re.IGNORECASE)
    s = s.replace('[[', '').replace(']]', '').replace('(', '').replace(')', '').replace('|-', '').strip()
    s = s.strip("'\" \t\r\n")

    if 'kfc' in s.lower():
        return 'KFC Promo'

    # Remove 'Also in ' reprint prefix
    if s.lower().startswith('also in '):
        s = s[8:].strip()

    sl = s.lower()
    # Reject non-set notes: tournament prizes, wafers, candy snacks, alternate arts, binders
    junk_keywords = [
        'prize', 'entry', 'winning', 'participation', 'championship',
        'batosupi', 'battle skii', 'shop battle', 'barone',
        'wafers', 'choco', 'snack', 'candy', 'dan cup', 'figure collection',
        'treasure pack', 'vol.', 'selection pack', 'pack 20', 'box 20',
        'campaign_promo', 'released in', 'english only', 'italian only',
        'japanese only', 'binder', 'sleeve', 'case', 'deck case', 'special set:',
        'music deck'
    ]
    if any(k in sl for k in junk_keywords):
        return None

    if re.search(r'\b(art|artwork|alt-art)\b', sl):
        return None

    # Reject template artifacts
    if re.search(r'^\d+rbs', sl) or sl.startswith('category:') or sl in ['promo', 'also in', 'none', 'tba', 'original']:
        return None

    # Never accept underscore-separated wiki category tags (e.g. Draw_from_deckbottom, BP_10000_at_level_4)
    if '_' in s:
        return None

    # Normalize 'BS01- Call of the Core' -> 'BS01'
    m = re.match(r'^(BS|BSC|CB|SD|PB|PC|SE|LM|SJ|SA|PX|SS|RV)\d+\s*[-:]\s*(.*)', s, re.IGNORECASE)
    if m:
        return m.group(1).upper()

    # Standard set codes
    m2 = re.match(r'^(BS|BSC|CB|SD|PB|PC|SE|LM|SJ|SA|PX|SS|RV)\d+$', s, re.IGNORECASE)
    if m2:
        return s.upper()

    # Legitimate named products/sets
    known_named = [
        'ascension of dragons', 'call of the core', 'burning stardust', 'chaos guardian',
        'dawn of the ancients', 'the twelve god-kings chapter 0', 'kerokero starter',
        'bakudou starter', 'herodragon deck', 'structure deck heroes',
        'pre-constructed deck: heroes', 'trial deck brave', 'memorial extra pack',
        'galaxian deck complete box', 'ultimate battle 00', 'ultimate battle 01'
    ]
    if sl in known_named or 'starter' in sl or 'start deck' in sl:
        if 'kerokero' in sl:
            return 'Kerokero Starter'
        return s.strip().title()

    if len(s) > 40 or len(s) < 2:
        return None

    return s

def extract_card_number(img_fn='', name=''):
    """Extract official Battle Spirits card number like BS01-001 or CB02-041."""
    if img_fn:
        m = re.search(r'\b([A-Z]{1,4}\d{1,3}-[A-Z0-9]+)\b', str(img_fn), re.IGNORECASE)
        if m:
            return m.group(1).upper()
    if name:
        m = re.search(r'\b([A-Z]{1,4}\d{1,3}-[A-Z0-9]+)\b', str(name), re.IGNORECASE)
        if m:
            return m.group(1).upper()
    return None

def save_card(card_data):
    if not card_data or not card_data.get('is_card') or not card_data.get('name'):
        return None

    cost_val = None
    try:
        if card_data.get('cost') is not None:
            cost_val = int(str(card_data['cost']).strip())
    except (ValueError, TypeError):
        pass

    conn = get_connection()
    cursor = conn.cursor()
    now = int(time.time())

    colors = card_data.get('colors') or []
    if not colors and card_data.get('color'):
        colors = [c.strip() for c in card_data['color'].split('/') if c.strip()]

    families = card_data.get('families') or []
    if not families and card_data.get('family'):
        families = [f.strip() for f in card_data['family'].replace('/', '\n').split('\n') if f.strip()]

    raw_sets = card_data.get('sets') or []
    sets = []
    for s in raw_sets:
        c_set = clean_set_name(s)
        if c_set and c_set not in sets:
            sets.append(c_set)

    card_number = card_data.get('card_number') or extract_card_number(card_data.get('image_filename'), card_data.get('name'))

    cursor.execute('''
    INSERT INTO cards (
        name, kanji, jpname, cost, color, colors_json, type, family, families_json,
        sets_json, symbol, levels, effect, rarity, flavor,
        image_filename, image_url, local_image_path, card_number, updated_at
    ) VALUES (
        :name, :kanji, :jpname, :cost, :color, :colors_json, :type, :family, :families_json,
        :sets_json, :symbol, :levels, :effect, :rarity, :flavor,
        :image_filename, :image_url, :local_image_path, :card_number, :updated_at
    )
    ON CONFLICT(name) DO UPDATE SET
        kanji = excluded.kanji,
        jpname = excluded.jpname,
        cost = excluded.cost,
        color = excluded.color,
        colors_json = excluded.colors_json,
        type = excluded.type,
        family = excluded.family,
        families_json = excluded.families_json,
        sets_json = excluded.sets_json,
        symbol = excluded.symbol,
        levels = excluded.levels,
        effect = excluded.effect,
        rarity = excluded.rarity,
        flavor = excluded.flavor,
        image_filename = excluded.image_filename,
        image_url = excluded.image_url,
        local_image_path = COALESCE(excluded.local_image_path, cards.local_image_path),
        card_number = COALESCE(excluded.card_number, cards.card_number),
        updated_at = excluded.updated_at
    ''', {
        'name': card_data.get('name'),
        'kanji': card_data.get('kanji'),
        'jpname': card_data.get('jpname'),
        'cost': cost_val,
        'color': card_data.get('color'),
        'colors_json': json.dumps(colors),
        'type': card_data.get('type'),
        'family': card_data.get('family'),
        'families_json': json.dumps(families),
        'sets_json': json.dumps(sets),
        'symbol': card_data.get('symbol'),
        'levels': card_data.get('levels'),
        'effect': card_data.get('effect'),
        'rarity': card_data.get('rarity'),
        'flavor': card_data.get('flavor'),
        'image_filename': card_data.get('image_filename'),
        'image_url': card_data.get('image_url'),
        'local_image_path': card_data.get('local_image_path'),
        'card_number': card_number,
        'updated_at': now
    })

    conn.commit()
    conn.close()
    return card_data.get('name')

def get_card_by_name(name):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM cards WHERE LOWER(name) = LOWER(?)', (name.strip(),))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    d['colors'] = json.loads(d.get('colors_json') or '[]')
    d['families'] = json.loads(d.get('families_json') or '[]')
    d['sets'] = json.loads(d.get('sets_json') or '[]')
    return d

def get_distinct_values():
    """Get all distinct colors, families, sets for filter dropdowns."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT DISTINCT type FROM cards WHERE type IS NOT NULL AND type != "" ORDER BY type')
    types = [r[0] for r in cursor.fetchall()]
    if 'Grandwalker' not in types:
        types.append('Grandwalker')
    
    cursor.execute('SELECT DISTINCT rarity FROM cards WHERE rarity IS NOT NULL AND rarity != "" ORDER BY rarity')
    rarities = [r[0] for r in cursor.fetchall()]

    cursor.execute('SELECT families_json FROM cards WHERE families_json IS NOT NULL')
    families_counter = {}
    for row in cursor.fetchall():
        try:
            row_fams = set()
            for f in json.loads(row[0]):
                clean_f = f.strip().replace('[[', '').replace(']]', '')
                if clean_f and len(clean_f) < 40 and not clean_f.startswith('Category:'):
                    row_fams.add(clean_f)
            for f in row_fams:
                families_counter[f] = families_counter.get(f, 0) + 1
        except Exception:
            pass

    cursor.execute('SELECT sets_json FROM cards WHERE sets_json IS NOT NULL')
    sets_counter = {}
    for row in cursor.fetchall():
        try:
            row_sets = set()
            for s in json.loads(row[0]):
                clean_s = clean_set_name(s)
                if clean_s:
                    row_sets.add(clean_s)
            for s in row_sets:
                sets_counter[s] = sets_counter.get(s, 0) + 1
        except Exception:
            pass

    wiki_counts = get_wiki_counts()
    wiki_sets = wiki_counts.get('sets', {})
    wiki_fams = wiki_counts.get('families', {})

    # Combine sets: use true official Wiki counts so every set displays its real card count
    all_sets_dict = {}
    for s, c in sets_counter.items():
        all_sets_dict[s] = max(c, wiki_sets.get(s, 0))
    for s, c in wiki_sets.items():
        if s not in all_sets_dict and c > 0:
            all_sets_dict[s] = c

    sorted_sets = sorted(all_sets_dict.items(), key=lambda x: x[0].lower())

    # Build structured categorized families matching official Wiki family template
    cat_map = family_taxonomy.get_family_category_map()
    categorized = []

    for cat_key, cat_data in family_taxonomy.FAMILY_TAXONOMY.items():
        cat_entry = {
            'key': cat_key,
            'title': cat_data['title'],
            'icon': cat_data['icon'],
            'color': cat_data.get('color', '#64748b'),
            'badge_bg': cat_data.get('badge_bg', 'rgba(255,255,255,0.05)'),
            'badge_border': cat_data.get('badge_border', 'rgba(255,255,255,0.1)')
        }
        if 'families' in cat_data:
            cat_entry['families'] = [
                {
                    'name': f,
                    'count': max(families_counter.get(f, 0), wiki_fams.get(f.lower(), 0)),
                    'wiki_count': max(families_counter.get(f, 0), wiki_fams.get(f.lower(), 0))
                }
                for f in cat_data['families']
            ]
        elif 'subsections' in cat_data:
            cat_entry['subsections'] = [
                {
                    'title': sub['title'],
                    'families': [
                        {
                            'name': f,
                            'count': max(families_counter.get(f, 0), wiki_fams.get(f.lower(), 0)),
                            'wiki_count': max(families_counter.get(f, 0), wiki_fams.get(f.lower(), 0))
                        }
                        for f in sub['families']
                    ]
                }
                for sub in cat_data['subsections']
            ]
            flat_fams = []
            for sub in cat_entry['subsections']:
                flat_fams.extend(sub['families'])
            cat_entry['families'] = flat_fams
        else:
            cat_entry['families'] = []
        categorized.append(cat_entry)

    # Any other families from the database that are not in the official taxonomy
    taxonomy_names = {f.lower() for f in cat_map.keys()}
    other_families = []
    for f_name, count in families_counter.items():
        if f_name.lower() not in taxonomy_names and len(f_name) < 40:
            other_families.append({'name': f_name, 'count': count, 'wiki_count': count})
    if other_families:
        categorized.append({
            'key': 'Other',
            'title': 'Other / Unclassified',
            'icon': '📂',
            'color': '#475569',
            'badge_bg': 'rgba(255,255,255,0.05)',
            'badge_border': 'rgba(255,255,255,0.1)',
            'families': sorted(other_families, key=lambda x: x['name'].lower())
        })

    # Combine flat families with official wiki counts
    flat_families_dict = {}
    for f, c in families_counter.items():
        flat_families_dict[f] = max(c, wiki_fams.get(f.lower(), 0))
    for f, c in wiki_fams.items():
        t_f = f.title()
        if t_f not in flat_families_dict:
            flat_families_dict[t_f] = c
    sorted_families = sorted(flat_families_dict.items(), key=lambda x: x[0].lower())

    # Build structured categorized sets
    def set_sort_key(item):
        s = item['name']
        m = re.match(r'([A-Za-z]+)(\d+)', s)
        if m:
            return (m.group(1).upper(), int(m.group(2)))
        return (s.lower(), 0)

    bs_sets = []
    sd_sets = []
    cb_sets = []
    bsc_sets = []
    pb_sets = []
    promo_sets = []

    for s, c in sorted_sets:
        item = {'name': s, 'count': c, 'wiki_count': c}
        if re.match(r'^BS\d+$', s, re.IGNORECASE):
            bs_sets.append(item)
        elif re.match(r'^SD\d+$', s, re.IGNORECASE):
            sd_sets.append(item)
        elif re.match(r'^CB\d+$', s, re.IGNORECASE):
            cb_sets.append(item)
        elif re.match(r'^BSC\d+$', s, re.IGNORECASE):
            bsc_sets.append(item)
        elif re.match(r'^(PB|PC)\d*$', s, re.IGNORECASE):
            pb_sets.append(item)
        else:
            promo_sets.append(item)

    bs_sets.sort(key=set_sort_key)
    sd_sets.sort(key=set_sort_key)
    cb_sets.sort(key=set_sort_key)
    bsc_sets.sort(key=set_sort_key)
    pb_sets.sort(key=set_sort_key)
    promo_sets.sort(key=lambda x: x['name'].lower())

    categorized_sets = [
        {'key': 'boosters', 'title': 'Main Boosters', 'subtitle': 'BS01 - BS68+', 'icon': '💥', 'sets': bs_sets},
        {'key': 'starters', 'title': 'Starter & Build Decks', 'subtitle': 'SD01 - SD68+', 'icon': '📦', 'sets': sd_sets},
        {'key': 'collabs', 'title': 'Collaboration Boosters', 'subtitle': 'CB01 - CB30+ (Gundam, Digimon, Kamen Rider)', 'icon': '🤝', 'sets': cb_sets},
        {'key': 'extras', 'title': 'Extra & Theme Boosters', 'subtitle': 'BSC01 - BSC45+', 'icon': '✨', 'sets': bsc_sets},
        {'key': 'premium', 'title': 'Premium Bandai & Box Sets', 'subtitle': 'PB & PC Releases', 'icon': '🏆', 'sets': pb_sets},
        {'key': 'promos', 'title': 'Promotional & Special Releases', 'subtitle': 'Kerokero, KFC, Promo Sets', 'icon': '🎁', 'sets': promo_sets},
    ]

    conn.close()
    return {
        'types': sorted(types),
        'rarities': sorted(rarities),
        'colors': ['Red', 'Purple', 'Green', 'White', 'Yellow', 'Blue'],
        'families': [{'name': f, 'count': c, 'wiki_count': c} for f, c in sorted_families],
        'categorized_families': categorized,
        'sets': [{'name': s, 'count': c, 'wiki_count': c} for s, c in sorted_sets],
        'categorized_sets': categorized_sets
    }


def search_cards_db(query='', color='', card_type='', rarity='', cost=None,
                    family='', set_name='', sort_by='cost_asc', limit=24, offset=0,
                    scope='all'):
    conn = get_connection()
    cursor = conn.cursor()

    conditions = []
    params = []

    ARCHETYPE_JP_MAP = {
        'makai': '魔界',
        'siegfried': 'ジークフリード',
        'siegwurm': 'ジークヴルム',
        'darkwurm': 'ダークヴルム',
        'beelze': 'ベルゼ',
        'nova': 'ノヴァ',
        'dragno': 'ドラグノ',
        'lolo': 'ロロ',
    }

    if query and query.strip():
        q_raw = query.strip()
        q_like = f"%{q_raw}%"
        ql = q_raw.lower()
        scope_clean = (scope or 'all').strip().lower()

        q_parts = []
        q_args = []

        if scope_clean == 'name':
            q_parts = ['name LIKE ?', 'kanji LIKE ?', 'jpname LIKE ?']
            q_args = [q_like, q_like, q_like]
            if ql in ARCHETYPE_JP_MAP:
                jp_val = f"%{ARCHETYPE_JP_MAP[ql]}%"
                q_parts.extend(['kanji LIKE ?', 'jpname LIKE ?'])
                q_args.extend([jp_val, jp_val])
        elif scope_clean in ('effect', 'desc', 'description'):
            q_parts = ['effect LIKE ?', 'flavor LIKE ?']
            q_args = [q_like, q_like]
        elif scope_clean == 'family':
            q_parts = ['family LIKE ?', 'families_json LIKE ?']
            q_args = [q_like, q_like]
        else:  # 'all' (anywhere in card)
            q_parts = [
                'name LIKE ?',
                'family LIKE ?',
                'families_json LIKE ?',
                'effect LIKE ?',
                'flavor LIKE ?',
                'kanji LIKE ?',
                'jpname LIKE ?',
                'card_number LIKE ?'
            ]
            q_args = [q_like] * 8
            if ql in ARCHETYPE_JP_MAP:
                jp_val = f"%{ARCHETYPE_JP_MAP[ql]}%"
                q_parts.extend(['kanji LIKE ?', 'jpname LIKE ?'])
                q_args.extend([jp_val, jp_val])

        conditions.append(f"({' OR '.join(q_parts)})")
        params.extend(q_args)

    if color and color.strip() and color.lower() != 'all':
        conditions.append("colors_json LIKE ?")
        params.append(f'%{color.strip()}%')

    if card_type and card_type.strip() and card_type.lower() != 'all':
        ct_clean = card_type.strip().lower()
        if ct_clean == 'grandwalker':
            conditions.append("(LOWER(type) LIKE '%grandwalker%' OR LOWER(family) LIKE '%grandwalker%' OR families_json LIKE '%Grandwalker%' OR effect LIKE '%[Grandwalker Nexus]%' OR name LIKE '%Grandwalker%')")
        elif ct_clean == 'spirit':
            conditions.append("(LOWER(type) LIKE '%spirit%')")
        elif ct_clean == 'nexus':
            conditions.append("(LOWER(type) LIKE '%nexus%')")
        elif ct_clean == 'brave':
            conditions.append("(LOWER(type) LIKE '%brave%')")
        elif ct_clean == 'magic':
            conditions.append("(LOWER(type) LIKE '%magic%')")
        elif ct_clean == 'ultimate':
            conditions.append("(LOWER(type) LIKE '%ultimate%')")
        else:
            conditions.append('LOWER(type) = LOWER(?)')
            params.append(card_type.strip())

    if rarity and rarity.strip() and rarity.lower() != 'all':
        conditions.append('LOWER(rarity) = LOWER(?)')
        params.append(rarity.strip())

    if family and family.strip() and family.lower() != 'all':
        conditions.append('families_json LIKE ?')
        params.append(f'%{family.strip()}%')

    if set_name and set_name.strip() and set_name.lower() != 'all':
        conditions.append('sets_json LIKE ?')
        params.append(f'%{set_name.strip()}%')

    if cost is not None and str(cost).strip() != '' and str(cost).lower() != 'all':
        cost_str = str(cost).strip()
        if cost_str.endswith('+'):
            try:
                base_c = int(cost_str.rstrip('+'))
                conditions.append('cost >= ?')
                params.append(base_c)
            except ValueError:
                conditions.append('cost >= 8')
        else:
            try:
                c = int(cost_str)
                conditions.append('cost = ?')
                params.append(c)
            except ValueError:
                pass

    where_clause = ('WHERE ' + ' AND '.join(conditions)) if conditions else ''

    count_sql = f"SELECT COUNT(*) as total FROM cards {where_clause}"
    cursor.execute(count_sql, params)
    total_count = cursor.fetchone()['total']

    # Handle sorting methods
    order_clause = "ORDER BY CASE WHEN cost IS NULL THEN 999 ELSE cost END ASC, name ASC"
    if sort_by == 'name_asc':
        order_clause = "ORDER BY name ASC"
    elif sort_by == 'name_desc':
        order_clause = "ORDER BY name DESC"
    elif sort_by == 'cost_asc':
        order_clause = "ORDER BY CASE WHEN cost IS NULL THEN 999 ELSE cost END ASC, name ASC"
    elif sort_by == 'cost_desc':
        order_clause = "ORDER BY CASE WHEN cost IS NULL THEN -1 ELSE cost END DESC, name ASC"
    elif sort_by == 'number_asc':
        order_clause = """ORDER BY 
            CASE WHEN card_number IS NULL OR card_number = '' THEN 1 ELSE 0 END ASC,
            card_number ASC, name ASC"""
    elif sort_by == 'number_desc':
        order_clause = """ORDER BY 
            CASE WHEN card_number IS NULL OR card_number = '' THEN 1 ELSE 0 END ASC,
            card_number DESC, name DESC"""
    elif sort_by == 'rarity_desc':
        order_clause = """ORDER BY 
            CASE
                WHEN rarity LIKE '%XX%' THEN 6
                WHEN rarity LIKE '%X%' THEN 5
                WHEN rarity LIKE '%Master%' OR rarity = 'M' THEN 4
                WHEN rarity LIKE '%Rare%' OR rarity = 'R' THEN 3
                WHEN rarity LIKE '%Uncommon%' OR rarity = 'U' THEN 2
                WHEN rarity LIKE '%Common%' OR rarity = 'C' THEN 1
                ELSE 0
            END DESC, CASE WHEN cost IS NULL THEN 999 ELSE cost END ASC, name ASC"""
    elif sort_by == 'rarity_asc':
        order_clause = """ORDER BY 
            CASE
                WHEN rarity LIKE '%Common%' OR rarity = 'C' THEN 1
                WHEN rarity LIKE '%Uncommon%' OR rarity = 'U' THEN 2
                WHEN rarity LIKE '%Rare%' OR rarity = 'R' THEN 3
                WHEN rarity LIKE '%Master%' OR rarity = 'M' THEN 4
                WHEN rarity LIKE '%X%' THEN 5
                WHEN rarity LIKE '%XX%' THEN 6
                ELSE 0
            END ASC, CASE WHEN cost IS NULL THEN 999 ELSE cost END ASC, name ASC"""
    elif sort_by == 'type_asc':
        order_clause = """ORDER BY 
            CASE
                WHEN LOWER(type) = 'spirit' THEN 1
                WHEN LOWER(type) = 'ultimate' THEN 2
                WHEN LOWER(type) = 'brave' THEN 3
                WHEN LOWER(type) = 'grandwalker' THEN 4
                WHEN LOWER(type) = 'nexus' THEN 5
                WHEN LOWER(type) = 'magic' THEN 6
                ELSE 7
            END ASC, CASE WHEN cost IS NULL THEN 999 ELSE cost END ASC, name ASC"""

    sql = f'''
    SELECT * FROM cards
    {where_clause}
    {order_clause}
    LIMIT ? OFFSET ?
    '''
    cursor.execute(sql, params + [limit, offset])
    rows = cursor.fetchall()
    conn.close()

    cards_out = []
    for r in rows:
        d = dict(r)
        d['colors'] = json.loads(d.get('colors_json') or '[]')
        d['families'] = json.loads(d.get('families_json') or '[]')
        d['sets'] = json.loads(d.get('sets_json') or '[]')
        cards_out.append(d)

    return {
        'total': total_count,
        'page': (offset // limit) + 1,
        'limit': limit,
        'cards': cards_out
    }

def get_stats():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) as total FROM cards')
    total = cursor.fetchone()['total']
    cursor.execute('SELECT type, COUNT(*) as count FROM cards WHERE type IS NOT NULL GROUP BY type')
    types = {r['type']: r['count'] for r in cursor.fetchall()}
    conn.close()
    return {'total_cards': total, 'by_type': types}

def save_deck(deck_id, name, cards):
    conn = get_connection()
    cursor = conn.cursor()
    now = int(time.time())
    cursor.execute('''
    INSERT INTO decks (id, name, cards_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        cards_json = excluded.cards_json,
        updated_at = excluded.updated_at
    ''', (deck_id, name, json.dumps(cards), now, now))
    conn.commit()
    conn.close()
    return True

def get_decks():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM decks ORDER BY updated_at DESC')
    decks = []
    for r in cursor.fetchall():
        d = dict(r)
        d['cards'] = json.loads(d['cards_json'])
        decks.append(d)
    conn.close()
    return decks

def delete_deck(deck_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM decks WHERE id = ?', (deck_id,))
    conn.commit()
    conn.close()
    return True

def resolve_cards(identifiers):
    """
    Given a list of identifiers (card names or card numbers like 'BS01-001'),
    look them up and return a dict mapping identifier -> canonical card name.
    """
    if not identifiers:
        return {}
    conn = get_connection()
    cursor = conn.cursor()
    mapping = {}
    for ident in identifiers:
        raw = str(ident).strip()
        if not raw:
            continue
        # 1. Exact card_number match
        cursor.execute('SELECT name FROM cards WHERE LOWER(card_number) = LOWER(?) LIMIT 1', (raw,))
        row = cursor.fetchone()
        if row:
            mapping[raw] = row['name']
            continue
        # 2. Exact card name match
        cursor.execute('SELECT name FROM cards WHERE LOWER(name) = LOWER(?) LIMIT 1', (raw,))
        row = cursor.fetchone()
        if row:
            mapping[raw] = row['name']
            continue
        # 3. Substring LIKE match for name
        cursor.execute('SELECT name FROM cards WHERE name LIKE ? LIMIT 1', (f'%{raw}%',))
        row = cursor.fetchone()
        if row:
            mapping[raw] = row['name']
            continue
        # Default to raw identifier
        mapping[raw] = raw
    conn.close()
    return mapping

def hash_password(password: str, salt: str) -> str:
    return hashlib.sha256((salt + password).encode('utf-8')).hexdigest()

def create_user(username: str, login: str, password: str):
    """Register a new user account."""
    username = (username or '').strip()
    login = (login or '').strip()
    password = password or ''

    if len(username) < 2:
        return {'success': False, 'error': 'Username must be at least 2 characters.'}
    if len(login) < 3:
        return {'success': False, 'error': 'Login must be at least 3 characters.'}
    if len(password) < 4:
        return {'success': False, 'error': 'Password must be at least 4 characters.'}

    conn = get_connection()
    cursor = conn.cursor()

    # Check if login already exists (case-insensitive)
    cursor.execute('SELECT id FROM users WHERE LOWER(login) = LOWER(?) LIMIT 1', (login,))
    if cursor.fetchone():
        conn.close()
        return {'success': False, 'error': f'The login "{login}" is already registered. Please choose another or log in.'}

    user_id = str(uuid.uuid4())
    salt = secrets.token_hex(16)
    pwd_hash = hash_password(password, salt)
    now = int(time.time())

    cursor.execute('''
    INSERT INTO users (id, username, login, password_hash, salt, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ''', (user_id, username, login, pwd_hash, salt, now))
    conn.commit()
    conn.close()

    return {
        'success': True,
        'user': {
            'id': user_id,
            'username': username,
            'login': login,
            'created_at': now
        }
    }

def authenticate_user(login: str, password: str):
    """Authenticate user credentials."""
    login = (login or '').strip()
    password = password or ''

    if not login or not password:
        return {'success': False, 'error': 'Login and password are required.'}

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id, username, login, password_hash, salt, created_at FROM users WHERE LOWER(login) = LOWER(?) LIMIT 1', (login,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return {'success': False, 'error': 'Invalid login or password.'}

    expected_hash = hash_password(password, row['salt'])
    if row['password_hash'] != expected_hash:
        return {'success': False, 'error': 'Invalid login or password.'}

    return {
        'success': True,
        'user': {
            'id': row['id'],
            'username': row['username'],
            'login': row['login'],
            'created_at': row['created_at']
        }
    }

def get_user_by_login(login: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id, username, login, created_at FROM users WHERE LOWER(login) = LOWER(?) LIMIT 1', ((login or '').strip(),))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def get_user_by_id(user_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id, username, login, created_at FROM users WHERE id = ? LIMIT 1', (user_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

init_db()
