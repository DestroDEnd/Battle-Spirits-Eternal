const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Update battleBlockModal with Flash Timing Section
const oldBlockModal = `<div class="battle-modal-overlay" id="battleBlockModal">
        <div class="battle-modal-card">
          <div class="result-badge result-lose">INCOMING ATTACK</div>
          <h3 class="modal-title">Declare Your Guard</h3>
          <p class="modal-desc">Opponent's <strong id="blockAttackerName">Spirit</strong> is striking! Choose a Ready spirit to intercept and clash BP, or take 1 Life damage.</p>
          <div id="blockerChoices">
            <!-- Injected blocker choices -->
          </div>
        </div>
      </div>`;

const newBlockModal = `<div class="battle-modal-overlay" id="battleBlockModal">
        <div class="battle-modal-card" style="max-width:540px; text-align:left;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
            <div class="result-badge result-lose" style="margin-bottom:0;">INCOMING ATTACK</div>
            <div class="flash-window-indicator">⚡ FLASH TIMING ACTIVE</div>
          </div>
          <h3 class="modal-title" style="margin-bottom:0.25rem;">Declare Defense &amp; Flash Magic</h3>
          <p class="modal-desc" style="font-size:0.85rem; color:#94a3b8; margin-bottom:0.75rem;">
            Opponent's <strong id="blockAttackerName" style="color:#f87171;">Spirit</strong> is striking! Cast defensive Flash Magic or Flash Summon Swift Spirits before declaring your block.
          </p>

          <!-- Flash Spells Section -->
          <div id="blockFlashSection" style="margin-bottom:1rem;">
            <!-- Injected flash choices -->
          </div>

          <!-- Blocker Selection Section -->
          <div style="font-size:0.78rem; font-weight:800; color:#cbd5e1; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:0.5rem;">
            🛡️ Intercept with Blocker or Take Damage:
          </div>
          <div id="blockerChoices">
            <!-- Injected blocker choices -->
          </div>
        </div>
      </div>`;

if (html.includes(oldBlockModal)) {
  html = html.replace(oldBlockModal, newBlockModal);
  console.log('[OK] Updated battleBlockModal with Flash Timing section');
} else {
  console.warn('[WARN] oldBlockModal not matched exactly, checking regex');
  html = html.replace(/<div class="battle-modal-overlay" id="battleBlockModal">[\s\S]*?<\/div>\s*<\/div>/, newBlockModal);
  console.log('[OK] Updated battleBlockModal via regex');
}

// 2. Add battleTributeModal right after battleSacrificeModal
const tributeModalHtml = `

      <!-- TRIBUTE SPIRIT SELECTION MODAL -->
      <div class="battle-modal-overlay" id="battleTributeModal">
        <div class="battle-modal-card" style="max-width:540px; text-align:left;">
          <div class="result-badge" style="background:linear-gradient(135deg, rgba(217,119,6,0.3), rgba(180,83,9,0.3)); color:#fbbf24; border:1px solid #f59e0b; margin-bottom:0.75rem;">👑 TRIBUTE SUMMON</div>
          <h3 class="modal-title" style="margin-bottom:0.35rem;" id="tributeModalTitle">Select Spirit to Tribute</h3>
          <p class="modal-desc" id="tributeModalDesc" style="margin-bottom:0.9rem; font-size:0.85rem; color:#94a3b8;">
            Select an eligible Spirit to Tribute. All cores on it will be sent to the Void, and the Spirit will be sent to the Trash!
          </p>
          <div class="tribute-spirit-choices" id="tributeSpiritChoices">
            <!-- Injected tribute spirit choices -->
          </div>
          <div style="margin-top:1rem; text-align:right;">
            <button class="btn-cancel-tribute" onclick="BattleArena.cancelTributeSummon()" style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.2); color:#cbd5e1; padding:0.5rem 1rem; border-radius:0.5rem; cursor:pointer; font-weight:700;">✕ Cancel Summon</button>
          </div>
        </div>
      </div>`;

if (!html.includes('id="battleTributeModal"')) {
  const sacTarget = "<!-- CORE SACRIFICE & SUMMON MODAL -->";
  html = html.replace(sacTarget, tributeModalHtml + "\n\n      " + sacTarget);
  console.log('[OK] Injected battleTributeModal into index.html');
}

fs.writeFileSync('index.html', html, 'utf8');
console.log('[DONE] index.html updated successfully');
