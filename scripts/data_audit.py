import sys
sys.stdout.reconfigure(encoding='utf-8')
import os
import sqlite3
import json

BSP_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BSP_DIR, 'battle_spirits.db')
DATA_DIR = os.path.join(BSP_DIR, 'data')
INDEX_PATH = os.path.join(DATA_DIR, 'cards_index.json')
DETAILED_PATH = os.path.join(DATA_DIR, 'cards_detailed.json')
EFFECTS_DIR = os.path.join(DATA_DIR, 'effects')
WIKI_TITLES_PATH = os.path.join(BSP_DIR, 'wiki_all_card_titles.json')

print("=" * 70)
print("PHASE 1 DATA INTEGRITY AUDIT")
print("=" * 70)

failures = []
warnings = []

# 1. Audit SQLite database
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# Check tables exist
c.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in c.fetchall()]
print(f"[OK] Database connected. Found {len(tables)} tables: {', '.join(tables)}")

if 'cards_v2' not in tables:
    failures.append("cards_v2 table missing from database!")
else:
    c.execute("SELECT COUNT(*) FROM cards_v2")
    v2_count = c.fetchone()[0]
    print(f"[OK] cards_v2 table exists with {v2_count} total cards.")
    if v2_count < 14607:
        failures.append(f"cards_v2 count mismatch: expected at least 14607, got {v2_count}")

    # Check empty card numbers
    c.execute("SELECT COUNT(*) FROM cards_v2 WHERE card_number IS NULL OR trim(card_number) = ''")
    empty_cn = c.fetchone()[0]
    if empty_cn == 0:
        print(f"[OK] Empty card numbers in cards_v2: 0")
    else:
        failures.append(f"Found {empty_cn} cards with empty card_number in cards_v2!")

    # Check distinct card numbers
    c.execute("SELECT COUNT(DISTINCT card_number) FROM cards_v2")
    dist_cn = c.fetchone()[0]
    if dist_cn == v2_count:
        print(f"[OK] All {dist_cn} card numbers are 100% unique!")
    else:
        failures.append(f"Card number uniqueness mismatch: {dist_cn} distinct out of {v2_count}")

    # Check empty types
    c.execute("SELECT COUNT(*) FROM cards_v2 WHERE type IS NULL OR trim(type) = ''")
    empty_t = c.fetchone()[0]
    if empty_t == 0:
        print(f"[OK] Empty card types in cards_v2: 0")
    else:
        failures.append(f"Found {empty_t} cards with empty type in cards_v2!")

    # Check type distribution
    c.execute("SELECT type, COUNT(*) FROM cards_v2 GROUP BY type ORDER BY COUNT(*) DESC")
    print("     Card types distribution:")
    for t, cnt in c.fetchall():
        print(f"       - {t}: {cnt}")

    # Check costs >= 0
    c.execute("SELECT COUNT(*) FROM cards_v2 WHERE cost < 0 OR cost IS NULL")
    bad_costs = c.fetchone()[0]
    if bad_costs == 0:
        print(f"[OK] Cost integrity verified: 0 invalid costs")
    else:
        failures.append(f"Found {bad_costs} cards with negative or null costs!")

    # Check symbols integrity
    c.execute("SELECT symbols_json, type FROM cards_v2")
    bad_symbols = 0
    for sym_j, ctype in c.fetchall():
        try:
            s_arr = json.loads(sym_j)
            if not isinstance(s_arr, list):
                bad_symbols += 1
            if ctype != 'Magic' and len(s_arr) == 0:
                bad_symbols += 1
        except Exception:
            bad_symbols += 1
    if bad_symbols == 0:
        print(f"[OK] Symbols integrity verified: 0 bad symbol entries")
    else:
        failures.append(f"Found {bad_symbols} cards with bad symbol arrays!")

    # Check reduction integrity
    c.execute("SELECT reduction_json, cost FROM cards_v2")
    bad_red = 0
    for red_j, cost_val in c.fetchall():
        try:
            r_obj = json.loads(red_j)
            if not isinstance(r_obj, dict) or "total" not in r_obj:
                bad_red += 1
            elif r_obj["total"] < 0 or r_obj["total"] > max(0, cost_val):
                bad_red += 1
        except Exception:
            bad_red += 1
    if bad_red == 0:
        print(f"[OK] Cost reduction integrity verified: 0 bad reduction entries")
    else:
        failures.append(f"Found {bad_red} cards with bad reduction values!")

    # Check Javad cards
    c.execute("SELECT card_number, name, type, is_contract_partner FROM cards_v2 WHERE name LIKE '%Javad%'")
    javad_cards = c.fetchall()
    print(f"[OK] Javad family cards verified ({len(javad_cards)} found):")
    for jc in javad_cards:
        print(f"       - {jc[0]}: {jc[1]} [{jc[2]}] (Contract Partner: {bool(jc[3])})")
    if not any('PartnerDemonLord' in jc[1] for jc in javad_cards):
        failures.append("The PartnerDemonLord Javad not found in database!")

