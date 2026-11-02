import sys
sys.stdout.reconfigure(encoding='utf-8')

# 1. Patch app.js
with open('app.js', 'r', encoding='utf-8') as f:
    app_text = f.read()

old_app_format = '''  safe = safe.replace(allKwPattern, (match) => {
    let cls = 'kw-generic';
    const low = match.toLowerCase();
    if (low.includes('advent') || low.includes('twinkle')) cls = 'kw-advent';
    else if (low.includes('clash')) cls = 'kw-clash';
    else if (low.includes('curse')) cls = 'kw-curse';
    else if (low.includes('crush')) cls = 'kw-crush';
    else if (low.includes('holy life') || low.includes('heavenly light')) cls = 'kw-holylife';
    else if (low.includes('windstorm') || low.includes('whirlwind')) cls = 'kw-windstorm';
    else if (low.includes('assault')) cls = 'kw-assault';
    else if (low.includes('high speed') || low.includes('swift') || low.includes('sound speed')) cls = 'kw-highspeed';
    else if (low.includes('awaken')) cls = 'kw-awaken';
    else if (low.includes('immortality') || low.includes('revive')) cls = 'kw-immortality';
    else if (low.includes('soul drive')) cls = 'kw-souldrive';
    else if (low.includes('soul core')) cls = 'kw-soul-core';
    else if (low.includes('ice wall')) cls = 'kw-icewall';
    else if (low.includes('armor') || low.includes('field')) cls = 'kw-armor';
    else if (low.includes('burst')) cls = 'kw-burst';
    else if (low.includes('flash')) cls = 'kw-flash';
    else if (low.includes('tribute')) cls = 'kw-tribute';
    else if (low.includes('consecutive blade')) cls = 'kw-consecutive';
    else if (low.includes('mirage')) cls = 'kw-mirage';
    else if (low.includes('spellbind')) cls = 'kw-spellbind';
    else if (low.includes('accel')) cls = 'kw-accel';
    else if (low.includes('change')) cls = 'kw-change';
    else if (low.includes('charge')) cls = 'kw-charge';
    else if (low.includes('rush')) cls = 'kw-rush';
    else if (low.includes('rebirth')) cls = 'kw-rebirth';
    else if (low.includes('unleash')) cls = 'kw-unleash';
    else if (low.includes('grand')) cls = 'kw-grand';
    return `<span class="effect-keyword-pill ${cls}">${match}</span>`;
  });
  return safe;'''

new_app_format = '''  safe = safe.replace(allKwPattern, (match) => {
    let cls = 'kw-generic';
    const low = match.toLowerCase();
    if (low.includes('advent') || low.includes('twinkle')) cls = 'kw-advent';
    else if (low.includes('clash')) cls = 'kw-clash';
    else if (low.includes('curse')) cls = 'kw-curse';
    else if (low.includes('crush')) cls = 'kw-crush';
    else if (low.includes('holy life') || low.includes('heavenly light')) cls = 'kw-holylife';
    else if (low.includes('windstorm') || low.includes('whirlwind')) cls = 'kw-windstorm';
    else if (low.includes('assault')) cls = 'kw-assault';
    else if (low.includes('high speed') || low.includes('swift') || low.includes('sound speed')) cls = 'kw-highspeed';
    else if (low.includes('awaken')) cls = 'kw-awaken';
    else if (low.includes('immortality') || low.includes('revive')) cls = 'kw-immortality';
    else if (low.includes('soul drive')) cls = 'kw-souldrive';
    else if (low.includes('soul core')) cls = 'kw-soul-core';
    else if (low.includes('ice wall')) cls = 'kw-icewall';
    else if (low.includes('armor') || low.includes('field')) cls = 'kw-armor';
    else if (low.includes('burst')) cls = 'kw-burst';
    else if (low.includes('flash')) cls = 'kw-flash';
    else if (low.includes('tribute')) cls = 'kw-tribute';
    else if (low.includes('consecutive blade')) cls = 'kw-consecutive';
    else if (low.includes('mirage')) cls = 'kw-mirage';
    else if (low.includes('spellbind')) cls = 'kw-spellbind';
    else if (low.includes('accel')) cls = 'kw-accel';
    else if (low.includes('change')) cls = 'kw-change';
    else if (low.includes('charge')) cls = 'kw-charge';
    else if (low.includes('rush')) cls = 'kw-rush';
    else if (low.includes('rebirth')) cls = 'kw-rebirth';
    else if (low.includes('unleash')) cls = 'kw-unleash';
    else if (low.includes('grand')) cls = 'kw-grand';
    return `<span class="effect-keyword-pill ${cls}">${match}</span>`;
  });

  // 5. Card Name References: Make referenced card names in quotes clickable!
  safe = safe.replace(/(?:&quot;|")([A-Za-z0-9\s,'\-\.]+?)(?:&quot;|")/g, (match, cardName) => {
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
  });

  return safe;'''

