with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = """        const isPlayerTurn = DuelState.activePlayer === 'player';
        const phase = DuelState.phases[DuelState.phaseIndex];
        const canPlay = isPlayerTurn && (phase === 'MAIN' || phase === 'ATTACK');
        const avail = (typeof BattleArena !== 'undefined' && BattleArena.getPlayerAvailableCores) 
          ? BattleArena.getPlayerAvailableCores() 
          : { reserve: DuelState.player.reserve, total: DuelState.player.reserve };

        if (canPlay && (avail.reserve >= totalNeeded)) {
          duelBtn.textContent = isSpirit ? `⚡ Summon in Duel (Cost ${cost})` : `✨ Cast Magic (Cost ${cost})`;
          duelBtn.disabled = false;
          duelBtn.style.opacity = '1';
          duelBtn.style.background = isSpirit ? '#10b981' : '#8b5cf6';
          duelBtn.onclick = () => {
            closeModal();
            if (isSpirit) BattleArena.summonCard(handCard.uid);
            else BattleArena.castMagic(handCard.uid);
          };
        } else if (canPlay && (avail.total >= totalNeeded)) {"""

replacement = """        const isPlayerTurn = DuelState.activePlayer === 'player';
        const phase = DuelState.phases[DuelState.phaseIndex];
        const canPlay = (typeof BattleArena !== 'undefined' && BattleArena.canPlayCardInCurrentPhase)
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
          duelBtn.onclick = null;
        } else if (avail.reserve >= totalNeeded) {
          const btnLabel = (phase === 'ATTACK') 
            ? (isSpirit ? `⚡ Flash Summon (Cost ${cost})` : `✨ Flash Cast (Cost ${cost})`)
            : (isSpirit ? `⚡ Summon in Duel (Cost ${cost})` : `✨ Cast Magic (Cost ${cost})`);
          duelBtn.textContent = btnLabel;
          duelBtn.disabled = false;
          duelBtn.style.opacity = '1';
          duelBtn.style.background = isSpirit ? '#10b981' : '#8b5cf6';
          duelBtn.onclick = () => {
            closeModal();
            if (isSpirit) BattleArena.summonCard(handCard.uid);
            else BattleArena.castMagic(handCard.uid);
          };
        } else if (avail.total >= totalNeeded) {"""

content_norm = content.replace('\r\n', '\n')
target_norm = target.replace('\r\n', '\n')
replacement_norm = replacement.replace('\r\n', '\n')

assert target_norm in content_norm, "target not found in app.js"
content_norm = content_norm.replace(target_norm, replacement_norm, 1)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content_norm)

print("Successfully updated app.js with Attack Step Flash timing check")