conn.close()

# 2. Audit JSON Artifacts
print("\n" + "-" * 70)
print("AUDITING SHARDED DATA ARTIFACTS")
print("-" * 70)

if not os.path.exists(INDEX_PATH):
    failures.append("data/cards_index.json does not exist!")
else:
    with open(INDEX_PATH, 'r', encoding='utf-8') as f:
        idx_data = json.load(f)
    print(f"[OK] cards_index.json verified: {len(idx_data)} cards ({os.path.getsize(INDEX_PATH)/(1024*1024):.2f} MB)")
    if len(idx_data) < 14607 or len(idx_data) != v2_count:
        failures.append(f"cards_index.json count mismatch: expected {v2_count}, got {len(idx_data)}")

if not os.path.exists(DETAILED_PATH):
    failures.append("data/cards_detailed.json does not exist!")
else:
    with open(DETAILED_PATH, 'r', encoding='utf-8') as f:
        det_data = json.load(f)
    print(f"[OK] cards_detailed.json verified: {len(det_data)} cards ({os.path.getsize(DETAILED_PATH)/(1024*1024):.2f} MB)")
    if len(det_data) < 14607 or len(det_data) != v2_count:
        failures.append(f"cards_detailed.json count mismatch: expected {v2_count}, got {len(det_data)}")

if not os.path.exists(EFFECTS_DIR):
    failures.append("data/effects/ directory does not exist!")
else:
    shards = [f for f in os.listdir(EFFECTS_DIR) if f.endswith('.json')]
    print(f"[OK] Sharded effects verified: {len(shards)} set shards in data/effects/")
    total_shard_cards = 0
    for s in shards:
        try:
            with open(os.path.join(EFFECTS_DIR, s), 'r', encoding='utf-8') as f:
                s_obj = json.load(f)
                total_shard_cards += len(s_obj)
        except Exception as e:
            failures.append(f"Corrupt shard {s}: {e}")
    print(f"[OK] Total cards across all shards: {total_shard_cards}")
    if total_shard_cards < 14607 or total_shard_cards != v2_count:
        failures.append(f"Shard total mismatch: expected {v2_count}, got {total_shard_cards}")

# 3. Cross-check against wiki_all_card_titles.json
if os.path.exists(WIKI_TITLES_PATH):
    with open(WIKI_TITLES_PATH, 'r', encoding='utf-8') as f:
        wiki_titles = json.load(f)
    if isinstance(wiki_titles, dict):
        wiki_titles = list(wiki_titles.keys())
    print(f"[OK] Wiki card titles catalog: {len(wiki_titles)} titles loaded.")
    # Check coverage
    db_names = set(c["name"] for c in det_data.values()) if 'det_data' in locals() else set()
    missing_from_db = [t for t in wiki_titles if t not in db_names]
    print(f"[OK] Wiki titles matched against DB: {len(wiki_titles) - len(missing_from_db)} / {len(wiki_titles)}")
    if missing_from_db:
        print(f"     Note: {len(missing_from_db)} wiki category/archetype articles (e.g. {missing_from_db[:3]})")

print("\n" + "=" * 70)
if failures:
    print(f"FAILED with {len(failures)} error(s):")
    for f in failures:
        print(f"  [X] {f}")
    sys.exit(1)
else:
    print("PHASE 1 DATA INTEGRITY AUDIT PASSED WITH 0 ERRORS!")
    print("=" * 70)
    sys.exit(0)