assert old_app_format in app_text, 'old_app_format not found in app.js'
app_text = app_text.replace(old_app_format, new_app_format, 1)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(app_text)
print('SUCCESSFULLY PATCHED app.js')


# 2. Patch battle_arena.js
with open('battle_arena.js', 'r', encoding='utf-8') as f:
    arena_text = f.read()

# 2A. Update formatEffectKeywords with clickable card names
old_arena_format = '''    safe = safe.replace(allKwPattern, (match) => {
      let cls = 'kw-generic';
      const low = match.toLowerCase();
      if (low.includes('advent') || low.includes('twinkle')) cls = 'kw-advent';
      else if (low.includes('clash')) cls = 'kw-clash';
      else if (low.includes('curse')) cls = 'kw-curse';
      else if (low.includes('crush')) cls = 'kw-crush';
      else if (low.includes('holy life') || low.includes('heavenly light')) cls = 'kw-holylife';
      else if (low.includes('windstorm') || low.includes('whirlwind')) cls = 'kw-windstorm';
      else if (low.includes('assault')) cls = 'kw-assault';
      else if (low.includes('high speed') || low.includes('swift') || low.includes('sound speed')) cls = 'kw-highspeed';
      else if (low.includes('awaken')) cls = 'kw-awaken';
      else if (low.includes('immortality') || low.includes('revive')) cls = 'kw-immortality';
      else if (low.includes('soul drive')) cls = 'kw-souldrive';
      else if (low.includes('soul core')) cls = 'kw-soul-core';
      else if (low.includes('ice wall')) cls = 'kw-icewall';
      else if (low.includes('armor') || low.includes('field')) cls = 'kw-armor';
      else if (low.includes('burst')) cls = 'kw-burst';
      else if (low.includes('flash')) cls = 'kw-flash';
      else if (low.includes('tribute')) cls = 'kw-tribute';
      else if (low.includes('consecutive blade')) cls = 'kw-consecutive';
      else if (low.includes('mirage')) cls = 'kw-mirage';
      else if (low.includes('spellbind')) cls = 'kw-spellbind';
      else if (low.includes('accel')) cls = 'kw-accel';
      else if (low.includes('change')) cls = 'kw-change';
      else if (low.includes('charge')) cls = 'kw-charge';
      else if (low.includes('rush')) cls = 'kw-rush';
      else if (low.includes('rebirth')) cls = 'kw-rebirth';
      else if (low.includes('unleash')) cls = 'kw-unleash';
      else if (low.includes('grand')) cls = 'kw-grand';
      return `<span class="effect-keyword-pill ${cls}">${match}</span>`;
    });
    return safe;'''

