with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = """      } else if (handCard) {
        const isSpirit = handCard.type === 'Spirit';
        const isMagic = handCard.type === 'Magic';
        const cost = handCard.cost || 0;
        const totalNeeded = isSpirit ? cost + 1 : cost;
        const isPlayerTurn = DuelState.activePlayer === 'player';
        const phase = DuelState.phases[DuelState.phaseIndex];
        const rest = checkCardUsageRestriction(handCard, 'player');
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
        } else if (avail.total >= totalNeeded) {
          duelBtn.textContent = `💀 Sacrifice & Summon (${cost})`;
          duelBtn.disabled = false;
          duelBtn.style.opacity = '1';
          duelBtn.style.background = '#ea580c';
          duelBtn.onclick = () => {
            closeModal();
            BattleArena.openSacrificeModal(handCard.uid);
          };
        } else {
          duelBtn.textContent = `⚠️ Need ${totalNeeded} Cores`;
          duelBtn.disabled = true;
          duelBtn.style.opacity = '0.5';
          duelBtn.style.background = '#475569';
          duelBtn.onclick = null;
        }
      } else {
        duelBtn.textContent = '⚔️ Active on Battlefield';
        duelBtn.disabled = true;
        duelBtn.style.opacity = '0.6';
        duelBtn.style.background = '#3b82f6';
        duelBtn.onclick = null;
      }"""

