with open('app.js', 'r', encoding='utf-8') as f:
    c = f.read()

deck_quick_code = '''
function deleteFromDeck(name) {
  if (S.deck[name]) {
    delete S.deck[name];
    saveDeck();
    updateDeckBadge();
    if (typeof renderDeckView === 'function') renderDeckView();
    if (typeof DeckManagerUI !== 'undefined') DeckManagerUI.renderDeckSelector();
    showToast(`Removed all copies of "${name}"`, 'info');
  }
}

// ═══════════════════ DECK QUICK-VIEW POPUP COMPONENT ═══════════════════
const DeckQuickView = {
  isOpen: false,

  init() {
    if (typeof document === 'undefined') return;
    this.injectDOM();
    this.update();
  },

  injectDOM() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('deckQuickWidgetWrap')) return;

    const wrap = document.createElement('div');
    wrap.id = 'deckQuickWidgetWrap';
    wrap.className = 'deck-quick-widget-wrap';
    wrap.innerHTML = `
      <!-- Collapsible Quick View Popup Panel -->
      <div class="deck-quick-flyout" id="deckQuickFlyout" style="display:none;">
        <div class="deck-quick-flyout-header">
          <div class="deck-quick-flyout-title-wrap">
            <span class="deck-quick-flyout-icon">🃏</span>
            <div class="deck-quick-flyout-text">
              <div class="deck-quick-deck-name" id="quickDeckName">Active Deck</div>
              <div class="deck-quick-deck-sub" id="quickDeckSub">Click a card to inspect</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:0.4rem;">
            <span class="deck-quick-count-tag" id="quickDeckFlyoutCount">0 / 40</span>
            <button class="deck-quick-close-btn" onclick="DeckQuickView.toggle(false)" title="Close Deck Popup">✕</button>
          </div>
        </div>

        <div class="deck-quick-flyout-body" id="quickDeckCardList">
          <!-- Populated dynamically -->
        </div>

        <div class="deck-quick-flyout-footer">
          <a href="/deck" class="btn-quick-deck-view">
            <span>🃏 Open in Deck Builder ↗</span>
          </a>
          <button class="btn-quick-deck-clear" onclick="clearDeck()" title="Clear all cards from active deck">Clear</button>
        </div>
      </div>

      <!-- Floating Trigger Button -->
      <button class="deck-quick-trigger" id="deckQuickTrigger" onclick="DeckQuickView.toggle()" title="View Cards in Active Deck">
        <span class="deck-quick-trigger-icon">🃏</span>
        <span class="deck-quick-trigger-label" id="quickTriggerLabel">Deck</span>
        <span class="deck-quick-trigger-badge" id="quickTriggerBadge">0</span>
        <span class="deck-quick-trigger-arrow" id="quickTriggerArrow">▴</span>
      </button>
    `;

    document.body.appendChild(wrap);
  },

  toggle(forceState) {
    this.isOpen = (typeof forceState === 'boolean') ? forceState : !this.isOpen;
    if (typeof document === 'undefined') return;
    const flyout = document.getElementById('deckQuickFlyout');
    const trigger = document.getElementById('deckQuickTrigger');
    const arrow = document.getElementById('quickTriggerArrow');

    if (flyout) {
      if (this.isOpen) {
        flyout.style.display = 'flex';
        flyout.classList.add('open');
        this.renderCardList();
        if (trigger) trigger.classList.add('active');
        if (arrow) arrow.textContent = '▾';
      } else {
        flyout.classList.remove('open');
        flyout.style.display = 'none';
        if (trigger) trigger.classList.remove('active');
        if (arrow) arrow.textContent = '▴';
      }
    }
  },

  update() {
    if (typeof document === 'undefined') return;
    this.injectDOM();
    const count = Object.values(S.deck).reduce((a, b) => a + b, 0);

    const triggerBadge = document.getElementById('quickTriggerBadge');
    const flyoutCount = document.getElementById('quickDeckFlyoutCount');
    const deckNameEl = document.getElementById('quickDeckName');
    const triggerBtn = document.getElementById('deckQuickTrigger');

    let currentDeckName = 'Active Deck';
    if (typeof DeckManager !== 'undefined') {
      const activeDeck = DeckManager.getActiveDeck();
      if (activeDeck && activeDeck.name) currentDeckName = activeDeck.name;
    }

    if (triggerBadge) triggerBadge.textContent = count;
    if (flyoutCount) {
      flyoutCount.textContent = `${count} / 40 cards`;
      if (count >= 40) {
        flyoutCount.className = 'deck-quick-count-tag count-ready';
      } else {
        flyoutCount.className = 'deck-quick-count-tag count-partial';
      }
    }
    if (deckNameEl) deckNameEl.textContent = currentDeckName;

    if (triggerBtn) {
      if (count > 0) {
        triggerBtn.classList.add('has-cards');
      } else {
        triggerBtn.classList.remove('has-cards');
      }
    }

    if (this.isOpen) {
      this.renderCardList();
    }
  },

  flashAddAnimation() {
    if (typeof document === 'undefined') return;
    const triggerBtn = document.getElementById('deckQuickTrigger');
    if (triggerBtn) {
      triggerBtn.classList.remove('pulse-add');
      void triggerBtn.offsetWidth;
      triggerBtn.classList.add('pulse-add');
      setTimeout(() => triggerBtn.classList.remove('pulse-add'), 700);
    }
  },

  renderCardList() {
    if (typeof document === 'undefined') return;
    const listEl = document.getElementById('quickDeckCardList');
    if (!listEl) return;

    const entries = Object.entries(S.deck);
    if (!entries.length) {
      listEl.innerHTML = `
        <div class="deck-quick-empty">
          <div style="font-size:2rem;margin-bottom:0.4rem;">🎴</div>
          <div style="font-weight:700;color:#e2e8f0;font-size:0.9rem;">Your deck is currently empty</div>
          <div style="color:var(--muted);font-size:0.78rem;margin-top:0.25rem;">Click <strong>+ Add to Deck</strong> on any card to add it here.</div>
        </div>
      `;
      return;
    }

    // Sort by card name
    entries.sort((a, b) => a[0].localeCompare(b[0]));
    const cardNames = entries.map(([name]) => name);

    listEl.innerHTML = entries.map(([name, count]) => {
      const safeName = esc(name);
      const jsName = escapeJsStr(name);
      return `
        <div class="deck-quick-item">
          <div class="deck-quick-item-info" onclick="openCardDetail('${jsName}', ${JSON.stringify(cardNames).replace(/"/g, '&quot;')})" title="Click to view card details">
            <span class="deck-quick-item-qty">${count}x</span>
            <span class="deck-quick-item-name">${safeName}</span>
          </div>
          <div class="deck-quick-item-ctrls">
            <button class="deck-quick-qty-btn" onclick="removeFromDeck('${jsName}')" title="Remove 1 copy">-</button>
            <button class="deck-quick-qty-btn" onclick="addToDeck('${jsName}')" title="Add 1 copy">+</button>
            <button class="deck-quick-del-btn" onclick="deleteFromDeck('${jsName}')" title="Remove all copies">✕</button>
          </div>
        </div>
      `;
    }).join('');
  }
};
'''

