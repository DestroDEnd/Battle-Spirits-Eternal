import http.server
import socketserver
import urllib.parse
import urllib.request
import json
import os
import sys
import threading
import uuid
import time
import random

import database
import fetch_card

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
_FILTERS_CACHE = None

_CAPTCHA_STORE = {}
_CAPTCHA_LOCK = threading.Lock()

def generate_captcha():
    chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
    code = ''.join(random.choice(chars) for _ in range(6))
    token = str(uuid.uuid4())

    with _CAPTCHA_LOCK:
        now = time.time()
        # Clean expired (older than 10 minutes)
        expired = [k for k, v in _CAPTCHA_STORE.items() if v['expires'] < now]
        for k in expired:
            _CAPTCHA_STORE.pop(k, None)
        _CAPTCHA_STORE[token] = {
            'code': code,
            'expires': now + 600
        }

    # Generate an authentic distorted SVG with noise lines & arcs
    svg_lines = []
    svg_lines.append('<svg xmlns="http://www.w3.org/2000/svg" width="180" height="50" viewBox="0 0 180 50">')
    svg_lines.append('<rect width="180" height="50" fill="#0d1117" rx="6" stroke="#30363d" stroke-width="1"/>')
    # Background interference lines
    for _ in range(6):
        x1, y1 = random.randint(0, 180), random.randint(0, 50)
        x2, y2 = random.randint(0, 180), random.randint(0, 50)
        color = random.choice(['#ff5722', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'])
        svg_lines.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="1.5" stroke-opacity="0.35"/>')
    # Background noise dots
    for _ in range(25):
        cx, cy = random.randint(0, 180), random.randint(0, 50)
        r = random.uniform(0.8, 1.8)
        svg_lines.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="#8b949e" fill-opacity="0.3"/>')
    # Render distorted characters
    colors = ['#f87171', '#60a5fa', '#34d399', '#fbbf24', '#c084fc', '#38bdf8']
    x_positions = [18, 44, 70, 96, 122, 148]
    for i, ch in enumerate(code):
        x = x_positions[i] + random.randint(-3, 3)
        y = random.randint(32, 38)
        rot = random.randint(-18, 18)
        c = random.choice(colors)
        svg_lines.append(f'<text x="{x}" y="{y}" fill="{c}" font-family="monospace, sans-serif" font-weight="900" font-size="24" transform="rotate({rot} {x} {y})">{ch}</text>')
    svg_lines.append('</svg>')
    svg_str = ''.join(svg_lines)

    return token, code, svg_str

def verify_captcha(token: str, user_code: str) -> bool:
    if not token or not user_code:
        return False
    with _CAPTCHA_LOCK:
        item = _CAPTCHA_STORE.get(token)
        if not item:
            return False
        if time.time() > item['expires']:
            _CAPTCHA_STORE.pop(token, None)
            return False
        # Remove after verification attempt to prevent replay
        _CAPTCHA_STORE.pop(token, None)
        return item['code'].upper() == user_code.strip().upper()

def sync_set_cards_to_db(set_name, limit=50):
    """Fetch all cards for a set from Wiki and save into SQLite cache."""
    try:
        titles = fetch_card.fetch_set_card_titles(set_name, limit=limit)
        cleaned_set = database.clean_set_name(set_name) or set_name
        synced = 0
        for t in titles:
            try:
                card = fetch_card.fetch_card_details(t, download_img=False)
                if card and card.get('is_card'):
                    sets = card.get('sets') or []
                    if cleaned_set not in sets:
                        sets.append(cleaned_set)
                        card['sets'] = sets
                        database.save_card(card)
                        synced += 1
            except Exception:
                pass
        return synced
    except Exception as e:
        print(f"Error syncing set {set_name}: {e}")
        return 0

class BattleSpiritsAPIHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        try:
            payload = json.dumps(data, ensure_ascii=False).encode('utf-8')
        except UnicodeEncodeError:
            payload = json.dumps(data, ensure_ascii=True).encode('utf-8')
        self.wfile.write(payload)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # 1. Clean Page Routes
        PAGE_ROUTES = {
            '/': 'index.html',
            '/index.html': 'index.html',
            '/arena': 'arena.html',
            '/arena.html': 'arena.html',
            '/battle': 'arena.html',
            '/battle.html': 'arena.html',
            '/browse': 'browse.html',
            '/browse.html': 'browse.html',
            '/family': 'family.html',
            '/family.html': 'family.html',
            '/sets': 'sets.html',
            '/sets.html': 'sets.html',
            '/deck': 'deck.html',
            '/deck.html': 'deck.html',
            '/deck-view': 'deck_view.html',
            '/deck-view.html': 'deck_view.html',
            '/deck/view': 'deck_view.html',
            '/login': 'login.html',
            '/login.html': 'login.html',
            '/register': 'register.html',
            '/register.html': 'register.html',
        }
        if path in PAGE_ROUTES:
            filepath = os.path.join(DIRECTORY, PAGE_ROUTES[path])
            if os.path.exists(filepath):
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
                self.send_header('Pragma', 'no-cache')
                self.send_header('Expires', '0')
                self.end_headers()
                with open(filepath, 'rb') as f:
                    self.wfile.write(f.read())
                return

        # 1b. GET /api/captcha — generate security captcha challenge
        if path == '/api/captcha':
            token, code, svg = generate_captcha()
            self.send_json({'success': True, 'token': token, 'svg': svg, 'length': len(code)})
            return

        # 2. GET /api/cards — filtered paginated catalog from local DB
        if path == '/api/cards':
            q = query.get('q', [''])[0]
            scope = query.get('scope', ['all'])[0]
            color = query.get('color', [''])[0]
            card_type = query.get('type', [''])[0]
            rarity = query.get('rarity', [''])[0]
            family = query.get('family', [''])[0]
            set_name = query.get('set', [''])[0]
            cost = query.get('cost', [None])[0]
            sort_by = query.get('sort', ['cost_asc'])[0]

            # If user selected a specific family, auto-populate all cards for this family from Wiki if missing
            if family and family.lower() != 'all':
                wiki_counts = database.get_wiki_counts()
                target_count = wiki_counts.get('families', {}).get(family.lower(), 0)
                existing = database.search_cards_db(family=family, limit=1)
                if (target_count > 0 and existing['total'] < target_count) or (target_count == 0 and existing['total'] == 0):
                    cat_titles = fetch_card.fetch_category_cards(f"Category:{family}", limit=500)
                    if cat_titles:
                        fetch_card.fetch_cards_batch(cat_titles, forced_family=family)

            # If user selected a specific set, auto-populate all cards for this set if missing
            if set_name and set_name.lower() != 'all':
                wiki_counts = database.get_wiki_counts()
                target_count = wiki_counts.get('sets', {}).get(set_name, 0)
                existing = database.search_cards_db(set_name=set_name, limit=1)
                if (target_count > 0 and existing['total'] < target_count) or (target_count == 0 and existing['total'] == 0):
                    set_titles = fetch_card.fetch_set_card_titles(set_name, limit=500)
                    if set_titles:
                        fetch_card.fetch_cards_batch(set_titles, forced_set=set_name)

            # If user searches a keyword or archetype (e.g. Makai, Sieg, Darkwurm), auto-populate from Wiki if missing
            if q and len(q.strip()) >= 3 and q.lower() != 'all':
                existing_q = database.search_cards_db(query=q.strip(), scope=scope, limit=1)
                if existing_q['total'] < 15:
                    wiki_titles = fetch_card.wiki_full_search(q.strip(), limit=60)
                    if wiki_titles:
                        fetch_card.fetch_cards_batch(wiki_titles)

            limit = min(48, max(6, int(query.get('limit', [18])[0])))
            if 'offset' in query:
                try:
                    offset = max(0, int(query.get('offset', [0])[0]))
                    page = (offset // limit) + 1
                except ValueError:
                    offset = 0
                    page = 1
            else:
                try:
                    page = max(1, int(query.get('page', [1])[0]))
                except ValueError:
                    page = 1
                offset = (page - 1) * limit

            result = database.search_cards_db(
                query=q, scope=scope, color=color, card_type=card_type,
                rarity=rarity, cost=cost, family=family,
                set_name=set_name, sort_by=sort_by, limit=limit, offset=offset
            )
            result['page'] = page
            self.send_json(result)
            return

        # 3. GET /api/search?q=... or /api/autocomplete?q=... — fast autocomplete
        if path in ('/api/search', '/api/autocomplete'):
            q = query.get('q', [''])[0]
            limit_val = int(query.get('limit', [12])[0])
            results = fetch_card.search_cards(q, limit=limit_val)
            self.send_json(results)
            return

        # 4. GET /api/wiki-search — dynamically fetches cards from Wiki for search or any filter
        if path == '/api/wiki-search':
            q = query.get('q', [''])[0]
            color = query.get('color', [''])[0]
            set_name = query.get('set', [''])[0]
            family = query.get('family', [''])[0]
            card_type = query.get('type', [''])[0]

            titles = []
            forced_family = None
            forced_set = None

            if set_name and set_name.lower() != 'all':
                titles = fetch_card.fetch_set_card_titles(set_name, limit=500)
                forced_set = set_name
            elif family and family.lower() != 'all':
                titles = fetch_card.fetch_category_cards(f"Category:{family}", limit=500)
                if not titles:
                    titles = fetch_card.wiki_full_search(family, limit=100)
                forced_family = family
            elif q:
                titles = fetch_card.wiki_full_search(q, limit=60)
            elif color and color.lower() != 'all':
                titles = fetch_card.fetch_category_cards(f"Category:{color}", limit=100)
            elif card_type and card_type.lower() != 'all':
                titles = fetch_card.fetch_category_cards(f"Category:{card_type}", limit=100)

            if not titles and q:
                titles = fetch_card.wiki_full_search(q, limit=60)

            # High-performance batch card details fetch
            cards = fetch_card.fetch_cards_batch(titles, forced_family=forced_family, forced_set=forced_set)

            # If color filter specified, enforce it
            if color and color.lower() != 'all':
                filtered_cards = []
                for c in cards:
                    card_colors = c.get('colors') or ([c.get('color')] if c.get('color') else [])
                    if any(color.lower() == col.lower() for col in card_colors):
                        filtered_cards.append(c)
                cards = filtered_cards

            sort_by = query.get('sort', ['cost_asc'])[0]
            if sort_by == 'name_asc':
                cards.sort(key=lambda c: (c.get('name') or '').lower())
            elif sort_by == 'name_desc':
                cards.sort(key=lambda c: (c.get('name') or '').lower(), reverse=True)
            elif sort_by == 'cost_asc':
                cards.sort(key=lambda c: (c.get('cost') if c.get('cost') is not None else 999, (c.get('name') or '').lower()))
            elif sort_by == 'cost_desc':
                cards.sort(key=lambda c: (c.get('cost') if c.get('cost') is not None else -1, (c.get('name') or '').lower()), reverse=True)
            elif sort_by == 'number_asc':
                cards.sort(key=lambda c: (0 if c.get('card_number') else 1, c.get('card_number') or '', (c.get('name') or '').lower()))
            elif sort_by == 'number_desc':
                cards.sort(key=lambda c: (0 if c.get('card_number') else 1, c.get('card_number') or '', (c.get('name') or '').lower()), reverse=True)
            elif sort_by == 'rarity_desc':
                def r_score(r):
                    r = (r or '').lower()
                    if 'xx' in r: return 6
                    if 'x' in r: return 5
                    if 'master' in r or r == 'm': return 4
                    if 'rare' in r or r == 'r': return 3
                    if 'uncommon' in r or r == 'u': return 2
                    if 'common' in r or r == 'c': return 1
                    return 0
                cards.sort(key=lambda c: (r_score(c.get('rarity')), -(c.get('cost') if c.get('cost') is not None else 999)), reverse=True)

            self.send_json({'cards': cards, 'total': len(cards)})
            return

        # 12. GET /api/ai-weights — trained AI archetype weights from Paradoxes simulation
        if path == '/api/ai-weights':
            if os.path.exists('ai_weights.json'):
                with open('ai_weights.json', 'r', encoding='utf-8') as f:
                    self.send_json(json.load(f))
            else:
                import ai_trainer
                self.send_json(ai_trainer.DEFAULT_ARCHETYPE_PROFILES)
            return

        # 5. GET /api/card?name=... — single card details
        if path == '/api/card':
            name = query.get('name', [''])[0]
            if not name:
                self.send_json({'error': 'Card name is required'}, status=400)
                return
            card_data = fetch_card.fetch_card_details(name, download_img=False)
            self.send_json(card_data)
            return

        # 5b. GET /api/cards-batch?names=Name1|Name2|... — batch card details from DB
        if path == '/api/cards-batch':
            names_param = query.get('names', [''])[0]
            names = [n.strip() for n in names_param.split('|') if n.strip()]
            results = {}
            for n in names:
                c_data = database.get_card_by_name(n)
                if c_data:
                    results[n] = c_data
                else:
                    # Fallback to wiki fetch if not in DB
                    c_data = fetch_card.fetch_card_details(n, download_img=False)
                    if c_data and c_data.get('is_card'):
                        results[n] = c_data
            self.send_json(results)
            return

        # 6. GET /api/download-art?name=... — stream image as attachment download
        # 5c. GET /api/card-effects-db — universal NLP card effects database
        if path == '/api/card-effects-db':
            effects_file = os.path.join(DIRECTORY, 'card_effects_db.json')
            if os.path.exists(effects_file):
                try:
                    with open(effects_file, 'r', encoding='utf-8') as f:
                        self.send_json(json.load(f))
                except Exception as e:
                    self.send_json({'error': str(e)}, 500)
            else:
                self.send_json({})
            return

        if path == '/api/download-art':
            name = query.get('name', [''])[0]
            card_data = fetch_card.fetch_card_details(name, download_img=False)
            img_url = card_data.get('image_url') if card_data else None
            if not img_url:
                self.send_json({'error': 'Card art not found'}, status=404)
                return
            try:
                filename = card_data.get('image_filename') or 'card_art.jpg'
                req = urllib.request.Request(img_url, headers=fetch_card.HEADERS)
                with urllib.request.urlopen(req, timeout=15) as resp:
                    img_bytes = resp.read()
                    content_type = resp.headers.get('Content-Type', 'image/jpeg')
                self.send_response(200)
                self.send_header('Content-Type', content_type)
                self.send_header('Content-Disposition', f'attachment; filename="{filename}"')
                self.send_header('Content-Length', str(len(img_bytes)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(img_bytes)
                return
            except Exception as e:
                self.send_json({'error': f'Failed to stream image: {e}'}, status=500)
                return

        # 6b. GET /api/proxy-image?url=... — stream card image through local server with caching
        if path == '/api/proxy-image':
            img_url = query.get('url', [''])[0]
            if not img_url:
                name = query.get('name', [''])[0]
                if name:
                    card_data = database.get_card_by_name(name)
                    if card_data:
                        img_url = card_data.get('image_url')
            if not img_url:
                self.send_json({'error': 'No image URL provided'}, status=400)
                return
            try:
                img_headers = {'User-Agent': 'Mozilla/5.0', 'Accept': '*/*'}
                req = urllib.request.Request(img_url, headers=img_headers)
                with urllib.request.urlopen(req, timeout=12) as resp:
                    img_bytes = resp.read()
                    content_type = resp.headers.get('Content-Type', 'image/jpeg')
                self.send_response(200)
                self.send_header('Content-Type', content_type)
                self.send_header('Cache-Control', 'public, max-age=86400')
                self.send_header('Content-Length', str(len(img_bytes)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(img_bytes)
                return
            except Exception as e:
                self.send_json({'error': f'Failed to proxy image: {e}'}, status=502)
                return

        # 7. GET /api/filters — return distinct values for filter dropdowns
        if path == '/api/filters':
            global _FILTERS_CACHE
            if _FILTERS_CACHE is None:
                _FILTERS_CACHE = database.get_distinct_values()
            self.send_json(_FILTERS_CACHE)
            return

        # 8. GET /api/stats
        if path == '/api/stats':
            self.send_json(database.get_stats())
            return

        # 9. GET /api/decks
        if path == '/api/decks':
            self.send_json(database.get_decks())
            return

        # 10. GET /api/standard-decks — 6 canonical color starter decks
        if path == '/api/standard-decks':
            import standard_decks
            color_param = query.get('color', [''])[0]
            if color_param:
                deck = standard_decks.get_standard_deck(color_param)
                if deck:
                    self.send_json(deck)
                else:
                    self.send_json({'error': f'Standard deck for color {color_param} not found'}, status=404)
            else:
                self.send_json({'decks': standard_decks.get_all_standard_decks()})
            return

        # 11. GET /api/featured-x-rares — random color X-Rare feature cards
        if path == '/api/featured-x-rares':
            color_param = query.get('color', [''])[0].strip()
            conn = database.get_connection()
            c = conn.cursor()
            colors = ['Red', 'Purple', 'Green', 'White', 'Yellow', 'Blue']
            if color_param and color_param.capitalize() in colors:
                target_colors = [color_param.capitalize()]
                per_color = 12
            else:
                target_colors = colors
                per_color = 3

            cards = []
            for col in target_colors:
                c.execute("""
                    SELECT name, cost, color, type, family, rarity, image_url, card_number
                    FROM cards
                    WHERE color = ?
                      AND (rarity LIKE '%X%' OR rarity LIKE '%XX%')
                      AND image_url IS NOT NULL AND image_url != ''
                    ORDER BY RANDOM() LIMIT ?
                """, (col, per_color))
                for r in c.fetchall():
                    cards.append({
                        'name': r[0],
                        'cost': r[1],
                        'color': r[2],
                        'type': r[3],
                        'family': r[4],
                        'rarity': r[5],
                        'image_url': r[6],
                        'card_number': r[7]
                    })
            conn.close()
            if len(target_colors) > 1:
                import random
                random.shuffle(cards)
            self.send_json({'cards': cards, 'total': len(cards)})
            return

        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        payload = json.loads(body.decode('utf-8')) if body else {}

        # POST /api/register
        if path == '/api/register':
            username = payload.get('username', '').strip()
            login = payload.get('login', '').strip()
            password = payload.get('password', '')
            captcha_token = payload.get('captcha_token', '')
            captcha_code = payload.get('captcha_code', '')

            if not verify_captcha(captcha_token, captcha_code):
                self.send_json({'success': False, 'error': 'Invalid security captcha code. Please try again.'}, status=400)
                return

            res = database.create_user(username, login, password)
            if not res.get('success'):
                self.send_json(res, status=400)
            else:
                self.send_json(res, status=200)
            return

        # POST /api/login
        if path == '/api/login':
            login = payload.get('login', '').strip()
            password = payload.get('password', '')
            captcha_token = payload.get('captcha_token', '')
            captcha_code = payload.get('captcha_code', '')

            if not verify_captcha(captcha_token, captcha_code):
                self.send_json({'success': False, 'error': 'Invalid security captcha code. Please try again.'}, status=400)
                return

            res = database.authenticate_user(login, password)
            if not res.get('success'):
                self.send_json(res, status=401)
            else:
                self.send_json(res, status=200)
            return

        # POST /api/cards-batch — batch card details for a list of names
        if path == '/api/cards-batch':
            names = payload.get('names', [])
            results = {}
            for n in names:
                c_data = database.get_card_by_name(n)
                if c_data:
                    results[n] = c_data
                else:
                    c_data = fetch_card.fetch_card_details(n, download_img=False)
                    if c_data and c_data.get('is_card'):
                        results[n] = c_data
            self.send_json(results)
            return

        # POST /api/decks
        if path == '/api/decks':
            deck_id = payload.get('id') or str(uuid.uuid4())[:8]
            name = payload.get('name', 'Untitled Deck')
            cards = payload.get('cards', [])
            database.save_deck(deck_id, name, cards)
            self.send_json({'success': True, 'id': deck_id, 'name': name})
            return

        # POST /api/resolve-cards — batch resolve card codes/names to canonical names
        if path == '/api/resolve-cards':
            items = payload.get('items', [])
            resolved = database.resolve_cards(items)
            self.send_json({'resolved': resolved})
            return

        # POST /api/sync — index a category or set into DB in the background
        if path == '/api/sync':
            category = payload.get('category', 'Divine_Spirit')
            limit = min(100, payload.get('limit', 20))
            def run_sync():
                fetch_card.index_category_cards(category, limit=limit, download_img=False)
            threading.Thread(target=run_sync, daemon=True).start()
            self.send_json({'success': True, 'message': f'Sync started for {category} (up to {limit} cards)'})
            return

        # POST /api/train-ai — run on-demand Monte Carlo training generations
        if path == '/api/train-ai':
            generations = min(10, max(1, payload.get('generations', 3)))
            matches = min(20, max(2, payload.get('matches', 4)))
            import ai_trainer
            trainer = ai_trainer.MonteCarloAiTrainer()
            updated_profiles = trainer.train_evolutionary(generations=generations, matches_per_gen=matches)
            trainer.save_profiles('ai_weights.json')
            self.send_json({
                'success': True,
                'status': 'ok',
                'generations': generations,
                'games_played': generations * matches * 15,
                'profiles': updated_profiles,
                'trained_profiles': updated_profiles,
                'message': f'Evolutionary tournament complete ({generations} generations across all 6 archetypes).'
            })
            return

        self.send_json({'error': 'Not found'}, status=404)

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)
        if path == '/api/decks':
            deck_id = query.get('id', [''])[0]
            if deck_id:
                database.delete_deck(deck_id)
                self.send_json({'success': True})
            else:
                self.send_json({'error': 'Deck ID required'}, status=400)
            return
        self.send_json({'error': 'Not found'}, status=404)

    def log_message(self, format, *args):
        sys.stderr.write(f"[Server] {self.address_string()} - {format % args}\n")

def run():
    database.init_db()
    port = PORT
    while port < PORT + 20:
        try:
            httpd = http.server.ThreadingHTTPServer(('0.0.0.0', port), BattleSpiritsAPIHandler)
            print(f"=====================================================")
            print(f" ⚔️  Destro's BATTLE SPIRITS Colosseum Running!")
            print(f" -> Localhost: http://localhost:{port}")
            print(f" -> Direct IP: http://127.0.0.1:{port}")
            print(f"=====================================================")
            print(f" (Keep this window OPEN while using the site)")
            print(f" Press Ctrl+C to stop.")
            sys.stdout.flush()
            httpd.serve_forever()
        except OSError:
            port += 1

if __name__ == '__main__':
    run()
