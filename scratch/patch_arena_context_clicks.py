with open('battle_arena.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Add openCardDetailContext helper
fn_target = '''  function openCardDetailContext(cardName, zone = 'auto') {
    let contextList = null;
    if (zone === 'hand') {
      contextList = (DuelState.player && DuelState.player.hand ? DuelState.player.hand : []).map(c => c.name);
    } else if (zone === 'field') {
      const list = [];
      const pField = (DuelState.player && DuelState.player.field) || [];
      pField.forEach(s => {
        if (!s) return;
        list.push(s.name);
        if (s.underlyingCards && s.underlyingCards.length > 0) {
          s.underlyingCards.forEach(u => u && list.push(u.name));
        }
      });
      contextList = list;
    } else if (zone === 'opp-field') {
      const list = [];
      const oppField = (DuelState.opponent && DuelState.opponent.field) || [];
      oppField.forEach(s => {
        if (!s) return;
        list.push(s.name);
        if (s.underlyingCards && s.underlyingCards.length > 0) {
          s.underlyingCards.forEach(u => u && list.push(u.name));
        }
      });
      contextList = list;
    }
    if (typeof openCardDetail === 'function') {
      openCardDetail(cardName, contextList);
    }
  }'''

# Put it before renderFieldSpirit
target_pos = '  function renderFieldSpirit(spirit, side) {'
assert target_pos in text, 'target_pos not found'
text = text.replace(target_pos, fn_target + '\n\n' + target_pos, 1)

# In renderFieldSpirit:
# replace openCardDetail('${safeSpName}') with BattleArena.openCardDetailContext('${safeSpName}', 'field')
old_fsc = '<button class="fsc-zoom-btn" onclick="event.stopPropagation(); openCardDetail(\'${safeSpName}\')" title="Inspect Card Details">'
new_fsc = '<button class="fsc-zoom-btn" onclick="event.stopPropagation(); BattleArena.openCardDetailContext(\'${safeSpName}\', \'field\')" title="Inspect Card Details">'
assert old_fsc in text, 'old_fsc not found'
text = text.replace(old_fsc, new_fsc, 1)

# In renderPlayerHand:
# replace openCardDetail('${safeCardName}') with BattleArena.openCardDetailContext('${safeCardName}', 'hand')
old_hc = '<button class="hc-zoom-btn" onclick="event.stopPropagation(); openCardDetail(\'${safeCardName}\')" title="View Full Card Details">'
new_hc = '<button class="hc-zoom-btn" onclick="event.stopPropagation(); BattleArena.openCardDetailContext(\'${safeCardName}\', \'hand\')" title="View Full Card Details">'
assert old_hc in text, 'old_hc not found'
text = text.replace(old_hc, new_hc, 1)

# In export object of BattleArena:
export_target = '    getCardEffectsDB: () => CardEffectsDB,'
assert export_target in text, 'export_target not found'
text = text.replace(export_target, export_target + "\n    openCardDetailContext,\n    sendToTrash,\n    executeWhenSummonedEffects,\n    executeAbilityActions,\n    activateBurst,\n    endTurn,\n    renderPlayerHand,", 1)

with open('battle_arena.js', 'w', encoding='utf-8') as f:
    f.write(text)

print('SUCCESSFULLY PATCHED BATTLE ARENA CONTEXT CLICKS')
