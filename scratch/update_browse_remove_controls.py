with open('browse.html', 'r', encoding='utf-8') as f:
    c = f.read()

old_build = '''function buildCardTile(card) {
  const colors = card.colors || (card.color ? [card.color] : []);
  const colorDots = colors.map(c => `<span class="color-dot color-dot-${esc(c)}" title="${esc(c)}"></span>`).join('');
  const families = card.families || (card.family ? [card.family] : []);
  const codeBadge = card.card_number ? `<span class="tile-number">${esc(card.card_number)}</span>` : '';

  return `
  <div class="card-tile" data-name="${esc(card.name)}">
    <div class="tile-art">
      <span class="tile-cost">💎 ${card.cost !== null && card.cost !== undefined ? card.cost : '—'}</span>
      <div class="tile-colors">${colorDots}</div>
      <img src="${esc(card.image_url || FALLBACK_CARD_ART)}" alt="${esc(card.name)}" loading="lazy" referrerpolicy="no-referrer"
        onerror="this.onerror=null; this.src=FALLBACK_CARD_ART;" />
    </div>
    <div class="tile-info">
      <div>
        <div class="tile-name">${esc(card.name)}</div>
        <div class="tile-meta">
          <span>${esc(card.type || '—')}</span>
          ${codeBadge}
          <span>${esc(card.rarity || '')}</span>
        </div>
        ${families.length ? `<div class="tile-family">${esc(families.slice(0,2).join(' · '))}</div>` : ''}
      </div>
      <div class="tile-actions" onclick="event.stopPropagation()">
        <button class="btn-add-deck" onclick="addToDeck('${escapeJsStr(card.name)}')">+ Add to Deck</button>
      </div>
    </div>
  </div>`;
}'''

new_build = '''function getCardInDeckCount(cardName) {
  if (typeof S !== 'undefined' && S.deck && S.deck[cardName]) {
    return S.deck[cardName];
  }
  return 0;
}

function buildTileDeckActionsHtml(cardName) {
  const inDeck = getCardInDeckCount(cardName);
  const jsName = escapeJsStr(cardName);

  if (inDeck > 0) {
    return `
      <div class="browse-tile-deck-ctrls">
        <button class="btn-tile-act btn-tile-minus" onclick="handleBrowseRemoveDeck('${jsName}')" title="Remove 1 copy from deck">-</button>
        <span class="browse-tile-count-val" title="${inDeck} of 3 in active deck">${inDeck}/3 in Deck</span>
        <button class="btn-tile-act btn-tile-plus" onclick="handleBrowseAddDeck('${jsName}')" ${inDeck >= 3 ? 'disabled title="Max 3 copies reached"' : 'title="Add 1 more copy to deck"'}>+</button>
        <button class="btn-tile-act btn-tile-del" onclick="handleBrowseDeleteDeck('${jsName}')" title="Remove all copies from deck">🗑</button>
      </div>
    `;
  }
  return `
    <button class="btn-add-deck" onclick="handleBrowseAddDeck('${jsName}')">+ Add to Deck</button>
  `;
}

function buildCardTile(card) {
  const colors = card.colors || (card.color ? [card.color] : []);
  const colorDots = colors.map(c => `<span class="color-dot color-dot-${esc(c)}" title="${esc(c)}"></span>`).join('');
  const families = card.families || (card.family ? [card.family] : []);
  const codeBadge = card.card_number ? `<span class="tile-number">${esc(card.card_number)}</span>` : '';
  const inDeck = getCardInDeckCount(card.name);
  const safeName = esc(card.name);
  const deckPill = inDeck > 0
    ? `<span class="tile-deck-count-pill" id="tileDeckBadge-${safeName}">${inDeck}x in Deck</span>`
    : `<span class="tile-deck-count-pill" id="tileDeckBadge-${safeName}" style="display:none;"></span>`;

  return `
  <div class="card-tile" data-name="${safeName}">
    <div class="tile-art">
      <span class="tile-cost">💎 ${card.cost !== null && card.cost !== undefined ? card.cost : '—'}</span>
      ${deckPill}
      <div class="tile-colors">${colorDots}</div>
      <img src="${esc(card.image_url || FALLBACK_CARD_ART)}" alt="${safeName}" loading="lazy" referrerpolicy="no-referrer"
        onerror="this.onerror=null; this.src=FALLBACK_CARD_ART;" />
    </div>
    <div class="tile-info">
      <div>
        <div class="tile-name">${safeName}</div>
        <div class="tile-meta">
          <span>${esc(card.type || '—')}</span>
          ${codeBadge}
          <span>${esc(card.rarity || '')}</span>
        </div>
        ${families.length ? `<div class="tile-family">${esc(families.slice(0,2).join(' · '))}</div>` : ''}
      </div>
      <div class="tile-actions" id="tileActions-${safeName}" onclick="event.stopPropagation()">
        ${buildTileDeckActionsHtml(card.name)}
      </div>
    </div>
  </div>`;
}

function handleBrowseAddDeck(name) {
  addToDeck(name);
  updateBrowseTileDeckStatus(name);
}

function handleBrowseRemoveDeck(name) {
  removeFromDeck(name);
  updateBrowseTileDeckStatus(name);
}

function handleBrowseDeleteDeck(name) {
  deleteFromDeck(name);
  updateBrowseTileDeckStatus(name);
}

function updateBrowseTileDeckStatus(name) {
  const inDeck = getCardInDeckCount(name);
  const actEl = document.getElementById('tileActions-' + name);
  if (actEl) {
    actEl.innerHTML = buildTileDeckActionsHtml(name);
  }
  const badgeEl = document.getElementById('tileDeckBadge-' + name);
  if (badgeEl) {
    if (inDeck > 0) {
      badgeEl.textContent = `${inDeck}x in Deck`;
      badgeEl.style.display = 'block';
    } else {
      badgeEl.style.display = 'none';
    }
  }
}

function updateAllBrowseTilesDeckStatus() {
  document.querySelectorAll('.card-tile[data-name]').forEach(el => {
    const name = el.getAttribute('data-name');
    if (name) updateBrowseTileDeckStatus(name);
  });
}
window.updateAllBrowseTilesDeckStatus = updateAllBrowseTilesDeckStatus;'''

if old_build in c:
    c = c.replace(old_build, new_build)
else:
    old_build_crlf = old_build.replace('\n', '\r\n')
    assert old_build_crlf in c, 'old_build not found in browse.html'
    c = c.replace(old_build_crlf, new_build.replace('\n', '\r\n'))

with open('browse.html', 'w', encoding='utf-8') as f:
    f.write(c)

print('Updated browse.html with searcher remove card controls!')
