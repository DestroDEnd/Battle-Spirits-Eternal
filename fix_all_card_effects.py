import os
import sys
import time
import json
import sqlite3
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

import effect_cleaner

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'battle_spirits.db')
PROGRESS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fix_effects_progress.json')
DB_LOCK = threading.Lock()

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/javascript, */*; q=0.01',
}
API_BASE = 'https://battle-spirits.fandom.com/api.php'

def get_cards_to_fix(only_broken=False, unupdated_only=True):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    if only_broken:
        c.execute("""
            SELECT name FROM cards 
            WHERE effect LIKE '%{{%' 
               OR effect LIKE '%|%' 
               OR effect LIKE '%}}%'
               OR (length(effect) < 25 AND type NOT IN ('Nexus', 'Magic'))
            ORDER BY id ASC
        """)
        broken = [r[0] for r in c.fetchall()]
        conn.close()
        return broken

    if unupdated_only:
        c.execute("""
            SELECT name FROM cards 
            WHERE updated_at < datetime('now', '-20 minutes')
            ORDER BY id ASC
        """)
        names = [r[0] for r in c.fetchall()]
        conn.close()
        return names

    c.execute("SELECT name FROM cards ORDER BY id ASC")
    names = [r[0] for r in c.fetchall()]
    conn.close()
    return names

def fetch_and_clean_chunk(chunk, chunk_idx):
    params = {
        'action': 'query',
        'titles': '|'.join(chunk),
        'prop': 'revisions',
        'rvprop': 'content',
        'rvslots': '*',
        'format': 'json'
    }
    url = f"{API_BASE}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers=HEADERS)

    data = None
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode('utf-8'))
            break
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = (attempt + 1) * 3
                time.sleep(wait)
            else:
                break
        except Exception:
            time.sleep(1.5)

    if not data or 'query' not in data:
        return 0

    updates = []
    pages = data.get('query', {}).get('pages', {})
    for pid, p in pages.items():
        title = p.get('title')
        revs = p.get('revisions', [])
        if not revs:
            continue
        wt = revs[0].get('slots', {}).get('main', {}).get('*', '')
        if '{{CardTable' not in wt and '{{cardtable' not in wt.lower():
            continue
            
        fields = effect_cleaner.extract_template_fields_robust(wt)
        eff_raw = fields.get('effect', '')
        eff_clean = effect_cleaner.clean_card_effect(eff_raw)
        lvl_clean = effect_cleaner.clean_wikitext_general(fields.get('level', ''))
        flavor_clean = effect_cleaner.clean_wikitext_general(fields.get('enflavor1') or fields.get('flavor') or '')
        
        updates.append((eff_clean, lvl_clean, flavor_clean, title))

    if updates:
        with DB_LOCK:
            conn = sqlite3.connect(DB_PATH, timeout=30)
            c = conn.cursor()
            c.executemany("""
                UPDATE cards 
                SET effect = ?, levels = ?, flavor = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE name = ?
            """, updates)
            conn.commit()
            conn.close()

    return len(updates)

def run_fix(max_workers=5, chunk_size=45, only_broken=False):
    t_start = time.time()
    
    # Enable WAL mode for high concurrency
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    conn.close()

    card_list = get_cards_to_fix(only_broken=only_broken)
    total_cards = len(card_list)
    print(f"Targeting {total_cards} cards for effect updates (only_broken={only_broken})...")

    chunks = [card_list[i:i+chunk_size] for i in range(0, total_cards, chunk_size)]
    total_chunks = len(chunks)
    print(f"Divided into {total_chunks} chunks of ~{chunk_size} cards. Running with {max_workers} threads...")

    completed_cards = 0
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(fetch_and_clean_chunk, chunk, i+1): i for i, chunk in enumerate(chunks)}
        for future in as_completed(futures):
            try:
                count = future.result()
                completed_cards += count
            except Exception as e:
                print(f"Chunk error: {e}", file=sys.stderr)

            elapsed = time.time() - t_start
            rate = completed_cards / elapsed if elapsed > 0 else 0
            pct = (completed_cards / total_cards) * 100 if total_cards > 0 else 100

            if completed_cards % 200 == 0 or completed_cards >= total_cards:
                print(f"Progress: [{completed_cards}/{total_cards}] ({pct:.1f}%) -- Speed: {rate:.1f} cards/sec")
                try:
                    with open(PROGRESS_FILE, 'w', encoding='utf-8') as pf:
                        json.dump({
                            'completed': completed_cards,
                            'total': total_cards,
                            'percent': round(pct, 1),
                            'speed': round(rate, 1),
                            'elapsed_sec': round(elapsed, 1)
                        }, pf, indent=2)
                except Exception:
                    pass

    t_end = time.time()
    print(f"\nFinished updating {completed_cards} card effects in {t_end - t_start:.2f}s!")

if __name__ == '__main__':
    only_broken = '--only-broken' in sys.argv
    run_fix(max_workers=5, chunk_size=45, only_broken=only_broken)
