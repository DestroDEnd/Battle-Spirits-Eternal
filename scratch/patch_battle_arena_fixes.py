with open('battle_arena.js', 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Update executeStartDuel batch card extraction
old_batch_extract = '''            const res = await fetch('/api/cards-batch?names=' + encodeURIComponent(names.join('|')));
            const batchData = await res.json();
            for (const [name, count] of Object.entries(userDeck.cards)) {
              const cInfo = batchData[name] || { name, cost: 2, type: 'Spirit', color: userDeck.color || 'Red' };
              for (let i = 0; i < count; i++) {
                pCards.push({ ...cInfo });
              }
            }'''

new_batch_extract = '''            const res = await fetch('/api/cards-batch?names=' + encodeURIComponent(names.join('|')));
            const batchData = await res.json();
            for (const [name, count] of Object.entries(userDeck.cards)) {
              let cInfo = batchData[name] || batchData[name.toLowerCase()];
              if (!cInfo && batchData.cards && Array.isArray(batchData.cards)) {
                cInfo = batchData.cards.find(c => (c.name || '').toLowerCase() === name.toLowerCase());
              }
              if (!cInfo && typeof window !== 'undefined' && window.WasmDB && window.WasmDB.getCardByName) {
                cInfo = window.WasmDB.getCardByName(name);
              }
              if (!cInfo) {
                cInfo = { name, cost: 2, type: 'Spirit', color: userDeck.color || 'Red', image_url: './assets/card_back.png' };
              }
              if (!cInfo.image_url) {
                cInfo.image_url = './assets/card_back.png';
              }
              for (let i = 0; i < count; i++) {
                pCards.push({ ...cInfo });
              }
            }'''

if old_batch_extract in js:
    js = js.replace(old_batch_extract, new_batch_extract)
    print('Updated userDeck batch extraction')
else:
    print('Warning: old_batch_extract not found')

# 2. Update custom deck batch extraction
old_custom_extract = '''          const res = await fetch('/api/cards-batch?names=' + encodeURIComponent(names.join('|')));
          const batchData = await res.json();
          for (const [name, count] of Object.entries(saved)) {
            const cInfo = batchData[name] || { name, cost: 2, type: 'Spirit', color: 'Red' };
            for (let i = 0; i < count; i++) {
              pCards.push({ ...cInfo });
            }
          }'''

new_custom_extract = '''          const res = await fetch('/api/cards-batch?names=' + encodeURIComponent(names.join('|')));
          const batchData = await res.json();
          for (const [name, count] of Object.entries(saved)) {
            let cInfo = batchData[name] || batchData[name.toLowerCase()];
            if (!cInfo && batchData.cards && Array.isArray(batchData.cards)) {
              cInfo = batchData.cards.find(c => (c.name || '').toLowerCase() === name.toLowerCase());
            }
            if (!cInfo && typeof window !== 'undefined' && window.WasmDB && window.WasmDB.getCardByName) {
              cInfo = window.WasmDB.getCardByName(name);
            }
            if (!cInfo) {
              cInfo = { name, cost: 2, type: 'Spirit', color: 'Red', image_url: './assets/card_back.png' };
            }
            if (!cInfo.image_url) {
              cInfo.image_url = './assets/card_back.png';
            }
            for (let i = 0; i < count; i++) {
              pCards.push({ ...cInfo });
            }
          }'''

if old_custom_extract in js:
    js = js.replace(old_custom_extract, new_custom_extract)
    print('Updated custom deck batch extraction')
else:
    print('Warning: old_custom_extract not found')

# 3. Update enterFullscreen
old_fs = '''  function enterFullscreen() {
    try {
      const arenaEl = document.getElementById('battleArena') || (typeof document !== 'undefined' ? document.documentElement : null);
      if (!arenaEl) return;
      if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
        if (arenaEl.requestFullscreen) {
          arenaEl.requestFullscreen().catch(err => {
            console.log('Fullscreen request bypassed by browser security policy:', err);
          });
        } else if (arenaEl.webkitRequestFullscreen) {
          arenaEl.webkitRequestFullscreen();
        } else if (arenaEl.msRequestFullscreen) {
          arenaEl.msRequestFullscreen();
        }
      }
    } catch (e) {
      console.log('Fullscreen error:', e);
    }
  }'''

new_fs = '''  function enterFullscreen() {
    try {
      // Prefer document.documentElement so modals (#cardModal, #battleResultModal, etc.) are included in fullscreen
      const fsTarget = (typeof document !== 'undefined' ? document.documentElement : null) || document.getElementById('battleArena');
      if (!fsTarget) return;
      if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
        if (fsTarget.requestFullscreen) {
          fsTarget.requestFullscreen().catch(err => {
            console.log('Fullscreen request bypassed by browser security policy:', err);
          });
        } else if (fsTarget.webkitRequestFullscreen) {
          fsTarget.webkitRequestFullscreen();
        } else if (fsTarget.msRequestFullscreen) {
          fsTarget.msRequestFullscreen();
        }
      }
    } catch (e) {
      console.log('Fullscreen error:', e);
    }
  }'''

if old_fs in js:
    js = js.replace(old_fs, new_fs)
    print('Updated enterFullscreen to use document.documentElement')
else:
    print('Warning: old_fs not found')

# 4. Make sure renderPlayerHand has safe image fallback
old_hand_img = '''<img src="${card.image_url}" alt="${card.name}" referrerpolicy="no-referrer" onerror="if(!this.dataset.retried && this.src.startsWith('http')){this.dataset.retried='1'; this.src='/api/proxy-image?url=' + encodeURIComponent(this.src);} else {this.onerror=null; this.src='./assets/card_back.png';}">'''
new_hand_img = '''<img src="${card.image_url || './assets/card_back.png'}" alt="${card.name}" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='./assets/card_back.png';">'''

if old_hand_img in js:
    js = js.replace(old_hand_img, new_hand_img)
    print('Updated hand card image tag fallback')
else:
    print('Warning: old_hand_img not found')

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(js)

print('battle_arena.js patched successfully!')