new_arena_format = '''    safe = safe.replace(allKwPattern, (match) => {
      let cls = 'kw-generic';
      const low = match.toLowerCase();
      if (low.includes('advent') || low.includes('twinkle')) cls = 'kw-advent';
      else if (low.includes('clash')) cls = 'kw-clash';
      else if (low.includes('curse')) cls = 'kw-curse';
      else if (low.includes('crush')) cls = 'kw-crush';
      else if (low.includes('holy life') || low.includes('heavenly light')) cls = 'kw-holylife';
      else if (low.includes('windstorm') || low.includes('whirlwind')) cls = 'kw-windstorm';
      else if (low.includes('assault')) cls = 'kw-assault';
      else if (low.includes('high speed') || low.includes('swift') || low.includes('sound speed')) cls = 'kw-highspeed';
      else if (low.includes('awaken')) cls = 'kw-awaken';
      else if (low.includes('immortality') || low.includes('revive')) cls = 'kw-immortality';
      else if (low.includes('soul drive')) cls = 'kw-souldrive';
      else if (low.includes('soul core')) cls = 'kw-soul-core';
      else if (low.includes('ice wall')) cls = 'kw-icewall';
      else if (low.includes('armor') || low.includes('field')) cls = 'kw-armor';
      else if (low.includes('burst')) cls = 'kw-burst';
      else if (low.includes('flash')) cls = 'kw-flash';
      else if (low.includes('tribute')) cls = 'kw-tribute';
      else if (low.includes('consecutive blade')) cls = 'kw-consecutive';
      else if (low.includes('mirage')) cls = 'kw-mirage';
      else if (low.includes('spellbind')) cls = 'kw-spellbind';
      else if (low.includes('accel')) cls = 'kw-accel';
      else if (low.includes('change')) cls = 'kw-change';
      else if (low.includes('charge')) cls = 'kw-charge';
      else if (low.includes('rush')) cls = 'kw-rush';
      else if (low.includes('rebirth')) cls = 'kw-rebirth';
      else if (low.includes('unleash')) cls = 'kw-unleash';
      else if (low.includes('grand')) cls = 'kw-grand';
      return `<span class="effect-keyword-pill ${cls}">${match}</span>`;
    });

    // 5. Card Name References: Make referenced card names in quotes clickable!
    safe = safe.replace(/(?:&quot;|")([A-Za-z0-9\s,'\-\.]+?)(?:&quot;|")/g, (match, cardName) => {
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
    });

    return safe;'''

assert old_arena_format in arena_text, 'old_arena_format not found in battle_arena.js'
arena_text = arena_text.replace(old_arena_format, new_arena_format, 1)

# 2B. Prevent SUMMON_FREE from auto-summoning when card has twinkle necromancy
old_summon_free = '''      } else if (actType === 'SUMMON_FREE') {
        const pool = act.source === 'trash' ? (friendlyState.trashCards || friendlyState.trashPile || []) : friendlyState.hand;'''

new_summon_free = '''      } else if (actType === 'SUMMON_FREE') {
        if ((card.effect || '').toLowerCase().includes('twinkle necromancy') || (card.name || '').includes('Siegfried-Necro')) {
          // Handled specifically with interactive choice / one-of-each constraint by Twinkle Necromancy
          continue;
        }
        const pool = act.source === 'trash' ? (friendlyState.trashCards || friendlyState.trashPile || []) : friendlyState.hand;'''

assert old_summon_free in arena_text, 'old_summon_free not found in battle_arena.js'
arena_text = arena_text.replace(old_summon_free, new_summon_free, 1)

