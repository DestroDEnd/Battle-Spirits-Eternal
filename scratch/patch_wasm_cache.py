import re

with open('wasm_db.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update DB_KEY
content = content.replace("const DB_KEY = 'battle_spirits.db_v1';", "const DB_KEY = 'battle_spirits.db_v2';")

# 2. Update initWasmDatabase with self-healing check and cache purging
old_init_part = """      let dbBuffer = await getCachedDbBuffer();

      if (!dbBuffer) {
        showLoadingBanner("Initializing Battle Spirits Card Database (23 MB)...");
        let res = null;
        const candidateUrls = [
          getDbUrl(),
          './battle_spirits.db',
          'battle_spirits.db',
          '/battle_spirits.db'
        ];

        for (const u of candidateUrls) {
          try {
            const testRes = await window._originalFetch(u);
            const ct = (testRes.headers && testRes.headers.get('content-type')) || '';
            if (testRes.ok && !ct.includes('text/html')) {
              res = testRes;
              console.log(`[WasmDB] Successfully loaded database binary from ${u}`);
              break;
            }
          } catch(e) {}
        }

        if (!res) throw new Error("Could not fetch battle_spirits.db from any path candidate.");
        dbBuffer = await res.arrayBuffer();
        await setCachedDbBuffer(dbBuffer);
        hideLoadingBanner();
      }

      dbInstance = new SQL.Database(new Uint8Array(dbBuffer));"""

new_init_part = """      // Proactively purge old v1 cache if present
      try {
        const idb = await openIndexedDB();
        const tx = idb.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete('battle_spirits.db_v1');
      } catch (e) {}

      let dbBuffer = await getCachedDbBuffer();
      let needsFreshFetch = !dbBuffer;

      // Self-healing check: Verify cached buffer contains the latest cards (e.g. Javad SD65-CX01)
      if (dbBuffer) {
        try {
          const testDb = new SQL.Database(new Uint8Array(dbBuffer));
          const testStmt = testDb.prepare("SELECT COUNT(*) as cnt FROM cards WHERE name = 'The PartnerDemonLord Javad'");
          if (testStmt.step()) {
            const count = testStmt.getAsObject().cnt;
            if (!count || count < 1) {
              console.warn('[WasmDB] Cached database is missing latest updates (e.g. Javad). Refreshing...');
              needsFreshFetch = true;
            }
          } else {
            needsFreshFetch = true;
          }
          testStmt.free();
          testDb.close();
        } catch (e) {
          console.warn('[WasmDB] Cache validation error, re-fetching:', e);
          needsFreshFetch = true;
        }
      }

      if (needsFreshFetch) {
        showLoadingBanner("Updating Battle Spirits Card Database (23 MB)...");
        let res = null;
        const candidateUrls = [
          getDbUrl() + '?v=2.2',
          './battle_spirits.db?v=2.2',
          'battle_spirits.db?v=2.2',
          '/battle_spirits.db?v=2.2'
        ];

        for (const u of candidateUrls) {
          try {
            const testRes = await window._originalFetch(u);
            const ct = (testRes.headers && testRes.headers.get('content-type')) || '';
            if (testRes.ok && !ct.includes('text/html')) {
              res = testRes;
              console.log(`[WasmDB] Successfully loaded database binary from ${u}`);
              break;
            }
          } catch(e) {}
        }

        if (!res) throw new Error("Could not fetch battle_spirits.db from any path candidate.");
        dbBuffer = await res.arrayBuffer();
        await setCachedDbBuffer(dbBuffer);
        hideLoadingBanner();
      }

      dbInstance = new SQL.Database(new Uint8Array(dbBuffer));"""

old_init_norm = old_init_part.replace('\r\n', '\n')
content_norm = content.replace('\r\n', '\n')

if old_init_norm in content_norm:
    content_norm = content_norm.replace(old_init_norm, new_init_part.replace('\r\n', '\n'))
    with open('wasm_db.js', 'w', encoding='utf-8', newline='\n') as f:
        f.write(content_norm)
    print("wasm_db.js patched successfully!")
else:
    print("Could not find old_init_norm in wasm_db.js")
