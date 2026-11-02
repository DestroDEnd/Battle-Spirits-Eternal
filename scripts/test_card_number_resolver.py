import sys
sys.stdout.reconfigure(encoding='utf-8')
import sqlite3
import re
import urllib.parse

conn = sqlite3.connect('battle_spirits.db')
cursor = conn.cursor()

cursor.execute("""
SELECT id, name, type, image_filename, image_url, sets_json
FROM cards
""")
all_cards = cursor.fetchall()

# Pattern for card number: e.g. BS01-001, SD36-X01, CB07-024, BSC34-012, 26RBS03-X02, P21-06, etc.
# Also handles underscore variants like BS27_R_077 -> BS27-077, P21_16 -> P21-16
card_num_re1 = re.compile(r'([A-Z0-9]{2,10}-[A-Z0-9]+)', re.I)
card_num_re2 = re.compile(r'([A-Z0-9]{2,6})_(?:[CRMX]+_)?(\d{2,3}|[A-Z0-9]+)', re.I)

resolved = {}
unresolved = []

for cid, name, ctype, img_f, img_u, sets in all_cards:
    found_no = None
    
    # 1. Check img_f with standard hyphen
    m = card_num_re1.search(img_f or '')
    if m:
        found_no = m.group(1).upper()
        
    # 2. Check unquoted img_u with standard hyphen
    if not found_no and img_u:
        clean_u = urllib.parse.unquote(img_u)
        m = card_num_re1.search(clean_u)
        if m:
            found_no = m.group(1).upper()
            
    # 3. Check underscore patterns (e.g. BS27_R_077 -> BS27-077, P21_16 -> P21-16)
    if not found_no:
        for target in [img_f, img_u]:
            if not target:
                continue
            clean_t = urllib.parse.unquote(target)
            m = card_num_re2.search(clean_t)
            if m:
                s_code, c_code = m.group(1).upper(), m.group(2).upper()
                # avoid matching dimensions or generic names like Card_03 or 20px_01
                if not s_code.startswith('CARD') and not s_code.endswith('PX') and len(s_code) >= 2:
                    found_no = f"{s_code}-{c_code}"
                    break
                    
    # 4. Check name if it has parenthetical card number e.g. "The DragonEmperor Siegfried (26RBS03-X02)"
    if not found_no:
        m = card_num_re1.search(name)
        if m:
            found_no = m.group(1).upper()
            
    if found_no:
        resolved[name] = found_no
    else:
        unresolved.append((cid, name, ctype, img_f, img_u, sets))

print(f"Total cards evaluated: {len(all_cards)}")
print(f"Resolved card number: {len(resolved)} ({len(resolved)/len(all_cards)*100:.2f}%)")
print(f"Unresolved: {len(unresolved)}")

print("\nFirst 20 unresolved cards:")
for x in unresolved[:20]:
    print(f"  {x[0]}: {x[1]} ({x[2]}) | img: {x[3]} | sets: {x[5]}")

conn.close()