replacement = """      } else if (handCard) {
        const isBrave = handCard.type === 'Brave' || (handCard.type || '').includes('Brave');
        const isNexus = (handCard.type || '').includes('Nexus');
        const isMagic = handCard.type === 'Magic';
        const isSpirit = (handCard.type === 'Spirit' || (handCard.type || '').includes('Spirit')) && !isBrave;
        const cost = handCard.cost || 0;
        const totalNeeded = (isSpirit || isBrave) ? cost + 1 : cost;
        const isPlayerTurn = DuelState.activePlayer === 'player';
        const phase = DuelState.phases[DuelState.phaseIndex];
        const isAttackStep = phase === 'ATTACK';
        const rest = checkCardUsageRestriction(handCard, 'player');
        const canPlay = rest.allowed && ((typeof BattleArena !== 'undefined' && BattleArena.canPlayCardInCurrentPhase)
          ? BattleArena.canPlayCardInCurrentPhase(handCard, 'player')
          : (isPlayerTurn && (phase === 'MAIN' || (isAttackStep && (handCard.effect || '').includes('[Flash]')))));

        const avail = (typeof BattleArena !== 'undefined' && BattleArena.getPlayerAvailableCores) 
          ? BattleArena.getPlayerAvailableCores() 
          : { reserve: DuelState.player.reserve, total: DuelState.player.reserve };

        const modalBraveBtn = document.getElementById('modalDuelBraveBtn');
        if (modalBraveBtn) modalBraveBtn.style.display = 'none';

        if (!rest.allowed) {
          duelBtn.textContent = `🚫 ${rest.reason}`;
          duelBtn.title = rest.reason;
          duelBtn.disabled = true;
          duelBtn.style.opacity = '0.5';
          duelBtn.style.background = '#475569';
          duelBtn.onclick = null;
        } else if (!canPlay) {
          duelBtn.textContent = isAttackStep ? '⚔️ Main Step Only (No Flash)' : `⏳ Cannot Play in ${phase} Step`;
          duelBtn.disabled = true;
          duelBtn.style.opacity = '0.5';
          duelBtn.style.background = '#475569';
          duelBtn.onclick = null;
        } else if (avail.reserve >= totalNeeded) {
          let btnLabel = '';
          let btnBg = '#10b981';
          let btnAction = null;

          if (isBrave) {
            btnLabel = `⚔️ Summon Brave (Spirit Mode) (Cost ${cost})`;
            btnBg = 'linear-gradient(135deg, #10b981, #059669)';
            btnAction = () => {
              closeModal();
              BattleArena.summonBraveAsSpirit(handCard.uid);
            };

            // If player has eligible spirits on field, show Brave combine button
            const eligibleHosts = (DuelState.player.field || []).filter(s => !s.brave);
            if (modalBraveBtn && isPlayerTurn && phase === 'MAIN' && eligibleHosts.length > 0 && avail.reserve >= cost) {
              modalBraveBtn.style.display = 'block';
              modalBraveBtn.textContent = `🔗 Brave onto Spirit (Cost ${cost})`;
              modalBraveBtn.onclick = () => {
                closeModal();
                BattleArena.openBraveCombineModal(handCard.uid, 'hand');
              };
            }
          } else if (isNexus) {
            btnLabel = `🏛️ Deploy Nexus (Cost ${cost})`;
            btnBg = 'linear-gradient(135deg, #0284c7, #0369a1)';
            btnAction = () => {
              closeModal();
              BattleArena.deployNexus(handCard.uid);
            };
          } else if (isSpirit) {
            btnLabel = isAttackStep ? `⚡ Flash Summon (Cost ${cost})` : `⚔️ Summon in Duel (Cost ${cost})`;
            btnBg = '#10b981';
            btnAction = () => {
              closeModal();
              BattleArena.summonCard(handCard.uid);
            };
          } else {
            btnLabel = isAttackStep ? `✨ Flash Cast (Cost ${cost})` : `✨ Cast Magic (Cost ${cost})`;
            btnBg = '#8b5cf6';
            btnAction = () => {
              closeModal();
              BattleArena.castMagic(handCard.uid);
            };
          }

          duelBtn.textContent = btnLabel;
          duelBtn.disabled = false;
          duelBtn.style.opacity = '1';
          duelBtn.style.background = btnBg;
          duelBtn.onclick = btnAction;
        } else if (avail.total >= totalNeeded) {
          duelBtn.textContent = `💀 Sacrifice & Summon (${cost})`;
          duelBtn.disabled = false;
          duelBtn.style.opacity = '1';
          duelBtn.style.background = '#ea580c';
          duelBtn.onclick = () => {
            closeModal();
            BattleArena.openSacrificeModal(handCard.uid);
          };
        } else {
          duelBtn.textContent = `⚠️ Need ${totalNeeded} Cores`;
          duelBtn.disabled = true;
          duelBtn.style.opacity = '0.5';
          duelBtn.style.background = '#475569';
          duelBtn.onclick = null;
        }
      } else {
        // Field card inspection
        const modalBraveBtn = document.getElementById('modalDuelBraveBtn');
        if (modalBraveBtn) modalBraveBtn.style.display = 'none';

        const isPlayerTurn = (typeof DuelState !== 'undefined' && DuelState.activePlayer === 'player');
        const phase = (typeof DuelState !== 'undefined' && DuelState.phases ? DuelState.phases[DuelState.phaseIndex] : '');
        const fieldSpirit = (DuelState.player && DuelState.player.field || []).find(s => (s.name || '').toLowerCase() === (name || '').toLowerCase());
        if (fieldSpirit && isPlayerTurn && phase === 'MAIN') {
          if (fieldSpirit.brave) {
            duelBtn.textContent = `🔄 De-Brave (${fieldSpirit.brave.name})`;
            duelBtn.disabled = false;
            duelBtn.style.opacity = '1';
            duelBtn.style.background = '#f59e0b';
            duelBtn.onclick = () => {
              closeModal();
              BattleArena.separateBrave(fieldSpirit.uid);
            };
          } else if (fieldSpirit.type === 'Brave' || fieldSpirit.isBraveCard) {
            duelBtn.textContent = '🔗 Combine Brave onto Spirit';
            duelBtn.disabled = false;
            duelBtn.style.opacity = '1';
            duelBtn.style.background = 'linear-gradient(135deg, #a855f7, #6366f1)';
            duelBtn.onclick = () => {
              closeModal();
              BattleArena.openBraveCombineModal(fieldSpirit.uid, 'field');
            };
          } else {
            duelBtn.textContent = '⚔️ Active on Battlefield';
            duelBtn.disabled = true;
            duelBtn.style.opacity = '0.6';
            duelBtn.style.background = '#3b82f6';
            duelBtn.onclick = null;
          }
        } else {
          duelBtn.textContent = '⚔️ Active on Battlefield';
          duelBtn.disabled = true;
          duelBtn.style.opacity = '0.6';
          duelBtn.style.background = '#3b82f6';
          duelBtn.onclick = null;
        }
      }"""

if target not in content:
    raise ValueError("Target not found in app.js")

content = content.replace(target, replacement, 1)

# Also update closeModal() in app.js to hide modalBraveBtn
cm_target = """  const removeBtn = document.getElementById('modalRemoveDeckBtn');
  if (removeBtn) removeBtn.style.display = 'none';"""

cm_replacement = """  const removeBtn = document.getElementById('modalRemoveDeckBtn');
  if (removeBtn) removeBtn.style.display = 'none';
  const modalBraveBtn = document.getElementById('modalDuelBraveBtn');
  if (modalBraveBtn) modalBraveBtn.style.display = 'none';"""

if cm_target in content:
    content = content.replace(cm_target, cm_replacement, 1)
    print("Updated closeModal in app.js")

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully patched app.js!")
