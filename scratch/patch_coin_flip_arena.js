const fs = require('fs');

let js = fs.readFileSync('battle_arena.js', 'utf8');

// 1. Add coinFlip to AudioFX
const audioFxTarget = "lifeDamage() {";
const coinFlipAudio = `coinFlip() {
      this.init();
      if (!this.ctx) return;
      for (let i = 0; i < 9; i++) {
        setTimeout(() => {
          this.playTone(550 + (i * 70), 'triangle', 0.04, 0.05);
        }, i * 90);
      }
      setTimeout(() => {
        this.playTone(1046.5, 'sine', 0.4, 0.12);
        this.playTone(1318.5, 'triangle', 0.35, 0.08);
      }, 950);
    },
    `;

if (!js.includes('coinFlip() {')) {
  js = js.replace(audioFxTarget, coinFlipAudio + audioFxTarget);
  console.log('[OK] Added coinFlip to AudioFX');
}

// 2. Add Coin Flip Controller logic
const coinLogic = `
  // ── COIN FLIP (FIRST TURN DETERMINATION) CONTROLLER ──
  let pendingDuelDecks = null;
  let coinFlipWinner = null;
  let coinFlipAutoTimer = null;

  function launchCoinFlip(pDeckKey, oDeckKey) {
    pDeckKey = pDeckKey || document.getElementById('arenaPlayerDeckSelect')?.value || 'red';
    oDeckKey = oDeckKey || document.getElementById('arenaOpponentDeckSelect')?.value || 'purple';
    pendingDuelDecks = { pDeckKey, oDeckKey };

    const modalEl = document.getElementById('battleCoinModal');
    if (!modalEl) {
      // Fallback if modal not present: 50/50 flip directly
      const fp = Math.random() < 0.5 ? 'player' : 'opponent';
      executeStartDuel(pDeckKey, oDeckKey, fp);
      return;
    }

    // Reset coin modal elements
    const coinEl = document.getElementById('coinFlipCoin');
    if (coinEl) {
      coinEl.className = 'coin-3d-disc';
    }
    const resultBox = document.getElementById('coinFlipResultBox');
    if (resultBox) {
      resultBox.style.display = 'none';
      resultBox.innerHTML = '';
    }
    const triggerBtn = document.getElementById('btnTriggerCoinFlip');
    if (triggerBtn) {
      triggerBtn.style.display = 'inline-flex';
      triggerBtn.disabled = false;
      triggerBtn.textContent = '🪙 Flip Coin for First Turn!';
    }
    const proceedBtn = document.getElementById('btnCoinProceed');
    if (proceedBtn) {
      proceedBtn.style.display = 'none';
    }

    modalEl.classList.add('active');
  }

  function flipCoin() {
    const triggerBtn = document.getElementById('btnTriggerCoinFlip');
    if (triggerBtn) {
      triggerBtn.disabled = true;
      triggerBtn.textContent = 'Spinning in the air...';
    }

    const coinEl = document.getElementById('coinFlipCoin');
    const isHeads = Math.random() < 0.5; // Heads = player, Tails = opponent
    coinFlipWinner = isHeads ? 'player' : 'opponent';

    AudioFX.coinFlip();

    if (coinEl) {
      coinEl.classList.remove('is-flipping', 'lands-heads', 'lands-tails');
      void coinEl.offsetWidth; // trigger reflow
      coinEl.classList.add('is-flipping');
    }

    setTimeout(() => {
      if (coinEl) {
        coinEl.classList.remove('is-flipping');
        coinEl.classList.add(isHeads ? 'lands-heads' : 'lands-tails');
      }

      const resultBox = document.getElementById('coinFlipResultBox');
      if (resultBox) {
        resultBox.style.display = 'block';
        if (isHeads) {
          resultBox.className = 'coin-result-banner heads';
          resultBox.innerHTML = \`
            <div class="crb-icon">🛡️</div>
            <div class="crb-title">HEADS — YOU GO FIRST!</div>
            <div class="crb-sub">Challenger won the coin toss and takes Turn 1!</div>
          \`;
        } else {
          resultBox.className = 'coin-result-banner tails';
          resultBox.innerHTML = \`
            <div class="crb-icon">👑</div>
            <div class="crb-title">TAILS — OPPONENT GOES FIRST!</div>
            <div class="crb-sub">Champion won the coin toss and takes Turn 1!</div>
          \`;
        }
      }

      if (triggerBtn) triggerBtn.style.display = 'none';
      const proceedBtn = document.getElementById('btnCoinProceed');
      if (proceedBtn) {
        proceedBtn.style.display = 'inline-flex';
        proceedBtn.textContent = isHeads ? '⚔️ Begin Duel (Your Turn) →' : '⚔️ Begin Duel (Opponent Turn) →';
      }

      // Auto proceed after 2.5s if player doesn't click
      coinFlipAutoTimer = setTimeout(() => {
        proceedWithDuel();
      }, 2500);

    }, 1400);
  }

  function proceedWithDuel() {
    if (coinFlipAutoTimer) {
      clearTimeout(coinFlipAutoTimer);
      coinFlipAutoTimer = null;
    }
    const modalEl = document.getElementById('battleCoinModal');
    if (modalEl) modalEl.classList.remove('active');

    const decks = pendingDuelDecks || { pDeckKey: 'red', oDeckKey: 'purple' };
    const fp = coinFlipWinner || 'player';
    executeStartDuel(decks.pDeckKey, decks.oDeckKey, fp);
  }
`;