# 2C. Add promptTwinkleNecromancyModal and replace twinkle necromancy logic
old_twinkle = '''    // 2. THE MAKAI PHANTOM DRAGON SIEGFRIED-NECRO: [Twinkle Necromancy] (When Advents)
    // "You can summon Cost 0/1/3/6/9 Spirit cards, one of each, from your Trash, without paying the cost."
    if (effLower.includes('twinkle necromancy') || (effLower.includes('when advents') && /cost\\s*(?:0\\/1\\/3\\/6\\/9|[\\d\\/]+)\\s*spirit\\s*cards/i.test(effLower))) {
      const allowedCosts = [0, 1, 3, 6, 9];
      const reanimated = [];

      for (const targetCost of allowedCosts) {
        const tIdx = myTrash.findIndex(c => (c.type === 'Spirit' || !c.type) && (c.cost === targetCost));
        if (tIdx !== -1) {
          const card = myTrash.splice(tIdx, 1)[0];
          const spiritInstance = {
            ...card,
            uid: 'sp_' + Math.random().toString(36).slice(2, 9),
            currentCores: 1,
            hasSoulCore: false,
            isExhausted: false,
            hasAttacked: false,
            battleBp: 0
          };
          if (myReserve.reserve > 0) {
            myReserve.reserve -= 1;
          }
          const { level, bp } = calculateBpAndLevel(spiritInstance.levels, spiritInstance.currentCores, false, spiritInstance.effect);
          spiritInstance.currentLevel = level;
          spiritInstance.currentBp = bp;
          myField.push(spiritInstance);
          reanimated.push(`${spiritInstance.name} (Cost ${targetCost})`);
          executeWhenSummonedEffects(spiritInstance, side);
        }
      }

      if (reanimated.length > 0) {
        AudioFX.summon();
        addLog(`💀 **[TWINKLE NECROMANCY: ${spirit.name}]**: Reanimated ${reanimated.length} Spirit(s) from Trash onto the battlefield: ${reanimated.join(', ')}!`, 'magic');
        if (typeof showToast === 'function') {
          showToast(`💀 [Twinkle Necromancy]: Reanimated ${reanimated.length} Spirits from Trash!`, 'success');
        }
        renderDuelTable();
      } else {
        addLog(`ℹ️ **[TWINKLE NECROMANCY: ${spirit.name}]**: No Cost 0/1/3/6/9 Spirits found in Trash to reanimate.`, 'step');
      }
    }'''

new_twinkle = '''    // 2. THE MAKAI PHANTOM DRAGON SIEGFRIED-NECRO: [Twinkle Necromancy] (When Advents)
    // "You can summon Cost 0/1/3/6/9 Spirit cards, one of each, from your Trash, without paying the cost."
    if (effLower.includes('twinkle necromancy') || (effLower.includes('when advents') && /cost\\s*(?:0\\/1\\/3\\/6\\/9|[\\d\\/]+)\\s*spirit\\s*cards/i.test(effLower))) {
      const allowedCosts = [0, 1, 3, 6, 9];
      const costGroups = { 0: [], 1: [], 3: [], 6: [], 9: [] };
      myTrash.forEach(c => {
        if ((c.type === 'Spirit' || !c.type) && costGroups[c.cost] !== undefined) {
          costGroups[c.cost].push(c);
        }
      });

      const hasAny = allowedCosts.some(cost => costGroups[cost] && costGroups[cost].length > 0);
      if (!hasAny) {
        addLog(`ℹ️ **[TWINKLE NECROMANCY: ${spirit.name}]**: No Cost 0/1/3/6/9 Spirits found in Trash to reanimate.`, 'step');
      } else {
        promptTwinkleNecromancyModal(spirit, side, costGroups, (selectedSpirits) => {
          if (!selectedSpirits || !selectedSpirits.length) return;
          const reanimated = [];
          for (const card of selectedSpirits) {
            const tIdx = myTrash.findIndex(c => c.uid === card.uid);
            if (tIdx !== -1) {
              myTrash.splice(tIdx, 1);
            }
            const spiritInstance = {
              ...card,
              uid: 'sp_' + Math.random().toString(36).slice(2, 9),
              currentCores: 1,
              hasSoulCore: false,
              isExhausted: false,
              hasAttacked: false,
              battleBp: 0
            };
            if (myReserve.reserve > 0) {
              myReserve.reserve -= 1;
            }
            const { level, bp } = calculateBpAndLevel(spiritInstance.levels, spiritInstance.currentCores, false, spiritInstance.effect);
            spiritInstance.currentLevel = level;
            spiritInstance.currentBp = bp;
            myField.push(spiritInstance);
            reanimated.push(`${spiritInstance.name} (Cost ${card.cost})`);
            executeWhenSummonedEffects(spiritInstance, side);
          }

          if (reanimated.length > 0) {
            AudioFX.summon();
            addLog(`💀 **[TWINKLE NECROMANCY: ${spirit.name}]**: Reanimated ${reanimated.length} Spirit(s) from Trash (one per cost tier): ${reanimated.join(', ')}!`, 'magic');
            if (typeof showToast === 'function') {
              showToast(`💀 [Twinkle Necromancy]: Reanimated ${reanimated.length} Spirits!`, 'success');
            }
            renderDuelTable();
            if (side === 'player') renderPlayerHand();
          }
        });
      }
    }'''

