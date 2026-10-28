import urllib.request
import urllib.parse
import json
import re
import os
import sys

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

import database
import effect_cleaner

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Accept-Language': 'en-US,en;q=0.9',
}
API_BASE = 'https://battle-spirits.fandom.com/api.php'

def clean_wikitext(text):
    return effect_cleaner.clean_wikitext_general(text)

def extract_template_fields(wikitext):
    return effect_cleaner.extract_template_fields_robust(wikitext)

def search_cards(query, limit=12):
    """Fast autocomplete via opensearch."""
    if not query or not query.strip():
        return []
    params = {
        'action': 'opensearch',
        'search': query.strip(),
        'limit': limit,
        'format': 'json'
    }
    url = f"{API_BASE}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            if len(data) > 1 and isinstance(data[1], list):
                return data[1]
    except Exception as e:
        print(f"Autocomplete error: {e}", file=sys.stderr)
    return []

def wiki_full_search(query, limit=50):
    """Full wiki search: handles colors, sets, categories, and keyword searches."""
    if not query or not query.strip():
        return []
    
    q_clean = query.strip()
    ql = q_clean.lower()

    # 1. Special case: Colors -> query Category:{Color} directly (e.g. Category:Purple)
    color_map = {
        'purple': 'Purple',
        'red': 'Red',
        'green': 'Green',
        'white': 'White',
        'yellow': 'Yellow',
        'blue': 'Blue'
    }
    if ql in color_map:
        cat_title = f"Category:{color_map[ql]}"
        return fetch_category_cards(cat_title, limit=limit)

    # 2. Special case: Set page or category (e.g. KFC Promo, BS01)
    if 'kfc' in ql:
        return fetch_set_card_titles('KFC Promo', limit=limit)

    # 3. Standard text search on wiki
    titles = []
    params = {
        'action': 'query',
        'list': 'search',
        'srsearch': q_clean,
        'srlimit': limit,
        'srnamespace': 0,
        'srprop': 'titlesnippet',
        'format': 'json'
    }
    url = f"{API_BASE}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            results = data.get('query', {}).get('search', [])
            titles = [r['title'] for r in results]
    except Exception as e:
        print(f"Full search error: {e}", file=sys.stderr)

    # 4. If query matches an archetype or topic page, also pull direct card links from that page
    try:
        page_url = f"{API_BASE}?action=parse&page={urllib.parse.quote(q_clean.replace(' ', '_'))}&prop=links&format=json"
        with urllib.request.urlopen(urllib.request.Request(page_url, headers=HEADERS), timeout=6) as resp:
            pd = json.loads(resp.read().decode('utf-8'))
        if 'parse' in pd:
            links = [l['*'] for l in pd['parse'].get('links', []) if l.get('ns') == 0]
            for l in links:
                if l not in titles and not any(x in l.lower() for x in ['category', 'rule', 'episode', 'set list', 'season', 'anime']):
                    titles.append(l)
    except Exception:
        pass

    return titles

def get_image_url(image_filename, candidate_images=None, card_number=None):
    """Get direct high-res image URL, with multi-extension and candidate fallbacks."""
    imgs_to_try = []
    if image_filename:
        clean_fn = re.sub(r'^File:', '', image_filename, flags=re.IGNORECASE).strip()
        imgs_to_try.append(clean_fn)
        base, ext = os.path.splitext(clean_fn)
        if ext.lower() == '.png':
            imgs_to_try.append(base + '.jpg')
            imgs_to_try.append(base + '.jpeg')
        elif ext.lower() in ['.jpg', '.jpeg']:
            imgs_to_try.append(base + '.png')
    
    if card_number:
        clean_cn = card_number.strip()
        imgs_to_try.append(f"{clean_cn}.jpg")
        imgs_to_try.append(f"{clean_cn}.png")

    if candidate_images:
        for c in candidate_images:
            clean_c = re.sub(r'^File:', '', c, flags=re.IGNORECASE).strip()
            if clean_c not in imgs_to_try and not re.search(r'core|soul|icon|symbol|logo|thumb|banner|category', clean_c, re.IGNORECASE):
                imgs_to_try.append(clean_c)

    file_titles = [f"File:{img}" for img in imgs_to_try if img]
    if not file_titles:
        return None

    # Query all candidate files in one single batch request
    params = {
        'action': 'query',
        'titles': '|'.join(file_titles[:25]),
        'prop': 'imageinfo',
        'iiprop': 'url',
        'format': 'json'
    }
    url = f"{API_BASE}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read().decode('utf-8'))
        pages = data.get('query', {}).get('pages', {})
        # Return first candidate that has imageinfo
        found_map = {}
        for p in pages.values():
            if 'imageinfo' in p and p['imageinfo']:
                url_val = p['imageinfo'][0].get('url')
                found_map[p['title'].lower()] = url_val
                found_map[re.sub(r'^file:', '', p['title'], flags=re.IGNORECASE).strip().lower()] = url_val
        for ft in file_titles:
            c_key = re.sub(r'^File:', '', ft, flags=re.IGNORECASE).strip().lower()
            if c_key in found_map:
                return found_map[c_key]
    except Exception:
        pass

    return None