const duelTarget = "// ── STARTING A DUEL ──\n  async function startDuel(pDeckKey, oDeckKey) {";
const duelTargetCrlf = "// ── STARTING A DUEL ──\r\n  async function startDuel(pDeckKey, oDeckKey) {";

// 3. Update startDuel to launch coin flip or execute
const newStartDuel = `// ── STARTING A DUEL (WITH COIN TOSS) ──
  async function startDuel(pDeckKey, oDeckKey, firstPlayer = null) {
    if (!firstPlayer) {
      launchCoinFlip(pDeckKey, oDeckKey);
      return;
    }
    return executeStartDuel(pDeckKey, oDeckKey, firstPlayer);
  }

  async function executeStartDuel(pDeckKey, oDeckKey, firstPlayer = 'player') {`;

if (js.includes(duelTargetCrlf)) {
  js = js.replace(duelTargetCrlf, coinLogic + "\n  " + newStartDuel);
  console.log('[OK] Replaced startDuel with Coin Flip router (CRLF)');
} else if (js.includes(duelTarget)) {
  js = js.replace(duelTarget, coinLogic + "\n  " + newStartDuel);
  console.log('[OK] Replaced startDuel with Coin Flip router (LF)');
} else {
  console.warn('[WARN] duelTarget not matched, searching index');
  const idx = js.indexOf('async function startDuel(');
  if (idx !== -1) {
    const endHeader = js.indexOf('{', idx) + 1;
    js = js.substring(0, idx) + coinLogic + "\n  " + newStartDuel + js.substring(endHeader);
    console.log('[OK] Injected Coin Flip and executeStartDuel via index');
  }
}

// 4. Update the activePlayer assignment inside executeStartDuel
const activePlayerTarget = "DuelState.activePlayer = 'player';";
if (js.includes(activePlayerTarget)) {
  js = js.replace(activePlayerTarget, "DuelState.activePlayer = firstPlayer || 'player';");
  console.log('[OK] Updated DuelState.activePlayer assignment');
}

// 5. Add coin toss announcement in addLog and auto-start opponent if firstPlayer is opponent
const logTarget = "addLog(`⚔️ **DUEL COMMENCED!** ${pName} vs ${oName}.`, 'system');";
const logTargetCrlf = "addLog(`⚔️ **DUEL COMMENCED!** ${pName} vs ${oName}.`, 'system');";

const logReplacement = `addLog(\`⚔️ **DUEL COMMENCED!** \${pName} vs \${oName}.\`, 'system');
    addLog(\`🪙 **COIN FLIP RESULT**: Landed on **\${firstPlayer === 'player' ? 'HEADS (Challenger First)' : 'TAILS (Champion First)'}**!\`, 'step');`;

js = js.replace(logTarget, logReplacement);

// 6. Handle opponent turn initiation on Turn 1 if opponent won coin flip
const scrollTarget = "if (arenaEl) arenaEl.scrollIntoView({ behavior: 'smooth' });";
const opponentStart = `if (arenaEl) arenaEl.scrollIntoView({ behavior: 'smooth' });

    if (firstPlayer === 'opponent') {
      addLog(\`▶️ **OPPONENT TURN 1**: Opponent won coin toss and begins Turn 1 phases.\`, 'step');
      safeTimeout(advanceOpponentStep, 1000);
    } else {
      addLog(\`▶️ **START STEP**: Turn 1 begins! Click "Begin Turn" on the Step Navigator to proceed.\`, 'step');
    }`;

if (js.includes(scrollTarget)) {
  js = js.replace(scrollTarget, opponentStart);
  console.log('[OK] Added firstPlayer handling on Turn 1 start');
}

// 7. Expose coin flip methods on window.BattleArena
const exportsTarget = "castFlashInBattle,";
const coinExports = `castFlashInBattle,
    launchCoinFlip,
    flipCoin,
    proceedWithDuel,`;
js = js.replace(exportsTarget, coinExports);
console.log('[OK] Exported Coin Flip methods on window.BattleArena');

fs.writeFileSync('battle_arena.js', js, 'utf8');
console.log('[DONE] battle_arena.js updated successfully!');
