with open('app.js', 'r', encoding='utf-8') as f:
    c = f.read()

old_discover = '''  discoverPageCardList(cardName) {
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
  },'''

new_discover = '''  discoverPageCardList(cardName) {
    const collected = [];
    const path = (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname : '';

    // 1. If on Deck Builder page (/deck), prioritize current deck cards
    if (path.includes('/deck') && typeof S !== 'undefined' && S.deck && Object.keys(S.deck).length > 0) {
      const deckCards = Object.keys(S.deck);
      if (!cardName || deckCards.some(n => n.toLowerCase() === (cardName || '').toLowerCase())) {
        return deckCards;
      }
    }

    // 2. If on Browse / Searcher (/browse) or card tiles exist in DOM
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
      if (collected.length > 0) return collected;
    }

    // 5. Deck fallback if cards exist in deck
    if (typeof S !== 'undefined' && S.deck && Object.keys(S.deck).length > 0) {
      const deckCards = Object.keys(S.deck);
      if (!cardName || deckCards.some(n => n.toLowerCase() === (cardName || '').toLowerCase())) {
        return deckCards;
      }
    }

    // 6. Battle Arena: Hand and Field
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
  },'''

if old_discover in c:
    c = c.replace(old_discover, new_discover)
else:
    old_discover_crlf = old_discover.replace('\n', '\r\n')
    assert old_discover_crlf in c, 'old_discover not found'
    c = c.replace(old_discover_crlf, new_discover.replace('\n', '\r\n'))

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(c)

print('Updated discoverPageCardList in app.js!')
