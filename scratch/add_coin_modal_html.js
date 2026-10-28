const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

const coinModalHtml = `
      <!-- COIN TOSS (FIRST TURN DETERMINATION) MODAL -->
      <div class="battle-modal-overlay" id="battleCoinModal">
        <div class="battle-modal-card coin-modal-card">
          <div class="result-badge" style="background:linear-gradient(135deg, rgba(245,158,11,0.25), rgba(234,179,8,0.25)); color:#fef08a; border:1px solid #f59e0b; margin-bottom:0.75rem;">🪙 FIRST TURN DETERMINATION</div>
          <h3 class="modal-title" style="margin-bottom:0.35rem;">Battle Spirits Coin Toss</h3>
          <p class="modal-desc" style="font-size:0.85rem; color:#94a3b8; margin-bottom:1.25rem;">
            Official tournament rules dictate a coin flip to determine who commences Turn 1!
          </p>

          <!-- 3D Coin Stage -->
          <div class="coin-stage">
            <div class="coin-3d-disc" id="coinFlipCoin" onclick="BattleArena.flipCoin()" title="Click to Toss Coin">
              <div class="coin-face coin-face-heads">
                <div class="coin-inner-ring">
                  <div class="coin-crest">🛡️</div>
                  <div class="coin-label">CHALLENGER</div>
                  <div class="coin-sub">HEADS</div>
                </div>
              </div>
              <div class="coin-face coin-face-tails">
                <div class="coin-inner-ring">
                  <div class="coin-crest">👑</div>
                  <div class="coin-label">CHAMPION</div>
                  <div class="coin-sub">TAILS</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Result Announcement Banner -->
          <div id="coinFlipResultBox" style="display:none;"></div>

          <!-- Controls -->
          <div class="coin-actions-row">
            <button class="btn-coin-flip" id="btnTriggerCoinFlip" onclick="BattleArena.flipCoin()">🪙 Toss the Coin!</button>
            <button class="btn-coin-proceed" id="btnCoinProceed" onclick="BattleArena.proceedWithDuel()" style="display:none;">⚔️ Enter Battle →</button>
          </div>
        </div>
      </div>
`;

if (!html.includes('id="battleCoinModal"')) {
  const target = '<div class="battle-modal-overlay" id="battleBlockModal">';
  html = html.replace(target, coinModalHtml + "\n      " + target);
  fs.writeFileSync('index.html', html, 'utf8');
  console.log('[OK] Added battleCoinModal to index.html');
} else {
  console.log('[INFO] battleCoinModal already in index.html');
}
