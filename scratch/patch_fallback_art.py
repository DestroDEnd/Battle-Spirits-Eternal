# Patch app.js to expose window.FALLBACK_CARD_ART
with open('app.js', 'r', encoding='utf-8') as f:
    app_code = f.read()

if 'window.FALLBACK_CARD_ART =' not in app_code:
    app_code = app_code.replace('const FALLBACK_CARD_ART =', 'const FALLBACK_CARD_ART = window.FALLBACK_CARD_ART =', 1)
    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(app_code)
    print("app.js updated with window.FALLBACK_CARD_ART!")

# Patch battle_arena.js to define FALLBACK_CARD_ART and use it in hand rendering
with open('battle_arena.js', 'r', encoding='utf-8') as f:
    arena_code = f.read()

fallback_def = """  const FALLBACK_CARD_ART = (typeof window !== 'undefined' && window.FALLBACK_CARD_ART) ? window.FALLBACK_CARD_ART : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='210' height='300' viewBox='0 0 210 300'><rect width='210' height='300' rx='10' fill='%23111827'/><rect x='8' y='8' width='194' height='284' rx='6' fill='%231f2937' stroke='%23374151' stroke-width='2'/><circle cx='105' cy='140' r='40' fill='%23374151'/><text x='105' y='148' font-family='sans-serif' font-size='28' fill='%239ca3af' text-anchor='middle'>⚔️</text><text x='105' y='210' font-family='sans-serif' font-size='12' font-weight='bold' fill='%236b7280' text-anchor='middle'>BATTLE SPIRITS</text></svg>";
"""

if 'const FALLBACK_CARD_ART =' not in arena_code:
    # Insert right at the top of the IIFE
    arena_code = arena_code.replace("  'use strict';", "  'use strict';\n" + fallback_def, 1)

# Hand card image tag replacement
t_img = """<img src="${card.image_url || './assets/card_back.png'}" alt="${card.name}" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='./assets/card_back.png';" />"""
r_img = """<img src="${card.image_url || FALLBACK_CARD_ART}" alt="${card.name}" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src=FALLBACK_CARD_ART;" />"""

arena_code = arena_code.replace(t_img, r_img)

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(arena_code)

print("battle_arena.js updated with FALLBACK_CARD_ART!")
