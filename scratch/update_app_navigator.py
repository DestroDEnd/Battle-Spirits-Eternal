with open('app.js', 'r', encoding='utf-8') as f:
    c = f.read()

navigator_code = '''// ═══════════════════ MODAL CARD NAVIGATOR ═══════════════════
const ModalCardNavigator = {
  currentList: [],
  currentIndex: -1,
  currentCardName: '',

  setList(list, currentName) {
    if (Array.isArray(list) && list.length > 0) {
      this.currentList = list.map(item => {
        if (!item) return '';
        if (typeof item === 'string') return item.trim();
        return (item.name || '').trim();
      }).filter(Boolean);
    } else {
      this.currentList = this.discoverPageCardList(currentName);
    }

    this.currentCardName = currentName || '';
    const low = (this.currentCardName || '').toLowerCase();
    this.currentIndex = this.currentList.findIndex(n => n.toLowerCase() === low);

    if (this.currentIndex === -1 && this.currentCardName) {
      this.currentList.unshift(this.currentCardName);
      this.currentIndex = 0;
    }

    this.updateNavUI();
  },

  discoverPageCardList(cardName) {
    const collected = [];

    // 1. Deck Builder (deck.html): check current deck cards
    if (typeof S !== 'undefined' && S.deck && Object.keys(S.deck).length > 0) {
      const deckCards = Object.keys(S.deck);
      if (!cardName || deckCards.some(n => n.toLowerCase() === (cardName || '').toLowerCase())) {
        return deckCards;
      }
    }

    // 2. Browse / Searcher (browse.html)
    if (typeof document !== 'undefined') {
      const browseTiles = document.querySelectorAll('.card-tile[data-name]');
      if (browseTiles.length > 0) {
        browseTiles.forEach(el => {
          const n = el.getAttribute('data-name');
          if (n && !collected.includes(n)) collected.push(n);
        });
        if (collected.length > 0) return collected;
      }

      // 3. Featured Cards on Home
      const featuredItems = document.querySelectorAll('.featured-card-item[data-name]');
      if (featuredItems.length > 0) {
        featuredItems.forEach(el => {
          const n = el.getAttribute('data-name');
          if (n && !collected.includes(n)) collected.push(n);
        });
        if (collected.length > 0) return collected;
      }

      // 4. Generic fallback: all [data-name]
      document.querySelectorAll('[data-name]').forEach(el => {
        const n = el.getAttribute('data-name');
        if (n && !collected.includes(n)) collected.push(n);
      });
    }

    // 5. Battle Arena: Hand and Field
    if (typeof DuelState !== 'undefined' && DuelState.inDuel) {
      const arenaCards = [
        ...(DuelState.player.hand || []),
        ...(DuelState.player.field || []),
        ...(DuelState.opponent.field || [])
      ];
      arenaCards.forEach(card => {
        if (card && card.name && !collected.includes(card.name)) collected.push(card.name);
      });
    }

    return collected;
  },

  navigate(direction) {
    if (!this.currentList || this.currentList.length <= 1) return;
    let nextIdx = this.currentIndex + direction;

    if (nextIdx < 0) nextIdx = this.currentList.length - 1;
    if (nextIdx >= this.currentList.length) nextIdx = 0;

    this.currentIndex = nextIdx;
    const targetName = this.currentList[nextIdx];
    if (targetName) {
      openCardDetail(targetName, this.currentList);
    }
  },

  updateNavUI() {
    if (typeof document === 'undefined') return;
    const prevBtn = document.getElementById('modalPrevBtn');
    const nextBtn = document.getElementById('modalNextBtn');
    const counterEl = document.getElementById('modalNavCounter');
    const subPrev = document.getElementById('modalSubPrevBtn');
    const subNext = document.getElementById('modalSubNextBtn');

    const total = this.currentList.length;
    const hasMultiple = total > 1;

    if (prevBtn) prevBtn.style.display = hasMultiple ? 'flex' : 'none';
    if (nextBtn) nextBtn.style.display = hasMultiple ? 'flex' : 'none';
    if (subPrev) subPrev.style.display = hasMultiple ? 'inline-flex' : 'none';
    if (subNext) subNext.style.display = hasMultiple ? 'inline-flex' : 'none';

    if (counterEl) {
      if (hasMultiple && this.currentIndex >= 0) {
        counterEl.textContent = `Card ${this.currentIndex + 1} of ${total}`;
        counterEl.style.display = 'inline-flex';
      } else {
        counterEl.style.display = 'none';
      }
    }
  }
};

function navigateCardModal(direction) {
  ModalCardNavigator.navigate(direction);
}

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    const modal = document.getElementById('cardModal');
    if (!modal || !modal.classList.contains('open')) return;
    const targetTag = (e.target && e.target.tagName) ? e.target.tagName.toUpperCase() : '';
    if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || targetTag === 'SELECT') return;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      navigateCardModal(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      navigateCardModal(1);
    } else if (e.key === 'Escape') {
      closeModal();
    }
  });
}
'''

# 1. Insert navigator_code right above `async function openCardDetail`
target_func = 'async function openCardDetail(name) {'
assert target_func in c, 'openCardDetail target not found'

replacement_func = navigator_code + '\nasync function openCardDetail(name, contextList) {\n  const modal = document.getElementById(\'cardModal\');\n  if (!modal) return;\n  modal.classList.add(\'open\');\n  ModalCardNavigator.setList(contextList, name);'

c = c.replace('async function openCardDetail(name) {\r\n  const modal = document.getElementById(\'cardModal\');\r\n  if (!modal) return;\r\n  modal.classList.add(\'open\');', replacement_func)
if replacement_func not in c:
    c = c.replace('async function openCardDetail(name) {\n  const modal = document.getElementById(\'cardModal\');\n  if (!modal) return;\n  modal.classList.add(\'open\');', replacement_func)

# 2. Update closeModal
old_close = '''function closeModal() {
  const modal = document.getElementById('cardModal');
  if (modal) modal.classList.remove('open');
  S.currentCard = null;
}'''
if old_close not in c:
    old_close = '''function closeModal() {\r\n  const modal = document.getElementById('cardModal');\r\n  if (modal) modal.classList.remove('open');\r\n  S.currentCard = null;\r\n}'''

new_close = '''function closeModal() {
  const modal = document.getElementById('cardModal');
  if (modal) modal.classList.remove('open');
  S.currentCard = null;
  ModalCardNavigator.currentList = [];
  ModalCardNavigator.currentIndex = -1;
  ModalCardNavigator.updateNavUI();
}'''

assert old_close in c, 'closeModal target not found'
c = c.replace(old_close, new_close)

# 3. Add to module.exports
c = c.replace('AuthManager,', 'AuthManager,\n    ModalCardNavigator,\n    navigateCardModal,')

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(c)

print('app.js successfully updated with ModalCardNavigator!')
