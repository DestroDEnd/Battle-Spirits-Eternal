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

import database
import fetch_card

DB_LOCK = threading.Lock()

CATEGORIES = [
    'Category:Spirit',
    'Category:Brave',
    'Category:Magic',
    'Category:Nexus',
    'Category:Ultimate',
    'Category:Grandwalker'
]

TITLES_CACHE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'wiki_all_card_titles.json')

def get_all_wiki_card_titles():
    """Collect all unique card titles across the 6 major card categories, with disk caching and 429 retries."""
    if os.path.exists(TITLES_CACHE_FILE):
        try:
            with open(TITLES_CACHE_FILE, 'r', encoding='utf-8') as f:
                cached = json.load(f)
            if cached and len(cached) > 10000:
                print(f"Loaded {len(cached)} card titles from local cache ({TITLES_CACHE_FILE}).")
                return cached
        except Exception:
            pass

    print("Collecting all card titles from Battle Spirits Wiki...")
    all_titles = set()
    for cat in CATEGORIES:
        cmcontinue = None
        count_cat = 0
        while True:
            params = {
                'action': 'query',
                'list': 'categorymembers',
                'cmtitle': cat,
                'cmlimit': 500,
                'cmtype': 'page',
                'format': 'json'
            }
            if cmcontinue:
                params['cmcontinue'] = cmcontinue
            url = f"{fetch_card.API_BASE}?{urllib.parse.urlencode(params)}"
            req = urllib.request.Request(url, headers=fetch_card.HEADERS)

            data = None
            for attempt in range(5):
                try:
                    with urllib.request.urlopen(req, timeout=15) as resp:
                        data = json.loads(resp.read().decode('utf-8'))
                    break
                except urllib.error.HTTPError as e:
                    if e.code == 429:
                        wait = (attempt + 1) * 6
                        print(f"Rate limited (429) fetching {cat}. Waiting {wait}s...", file=sys.stderr)
                        time.sleep(wait)
                    else:
                        print(f"HTTP {e.code} on {cat}: {e}", file=sys.stderr)
                        break
                except Exception as e:
                    time.sleep(2)
                    break

            if not data:
                break

            mems = data.get('query', {}).get('categorymembers', [])
            for m in mems:
                if m.get('ns') == 0:
                    all_titles.add(m['title'])
                    count_cat += 1
            cmcontinue = data.get('continue', {}).get('cmcontinue')
            if not cmcontinue or not mems:
                break
            time.sleep(0.3)
        print(f"  -> {cat}: {count_cat} cards")

    result = sorted(list(all_titles))
    if len(result) > 10000:
        try:
            with open(TITLES_CACHE_FILE, 'w', encoding='utf-8') as f:
                json.dump(result, f, indent=1)
        except Exception:
            pass
    return result

def get_already_imported_cards():
    """Get set of card names already in DB with valid image_url."""
    conn = database.get_connection()
    cur = conn.cursor()
    cur.execute("SELECT name FROM cards WHERE image_url IS NOT NULL AND image_url != ''")
    names = set(r[0] for r in cur.fetchall())
    conn.close()
    return names

def process_chunk(chunk, chunk_idx, total_chunks):
    """Fetch and parse a chunk of up to 40 cards, saving them to SQLite."""
    try:
        cards = fetch_card.fetch_cards_batch(chunk, batch_size=len(chunk))
        time.sleep(0.15)
        with DB_LOCK:
            return len(cards)
    except Exception as e:
        print(f"Error processing chunk {chunk_idx}: {e}", file=sys.stderr)
        return 0

def run_import(max_cards=None, max_workers=4):
    t_start = time.time()
    all_titles = get_all_wiki_card_titles()
    already_done = get_already_imported_cards()

    needed = [t for t in all_titles if t not in already_done]
    print(f"\nTotal wiki cards: {len(all_titles)}")
    print(f"Already in database with valid art: {len(already_done)}")
    print(f"Cards remaining to import: {len(needed)}")

    if max_cards:
        needed = needed[:max_cards]
        print(f"Limiting to first {max_cards} cards for this run.")

    if not needed:
        print("All cards are already fully imported!")
        return

    chunk_size = 40
    chunks = [needed[i:i+chunk_size] for i in range(0, len(needed), chunk_size)]
    total_chunks = len(chunks)
    print(f"Starting import across {total_chunks} chunks using {max_workers} worker threads...\n")

    imported_count = 0
    progress_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'import_progress.json')

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(process_chunk, chunk, i+1, total_chunks): i for i, chunk in enumerate(chunks)}
        for future in as_completed(futures):
            count = future.result()
            imported_count += count
            elapsed = time.time() - t_start
            rate = imported_count / elapsed if elapsed > 0 else 0
            pct = (imported_count / len(needed)) * 100
            print(f"Progress: [{imported_count}/{len(needed)}] ({pct:.1f}%) -- Speed: {rate:.1f} cards/sec")

            try:
                with open(progress_file, 'w', encoding='utf-8') as pf:
                    json.dump({
                        'status': 'running',
                        'imported_this_session': imported_count,
                        'total_needed': len(needed),
                        'percent': round(pct, 1),
                        'speed_cards_sec': round(rate, 1),
                        'elapsed_sec': round(elapsed, 1),
                        'last_update': time.strftime('%Y-%m-%d %H:%M:%S')
                    }, pf, indent=2)
            except Exception:
                pass

    t_end = time.time()
    try:
        with open(progress_file, 'w', encoding='utf-8') as pf:
            json.dump({
                'status': 'completed',
                'imported_this_session': imported_count,
                'total_needed': len(needed),
                'percent': 100.0,
                'elapsed_sec': round(t_end - t_start, 1),
                'completed_at': time.strftime('%Y-%m-%d %H:%M:%S')
            }, pf, indent=2)
    except Exception:
        pass
    print(f"\nImport finished! {imported_count} cards imported in {t_end - t_start:.2f}s.")

if __name__ == '__main__':
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else None
    run_import(max_cards=limit)
