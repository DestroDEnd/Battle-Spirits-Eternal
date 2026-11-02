import sys

# Patch app.js
with open('app.js', 'r', encoding='utf-8') as f:
    app_content = f.read()

target_app = """  // 5. Card Name References: Make referenced card names in quotes clickable!
  safe = safe.replace(/(?:&quot;|")([A-Za-z0-9\\s,'\\-\\.]+?)(?:&quot;|")/g, (match, cardName) => {
    const trimmed = cardName.trim();
    const exclude = new Set([
      'Ancient Dragon', 'Astral Dragon', 'Ogre Wizard', 'Evil God', 'DemonLord',
      'Hell Contract', 'Purple', 'Red', 'Green', 'White', 'Yellow', 'Blue',
      'Your Turn', "Opponent's Turn", 'Either Attack Step', 'Your Attack Step', "Opponent's Attack Step"
    ]);
    if (exclude.has(trimmed)) return match;
    if (trimmed.startsWith('The ') || (typeof CardEffectsDB !== 'undefined' && CardEffectsDB[trimmed])) {
      const safeJs = trimmed.replace(/'/g, "\\\\'");
      return `"<span class="card-ref-link" onclick="event.stopPropagation(); if (typeof openCardDetail === 'function') openCardDetail('${safeJs}')" style="color:#60a5fa; text-decoration:underline; font-weight:700; cursor:pointer;" title="Click to inspect ${trimmed}">${trimmed}</span>"`;
    }
    return match;
  });"""

replacement_app = """  // 5. Card Name References: Make referenced card names in quotes clickable!
  safe = safe.replace(/(?:&quot;|"|[“”「」])([A-Za-z0-9\\s,'\\-\\.]+?)(?:&quot;|"|[”"」])/gu, (match, cardName) => {
    const trimmed = cardName.trim();
    const exclude = new Set([
      'Ancient Dragon', 'Astral Dragon', 'Ogre Wizard', 'Evil God', 'DemonLord',
      'Hell Contract', 'Purple', 'Red', 'Green', 'White', 'Yellow', 'Blue',
      'Your Turn', "Opponent's Turn", 'Either Attack Step', 'Your Attack Step', "Opponent's Attack Step"
    ]);
    if (exclude.has(trimmed)) return match;
    const isKnownCard = trimmed.startsWith('The ') ||
      (typeof CardEffectsDB !== 'undefined' && CardEffectsDB[trimmed]) ||
      (typeof WasmDB !== 'undefined' && WasmDB.getCardByName && WasmDB.getCardByName(trimmed));
    if (isKnownCard) {
      const safeJs = trimmed.replace(/'/g, "\\\\'");
      return `"<span class="card-ref-link" onclick="event.stopPropagation(); if (typeof openCardDetail === 'function') openCardDetail('${safeJs}')" style="color:#60a5fa; text-decoration:underline; font-weight:700; cursor:pointer;" title="Click to inspect ${trimmed}">${trimmed}</span>"`;
    }
    return match;
  });"""

# Normalize CRLF
target_norm = target_app.replace('\r\n', '\n')
app_norm = app_content.replace('\r\n', '\n')
if target_norm in app_norm:
    app_norm = app_norm.replace(target_norm, replacement_app.replace('\r\n', '\n'))
    with open('app.js', 'w', encoding='utf-8', newline='\n') as f:
        f.write(app_norm)
    print("app.js patched successfully!")
else:
    print("Could not find target in app.js")

# Patch battle_arena.js
with open('battle_arena.js', 'r', encoding='utf-8') as f:
    arena_content = f.read()

target_arena = """    // 5. Card Name References: Make referenced card names in quotes clickable!
    safe = safe.replace(/(?:&quot;|")([A-Za-z0-9\\s,'\\-\\.]+?)(?:&quot;|")/g, (match, cardName) => {
      const trimmed = cardName.trim();
      const exclude = new Set([
        'Ancient Dragon', 'Astral Dragon', 'Ogre Wizard', 'Evil God', 'DemonLord',
        'Hell Contract', 'Purple', 'Red', 'Green', 'White', 'Yellow', 'Blue',
        'Your Turn', "Opponent's Turn", 'Either Attack Step', 'Your Attack Step', "Opponent's Attack Step"
      ]);
      if (exclude.has(trimmed)) return match;
      if (trimmed.startsWith('The ') || (typeof CardEffectsDB !== 'undefined' && CardEffectsDB[trimmed])) {
        const safeJs = trimmed.replace(/'/g, "\\\\'");
        return `"<span class="card-ref-link" onclick="event.stopPropagation(); if (typeof openCardDetail === 'function') openCardDetail('${safeJs}')" style="color:#60a5fa; text-decoration:underline; font-weight:700; cursor:pointer;" title="Click to inspect ${trimmed}">${trimmed}</span>"`;
      }
      return match;
    });"""

replacement_arena = """    // 5. Card Name References: Make referenced card names in quotes clickable!
    safe = safe.replace(/(?:&quot;|"|[“”「」])([A-Za-z0-9\\s,'\\-\\.]+?)(?:&quot;|"|[”"」])/gu, (match, cardName) => {
      const trimmed = cardName.trim();
      const exclude = new Set([
        'Ancient Dragon', 'Astral Dragon', 'Ogre Wizard', 'Evil God', 'DemonLord',
        'Hell Contract', 'Purple', 'Red', 'Green', 'White', 'Yellow', 'Blue',
        'Your Turn', "Opponent's Turn", 'Either Attack Step', 'Your Attack Step', "Opponent's Attack Step"
      ]);
      if (exclude.has(trimmed)) return match;
      const isKnownCard = trimmed.startsWith('The ') ||
        (typeof CardEffectsDB !== 'undefined' && CardEffectsDB[trimmed]) ||
        (typeof WasmDB !== 'undefined' && WasmDB.getCardByName && WasmDB.getCardByName(trimmed));
      if (isKnownCard) {
        const safeJs = trimmed.replace(/'/g, "\\\\'");
        return `"<span class="card-ref-link" onclick="event.stopPropagation(); if (typeof openCardDetail === 'function') openCardDetail('${safeJs}')" style="color:#60a5fa; text-decoration:underline; font-weight:700; cursor:pointer;" title="Click to inspect ${trimmed}">${trimmed}</span>"`;
      }
      return match;
    });"""

arena_norm = arena_content.replace('\r\n', '\n')
target_arena_norm = target_arena.replace('\r\n', '\n')
if target_arena_norm in arena_norm:
    arena_norm = arena_norm.replace(target_arena_norm, replacement_arena.replace('\r\n', '\n'))
    with open('battle_arena.js', 'w', encoding='utf-8', newline='\n') as f:
        f.write(arena_norm)
    print("battle_arena.js patched successfully!")
else:
    print("Could not find target in battle_arena.js")