def download_image(img_url, dest_folder='images', filename=None):
    if not img_url:
        return None
    os.makedirs(dest_folder, exist_ok=True)
    if not filename:
        filename = img_url.split('/')[-1].split('?')[0]
    dest_path = os.path.join(dest_folder, filename)
    if os.path.exists(dest_path) and os.path.getsize(dest_path) > 0:
        return dest_path
    req = urllib.request.Request(img_url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            with open(dest_path, 'wb') as f:
                f.write(resp.read())
        return dest_path
    except Exception as e:
        print(f"Download error: {e}", file=sys.stderr)
        return None

def parse_wikitext_card(wikitext, page_title, categories, raw_images=None):
    """Parse a card's wikitext into a structured dict with full multi-color, family, and set support."""
    fields = extract_template_fields(wikitext)

    # --- Colors: support multi-color cards ---
    colors = []
    raw_color = clean_wikitext(fields.get('color', ''))
    if raw_color:
        for c in re.split(r'[/,\s]+', raw_color):
            c = c.strip()
            if c and c in ['Red', 'Purple', 'Green', 'White', 'Yellow', 'Blue']:
                if c not in colors:
                    colors.append(c)

    # Also check color1, color2, color3 keys
    for i in range(1, 6):
        c = clean_wikitext(fields.get(f'color{i}', ''))
        if c in ['Red', 'Purple', 'Green', 'White', 'Yellow', 'Blue'] and c not in colors:
            colors.append(c)

    # Check categories for color tags (e.g. Category:Purple, Category:Red)
    if not colors:
        for cat in categories:
            cat_clean = cat.replace('Category:', '').strip()
            if cat_clean in ['Red', 'Purple', 'Green', 'White', 'Yellow', 'Blue']:
                if cat_clean not in colors:
                    colors.append(cat_clean)

    # --- Card type ---
    card_type = clean_wikitext(fields.get('type', ''))
    if not card_type:
        for t in ['Brave', 'Ultimate', 'Grandwalker', 'Nexus', 'Magic', 'Spirit']:
            if any(t.lower() == cat.lower().replace('category:', '') for cat in categories):
                card_type = t
                break

    # --- Families: support multiple ---
    raw_family = clean_wikitext(fields.get('family', ''))
    families = []
    if raw_family:
        for f in re.split(r'[/\n,]', raw_family):
            f = f.strip()
            if f and len(f) < 50 and f not in families:
                families.append(f)

    # --- Sets: collect set1..20, subset1..20, categories, and validate via database.clean_set_name ---
    sets = []
    for k, v in fields.items():
        kl = k.lower()
        if kl.startswith('set') or kl.startswith('subset'):
            cleaned = clean_wikitext(v)
            for s in re.split(r'[,/]', cleaned):
                valid_s = database.clean_set_name(s)
                if valid_s and valid_s not in sets:
                    sets.append(valid_s)

    # Also extract set names from categories - ONLY if they match standard set codes!
    for cat in categories:
        cat_clean = cat.replace('Category:', '').strip()
        if re.match(r'^(BS|BSC|CB|SD|PB|PC|SE|LM|SJ|SA|PX|SS|RV)\d+', cat_clean, re.IGNORECASE) or 'promo' in cat_clean.lower():
            valid_s = database.clean_set_name(cat_clean)
            if valid_s and valid_s not in sets:
                sets.append(valid_s)

    # Rarity, flavor, effects, cost
    rarity = clean_wikitext(fields.get('rarity1') or fields.get('rarity') or '')
    flavor = clean_wikitext(fields.get('enflavor1') or fields.get('flavor') or '')
    effect = effect_cleaner.clean_card_effect(fields.get('effect', ''))
    levels = clean_wikitext(fields.get('level', ''))
    cost = fields.get('cost', '').strip()

    primary_color = colors[0] if colors else 'Yellow'
    primary_family = families[0] if families else ''

    # Image filename candidate
    image_filename = fields.get('image', '').strip()

    return {
        'cost': cost,
        'color': primary_color,
        'colors': colors,
        'type': card_type,
        'family': primary_family,
        'families': families,
        'sets': sets,
        'levels': levels,
        'effect': effect,
        'rarity': rarity,
        'flavor': flavor,
        'kanji': fields.get('kanji', ''),
        'jpname': clean_wikitext(fields.get('jpname', '')),
        'image_filename': image_filename,
        'symbol': clean_wikitext(fields.get('symbols', '')),
    }

def fetch_card_details(page_title, download_img=False, force_refresh=False):
    page_title = page_title.replace('https://battle-spirits.fandom.com/wiki/', '').replace('_', ' ').strip()

    # Check DB cache first
    if not force_refresh:
        cached = database.get_card_by_name(page_title)
        if cached and cached.get('image_url'):
            cached['is_card'] = True
            return cached

    params = {
        'action': 'parse',
        'page': page_title,
        'prop': 'wikitext|images|categories',
        'format': 'json'
    }
    url = f"{API_BASE}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        return {'error': f"Failed to connect: {str(e)}"}

    if 'parse' not in data:
        return {'error': f"Card '{page_title}' not found on wiki."}

    wikitext = data['parse']['wikitext']['*']
    categories = [c['*'] for c in data['parse'].get('categories', [])]
    raw_images = data['parse'].get('images', [])
    actual_title = data['parse']['title']

    # Not a card page
    if '{{CardTable' not in wikitext:
        cards_in_category = fetch_category_cards(actual_title, limit=20)
        return {
            'is_card': False,
            'title': actual_title,
            'type': 'Family / Category Page',
            'summary': clean_wikitext(wikitext.split('==')[0]),
            'sample_cards_in_family': cards_in_category,
            'categories': categories,
            'images': raw_images
        }

    parsed = parse_wikitext_card(wikitext, actual_title, categories, raw_images=raw_images)
    image_url = get_image_url(parsed['image_filename'], candidate_images=raw_images)
    local_path = None
    if download_img and image_url:
        local_path = download_image(image_url, filename=parsed['image_filename'])

    card_info = {
        'is_card': True,
        'name': actual_title,
        'kanji': parsed['kanji'],
        'jpname': parsed['jpname'],
        'cost': parsed['cost'],
        'color': parsed['color'],
        'colors': parsed['colors'],
        'type': parsed['type'],
        'family': parsed['family'],
        'families': parsed['families'],
        'sets': parsed['sets'],
        'symbol': parsed['symbol'],
        'levels': parsed['levels'],
        'effect': parsed['effect'],
        'rarity': parsed['rarity'],
        'flavor': parsed['flavor'],
        'image_filename': parsed['image_filename'],
        'image_url': image_url,
        'local_image_path': local_path
    }

    # Save to DB
    database.save_card(card_info)
    return card_info

def fetch_category_cards(category_name, limit=500):
    """Fetch all category members from the Wiki, supporting pagination up to limit."""
    cat_title = category_name if category_name.startswith('Category:') else f'Category:{category_name}'
    titles = []
    cmcontinue = None

    while len(titles) < limit:
        fetch_len = min(500, limit - len(titles))
        params = {
            'action': 'query',
            'list': 'categorymembers',
            'cmtitle': cat_title.replace(' ', '_'),
            'cmlimit': fetch_len,
            'format': 'json'
        }
        if cmcontinue:
            params['cmcontinue'] = cmcontinue
        url = f"{API_BASE}?{urllib.parse.urlencode(params)}"
        req = urllib.request.Request(url, headers=HEADERS)
        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                data = json.loads(resp.read().decode('utf-8'))
            mems = [m['title'] for m in data.get('query', {}).get('categorymembers', []) if m.get('ns') == 0]
            titles.extend(mems)
            cmcontinue = data.get('continue', {}).get('cmcontinue')
            if not cmcontinue or not mems:
                break
        except Exception as e:
            print(f"Category fetch error: {e}", file=sys.stderr)
            break

    return titles[:limit]

def fetch_cards_batch(titles, forced_family=None, forced_set=None, batch_size=40):
    """
    Fetch card wikitext and metadata for up to hundreds of titles in fast batch chunks.
    Saves each card to SQLite database and returns the list of cards.
    """
    if not titles:
        return []

    cards = []
    for i in range(0, len(titles), batch_size):
        chunk = titles[i:i+batch_size]
        params = {
            'action': 'query',
            'titles': '|'.join(chunk),
            'prop': 'revisions|images|categories',
            'rvprop': 'content',
            'rvslots': '*',
            'format': 'json'
        }
        url = f"{API_BASE}?{urllib.parse.urlencode(params)}"
        req = urllib.request.Request(url, headers=HEADERS)
        data = None
        for attempt in range(4):
            try:
                with urllib.request.urlopen(req, timeout=15) as resp:
                    data = json.loads(resp.read().decode('utf-8'))
                break
            except urllib.error.HTTPError as e:
                if e.code == 429:
                    time.sleep(2 * (attempt + 1))
                else:
                    break
            except Exception:
                time.sleep(1)
                break

        if not data:
            continue
        try:
            pages = data.get('query', {}).get('pages', {})

            file_titles = []
            parsed_cards = []
            for pid, p in pages.items():
                title = p.get('title')
                revs = p.get('revisions', [])
                if not revs:
                    continue
                wikitext = revs[0].get('slots', {}).get('main', {}).get('*', '')
                if '{{CardTable' not in wikitext:
                    continue
                cats = [c.get('title', '') for c in p.get('categories', [])]
                raw_imgs = [img['title'] for img in p.get('images', [])]
                parsed = parse_wikitext_card(wikitext, title, cats, raw_images=raw_imgs)

                # Ensure forced_family is in families
                if forced_family:
                    fams = parsed.get('families') or []
                    if forced_family not in fams:
                        fams.append(forced_family)
                        parsed['families'] = fams

                # Ensure forced_set is in sets
                if forced_set:
                    c_sets = parsed.get('sets') or []
                    c_clean = database.clean_set_name(forced_set) or forced_set
                    if c_clean not in c_sets:
                        c_sets.append(c_clean)
                        parsed['sets'] = c_sets

                # Collect all file candidates for this card
                card_files = []
                img_fn = parsed.get('image_filename', '').strip()
                if img_fn:
                    clean_f = re.sub(r'^File:', '', img_fn, flags=re.IGNORECASE).strip()
                    card_files.append(clean_f)
                    base, ext = os.path.splitext(clean_f)
                    if ext.lower() == '.png':
                        card_files.append(base + '.jpg')
                        card_files.append(base + '.jpeg')
                    elif ext.lower() in ['.jpg', '.jpeg']:
                        card_files.append(base + '.png')

                # Also try card number as filename (e.g. BS01-001.jpg, BS01-001.png)
                c_num = database.extract_card_number(img_fn, title)
                if c_num:
                    card_files.append(f"{c_num}.jpg")
                    card_files.append(f"{c_num}.png")

                # Also try raw image filenames from page
                for r_img in raw_imgs:
                    clean_r = re.sub(r'^File:', '', r_img, flags=re.IGNORECASE).strip()
                    if clean_r not in card_files and not re.search(r'core|soul|icon|symbol|logo|thumb|banner|category', clean_r, re.IGNORECASE):
                        card_files.append(clean_r)

                parsed['_candidate_files'] = card_files
                for cf in card_files:
                    file_titles.append(f"File:{cf}")

                parsed_cards.append((p, parsed, raw_imgs, c_num))

            # Batch resolve image URLs in slices of 50
            image_map = {}
            unique_file_titles = list(dict.fromkeys(file_titles))
            for f_idx in range(0, len(unique_file_titles), 50):
                f_slice = unique_file_titles[f_idx:f_idx+50]
                img_params = {
                    'action': 'query',
                    'titles': '|'.join(f_slice),
                    'prop': 'imageinfo',
                    'iiprop': 'url',
                    'format': 'json'
                }
                img_url = f"{API_BASE}?{urllib.parse.urlencode(img_params)}"
                idata = None
                for attempt in range(4):
                    try:
                        with urllib.request.urlopen(urllib.request.Request(img_url, headers=HEADERS), timeout=10) as resp:
                            idata = json.loads(resp.read().decode('utf-8'))
                        break
                    except urllib.error.HTTPError as e:
                        if e.code == 429:
                            time.sleep(2 * (attempt + 1))
                        else:
                            break
                    except Exception:
                        break
                if idata:
                    for ipid, ip in idata.get('query', {}).get('pages', {}).items():
                        if 'imageinfo' in ip and ip['imageinfo']:
                            url_val = ip['imageinfo'][0].get('url')
                            image_map[ip['title'].lower()] = url_val
                            image_map[re.sub(r'^file:', '', ip['title'], flags=re.IGNORECASE).strip().lower()] = url_val

            for p, parsed, raw_imgs, c_num in parsed_cards:
                img_fn = parsed.get('image_filename', '')
                img_url = None
                for cf in parsed.get('_candidate_files', []):
                    c_key = cf.strip().lower()
                    if c_key in image_map:
                        img_url = image_map[c_key]
                        break

                if not img_url:
                    img_url = get_image_url(img_fn, raw_imgs, c_num)

                card_info = {
                    'is_card': True,
                    'name': p['title'],
                    'cost': parsed['cost'],
                    'color': parsed['color'],
                    'colors': parsed['colors'],
                    'type': parsed['type'],
                    'family': parsed['family'],
                    'families': parsed['families'],
                    'sets': parsed['sets'],
                    'rarity': parsed['rarity'],
                    'effect': parsed['effect'],
                    'levels': parsed['levels'],
                    'flavor': parsed['flavor'],
                    'symbol': parsed['symbol'],
                    'kanji': parsed['kanji'],
                    'jpname': parsed['jpname'],
                    'image_filename': img_fn,
                    'image_url': img_url,
                    'local_image_path': None
                }
                database.save_card(card_info)
                cards.append(card_info)
        except Exception as e:
            print(f"Batch query error: {e}", file=sys.stderr)

    return cards

def fetch_set_card_titles(set_name, limit=60):
    """Fetch card titles from set categories or set page links (e.g. BS01, Kerokero Starter, KFC Promo)."""
    clean_name = set_name.strip()

    # 1. If it's a standard set code (BS01, SD01, CB02...), Category:CODE gives clean card lists!
    if re.match(r'^(BS|BSC|CB|SD|PB|PC|SE|LM|SJ|SA|PX|SS|RV)\d+$', clean_name, re.IGNORECASE):
        cat_cards = fetch_category_cards(f"Category:{clean_name.upper()}", limit=limit)
        if cat_cards:
            return cat_cards

    # 2. Try exact wiki page links (great for starter decks and promo sets like Kerokero_Starter, KFC_Promo)
    page_url = f"{API_BASE}?action=parse&page={urllib.parse.quote(clean_name.replace(' ', '_'))}&prop=links&format=json"
    req = urllib.request.Request(page_url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            pd = json.loads(resp.read().decode('utf-8'))
        if 'parse' in pd:
            links = [l['*'] for l in pd['parse'].get('links', []) if l.get('ns') == 0]
            # Exclude non-card links and other set navigation links
            cards = []
            for l in links:
                ll = l.lower()
                if re.match(r'^(BS|BSC|CB|SD|PB|PC|SE|LM|SJ|SA|PX|SS|RV)\d+$', l, re.IGNORECASE):
                    continue
                if any(x in ll for x in ['promo cards', 'category', 'rule', 'episode', 'set list', 'file:', 'anime', 'season', 'manga', 'battle spirits']):
                    continue
                cards.append(l)
            if cards:
                return cards[:limit]
    except Exception:
        pass

    # 3. Try category fallback
    cat_cards = fetch_category_cards(clean_name, limit=limit)
    if cat_cards:
        return cat_cards

    # 4. Try full search fallback on wiki
    return wiki_full_search(clean_name, limit=limit)

def index_category_cards(category_name, limit=20, download_img=False):
    print(f"Indexing up to {limit} cards from: {category_name}...")
    if 'kfc' in category_name.lower():
        card_titles = fetch_set_card_titles('KFC Promo', limit=limit)
    else:
        card_titles = fetch_category_cards(category_name, limit=limit)
        if not card_titles:
            card_titles = fetch_set_card_titles(category_name, limit=limit)

    indexed = []
    for title in card_titles:
        try:
            print(f" -> Indexing: {title}")
            card = fetch_card_details(title, download_img=download_img, force_refresh=True)
            if card and card.get('is_card'):
                indexed.append(card['name'])
        except Exception as e:
            print(f"Error indexing {title}: {e}")
    print(f"Done. Indexed {len(indexed)} cards.")
    return indexed

if __name__ == '__main__':
    query = sys.argv[1] if len(sys.argv) > 1 else 'The CreationDragonEmperor Generator-Siegfried'
    print(f"Fetching: {query}...")
    result = fetch_card_details(query, download_img=False, force_refresh=True)
    print(json.dumps(result, indent=2, ensure_ascii=False))