assert old_twinkle in arena_text, 'old_twinkle not found in battle_arena.js'
arena_text = arena_text.replace(old_twinkle, new_twinkle, 1)

# 2D. Add promptTwinkleNecromancyModal definition
prompt_fn = '''  function promptTwinkleNecromancyModal(spirit, side, costGroups, onConfirm) {
    if (side !== 'player' || typeof document === 'undefined' || !document.body || typeof document.createElement !== 'function') {
      const selected = [];
      for (const cost of [0, 1, 3, 6, 9]) {
        if (costGroups[cost] && costGroups[cost].length > 0) {
          const sorted = [...costGroups[cost]].sort((a, b) => (b.lv1Bp || b.currentBp || 0) - (a.lv1Bp || a.currentBp || 0));
          selected.push(sorted[0]);
        }
      }
      if (onConfirm) onConfirm(selected);
      return;
    }

    const box = document.createElement('div');
    box.className = 'optional-effect-popup twinkle-necromancy-modal';
    box.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:100001;width:min(480px,94vw);max-height:85vh;overflow-y:auto;background:#111827;border:2px solid #ec4899;border-radius:14px;padding:18px 20px;box-shadow:0 16px 45px rgba(0,0,0,.85);color:#e5e7eb;font-size:.88rem;';

    const selections = {};
    for (const cost of [0, 1, 3, 6, 9]) {
      if (costGroups[cost] && costGroups[cost].length > 0) {
        selections[cost] = costGroups[cost][0].uid;
      }
    }

    const render = () => {
      let costSectionsHtml = '';
      for (const cost of [0, 1, 3, 6, 9]) {
        const cards = costGroups[cost];
        if (!cards || !cards.length) continue;
        costSectionsHtml += `
          <div style="margin-bottom:12px;background:rgba(255,255,255,0.03);border:1px solid #374151;border-radius:8px;padding:10px;">
            <div style="font-weight:800;color:#f472b6;font-size:0.85rem;margin-bottom:6px;display:flex;justify-content:space-between;">
              <span>COST ${cost} SPIRIT (Pick at most 1)</span>
              <span style="font-size:0.75rem;color:#9ca3af;">${cards.length} available</span>
            </div>
            ${cards.map(c => {
              const isSel = selections[cost] === c.uid;
              return `
                <div class="twinkle-opt-row" data-cost="${cost}" data-uid="${_optEsc(c.uid)}" style="display:flex;align-items:center;justify-content:space-between;padding:6px 10px;margin-bottom:4px;border-radius:6px;cursor:pointer;background:${isSel ? 'rgba(236,72,153,0.22)' : 'rgba(0,0,0,0.2)'};border:1px solid ${isSel ? '#ec4899' : '#374151'};">
                  <div style="display:flex;align-items:center;gap:8px;">
                    <span style="display:inline-block;width:16px;height:16px;border-radius:50%;border:2px solid ${isSel ? '#ec4899' : '#6b7280'};background:${isSel ? '#ec4899' : 'transparent'};"></span>
                    <span style="font-weight:700;color:${isSel ? '#fdf2f8' : '#e5e7eb'};font-size:0.84rem;">${_optEsc(c.name)}</span>
                  </div>
                  <span style="font-size:0.75rem;color:#cbd5e1;">Lv1 ${c.lv1Bp || 1000} BP</span>
                </div>
              `;
            }).join('')}
            <div class="twinkle-opt-none" data-cost="${cost}" style="display:flex;align-items:center;gap:8px;padding:4px 10px;cursor:pointer;font-size:0.75rem;color:${selections[cost] === null ? '#ec4899' : '#9ca3af'};">
              <span style="display:inline-block;width:14px;height:14px;border-radius:50%;border:1px solid ${selections[cost] === null ? '#ec4899' : '#4b5563'};background:${selections[cost] === null ? '#ec4899' : 'transparent'};"></span>
              <span>Do not summon Cost ${cost}</span>
            </div>
          </div>
        `;
      }

      box.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
          <div style="font-weight:900;font-size:1.05rem;color:#f472b6;">🌟 Twinkle Necromancy</div>
          <span style="font-size:0.75rem;background:#831843;color:#fbcfe8;padding:2px 8px;border-radius:10px;">[When Advents]</span>
        </div>
        <div style="font-size:0.8rem;color:#cbd5e1;line-height:1.35;margin-bottom:12px;">
          You can summon Cost 0/1/3/6/9 Spirit cards, <strong>one of each</strong>, from your Trash without paying cost:
        </div>
        ${costSectionsHtml}
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:14px;">
          <button id="btnTwinkleSkip" style="padding:7px 14px;background:#374151;color:#e5e7eb;border:none;border-radius:6px;font-weight:700;cursor:pointer;font-size:0.82rem;">Skip All</button>
          <button id="btnTwinkleConfirm" style="padding:7px 16px;background:linear-gradient(135deg,#db2777,#ec4899);color:#fff;border:none;border-radius:6px;font-weight:800;cursor:pointer;font-size:0.82rem;box-shadow:0 0 10px rgba(236,72,153,0.4);">Confirm Summon</button>
        </div>
      `;

      box.querySelectorAll('.twinkle-opt-row').forEach(row => {
        row.onclick = () => {
          const cost = row.dataset.cost;
          const uid = row.dataset.uid;
          selections[cost] = uid;
          render();
        };
      });

      box.querySelectorAll('.twinkle-opt-none').forEach(row => {
        row.onclick = () => {
          const cost = row.dataset.cost;
          selections[cost] = null;
          render();
        };
      });

      const btnSkip = box.querySelector('#btnTwinkleSkip');
      if (btnSkip) btnSkip.onclick = () => {
        if (box.parentNode) box.parentNode.removeChild(box);
        if (onConfirm) onConfirm([]);
      };

      const btnConfirm = box.querySelector('#btnTwinkleConfirm');
      if (btnConfirm) btnConfirm.onclick = () => {
        if (box.parentNode) box.parentNode.removeChild(box);
        const selectedCards = [];
        for (const cost of [0, 1, 3, 6, 9]) {
          const selUid = selections[cost];
          if (selUid) {
            const card = costGroups[cost].find(c => c.uid === selUid);
            if (card) selectedCards.push(card);
          }
        }
        if (onConfirm) onConfirm(selectedCards);
      };
    };

    render();
    document.body.appendChild(box);
  }
'''

# Insert prompt_fn right before executeWhenAdventsEffects
advent_fn_target = '  function executeWhenAdventsEffects(spirit, side = \'player\') {'
assert advent_fn_target in arena_text, 'advent_fn_target not found'
arena_text = arena_text.replace(advent_fn_target, prompt_fn + '\n\n' + advent_fn_target, 1)

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(arena_text)
print('SUCCESSFULLY PATCHED battle_arena.js')
