import re

with open('wasm_db.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add getFeaturedXRares to WasmDB object and upgrade getCardsBatch
old_get_cards_batch = '''    getCardsBatch(names) {
      if (!dbInstance || !names || !names.length) return [];
      try {
        const placeholders = names.map(() => '?').join(',');
        const stmt = dbInstance.prepare(`SELECT * FROM cards WHERE name IN (${placeholders})`);
        stmt.bind(names);
        const results = [];
        while (stmt.step()) {
          const row = stmt.getAsObject();
          if (row.colors_json) {
            try { row.colors = JSON.parse(row.colors_json); } catch(e) {}
          }
          if (row.families_json) {
            try { row.families = JSON.parse(row.families_json); } catch(e) {}
          }
          if (row.sets_json) {
            try { row.sets = JSON.parse(row.sets_json); } catch(e) {}
          }
          results.push(row);
        }
        stmt.free();
        return results;
      } catch (e) {
        console.error('[WasmDB] getCardsBatch error:', e);
        return [];
      }
    },'''

new_get_cards_batch = '''    getCardsBatch(names) {
      if (!dbInstance || !names || !names.length) return [];
      try {
        const cleanNames = names.map(n => String(n).trim()).filter(Boolean);
        if (!cleanNames.length) return [];
        const placeholders = cleanNames.map(() => 'LOWER(?)').join(',');
        const stmt = dbInstance.prepare(`SELECT * FROM cards WHERE LOWER(name) IN (${placeholders})`);
        stmt.bind(cleanNames.map(n => n.toLowerCase()));
        const results = [];
        while (stmt.step()) {
          const row = stmt.getAsObject();
          if (row.colors_json) {
            try { row.colors = JSON.parse(row.colors_json); } catch(e) {}
          }
          if (row.families_json) {
            try { row.families = JSON.parse(row.families_json); } catch(e) {}
          }
          if (row.sets_json) {
            try { row.sets = JSON.parse(row.sets_json); } catch(e) {}
          }
          if (row.levels && typeof row.levels === 'string') {
            try { row.levels = JSON.parse(row.levels); } catch(e) {}
          }
          results.push(row);
        }
        stmt.free();
        return results;
      } catch (e) {
        console.error('[WasmDB] getCardsBatch error:', e);
        return [];
      }
    },

    getFeaturedXRares(color = '') {
      if (!dbInstance) return [];
      try {
        const colors = ['Red', 'Purple', 'Green', 'White', 'Yellow', 'Blue'];
        let targetColors = colors;
        let perColor = 4;
        if (color && colors.map(c => c.toLowerCase()).includes(color.toLowerCase())) {
          targetColors = [color.charAt(0).toUpperCase() + color.slice(1).toLowerCase()];
          perColor = 14;
        }
        const cards = [];
        for (const col of targetColors) {
          const stmt = dbInstance.prepare(`
            SELECT name, cost, color, type, family, rarity, image_url, card_number, effect, levels
            FROM cards
            WHERE color = ?
              AND (rarity LIKE '%X%' OR rarity LIKE '%XX%')
              AND image_url IS NOT NULL AND image_url != ''
            ORDER BY RANDOM() LIMIT ?
          `);
          stmt.bind([col, perColor]);
          while (stmt.step()) {
            const row = stmt.getAsObject();
            if (row.levels && typeof row.levels === 'string') {
              try { row.levels = JSON.parse(row.levels); } catch(e) {}
            }
            cards.push(row);
          }
          stmt.free();
        }
        return cards;
      } catch (e) {
        console.error('[WasmDB] getFeaturedXRares error:', e);
        return [];
      }
    },'''

if old_get_cards_batch in code:
    code = code.replace(old_get_cards_batch, new_get_cards_batch)
    print('Replaced getCardsBatch and added getFeaturedXRares')
else:
    print('Warning: old_get_cards_batch not found exactly, searching regex')

# 2. Update fetch routes for /api/featured-x-rares and /api/cards-batch
old_cards_batch_route = '''        if (path.endsWith('/api/cards-batch')) {
          const names = (params.names || '').split('|').filter(Boolean);
          const cards = WasmDB.getCardsBatch(names);
          return new Response(JSON.stringify({ cards }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }'''

new_routes = '''        if (path.endsWith('/api/featured-x-rares')) {
          const color = params.color || '';
          let cards = [];
          if (isReady && dbInstance) {
            cards = WasmDB.getFeaturedXRares(color);
          }
          if (!cards || !cards.length) {
            try {
              const rawRes = await window._originalFetch(getBaseDir() + 'featured_x_rares.json');
              if (rawRes.ok) {
                const staticData = await rawRes.json();
                if (color && staticData.by_color) {
                  const capColor = color.charAt(0).toUpperCase() + color.slice(1).toLowerCase();
                  if (staticData.by_color[capColor]) {
                    cards = staticData.by_color[capColor];
                  }
                }
                if (!cards || !cards.length) {
                  cards = staticData.cards || [];
                }
                cards = [...cards].sort(() => Math.random() - 0.5);
              }
            } catch(e) {}
          }
          return new Response(JSON.stringify({ cards }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        if (path.endsWith('/api/cards-batch')) {
          let names = [];
          if (init && init.body) {
            try {
              const parsed = typeof init.body === 'string' ? JSON.parse(init.body) : init.body;
              if (Array.isArray(parsed.names)) names = parsed.names;
            } catch(e) {}
          }
          if (!names.length && params.names) {
            names = params.names.split('|').filter(Boolean);
          }
          const batchMap = { cards: [] };
          if (names.length) {
            const list = WasmDB.getCardsBatch(names);
            list.forEach(c => {
              if (c && c.name) {
                batchMap[c.name] = c;
                batchMap[c.name.toLowerCase()] = c;
                batchMap.cards.push(c);
              }
            });
          }
          return new Response(JSON.stringify(batchMap), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }'''

if old_cards_batch_route in code:
    code = code.replace(old_cards_batch_route, new_routes)
    print('Updated /api/cards-batch and added /api/featured-x-rares')
else:
    print('Warning: old_cards_batch_route not found exactly')

with open('wasm_db.js', 'w', encoding='utf-8') as f:
    f.write(code)

print('wasm_db.js written successfully!')