# 1. Update updateDeckBadge() to invoke DeckQuickView.update()
old_badge = '''function updateDeckBadge() {
  const total = Object.values(S.deck).reduce((a, b) => a + b, 0);
  const badge = document.getElementById('deckBadge');
  if (badge) badge.textContent = total;
}'''

new_badge = '''function updateDeckBadge() {
  const total = Object.values(S.deck).reduce((a, b) => a + b, 0);
  const badge = document.getElementById('deckBadge');
  if (badge) badge.textContent = total;
  if (typeof DeckQuickView !== 'undefined') {
    DeckQuickView.update();
  }
}'''

if old_badge in c:
    c = c.replace(old_badge, new_badge)
else:
    c = c.replace(old_badge.replace('\n', '\r\n'), new_badge.replace('\n', '\r\n'))

# 2. Update addToDeck to trigger flashAddAnimation()
c = c.replace(
    'showToast(`Added 1x "${name}" to deck (${S.deck[name]}/3)`, \'success\');',
    'showToast(`Added 1x "${name}" to deck (${S.deck[name]}/3)`, \'success\');\n  if (typeof DeckQuickView !== \'undefined\') DeckQuickView.flashAddAnimation();'
)

# 3. Insert deleteFromDeck and DeckQuickView right before // ═══════════════════ MODAL CARD NAVIGATOR
target_nav = '// ═══════════════════ MODAL CARD NAVIGATOR ═══════════════════'
assert target_nav in c, 'target_nav not found'
c = c.replace(target_nav, deck_quick_code + '\n' + target_nav)

# 4. Update DOMContentLoaded to init DeckQuickView
c = c.replace(
    'AuthManager.init();',
    'AuthManager.init();\n  DeckQuickView.init();'
)

# 5. Add DeckQuickView and deleteFromDeck to module.exports
c = c.replace(
    'ModalCardNavigator,',
    'ModalCardNavigator,\n    DeckQuickView,\n    deleteFromDeck,\n    addToDeck,\n    removeFromDeck,'
)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(c)

print('Updated app.js with DeckQuickView and deleteFromDeck!')
