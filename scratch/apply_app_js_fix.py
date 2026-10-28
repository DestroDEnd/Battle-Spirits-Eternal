app_path = 'app.js'
with open(app_path, 'r', encoding='utf-8') as f:
    app_content = f.read()

# Define checkCardUsageRestriction in app.js if not already defined
helper_func = '''function checkCardUsageRestriction(card, side = 'player') {
  if (!card || !card.effect) return { allowed: true };
  if (typeof BattleArena !== 'undefined' && BattleArena.checkCardUsageRestriction) {
    return BattleArena.checkCardUsageRestriction(card, side);
  }
  const text = (card.effect || '').toLowerCase();
  const isOurTurn = (typeof DuelState !== 'undefined' && DuelState.activePlayer === side);
  const phase = (typeof DuelState !== 'undefined' && DuelState.phases) ? DuelState.phases[DuelState.phaseIndex] : 'MAIN';

  if (text.includes("can't be used on your turn") || 
      text.includes("cannot be used on your turn") ||
      text.includes("can't be used during your turn") ||
      text.includes("cannot be used during your turn") ||
      text.includes("自分のターンでは使用できず") ||
      text.includes("usable only on opponent's turn") ||
      text.includes("usable only during opponent's turn") ||
      text.includes("can only be used on opponent's turn") ||
      text.includes("can only be used during opponent's turn") ||
      text.includes("usable only during opposing turn")) {
    if (isOurTurn) {
      return { allowed: false, reason: "Cannot be used on Your Turn (Opponent's Turn only)" };
    }
  }

  if (text.includes("can only be used on your turn") ||
      text.includes("can only be used during your turn") ||
      text.includes("usable only on your turn")) {
    if (!isOurTurn) {
      return { allowed: false, reason: "Can only be used on Your Turn" };
    }
  }

  if (text.includes("can't be used in main step") ||
      text.includes("cannot be used in main step") ||
      text.includes("can't be used during main step") ||
      text.includes("cannot be used during main step") ||
      text.includes("usable only in attack step") ||
      text.includes("can only be used in attack step") ||
      text.includes("can only be used during attack step")) {
    if (phase === 'MAIN') {
      return { allowed: false, reason: "Cannot be used in Main Step (Attack Step only)" };
    }
  }

  if (text.includes("can't be used in attack step") ||
      text.includes("cannot be used in attack step") ||
      text.includes("can only be used in main step") ||
      text.includes("usable only in main step")) {
    if (phase === 'ATTACK') {
      return { allowed: false, reason: "Cannot be used in Attack Step (Main Step only)" };
    }
  }

  return { allowed: true };
}

async function openCardDetail(name, contextList) {'''

assert 'async function openCardDetail(name, contextList) {' in app_content, "openCardDetail not found!"
app_content = app_content.replace('async function openCardDetail(name, contextList) {', helper_func)

# Replace handCard duelBtn logic in openCardDetail
old_hand_logic = '''        const canPlay = (typeof BattleArena !== 'undefined' && BattleArena.canPlayCardInCurrentPhase)
          ? BattleArena.canPlayCardInCurrentPhase(handCard)
          : (isPlayerTurn && phase === 'MAIN');
        const avail = (typeof BattleArena !== 'undefined' && BattleArena.getPlayerAvailableCores) 
          ? BattleArena.getPlayerAvailableCores() 
          : { reserve: DuelState.player.reserve, total: DuelState.player.reserve };

        if (!canPlay) {
          duelBtn.textContent = phase === 'ATTACK' ? '⚔️ Main Step Only (No Flash)' : `⏳ Cannot Play in ${phase} Step`;
          duelBtn.disabled = true;
          duelBtn.style.opacity = '0.5';
          duelBtn.style.background = '#475569';
          duelBtn.onclick = null;'''

new_hand_logic = '''        const rest = checkCardUsageRestriction(handCard, 'player');
        const canPlay = rest.allowed && ((typeof BattleArena !== 'undefined' && BattleArena.canPlayCardInCurrentPhase)
          ? BattleArena.canPlayCardInCurrentPhase(handCard, 'player')
          : (isPlayerTurn && (phase === 'MAIN' || (phase === 'ATTACK' && (handCard.effect || '').includes('[Flash]')))));

        const avail = (typeof BattleArena !== 'undefined' && BattleArena.getPlayerAvailableCores) 
          ? BattleArena.getPlayerAvailableCores() 
          : { reserve: DuelState.player.reserve, total: DuelState.player.reserve };

        if (!rest.allowed) {
          duelBtn.textContent = `🚫 ${rest.reason}`;
          duelBtn.title = rest.reason;
          duelBtn.disabled = true;
          duelBtn.style.opacity = '0.5';
          duelBtn.style.background = '#475569';
          duelBtn.onclick = null;
        } else if (!canPlay) {
          duelBtn.textContent = phase === 'ATTACK' ? '⚔️ Main Step Only (No Flash)' : `⏳ Cannot Play in ${phase} Step`;
          duelBtn.disabled = true;
          duelBtn.style.opacity = '0.5';
          duelBtn.style.background = '#475569';
          duelBtn.onclick = null;'''

assert old_hand_logic in app_content, "old_hand_logic not found!"
app_content = app_content.replace(old_hand_logic, new_hand_logic)

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(app_content)

print("app.js updated successfully!")
