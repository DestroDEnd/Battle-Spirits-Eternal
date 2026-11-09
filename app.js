// ═══════════════════ GLOBAL APP STATE & SHARED UTILS ═══════════════════
const FALLBACK_CARD_ART = window.FALLBACK_CARD_ART = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='215' height='301' viewBox='0 0 215 301'><rect width='215' height='301' fill='%230f172a'/><rect x='8' y='8' width='199' height='285' rx='10' fill='%23141e33' stroke='%23f59e0b' stroke-width='1.5' stroke-opacity='0.4'/><circle cx='107' cy='125' r='36' fill='%231e293b' stroke='%23f59e0b' stroke-width='1.2'/><text x='107' y='133' font-size='22' text-anchor='middle' fill='%23fbbf24' font-family='sans-serif'>⚔️</text><text x='107' y='185' font-size='11' font-weight='bold' text-anchor='middle' fill='%23fbbf24' font-family='sans-serif' letter-spacing='1'>BATTLE SPIRITS</text><text x='107' y='205' font-size='10' text-anchor='middle' fill='%2394a3b8' font-family='sans-serif'>Card Art Pending</text></svg>";

window.cleanCardImageUrl = function(url) {
  if (!url || typeof url !== 'string') return url || FALLBACK_CARD_ART;
  if (url.includes('static.wikia.nocookie.net') && url.includes('/revision/latest')) return url.split('/revision/latest')[0];
  return url;
};

// ═══════════════════ MULTI-DECK MANAGER & REPOSITORIES ═══════════════════
const DeckManager = {
  STORAGE_KEY: 'bs_user_decks_v2',
  ACTIVE_KEY: 'deckbuilder_selected_deck_id',
  BATTLE_KEY: 'colosseum_p1_deck_id',
  OPPONENT_KEY: 'colosseum_opponent_deck_id',

  STANDARD_DECK_NAMES: {
    red: "Hero Dragon's Blazing Soul (Standard Red)",
    purple: "Netherworld Curse & Seven Shoguns (Standard Purple)",
    green: "Emerald Gale of Insect Sovereigns (Standard Green)",
    white: "Armed Fortress & Mobile Machine Deity (Standard White)",
    yellow: "Celestial Symphony of Seraphs (Standard Yellow)",
    blue: "Colosseum Titans & Golem Mill (Standard Blue)"
  },

  CANONICAL_STANDARD_DECKS: {
    red: {
      name: "Hero Dragon's Blazing Soul (Standard Red)",
      color: "Red",
      cards: {"Goradon": 3, "Rokceratops": 3, "Lizardedge": 3, "DarkGoradon": 3, "Dragonhead": 3, "Chakrambat": 3, "Jurassickle": 3, "The HeroDragon Lord-Dragon": 3, "The ExplosionHero Lord-Dragon-Bazzel": 2, "The SengokuDragonEmperor Burning-Souldragon": 2, "Double Draw": 3, "Flame Dance": 3, "Burst Draw": 3, "Flame Tempest": 3}
    },
    purple: {
      name: "Netherworld Curse & Seven Shoguns (Standard Purple)",
      color: "Purple",
      cards: {"Foger": 3, "Camelot-Pawn": 3, "Puppet Soldier": 3, "Skulldevil": 3, "Zombie-Snake": 3, "Shadow Yatagarasu": 3, "The PoisonSnakeScythe Alphard": 3, "The NetherCorpseKnight Ajaccio": 3, "The SevenShogun Desperado": 3, "The SorcererInfernalKing Dark-Clymenus": 2, "The WhiteSnakeEmperor Aldius-Viper": 2, "Brave Cemetery": 3, "Curse of Hades": 3, "Bomburst": 3}
    },
    green: {
      name: "Emerald Gale of Insect Sovereigns (Standard Green)",
      color: "Green",
      cards: {"Beatbeetle": 3, "Axemoth": 3, "BladeG": 3, "The ForestBird Sekkohkiji": 3, "The Singing Makigale": 3, "Anaguma-Kosuke": 3, "ChickenKnight": 3, "The WingedBlade Gruid": 3, "The Duke Kingtaurus": 3, "The Emperor Kaiseratlas": 2, "The Providence Hououga X": 2, "Divine Wind": 3, "Breeze Ride": 3, "Insect Aura": 3}
    },
    white: {
      name: "Armed Fortress & Mobile Machine Deity (Standard White)",
      color: "White",
      cards: {"Icemaiden": 3, "Ray-Bullet": 3, "The ImperialMachine Ohsu-Mi": 3, "The ArmoredBeast Oozuchi": 3, "Diamond Betta": 3, "Bobcats": 3, "The Silver Guardian Blade": 3, "The SixAbsoluteDeities Impenetrable-Chrome-Riservar": 2, "The WingDeity Grand-Woden": 3, "The ArmoredDragonBattleship Enterprise": 2, "Blizzard Wall": 3, "Defensive Aura": 3, "Ice Age Shield": 3, "Co-op Barrier": 3}
    },
    yellow: {
      name: "Celestial Symphony of Seraphs (Standard Yellow)",
      color: "Yellow",
      cards: {"Koristal": 3, "Piyon": 3, "Melofuurin": 3, "The Angelia Spiele": 3, "The Angelia Archiel": 3, "Chocorone": 3, "Haneppo": 3, "Angeloid": 3, "The GreatAngeliaOfThrones Tzaphkiel": 3, "The ArcAngelia Raraphael": 2, "The ArcAngelia Mikafar XV": 2, "After Image": 3, "Defense Nebula": 3, "Additional Color": 3}
    },
    blue: {
      name: "Colosseum Titans & Golem Mill (Standard Blue)",
      color: "Blue",
      cards: {"The BattleBeast Bulltop": 3, "Rammer-Golem": 3, "Drian": 3, "Mechanic-Corgi": 3, "The GreenBird Douji": 3, "Chacopecca": 3, "Dolphino": 3, "The GiantEmperor Alexander": 3, "The GiantHero Titus": 3, "The GiantHero Titus XV": 2, "Spinning Sword": 3, "Lead Wall": 3, "Ptolemaios": 3, "The Giants of Light": 2}
    }
  },

  getCardsCount(cards) {
    if (!cards) return 0;
    if (Array.isArray(cards)) {
      return cards.reduce((a, b) => {
        if (Array.isArray(b)) return a + (typeof b[1] === 'number' ? b[1] : 1);
        if (typeof b === 'object' && b !== null) return a + (typeof b.count === 'number' ? b.count : 1);
        return a + 1;
      }, 0);
    }
    if (typeof cards === 'object') {
      return Object.values(cards).reduce((a, b) => {
        if (typeof b === 'number') return a + b;
        if (Array.isArray(b)) return a + (typeof b[1] === 'number' ? b[1] : 1);
        if (typeof b === 'object' && b !== null) return a + (typeof b.count === 'number' ? b.count : 1);
        return a + 1;
      }, 0);
    }
    return 0;
  },

  getAllData() {
    let data = null;
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) data = JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse bs_user_decks_v2:', e);
    }

    if (!data || !Array.isArray(data.decks) || data.decks.length === 0) {
      data = this._migrateInitialDecks();
    } else {
      // If the user's only deck is the default auto-seeded red standard deck, convert to clean empty custom deck
      if (data.decks && data.decks.length === 1 && data.decks[0].id === 'deck_std_red' && !localStorage.getItem('bse_keep_std_red')) {
        data.decks[0] = {
          id: 'deck_custom_1',
          name: 'My Custom Deck',
          color: 'Red',
          isStandard: false,
          cards: {},
          updatedAt: Date.now()
        };
        data.activeDeckId = 'deck_custom_1';
        data.battleDeckId = 'deck_custom_1';
        this.saveAllData(data);
      }

      // Auto-repair any standard decks that have 0 cards (e.g. from previous empty migration)
      let repaired = false;
      for (const d of data.decks) {
        if (d.isStandard) {
          const colorKey = (d.standardKey || 'red').toLowerCase();
          const canon = this.CANONICAL_STANDARD_DECKS[colorKey];
          const count = this.getCardsCount(d?.cards);
          if (canon && count === 0) {
            d.cards = { ...canon.cards };
            d.updatedAt = Date.now();
            repaired = true;
          }
        }
      }
      if (repaired) {
        this.saveAllData(data);
      }

      // Auto-sync cards from active builder cache (bs_deck) if active deck is empty
      try {
        const legacyRaw = localStorage.getItem('bs_deck') || localStorage.getItem('battle_spirits_deck_v1');
        if (legacyRaw) {
          const legacyCards = JSON.parse(legacyRaw);
          const legacyTotal = Object.values(legacyCards || {}).reduce((a, b) => a + (typeof b === 'number' ? b : 1), 0);
          if (legacyTotal > 0) {
            const active = data.decks.find(d => d.id === data.activeDeckId) || data.decks[0];
            if (active && (!active.cards || Object.keys(active.cards).length === 0)) {
              active.cards = { ...legacyCards };
              active.updatedAt = Date.now();
              this.saveAllData(data);
            }
          }
        }
      } catch (e) {}
    }
    return data;
  },

  _migrateInitialDecks() {
    let legacyCards = {};
    try {
      legacyCards = JSON.parse(localStorage.getItem('bs_deck') || localStorage.getItem('battle_spirits_deck_v1') || '{}');
    } catch (e) {}

    const legacyTotal = this.getCardsCount(legacyCards);
    const decks = [];

    // If user already had a custom deck with cards, preserve it
    if (legacyTotal > 0) {
      decks.push({
        id: 'deck_custom_legacy',
        name: 'My Custom Deck',
        color: 'Red',
        isStandard: false,
        cards: { ...legacyCards },
        updatedAt: Date.now()
      });
    } else {
      // Default: clean empty custom deck!
      decks.push({
        id: 'deck_custom_1',
        name: 'My Custom Deck',
        color: 'Red',
        isStandard: false,
        cards: {},
        updatedAt: Date.now()
      });
    }

    const activeId = decks[0].id;
    const battleId = activeId;
    const initialData = {
      activeDeckId: activeId,
      battleDeckId: battleId,
      decks
    };

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(initialData));
    } catch (e) {}

    return initialData;
  },

  saveAllData(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      const active = this.getActiveDeck(data);
      if (active) {
        localStorage.setItem('bs_deck', JSON.stringify(active.cards || {}));
        localStorage.setItem('battle_spirits_deck_v1', JSON.stringify(active.cards || {}));
      }
    } catch (e) {
      console.warn('Failed to save bs_user_decks_v2:', e);
    }
  },

  getDecks() {
    return this.getAllData().decks;
  },

  getDeck(id) {
    if (!id) return null;
    const data = this.getAllData();
    return data.decks.find(d => d.id === id) || null;
  },

  getActiveDeckId() {
    const saved = localStorage.getItem(this.ACTIVE_KEY);
    const data = this.getAllData();
    if (saved && data.decks.some(d => d.id === saved)) {
      return saved;
    }
    return data.activeDeckId || (data.decks[0] ? data.decks[0].id : null);
  },

  getActiveDeck(data) {
    if (!data) data = this.getAllData();
    const activeId = this.getActiveDeckId();
    let deck = data.decks.find(d => d.id === activeId) || data.decks[0] || null;
    if (deck && deck.isStandard) {
      const colorKey = (deck.standardKey || 'red').toLowerCase();
      const canon = this.CANONICAL_STANDARD_DECKS[colorKey];
      const count = this.getCardsCount(deck?.cards);
      if (canon && count === 0) {
        deck.cards = { ...canon.cards };
        deck.updatedAt = Date.now();
        this.saveAllData(data);
      }
    }
    return deck;
  },

  setActiveDeckId(id) {
    const data = this.getAllData();
    if (!data.decks.some(d => d.id === id)) return;
    data.activeDeckId = id;
    localStorage.setItem(this.ACTIVE_KEY, id);
    this.saveAllData(data);
  },

  getBattleDeckId() {
    const saved = localStorage.getItem(this.BATTLE_KEY);
    const data = this.getAllData();
    const countCards = (d) => this.getCardsCount(d?.cards);

    if (saved) {
      const d = data.decks.find(x => x.id === saved);
      if (d && countCards(d) >= 40) return saved;
    }
    if (data.battleDeckId) {
      const d = data.decks.find(x => x.id === data.battleDeckId);
      if (d && countCards(d) >= 40) return data.battleDeckId;
    }
    // Fallback to first registered deck that has >= 40 cards
    const validDeck = data.decks.find(d => countCards(d) >= 40);
    if (validDeck) {
      data.battleDeckId = validDeck.id;
      localStorage.setItem(this.BATTLE_KEY, validDeck.id);
      return validDeck.id;
    }
    return data.decks[0] ? data.decks[0].id : null;
  },

  setBattleDeckId(id) {
    const data = this.getAllData();
    const deck = data.decks.find(d => d.id === id);
    if (!deck) return false;
    const count = this.getCardsCount(deck?.cards);
    if (count < 40) {
      console.warn(`Cannot set deck "${deck.name}" as battle deck: only has ${count}/40 cards.`);
      return false;
    }
    data.battleDeckId = id;
    localStorage.setItem(this.BATTLE_KEY, id);
    this.saveAllData(data);
    return true;
  },

  createDeck(name = 'New Deck', color = 'Red', initialCards = {}) {
    const data = this.getAllData();
    const id = 'deck_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const newDeck = {
      id,
      name: name.trim() || 'Untitled Deck',
      color: color || 'Red',
      isStandard: false,
      cards: { ...initialCards },
      updatedAt: Date.now()
    };
    data.decks.push(newDeck);
    data.activeDeckId = id;
    localStorage.setItem(this.ACTIVE_KEY, id);
    this.saveAllData(data);
    return newDeck;
  },

  renameDeck(id, newName) {
    const data = this.getAllData();
    const deck = data.decks.find(d => d.id === id);
    if (!deck) return false;
    deck.name = newName.trim() || deck.name;
    deck.updatedAt = Date.now();
    this.saveAllData(data);
    return true;
  },

  deleteDeck(id) {
    const data = this.getAllData();
    if (data.decks.length <= 1) {
      data.decks = [{
        id: 'deck_' + Date.now(),
        name: 'My Deck',
        color: 'Red',
        isStandard: false,
        cards: {},
        updatedAt: Date.now()
      }];
      data.activeDeckId = data.decks[0].id;
      data.battleDeckId = data.decks[0].id;
      localStorage.setItem(this.ACTIVE_KEY, data.decks[0].id);
      localStorage.setItem(this.BATTLE_KEY, data.decks[0].id);
      this.saveAllData(data);
      return true;
    }

    const idx = data.decks.findIndex(d => d.id === id);
    if (idx === -1) return false;
    data.decks.splice(idx, 1);
    if (data.activeDeckId === id) {
      data.activeDeckId = data.decks[0].id;
      localStorage.setItem(this.ACTIVE_KEY, data.decks[0].id);
    }
    if (data.battleDeckId === id) {
      data.battleDeckId = data.decks[0].id;
      localStorage.setItem(this.BATTLE_KEY, data.decks[0].id);
    }
    this.saveAllData(data);
    return true;
  },

  saveActiveDeckCards(cardsMap) {
    const data = this.getAllData();
    const active = this.getActiveDeck(data);
    if (!active) return;
    active.cards = { ...cardsMap };
    active.updatedAt = Date.now();
    this.saveAllData(data);
  },

  async registerStandardDeck(colorKey, stdData = null) {
    colorKey = (colorKey || 'red').toLowerCase();
    const data = this.getAllData();
    const canon = this.CANONICAL_STANDARD_DECKS[colorKey];

    // Check if already registered
    const existing = data.decks.find(d => d.isStandard && d.standardKey === colorKey);
    if (existing) {
      const existingCount = this.getCardsCount(existing?.cards);
      if (existingCount === 0 && canon) {
        existing.cards = { ...canon.cards };
        existing.updatedAt = Date.now();
      }
      data.activeDeckId = existing.id;
      localStorage.setItem(this.ACTIVE_KEY, existing.id);
      this.saveAllData(data);
      return existing;
    }

    let deckInfo = stdData;
    if (!deckInfo && typeof window !== 'undefined' && window.location && window.location.origin) {
      try {
        const res = await fetch('/api/standard-decks?color=' + encodeURIComponent(colorKey));
        if (res.ok) deckInfo = await res.json();
      } catch (e) {
        console.warn('Failed to fetch standard deck:', e);
      }
    }

    let cardsMap = {};
    if (deckInfo && deckInfo.validated_cards && deckInfo.validated_cards.length > 0) {
      deckInfo.validated_cards.forEach(c => {
        cardsMap[c.name] = c.count;
      });
    } else if (canon) {
      cardsMap = { ...canon.cards };
    }

    const id = 'deck_std_' + colorKey + '_' + Date.now();
    const name = deckInfo ? `${deckInfo.name} (Standard ${deckInfo.color})` : (canon ? canon.name : (this.STANDARD_DECK_NAMES[colorKey] || `${colorKey.toUpperCase()} Standard Deck`));
    const newDeck = {
      id,
      name,
      color: (deckInfo?.color || (canon ? canon.color : colorKey.charAt(0).toUpperCase() + colorKey.slice(1))),
      isStandard: true,
      standardKey: colorKey,
      cards: cardsMap,
      updatedAt: Date.now()
    };

    data.decks.push(newDeck);
    data.activeDeckId = id;
    localStorage.setItem(this.ACTIVE_KEY, id);
    this.saveAllData(data);
    return newDeck;
  },

  isStandardDeckRegistered(colorKey) {
    colorKey = (colorKey || '').toLowerCase();
    const data = this.getAllData();
    return data.decks.some(d => d.isStandard && d.standardKey === colorKey);
  }
};
window.DeckManager = DeckManager;

// Initial state from active deck
const _initActiveDeck = DeckManager.getActiveDeck();
const S = {
  deck: _initActiveDeck ? { ..._initActiveDeck.cards } : {},
  currentCard: null,
  filtersData: null,
  parsedImportDeck: null
};

// ═══════════════════ UTILITIES ═══════════════════
function esc(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeJsStr(str) {
  return String(str || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function showToast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const item = document.createElement('div');
  item.className = `toast-item toast-${type}`;
  item.innerHTML = `<span>${esc(msg)}</span>`;
  container.appendChild(item);
  setTimeout(() => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(10px)';
    item.style.transition = 'all 0.3s';
    setTimeout(() => {
      if (typeof item.remove === 'function') item.remove();
      else if (item.parentNode && typeof item.parentNode.removeChild === 'function') item.parentNode.removeChild(item);
    }, 300);
  }, 3200);
}

// ═══════════════════ DECK OPERATIONS ═══════════════════
function updateDeckBadge() {
  const total = Object.values(S.deck).reduce((a, b) => a + b, 0);
  const badge = document.getElementById('deckBadge');
  if (badge) badge.textContent = total;
  const mobileBadge = document.getElementById('mobileDeckBadge');
  if (mobileBadge) mobileBadge.textContent = total;
  if (typeof DeckQuickView !== 'undefined') {
    DeckQuickView.update();
  }
  if (typeof window !== 'undefined' && typeof window.updateAllBrowseTilesDeckStatus === 'function') {
    window.updateAllBrowseTilesDeckStatus();
  }
  if (typeof updateModalDeckButtons === 'function') {
    updateModalDeckButtons();
  }
}

function saveDeck() {
  if (window.DeckManager) {
    DeckManager.saveActiveDeckCards(S.deck);
  }
  localStorage.setItem('bs_deck', JSON.stringify(S.deck));
  localStorage.setItem('battle_spirits_deck_v1', JSON.stringify(S.deck));
}

function addToDeck(name) {
  const cur = S.deck[name] || 0;
  if (cur >= 3) {
    showToast(`Maximum 3 copies reached for "${name}"!`, 'error');
    return;
  }
  S.deck[name] = cur + 1;
  saveDeck();
  updateDeckBadge();
  showToast(`Added 1x "${name}" to deck (${S.deck[name]}/3)`, 'success');
  if (typeof DeckQuickView !== 'undefined') DeckQuickView.flashAddAnimation();
  if (typeof renderDeckView === 'function') renderDeckView();
  if (typeof DeckManagerUI !== 'undefined') DeckManagerUI.renderDeckSelector();
}

function removeFromDeck(name) {
  if (!S.deck[name]) return;
  S.deck[name]--;
  if (S.deck[name] <= 0) delete S.deck[name];
  saveDeck();
  updateDeckBadge();
  if (typeof renderDeckView === 'function') renderDeckView();
  if (typeof DeckManagerUI !== 'undefined') DeckManagerUI.renderDeckSelector();
}

function clearDeck() {
  if (confirm('Are you sure you want to clear your active deck?')) {
    S.deck = {};
    saveDeck();
    updateDeckBadge();
    if (typeof renderDeckView === 'function') renderDeckView();
    if (typeof DeckManagerUI !== 'undefined') DeckManagerUI.renderDeckSelector();
    showToast('Active deck cleared.', 'success');
  }
}

function exportDeck() {
  const txt = Object.entries(S.deck).map(([n, c]) => `${c}x ${n}`).join('\n');
  if (!txt) { showToast('Active deck is empty!', 'error'); return; }
  navigator.clipboard.writeText(txt).then(() => showToast('📋 Deck list copied to clipboard!', 'success'));
}

function exportDeckJson() {
  const entries = Object.entries(S.deck);
  if (!entries.length) { showToast('Active deck is empty!', 'error'); return; }
  const total = entries.reduce((a, [, c]) => a + c, 0);
  const deckData = {
    name: 'Battle Spirits Deck',
    exported_at: new Date().toISOString(),
    total_cards: total,
    unique_cards: entries.length,
    cards: entries.map(([name, count]) => ({ name, count }))
  };
  const blob = new Blob([JSON.stringify(deckData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `battle_spirits_deck_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('💾 Saved JSON deck file to computer!', 'success');
}

function exportDeckTxt() {
  const entries = Object.entries(S.deck);
  if (!entries.length) { showToast('Active deck is empty!', 'error'); return; }
  const lines = [
    `# Battle Spirits Deck Export`,
    `# Total Cards: ${entries.reduce((a, [, c]) => a + c, 0)}`,
    ...entries.map(([name, count]) => `${count}x ${name}`)
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `battle_spirits_deck_${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('📄 Saved TXT deck file to computer!', 'success');
}

async function saveDeckPrompt() {
  const name = prompt('Name this deck:', 'My Deck');
  if (!name) return;
  const cards = Object.entries(S.deck).map(([n, c]) => ({ name: n, count: c }));
  try {
    await fetch('/api/decks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, cards })
    });
    showToast(`Deck "${name}" saved to library!`, 'success');
  } catch (err) {
    showToast('Failed to save deck to server.', 'error');
  }
}

// ═══════════════════ CARD DETAIL MODAL ═══════════════════
function formatEffectKeywordsInModal(text) {
  if (!text) return '<span style="color:var(--muted);font-style:italic;">No special effects or abilities.</span>';
  let safe = esc(text);

  // Clean raw html tags from wiki card text (e.g. <sub>, <sup>)
  safe = safe.replace(/&lt;sub&gt;\s*\((.*?)\)\s*&lt;\/sub&gt;|&lt;sub&gt;\s*(.*?)\s*&lt;\/sub&gt;/gi, ' <span class="effect-reminder-box">ℹ️ ($1$2)</span>');
  safe = safe.replace(/&lt;sup&gt;\s*(.*?)\s*&lt;\/sup&gt;/gi, '<sup>$1</sup>');

  // 1. Advent, Contract Advent, Manifest (顕現)
  safe = safe.replace(/(?:Flash\s*-\s*)?\[(?:Contract\s+)?Advent:[^\]]+(?:\([^)]*\)[^\]]*)*\]|【(?:契約)?煌臨：[^】]+】/gi, '<span class="effect-keyword-pill kw-advent">$&</span>');
  safe = safe.replace(/(?:Flash\s*-\s*)?\[(?:Manifest|Mani):[^\]]+\]|【顕現：[^】]+】/gi, '<span class="effect-keyword-pill kw-manifest">$&</span>');
  safe = safe.replace(/\[Mani\]/gi, '<span class="effect-keyword-pill kw-manifest">[Manifest]</span>');

  // 1a. Accel (アクセル) - Flash/Main timing, Cost and Bracketed/Unbracketed variants
  safe = safe.replace(/(?:(Flash|Main|Flash\/Main|Main\/Flash)\s*[-–—]\s*)?\[Accel:\s*Cost\s*([\s\S]*?(?:\)|\bCore\]|symbols?\]|\d+))\s*\]/gi, (match, timing, costBody) => {
    let out = '';
    if (timing) {
      const tCls = timing.toLowerCase().includes('flash') ? 'kw-flash' : 'kw-main';
      out += `<span class="effect-keyword-pill ${tCls}">[${timing}]</span> `;
    }
    let cleanCost = costBody.trim();
    if (cleanCost.startsWith('(') && !cleanCost.endsWith(')')) {
      cleanCost = cleanCost.replace(/\]+$/, '') + ')';
    }
    out += `<span class="effect-keyword-pill kw-accel">[Accel: Cost ${cleanCost}]</span>`;
    return out;
  });

  safe = safe.replace(/(?:(Flash|Main|Flash\/Main|Main\/Flash)\s*[-–—]\s*)Accel:\s*Cost\s*(\d+)/gi, (match, timing, costNum) => {
    let out = '';
    if (timing) {
      const tCls = timing.toLowerCase().includes('flash') ? 'kw-flash' : 'kw-main';
      out += `<span class="effect-keyword-pill ${tCls}">[${timing}]</span> `;
    }
    out += `<span class="effect-keyword-pill kw-accel">[Accel: Cost ${costNum}]</span>`;
    return out;
  });

  safe = safe.replace(/\[Accel\]|【アクセル(?:：コスト[^】]+)?】/gi, '<span class="effect-keyword-pill kw-accel">$&</span>');

  // 1b. Reminder text expansions for wiki abbreviations ([utb], [wutb], [tutb], [qutb], [cutb], [outb], [heb])
  safe = safe.replace(/\[heb\]/gi, '<span class="effect-reminder-box">ℹ️ (Heavy Exhaust: Exhausted card is turned upside down and requires two refreshes to return to ready.)</span>');
  safe = safe.replace(/\[utb\]/gi, '<span class="effect-reminder-box">ℹ️ (Ultimate Trigger: Send 1 card from opposing Deck top to Trash. If that card\'s cost is lower than this Ultimate\'s, it hits.)</span>');
  safe = safe.replace(/\[wutb\]/gi, '<span class="effect-reminder-box">ℹ️ (Double Ultimate Trigger: Send 2 cards from opposing Deck top to Trash. For each card whose cost is lower than this Ultimate\'s, it hits.)</span>');
  safe = safe.replace(/\[tutb\]/gi, '<span class="effect-reminder-box">ℹ️ (Triple Ultimate Trigger: Send 3 cards from opposing Deck top to Trash. For each card whose cost is lower than this Ultimate\'s, it hits.)</span>');
  safe = safe.replace(/\[qutb\]/gi, '<span class="effect-reminder-box">ℹ️ (Quadruple Ultimate Trigger: Send 4 cards from opposing Deck top to Trash. For each card whose cost is lower than this Ultimate\'s, it hits.)</span>');
  safe = safe.replace(/\[cutb\]/gi, '<span class="effect-reminder-box">ℹ️ (Count Ultimate Trigger: Send 1 card from opposing Deck top to Trash. If that card\'s cost is lower than this Ultimate\'s current Count, it hits.)</span>');
  safe = safe.replace(/\[outb\]/gi, '<span class="effect-reminder-box">ℹ️ (Octa Ultimate Trigger: Send 8 cards from opposing Deck top to Trash. For each card whose cost is lower than this Ultimate\'s, it hits.)</span>');
  safe = safe.replace(/\[xutb\]/gi, '<span class="effect-keyword-pill kw-utrigger">[Cross Ultimate Trigger]</span>');
  safe = safe.replace(/\[dcutb\]/gi, '<span class="effect-keyword-pill kw-utrigger">[Double Count Ultimate Trigger]</span>');
  safe = safe.replace(/\[team:\s*([^\]]+)\]/gi, '<span class="effect-keyword-pill kw-team">[Team: $1]</span>');
  safe = safe.replace(/\[teams:\s*([^\]]+)\]/gi, '<span class="effect-keyword-pill kw-team">[Teams: $1]</span>');
  safe = safe.replace(/\[uhand:\s*([^\]]+)\]/gi, '<span class="effect-keyword-pill kw-uhand">[U-Hand: $1]</span>');
  safe = safe.replace(/\[catl:\s*([^\]]+)\]/gi, '<span class="effect-keyword-pill kw-catalyze">[Catalyze: $1]</span>');
  safe = safe.replace(/\[zc\]/gi, '<span class="effect-keyword-pill kw-zc">[Zero Counter]</span>');
  safe = safe.replace(/\[advents\]/gi, 'Advents');
  safe = safe.replace(/\[advented\]/gi, 'Advented');
  safe = safe.replace(/\[adventing\]/gi, 'Adventing');
  safe = safe.replace(/\[manis\]/gi, 'Manifests');
  safe = safe.replace(/\[manid\]/gi, 'Manifested');
  safe = safe.replace(/\[rtp\]/gi, '');
  safe = safe.replace(/\[deh:\s*([^\]]+)\]/gi, '<span class="effect-keyword-pill kw-limit">[Heavy Exhaust: $1]</span>');
  safe = safe.replace(/\[mflash:\s*([^\]]+)\]/gi, '<span class="effect-keyword-pill kw-flash">[Mirage Flash: $1]</span>');
  safe = safe.replace(/\[mdrain:\s*([^\]]+)\]/gi, '<span class="effect-keyword-pill kw-flash">[Magic Drain: $1]</span>');
  safe = safe.replace(/\[msyn:\s*([^\]]+)\]/gi, '<span class="effect-keyword-pill kw-flash">[Magic Synergy: $1]</span>');

  // 2. Soul Burst, Burst, and Burst Condition
  safe = safe.replace(/\[Soul Burst(?::[^\]]+)?\]|\[Burst:\s*[sS]\]|【(?:ソウルバースト|バースト：[SＳｓ])(?::[^】]+)?】/gi, '<span class="effect-keyword-pill kw-soul-burst">[Soul Burst]</span>');
  safe = safe.replace(/\[Burst Condition(?::[^\]]+)?\]|\[Burst:\s*con\]|【バースト条件(?::[^】]+)?】/gi, '<span class="effect-keyword-pill kw-burst-cond">[Burst Condition]</span>');
  safe = safe.replace(/\[Burst(?::[^\]]+)?\]|【バースト(?::[^】]+)?】/gi, (match) => {
    if (/soul\s*burst/i.test(match)) return `<span class="effect-keyword-pill kw-soul-burst">${match}</span>`;
    return `<span class="effect-keyword-pill kw-burst">${match}</span>`;
  });

  // 3. Summon Conditions & SuAdcon
  safe = safe.replace(/\[(?:Summon Condition|Summon\/Advent Condition|SuAdcon):[^\]]+\]|【(?:召喚条件|召喚\/煌臨条件)：[^】]+】/gi, '<span class="effect-keyword-pill kw-summon-cond">$&</span>');

  // 4. Brave Conditions
  safe = safe.replace(/\[(?:Brave Condition|Brave condition):[^\]]+\]|【合体条件：[^】]+】/gi, '<span class="effect-keyword-pill kw-brave-cond">$&</span>');

  // 5. Over Count, Soul State, and Active States
  safe = safe.replace(/\[During\s*OC\]|【OC中】|\[OC\s*Condition:[^\]]+\]/gi, '<span class="effect-keyword-pill kw-oc">$&</span>');
  safe = safe.replace(/\[Soul\s*State\]|【ソウル状態】/gi, '<span class="effect-keyword-pill kw-soul-state">$&</span>');
  safe = safe.replace(/\[(?:During\s+Advent|When\s+Braved|During\s+Brave|During\s+Set|During\s+Nexus\s+Brave|During\s+Spirit\s+Brave)\]|【(?:合体中|合体時|煌臨中|セット中)】/gi, '<span class="effect-keyword-pill kw-state">$&</span>');

  // 6. Level tags like [LV1], [LV2][LV3]
  safe = safe.replace(/\[(LV\d+(?:[-~]LV\d+)*)\]/gi, '<span class="effect-keyword-pill kw-level">[$1]</span>');

  // 7. Manual Actions & God Skills ([Main], [Flash], [Grand Skill: N], [Grand Field], [Contract Skill: N], [Contract Field])
  safe = safe.replace(/\[(?:Main|MAIN)\]|【メイン】/g, '<span class="effect-keyword-pill kw-main">[Main]</span>');
  safe = safe.replace(/\[(?:Flash|FLASH)\]|【フラッシュ】/g, '<span class="effect-keyword-pill kw-flash">[Flash]</span>');
  safe = safe.replace(/\[(?:Grand|Contract)\s*Skill:\s*(\d+)\]|【(?:神技|契約技)：(\d+)】/gi, '<span class="effect-keyword-pill kw-grand">$&</span>');
  safe = safe.replace(/\[(?:Grand|Contract)\s*Field\]|【(?:神域|契約域)】/gi, '<span class="effect-keyword-pill kw-grand">$&</span>');

  // 8. Limiters: (Once per Turn: Same Name), (Once per Turn), etc.
  safe = safe.replace(/\((Once per Turn(?::\s*[^)]+)?|Once per turn(?::\s*[^)]+)?|Once per Game)\)|【(ターンに\d+回[^】]*)】/gi, '<span class="effect-keyword-pill kw-limit">$&</span>');

  // 9. Timing and Step triggers (guarded against matching inside brackets)
  safe = safe.replace(/(?<!\[[^\]]*)(?<!<[^>]*)\((When (?:Brave\s+)?(?:Attacks|Summoned|Advents|Battles|Blocks|Manifests|Reborn|Destroyed)(?:\/[^)]+)?|After (?:Your |a )?Burst [^)]+|Twinkle Necromancy|(?:Your|Opponent's|Opposing|Either)\s+Attack\s+Step|(?:Main|Refresh|Start|Core|Draw|End)\s+Step|During (?:either|your|opposing|opponent's) Attack Step)\)/gi, (match) => {
    return `<span class="effect-keyword-pill kw-timing">${match}</span>`;
  });

  // 10. Soul Core & Color Cores ([Soul Core], [Red Core], [Purple Core], etc.)
  safe = safe.replace(/(?<!<[^>]*)(?:\[Soul Core(?::[^\]]+)?\]|【ソウルコア】)/gi, '<span class="effect-keyword-pill kw-soul-core">$&</span>');
  safe = safe.replace(/\[(Red|Purple|Green|White|Yellow|Blue)\s+Core\]/gi, (match, color) => {
    return `<span class="effect-keyword-pill kw-core-${color.toLowerCase()}">${match}</span>`;
  });

  // 11. Ultimate Triggers
  safe = safe.replace(/(?<!<[^>]*)(?:\[(?:Ultimate Trigger|U-Trigger|Cross Ultimate Trigger|XU-Trigger|Hit|Critical Hit)\]|【(?:Uトリガー|XUトリガー|ヒット|クリティカルヒット)】)/gi, '<span class="effect-keyword-pill kw-utrigger">$&</span>');

  // 12. Highlight all Official Battle Spirits Wiki Keywords (English and Japanese)
  const allKwPattern = /\[(A\.T\.\s*Field|Accel(?::[^\]]+)?|Advent(?::[^\]]+)?|Amplify|Appeal|Armed Intervention|Armor(?::[^\]]+)?|Assault(?::\s*\d+)?|Assemble|Awaken|Barrage|Bombardment|Brilliance|Buddy|Bunshin(?::\s*\d+)?|Burst(?::[^\]]+)?|Burst S|Bushido|Cast Off|Catalyze|Change|Charge|Clash|Clock Up|Consecutive Blade|Contract Armor|Contract Awaken|Contract Unleash|Core Charge|Count Break|Crush|Curse|Digivolution(?::[^\]]+)?|Digivolve(?::[^\]]+)?|Dispersion|Diva Rush|Double Drive|Draw Lock|Emperor Road|Fast Draw|Fierce Windstorm|Flashing Swift|Fortress|Friend|Funnel|God Strike|Grand Assault|Grand Field|Grand Ice Wall|Grand Skill|Grandphosis|Great Assault|Great Crush|Heavenly Light|Heavy Armor(?::[^\]]+)?|Heavy Exhaust(?::[^\]]+)?|High Speed|Holy Life|Ice Wall(?::[^\]]+)?|Immortality(?::[^\]]+)?|Infinite Blade|Infinite Flame|Kagemusha|Leap|Level Up|Load(?::\s*\d+)?|Manifest(?::[^\]]+)?|Mani(?::[^\]]+)?|Mirage(?::[^\]]+)?|My Unit|NT-D|On Stage|Plunder|Poison Blade|PS Armor|Pursuit|Rebirth|Reload|Resonance|Revive|Rumble(?::\s*\d+)?|Rush(?::[^\]]+)?|Seal|Shamanism|Show Up|Six Heaven Rush|Soar|Solo Part|Soul Awaken|Soul Burst(?::[^\]]+)?|Soul Drive|Soul Magic|Sound Speed|Spellbind|Spell Blight|Spirit Soul(?::[^\]]+)?|Stampede|Super Boost|Super Unleash|Supreme Clash|Trans-Am(?::[^\]]+)?|Tribute(?::[^\]]+)?|Trigger Counter|True-Awaken|True-Clash|True-Curse|Twinkle(?::[^\]]+)?|Ultra Armor(?::[^\]]+)?|Ultra Holy Life|Unleash|Unsheathe|Windstorm(?::\s*\d+)?|Zero Counter|Flash|Twinkle Necromancy)\]|【(連鎖(?::[^】]+)?|激突|呪撃|粉砕|大粉砕|装甲(?::[^】]+)?|重装甲(?::[^】]+)?|超装甲(?::[^】]+)?|神速|烈神速|抜刀|覚醒|超覚醒|不老不死|ソウルドライブ|バースト(?::[^】]+)?|ソウルバースト|アクセル(?::[^】]+)?|煌臨(?::[^】]+)?|契約煌臨(?::[^】]+)?|顕現|ミラージュ(?::[^】]+)?|転醒|影武者|六天連鎖(?::[^】]+)?|連刃|強襲(?::[^】]+)?|旋風(?::[^】]+)?|聖命|氷壁(?::[^】]+)?)】/gi;

  safe = safe.replace(allKwPattern, (match) => {
    let cls = 'kw-generic';
    const low = match.toLowerCase();
    if (low.includes('soul burst') || low.includes('burst s') || low.includes('ソウルバースト')) cls = 'kw-soul-burst';
    else if (low.includes('manifest') || low.includes('mani') || low.includes('顕現')) cls = 'kw-manifest';
    else if (low.includes('contract advent') || low.includes('契約煌臨')) cls = 'kw-advent';
    else if (low.includes('advent') || low.includes('twinkle') || low.includes('煌臨')) cls = 'kw-advent';
    else if (low.includes('clash') || low.includes('激突')) cls = 'kw-clash';
    else if (low.includes('curse') || low.includes('呪撃')) cls = 'kw-curse';
    else if (low.includes('crush') || low.includes('粉砕')) cls = 'kw-crush';
    else if (low.includes('holy life') || low.includes('heavenly light') || low.includes('聖命')) cls = 'kw-holylife';
    else if (low.includes('windstorm') || low.includes('whirlwind') || low.includes('旋風')) cls = 'kw-windstorm';
    else if (low.includes('assault') || low.includes('強襲')) cls = 'kw-assault';
    else if (low.includes('high speed') || low.includes('swift') || low.includes('sound speed') || low.includes('神速')) cls = 'kw-highspeed';
    else if (low.includes('awaken') || low.includes('覚醒')) cls = 'kw-awaken';
    else if (low.includes('immortality') || low.includes('revive') || low.includes('不老不死')) cls = 'kw-immortality';
    else if (low.includes('soul drive') || low.includes('ソウルドライブ')) cls = 'kw-souldrive';
    else if (low.includes('soul core') || low.includes('ソウルコア')) cls = 'kw-soul-core';
    else if (low.includes('ice wall') || low.includes('氷壁')) cls = 'kw-icewall';
    else if (low.includes('armor') || low.includes('field') || low.includes('装甲')) cls = 'kw-armor';
    else if (low.includes('burst') || low.includes('バースト')) cls = 'kw-burst';
    else if (low.includes('flash')) cls = 'kw-flash';
    else if (low.includes('tribute')) cls = 'kw-tribute';
    else if (low.includes('consecutive blade') || low.includes('連刃')) cls = 'kw-consecutive';
    else if (low.includes('mirage') || low.includes('ミラージュ')) cls = 'kw-mirage';
    else if (low.includes('spellbind') || low.includes('spell blight')) cls = 'kw-spellbind';
    else if (low.includes('accel') || low.includes('アクセル')) cls = 'kw-accel';
    else if (low.includes('change') || low.includes('チェンジ')) cls = 'kw-change';
    else if (low.includes('charge')) cls = 'kw-charge';
    else if (low.includes('rush') || low.includes('連鎖')) cls = 'kw-rush';
    else if (low.includes('rebirth') || low.includes('転醒')) cls = 'kw-rebirth';
    else if (low.includes('kagemusha') || low.includes('影武者')) cls = 'kw-kagemusha';
    else if (low.includes('unsheathe') || low.includes('抜刀')) cls = 'kw-unsheathe';
    else if (low.includes('unleash')) cls = 'kw-unleash';
    else if (low.includes('grand')) cls = 'kw-grand';
    return `<span class="effect-keyword-pill ${cls}">${match}</span>`;
  });

  // 13. Card Name References: Make referenced card names in quotes clickable!
  safe = safe.replace(/(?:&quot;|[“”「」])([A-Za-z0-9\s,'\-\.]+?)(?:&quot;|[”"」])/gu, (match, cardName) => {
    const trimmed = cardName.trim();
    const exclude = new Set([
      'Ancient Dragon', 'Astral Dragon', 'Ogre Wizard', 'Evil God', 'DemonLord',
      'Hell Contract', 'Purple', 'Red', 'Green', 'White', 'Yellow', 'Blue',
      'Your Turn', "Opponent's Turn", 'Either Attack Step', 'Your Attack Step', "Opponent's Attack Step"
    ]);
    if (exclude.has(trimmed)) return match;
    const isKnownCard = trimmed.startsWith('The ') ||
      (typeof CardEffectsDB !== 'undefined' && CardEffectsDB[trimmed]) ||
      (typeof WasmDB !== 'undefined' && WasmDB.getCardByName && WasmDB.getCardByName(trimmed));
    if (isKnownCard) {
      const safeJs = trimmed.replace(/'/g, "\\'");
      return `"<span class="card-ref-link" onclick="event.stopPropagation(); if (typeof openCardDetail === 'function') openCardDetail('${safeJs}')" style="color:#60a5fa; text-decoration:underline; font-weight:700; cursor:pointer;" title="Click to inspect ${trimmed}">${trimmed}</span>"`;
    }
    return match;
  });

  return safe;
}


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
            <span class="deck-quick-count-tag" id="quickDeckFlyoutCount">0 Cards (40 Min)</span>
            <button class="deck-quick-close-btn" onclick="DeckQuickView.toggle(false)" title="Close Deck Popup">✕</button>
          </div>
        </div>

        <!-- Deck Switcher & Creation Bar -->
        <div class="deck-quick-switch-bar">
          <div class="deck-quick-select-wrap">
            <span class="deck-quick-select-icon">📁</span>
            <select class="deck-quick-select" id="quickDeckSelect" onchange="DeckQuickView.onDeckSelectChange(this.value)" title="Change Active Deck">
              <!-- Dynamically populated with all decks -->
            </select>
          </div>
          <button class="btn-quick-new-deck" id="btnQuickNewDeck" onclick="DeckQuickView.createNewDeckPrompt()" title="Create a new deck">+ New</button>
          <button class="btn-quick-icon-btn" onclick="DeckQuickView.renameCurrentDeckPrompt()" title="Rename active deck">✏️</button>
        </div>

        <div class="deck-quick-flyout-body" id="quickDeckCardList">
          <!-- Populated dynamically -->
        </div>

        <div class="deck-quick-flyout-footer">
          <a href="./deck.html" class="btn-quick-deck-view">
            <span>🃏 Open in Deck Builder ↗</span>
          </a>
          <button class="btn-quick-deck-clear" onclick="clearDeck()" title="Clear all cards from active deck">Clear</button>
          <button class="btn-quick-deck-del" onclick="DeckQuickView.deleteCurrentDeckPrompt()" title="Delete this deck">🗑</button>
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
        this.renderDeckSelectorOptions();
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
      if (count >= 40) {
        flyoutCount.textContent = `${count} Cards (Valid: 40+ Min)`;
        flyoutCount.className = 'deck-quick-count-tag count-ready';
      } else {
        flyoutCount.textContent = `${count} / 40 Min Cards`;
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

    this.renderDeckSelectorOptions();

    if (this.isOpen) {
      this.renderCardList();
    }
  },

  renderDeckSelectorOptions() {
    if (typeof document === 'undefined') return;
    const selectEl = document.getElementById('quickDeckSelect');
    if (!selectEl || typeof DeckManager === 'undefined') return;

    const data = DeckManager.getAllData();
    const decks = data.decks || [];
    const activeId = DeckManager.getActiveDeckId();
    const battleId = DeckManager.getBattleDeckId();

    selectEl.innerHTML = decks.map(d => {
      const count = DeckManager.getCardsCount(d?.cards);
      const isBattle = d.id === battleId;
      const isSelected = d.id === activeId;
      const battleIcon = isBattle ? '⚔️ ' : '';
      const safeName = esc(d.name);
      const countLabel = count >= 40 ? `${count} cards` : `${count}/40 min`;
      return `<option value="${esc(d.id)}" ${isSelected ? 'selected' : ''}>${battleIcon}${safeName} (${countLabel})</option>`;
    }).join('');
    selectEl.value = activeId;
  },

  onDeckSelectChange(newId) {
    if (!newId || typeof DeckManager === 'undefined') return;
    DeckManager.setActiveDeckId(newId);
    const activeDeck = DeckManager.getActiveDeck();
    if (activeDeck) {
      if (activeDeck.isStandard && Object.keys(activeDeck.cards || {}).length === 0) {
        const canon = DeckManager.CANONICAL_STANDARD_DECKS ? DeckManager.CANONICAL_STANDARD_DECKS[(activeDeck.standardKey || 'red').toLowerCase()] : null;
        if (canon) activeDeck.cards = { ...canon.cards };
      }
      S.deck = { ...(activeDeck.cards || {}) };
      saveDeck();
      updateDeckBadge();
      this.update();
      if (typeof window !== 'undefined' && typeof window.updateAllBrowseTilesDeckStatus === 'function') {
        window.updateAllBrowseTilesDeckStatus();
      }
      if (typeof renderDeckView === 'function') renderDeckView();
      if (typeof DeckManagerUI !== 'undefined') {
        DeckManagerUI.syncActiveDeck();
        DeckManagerUI.renderDeckSelector();
      }
      const count = Object.values(S.deck).reduce((a, b) => a + b, 0);
      showToast(`Switched to "${activeDeck.name}" (${count} cards)`, 'info');
    }
  },

  createNewDeckPrompt() {
    if (typeof DeckManager === 'undefined') return;
    const data = DeckManager.getAllData();
    const nextNum = (data && data.decks ? data.decks.length : 0) + 1;
    const name = prompt('Enter a name for the new deck:', `Custom Deck ${nextNum}`);
    if (!name || !name.trim()) return;

    const trimmedName = name.trim();
    const newDeck = DeckManager.createDeck(trimmedName, 'Red', {});
    S.deck = {};
    saveDeck();
    updateDeckBadge();
    this.update();
    if (typeof window !== 'undefined' && typeof window.updateAllBrowseTilesDeckStatus === 'function') {
      window.updateAllBrowseTilesDeckStatus();
    }
    if (typeof renderDeckView === 'function') renderDeckView();
    if (typeof DeckManagerUI !== 'undefined') {
      DeckManagerUI.syncActiveDeck();
      DeckManagerUI.renderDeckSelector();
    }
    showToast(`✨ Created new deck "${newDeck.name}"! Ready to add cards.`, 'success');
  },

  renameCurrentDeckPrompt() {
    if (typeof DeckManager === 'undefined') return;
    const activeDeck = DeckManager.getActiveDeck();
    if (!activeDeck) return;
    const newName = prompt('Enter new name for this deck:', activeDeck.name);
    if (!newName || !newName.trim() || newName.trim() === activeDeck.name) return;

    const trimmed = newName.trim();
    DeckManager.renameDeck(activeDeck.id, trimmed);
    this.update();
    if (typeof renderDeckView === 'function') renderDeckView();
    if (typeof DeckManagerUI !== 'undefined') DeckManagerUI.renderDeckSelector();
    showToast(`Deck renamed to "${trimmed}"`, 'success');
  },

  deleteCurrentDeckPrompt() {
    if (typeof DeckManager === 'undefined') return;
    const activeDeck = DeckManager.getActiveDeck();
    if (!activeDeck) return;
    if (!confirm(`Are you sure you want to delete deck "${activeDeck.name}"?`)) return;

    DeckManager.deleteDeck(activeDeck.id);
    const nextActive = DeckManager.getActiveDeck();
    S.deck = nextActive ? { ...(nextActive.cards || {}) } : {};
    saveDeck();
    updateDeckBadge();
    this.update();
    if (typeof window !== 'undefined' && typeof window.updateAllBrowseTilesDeckStatus === 'function') {
      window.updateAllBrowseTilesDeckStatus();
    }
    if (typeof renderDeckView === 'function') renderDeckView();
    if (typeof DeckManagerUI !== 'undefined') {
      DeckManagerUI.syncActiveDeck();
      DeckManagerUI.renderDeckSelector();
    }
    showToast(`Deleted deck. Switched to "${nextActive ? nextActive.name : 'Deck'}".`, 'info');
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

// ═══════════════════ MODAL CARD NAVIGATOR ═══════════════════
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
    const path = (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname : '';

    // 0. Priority: Battle Arena Context (Hand or Field or Burst)
    if (typeof DuelState !== 'undefined' && DuelState.inDuel) {
      const targetNameLow = (cardName || '').trim().toLowerCase();

      // Check Player Field (including underlyingCards stacked under Advent spirits)
      const pField = (DuelState.player && DuelState.player.field) || [];
      const pFieldList = [];
      let foundOnPField = false;
      pField.forEach(s => {
        if (!s) return;
        pFieldList.push(s.name);
        if ((s.name || '').trim().toLowerCase() === targetNameLow) foundOnPField = true;
        if (s.underlyingCards && s.underlyingCards.length > 0) {
          s.underlyingCards.forEach(u => {
            if (!u) return;
            pFieldList.push(u.name);
            if ((u.name || '').trim().toLowerCase() === targetNameLow) foundOnPField = true;
          });
        }
      });

      // Check Player Hand
      const pHand = (DuelState.player && DuelState.player.hand) || [];
      const foundInHand = pHand.some(c => (c.name || '').trim().toLowerCase() === targetNameLow);

      if (foundInHand && !foundOnPField) {
        return pHand.map(c => c.name);
      }
      if (foundOnPField && !foundInHand) {
        return pFieldList;
      }
      if (foundOnPField && foundInHand) {
        const sel = DuelState.selectedPlayerCard;
        if (sel && pField.some(s => s.uid === sel.uid)) {
          return pFieldList;
        }
        return pHand.map(c => c.name);
      }

      // Check Opponent Field (including underlyingCards)
      const oppField = (DuelState.opponent && DuelState.opponent.field) || [];
      const oppFieldList = [];
      let foundOnOppField = false;
      oppField.forEach(s => {
        if (!s) return;
        oppFieldList.push(s.name);
        if ((s.name || '').trim().toLowerCase() === targetNameLow) foundOnOppField = true;
        if (s.underlyingCards && s.underlyingCards.length > 0) {
          s.underlyingCards.forEach(u => {
            if (!u) return;
            oppFieldList.push(u.name);
            if ((u.name || '').trim().toLowerCase() === targetNameLow) foundOnOppField = true;
          });
        }
      });
      if (foundOnOppField && oppFieldList.length > 0) {
        return oppFieldList;
      }
    }

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

if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('keydown', (e) => {
    const targetTag = (e.target && e.target.tagName) ? e.target.tagName.toUpperCase() : '';
    if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || targetTag === 'SELECT') return;

    const modal = document.getElementById('cardModal');
    const modalIsOpen = modal && modal.classList.contains('open');

    if (modalIsOpen) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateCardModal(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateCardModal(1);
      } else if (e.key === 'Escape') {
        closeModal();
      } else if (e.key === '+' || e.key === '=' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        if (typeof addModalCardToDeck === 'function') addModalCardToDeck();
      } else if (e.key === '-' || e.key === '_' || e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        if (typeof removeModalCardFromDeck === 'function') removeModalCardFromDeck();
      }
    } else {
      if (e.key === '/') {
        const searchInput = document.getElementById('browseSearchInput') || document.getElementById('deckCardQuickSearch') || document.getElementById('familySearchInput') || document.getElementById('setsSearchInput');
        if (searchInput) {
          e.preventDefault();
          searchInput.focus();
          if (typeof searchInput.select === 'function') searchInput.select();
        }
      }
    }
  });
}

function checkCardUsageRestriction(card, side = 'player') {
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

function renderModalFieldStatus(container, unit, isPlayer) {
  if (!container || !unit) return;

  const normalCores = unit.hasSoulCore ? Math.max(0, unit.currentCores - 1) : unit.currentCores;
  const isExhausted = !!unit.isExhausted;
  const stateClass = isExhausted ? 'mfs-status-exhausted' : 'mfs-status-ready';
  const stateLabel = isExhausted ? '🔄 EXHAUSTED' : '🟢 READY';

  // BP calculation & buffs
  const baseBp = unit.baseBp !== undefined ? unit.baseBp : (unit.currentBp || 0);
  const buffTotal = (unit.turnBpBoost || 0) + (unit.temporaryBpBuff || 0) + (unit.battleBpBoost || 0);
  const currentBp = unit.battleBp || unit.currentBp;

  // Active modifiers & granted effects
  const effectsList = [];
  if (Array.isArray(unit.grantedKeywords)) {
    unit.grantedKeywords.forEach(kw => {
      const kwStr = typeof kw === 'string' ? kw : kw.name;
      if (kwStr && !effectsList.some(e => e.keyword === kwStr)) {
        let desc = '';
        const low = kwStr.toLowerCase();
        if (low.includes('clash')) desc = 'The opponent must block if possible.';
        else if (low.includes('curse')) desc = 'When destroyed in battle, destroy the opponent\'s battling Spirit.';
        else if (low.includes('crush')) desc = 'When attacks, discard cards from opponent\'s deck equal to this Spirit\'s level.';
        else if (low.includes('unblockable')) desc = 'This Spirit cannot be blocked.';
        effectsList.push({ keyword: kwStr, desc: desc || `Granted keyword [${kwStr}] active this turn.` });
      }
    });
  }

  if (Array.isArray(unit.grantedEffects)) {
    unit.grantedEffects.forEach(ge => {
      const txt = typeof ge === 'string' ? ge : (ge.text || ge.desc || '');
      const src = (typeof ge === 'object' && ge.source) ? ` (Granted by ${ge.source})` : '';
      const kw = (typeof ge === 'object' && ge.keyword) ? ge.keyword : '';
      if (txt && !effectsList.some(e => e.desc === `${txt}${src}`)) {
        effectsList.push({ keyword: kw || 'Granted Ability', desc: `${txt}${src}` });
      }
    });
  }

  if (buffTotal > 0 && !effectsList.some(e => e.keyword === `+${buffTotal} BP`)) {
    effectsList.push({ keyword: `+${buffTotal} BP`, desc: `Active battle/turn BP boost (+${buffTotal} BP).` });
  }

  if (unit.hasSoulCore && !effectsList.some(e => e.keyword === 'Soul Core')) {
    effectsList.push({ keyword: 'Soul Core', desc: 'Soul Core placed on this card (+1000 BP bonus at all levels).' });
  }

  let braveHtml = '';
  if (unit.brave) {
    braveHtml = `
      <div class="mfs-brave-banner">
        ⚔️ <strong>Braved with ${esc(unit.brave.name)}</strong> • +${unit.brave.bpBonus || 1000} BP • +${unit.brave.symbolCount || 1} Symbol
      </div>
    `;
  }

  let effectsHtml = '';
  if (effectsList.length > 0) {
    effectsHtml = `
      <div class="mfs-effects-container">
        <div class="mfs-effects-header">⚡ ACTIVE BUFFS & GRANTED EFFECTS (${effectsList.length})</div>
        ${effectsList.map(eff => `
          <div class="mfs-effect-pill">
            <span class="mfs-effect-tag">✨ [${esc(eff.keyword)}]</span>
            <span class="mfs-effect-desc">${esc(eff.desc)}</span>
          </div>
        `).join('')}
      </div>
    `;
  } else {
    effectsHtml = `
      <div class="mfs-effects-container">
        <div class="mfs-effects-header">⚡ ACTIVE BUFFS & MODIFIERS</div>
        <div class="mfs-no-effects">No temporary buffs or granted abilities currently active. Base card rules apply.</div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="mfs-header">
      <div class="mfs-title">
        <span>⚡ BATTLEFIELD STATUS</span>
        <span style="font-size:0.65rem; color:var(--muted); font-weight:700;">(${isPlayer ? 'YOUR FIELD' : 'OPPONENT FIELD'})</span>
      </div>
      <div class="mfs-status-pill ${stateClass}">${stateLabel}</div>
    </div>
    <div class="mfs-grid">
      <div class="mfs-stat-item">
        <div class="mfs-stat-label">Current BP</div>
        <div class="mfs-stat-val">
          <span>${currentBp} BP</span>
          ${buffTotal > 0 ? `<span style="font-size:0.7rem; color:#fbbf24;">(+${buffTotal})</span>` : ''}
        </div>
      </div>
      <div class="mfs-stat-item">
        <div class="mfs-stat-label">Level & Cores</div>
        <div class="mfs-stat-val">
          <span>Lv${unit.currentLevel || 1}</span>
          <span style="font-size:0.72rem; color:#93c5fd; font-weight:600;">(${normalCores}c${unit.hasSoulCore ? ' + 🔥SC' : ''})</span>
        </div>
      </div>
      <div class="mfs-stat-item">
        <div class="mfs-stat-label">Symbols</div>
        <div class="mfs-stat-val">
          <span>${(unit.extraSymbols || 0) + (unit.brave ? (unit.brave.symbolCount || 1) : 1)} Symbol</span>
        </div>
      </div>
    </div>
    ${braveHtml}
    ${effectsHtml}
  `;
}

function renderManualActionsIntoModal(card, fieldUnit, isPlayerField) {
  if (typeof DuelState === 'undefined' || !DuelState.inDuel) return;
  if (typeof BattleArena === 'undefined' || !BattleArena.getCardManualActions) return;
  const modalEffect = document.getElementById('modalEffect');
  if (!modalEffect) return;

  const existing = modalEffect.querySelector('.effect-action-buttons-container');
  if (existing) existing.remove();

  const manualActions = BattleArena.getCardManualActions(card, 'auto', fieldUnit, isPlayerField ? 'player' : 'opponent');
  if (!manualActions || !manualActions.length) return;

  const container = document.createElement('div');
  container.className = 'effect-action-buttons-container';

  manualActions.forEach((act) => {
    const btn = document.createElement('button');
    btn.className = `effect-action-btn ${act.cls || ''}`;
    btn.textContent = act.label;
    btn.title = act.reason || act.label;
    if (act.disabled) {
      btn.disabled = true;
    } else {
      btn.onclick = (e) => {
        e.stopPropagation();
        closeModal();
        if (typeof act.action === 'function') act.action();
      };
    }
    container.appendChild(btn);
  });

  modalEffect.appendChild(container);
}

async function openCardDetail(name, contextList, cardUid = null) {
  const modal = document.getElementById('cardModal');
  if (!modal) return;
  modal.classList.add('open');
  ModalCardNavigator.setList(contextList, name);
  document.getElementById('modalTitle').textContent = name;
  document.getElementById('modalJpName').textContent = '';
  document.getElementById('modalArt').src = FALLBACK_CARD_ART;
  document.getElementById('modalBadges').innerHTML = '';
  document.getElementById('modalLevels').textContent = '';
  document.getElementById('modalEffect').innerHTML = '';
  document.getElementById('modalFlavor').style.display = 'none';
  document.getElementById('modalSets').innerHTML = '';
  if (typeof initCardFoilTilt === 'function') {
    initCardFoilTilt();
  }

  // Setup Duel Action Button vs Deck Builder Button
  const duelBtn = document.getElementById('modalDuelSummonBtn');
  const deckBtn = document.getElementById('modalDeckBtn');
  const isInDuel = typeof DuelState !== 'undefined' && DuelState.inDuel;

  // Look up field card instance
  let fieldUnit = null;
  let isPlayerField = true;
  if (isInDuel) {
    const pField = (DuelState.player && DuelState.player.field) || [];
    const oppField = (DuelState.opponent && DuelState.opponent.field) || [];
    if (cardUid) {
      fieldUnit = pField.find(s => s.uid === cardUid);
      if (!fieldUnit) {
        fieldUnit = oppField.find(s => s.uid === cardUid);
        if (fieldUnit) isPlayerField = false;
      }
    }
    if (!fieldUnit) {
      fieldUnit = pField.find(s => (s.name || '').toLowerCase() === (name || '').toLowerCase());
      if (!fieldUnit) {
        fieldUnit = oppField.find(s => (s.name || '').toLowerCase() === (name || '').toLowerCase());
        if (fieldUnit) isPlayerField = false;
      }
    }
  }

  let fieldStatusEl = document.getElementById('modalFieldStatus');
  if (!fieldStatusEl) {
    const modalInfo = document.querySelector('.modal-info');
    if (modalInfo) {
      fieldStatusEl = document.createElement('div');
      fieldStatusEl.id = 'modalFieldStatus';
      fieldStatusEl.className = 'modal-field-status-box';
      fieldStatusEl.style.display = 'none';
      const modalBadges = document.getElementById('modalBadges');
      if (modalBadges && modalBadges.nextSibling) {
        modalInfo.insertBefore(fieldStatusEl, modalBadges.nextSibling);
      } else {
        modalInfo.appendChild(fieldStatusEl);
      }
    }
  }

  if (fieldStatusEl) {
    if (fieldUnit) {
      renderModalFieldStatus(fieldStatusEl, fieldUnit, isPlayerField);
      fieldStatusEl.style.display = 'flex';
    } else {
      fieldStatusEl.style.display = 'none';
      fieldStatusEl.innerHTML = '';
    }
  }

  if (isInDuel) {
    if (deckBtn) deckBtn.style.display = 'none';
    const removeBtn = document.getElementById('modalRemoveDeckBtn');
    if (removeBtn) removeBtn.style.display = 'none';
    if (duelBtn) {
      duelBtn.style.display = 'block';
      const handCard = (DuelState.player.hand || []).find(c => (c.name || '').toLowerCase() === (name || '').toLowerCase());
      const isSetBurst = DuelState.player && DuelState.player.burst && (DuelState.player.burst.name || '').toLowerCase() === (name || '').toLowerCase();

      if (isSetBurst) {
        duelBtn.textContent = '⚡ Trigger Set Burst';
        duelBtn.disabled = false;
        duelBtn.style.opacity = '1';
        duelBtn.style.background = '#ef4444';
        duelBtn.onclick = () => {
          closeModal();
          BattleArena.activateBurst('player');
        };
      } else if (handCard) {
        const isBrave = handCard.type === 'Brave' || (handCard.type || '').includes('Brave');
        const isNexus = (handCard.type || '').includes('Nexus');
        const isMagic = handCard.type === 'Magic';
        const isUltimate = handCard.type === 'Ultimate' || (handCard.type || '').includes('Ultimate');
        const ultCheck = (isUltimate && typeof BattleArena !== 'undefined' && BattleArena.validateUltimateSummonCondition)
          ? BattleArena.validateUltimateSummonCondition(handCard, 'player')
          : { allowed: true };
        const isSpirit = (handCard.type === 'Spirit' || (handCard.type || '').includes('Spirit')) && !isBrave && !isUltimate;
        const cost = (typeof BattleArena !== 'undefined' && BattleArena.getCardEffectiveCost) ? BattleArena.getCardEffectiveCost(handCard, 'player') : (handCard.cost || 0);
        const totalNeeded = (isSpirit || isBrave || isUltimate) ? cost + 1 : cost;
        const isPlayerTurn = DuelState.activePlayer === 'player';
        const phase = DuelState.phases[DuelState.phaseIndex];
        const isAttackStep = phase === 'ATTACK';
        const rest = checkCardUsageRestriction(handCard, 'player');
        const canPlay = rest.allowed && ultCheck.allowed && ((typeof BattleArena !== 'undefined' && BattleArena.canPlayCardInCurrentPhase)
          ? BattleArena.canPlayCardInCurrentPhase(handCard, 'player')
          : (isPlayerTurn && (phase === 'MAIN' || (isAttackStep && (handCard.effect || '').includes('[Flash]')))));

        const adventReq = (typeof BattleArena !== 'undefined' && BattleArena.getCardAdventRequirement)
          ? BattleArena.getCardAdventRequirement(handCard)
          : null;
        const canAdvent = adventReq && (typeof BattleArena !== 'undefined' && BattleArena.canPerformAdvent)
          ? BattleArena.canPerformAdvent(handCard, 'player')
          : false;

        let adventReason = '';
        if (adventReq) {
          const pCount = ((DuelState.player.count !== undefined ? DuelState.player.count : DuelState.player.counters) || 0);
          if (typeof BattleArena !== 'undefined' && BattleArena.isAdventTimingValid && !BattleArena.isAdventTimingValid(adventReq, 'player')) {
            adventReason = `⚔️ Advent: ${adventReq.timingLabel} Only`;
          } else if (DuelState.player.soulCoreLocation === 'trash') {
            adventReason = '⚠️ Advent: Soul Core in Trash';
          } else if (adventReq.minCount !== null && pCount < adventReq.minCount) {
            adventReason = `⚠️ Advent: Need Count ${adventReq.minCount}+ (Current: ${pCount})`;
          } else {
            adventReason = `⚠️ Advent: No Target (${adventReq.condText})`;
          }
        }

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
        } else if (canAdvent && (!canPlay || isAttackStep)) {
          // If eligible to Advent in Flash timing, provide direct Advent action
          duelBtn.textContent = `🌟 Stack [Advent] (${adventReq.timingLabel})`;
          duelBtn.title = `Stack onto an eligible target using your Soul Core`;
          duelBtn.disabled = false;
          duelBtn.style.opacity = '1';
          duelBtn.style.background = 'linear-gradient(135deg, #7e22ce, #9333ea)';
          duelBtn.style.border = '1px solid #c084fc';
          duelBtn.onclick = () => {
            closeModal();
            BattleArena.openAdventPrompt(handCard.uid);
          };
        } else if (!ultCheck.allowed) {
          duelBtn.textContent = (adventReq && isAttackStep) ? adventReason : `🔒 ${ultCheck.reason || 'Summon Condition Not Met'}`;
          duelBtn.title = (adventReq && isAttackStep) ? adventReason : ultCheck.reason;
          duelBtn.disabled = true;
          duelBtn.style.opacity = '0.5';
          duelBtn.style.background = '#475569';
          duelBtn.onclick = null;
          if (modalBraveBtn) modalBraveBtn.style.display = 'none';
        } else if (!canPlay) {
          duelBtn.textContent = (adventReq && isAttackStep) ? adventReason : (isAttackStep ? '⚔️ Main Step Only (No Flash)' : `⏳ Cannot Play in ${phase} Step`);
          duelBtn.title = (adventReq && isAttackStep) ? adventReason : 'Normal cards without [Flash] cannot be played in Attack Step';
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

            const accelCheck = (typeof BattleArena !== 'undefined' && BattleArena.canCastAccel) ? BattleArena.canCastAccel(handCard, 'player') : { allowed: false, cost: 0 };
            if (modalBraveBtn && accelCheck.allowed) {
              modalBraveBtn.style.display = 'block';
              modalBraveBtn.textContent = `⚡ Cast Accel (${accelCheck.cost})`;
              modalBraveBtn.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
              modalBraveBtn.disabled = false;
              modalBraveBtn.style.opacity = '1';
              modalBraveBtn.onclick = () => {
                closeModal();
                BattleArena.castAccel(handCard.uid, 'player');
              };
            }
          } else if (isUltimate) {
            btnLabel = isAttackStep ? `⚡ Flash Summon Ultimate (Cost ${cost})` : `⚔️ Summon Ultimate (Cost ${cost})`;
            btnBg = 'linear-gradient(135deg, #eab308, #ca8a04)';
            btnAction = () => {
              closeModal();
              BattleArena.summonCard(handCard.uid);
            };
          } else {
            const eff = handCard.effect || '';
            const hasMain = /\[(?:Main|MAIN)\]|【メイン】/i.test(eff);
            const hasFlash = /\[(?:Flash|FLASH)\]|【フラッシュ】/i.test(eff);

            if (isAttackStep) {
              btnLabel = `⚡ Flash Cast (${cost})`;
              btnBg = 'linear-gradient(135deg, #f59e0b, #d97706)';
              btnAction = () => {
                closeModal();
                BattleArena.castMagic(handCard.uid, null, null, 'flash');
              };
            } else if (phase === 'MAIN' && hasMain && hasFlash) {
              btnLabel = `📜 Cast Main (${cost})`;
              btnBg = 'linear-gradient(135deg, #0284c7, #0369a1)';
              btnAction = () => {
                closeModal();
                BattleArena.castMagic(handCard.uid, null, null, 'main');
              };

              if (modalBraveBtn) {
                modalBraveBtn.style.display = 'block';
                modalBraveBtn.textContent = `⚡ Flash Cast (${cost})`;
                modalBraveBtn.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
                modalBraveBtn.disabled = false;
                modalBraveBtn.style.opacity = '1';
                modalBraveBtn.onclick = () => {
                  closeModal();
                  BattleArena.castMagic(handCard.uid, null, null, 'flash');
                };
              }
            } else {
              const mode = hasFlash ? 'flash' : 'main';
              btnLabel = hasFlash ? `⚡ Flash Cast (${cost})` : `📜 Cast Magic (${cost})`;
              btnBg = hasFlash ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #0284c7, #0369a1)';
              btnAction = () => {
                closeModal();
                BattleArena.castMagic(handCard.uid, null, null, mode);
              };
            }
          }

          duelBtn.textContent = btnLabel;
          duelBtn.disabled = false;
          duelBtn.style.opacity = '1';
          duelBtn.style.background = btnBg;
          duelBtn.onclick = btnAction;
        } else if (avail.total >= totalNeeded) {
          if (isMagic) {
            const eff = handCard.effect || '';
            const hasMain = /\[(?:Main|MAIN)\]|【メイン】/i.test(eff);
            const hasFlash = /\[(?:Flash|FLASH)\]|【フラッシュ】/i.test(eff);

            if (isAttackStep) {
              duelBtn.textContent = `💀 Sac & Flash (${cost})`;
              duelBtn.disabled = false;
              duelBtn.style.opacity = '1';
              duelBtn.style.background = '#ea580c';
              duelBtn.onclick = () => {
                closeModal();
                BattleArena.openSacrificeModal(handCard.uid, 'flash');
              };
            } else if (phase === 'MAIN' && hasMain && hasFlash) {
              duelBtn.textContent = `💀 Sac & Main (${cost})`;
              duelBtn.disabled = false;
              duelBtn.style.opacity = '1';
              duelBtn.style.background = '#0284c7';
              duelBtn.onclick = () => {
                closeModal();
                BattleArena.openSacrificeModal(handCard.uid, 'main');
              };

              if (modalBraveBtn) {
                modalBraveBtn.style.display = 'block';
                modalBraveBtn.textContent = `💀 Sac & Flash (${cost})`;
                modalBraveBtn.style.background = '#ea580c';
                modalBraveBtn.disabled = false;
                modalBraveBtn.style.opacity = '1';
                modalBraveBtn.onclick = () => {
                  closeModal();
                  BattleArena.openSacrificeModal(handCard.uid, 'flash');
                };
              }
            } else {
              const mode = hasFlash ? 'flash' : 'main';
              duelBtn.textContent = `💀 Sac & Cast (${cost})`;
              duelBtn.disabled = false;
              duelBtn.style.opacity = '1';
              duelBtn.style.background = '#ea580c';
              duelBtn.onclick = () => {
                closeModal();
                BattleArena.openSacrificeModal(handCard.uid, mode);
              };
            }
          } else {
            duelBtn.textContent = `💀 Sacrifice & Summon (${cost})`;
            duelBtn.disabled = false;
            duelBtn.style.opacity = '1';
            duelBtn.style.background = '#ea580c';
            duelBtn.onclick = () => {
              closeModal();
              BattleArena.openSacrificeModal(handCard.uid);
            };
          }
        } else {
          duelBtn.textContent = (adventReq && isAttackStep) ? adventReason : `⚠️ Need ${totalNeeded} Cores`;
          duelBtn.title = (adventReq && isAttackStep) ? adventReason : `Requires ${totalNeeded} cores (Reserve: ${avail.reserve}, Total: ${avail.total})`;
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
            const canSd = (typeof BattleArena !== 'undefined' && BattleArena.canActivateSoulDrive)
              ? BattleArena.canActivateSoulDrive(fieldSpirit, 'player')
              : { allowed: false };
            if (canSd.allowed) {
              duelBtn.textContent = '🔥 Unleash Soul Drive';
              duelBtn.disabled = false;
              duelBtn.style.opacity = '1';
              duelBtn.style.background = 'linear-gradient(135deg, #ef4444, #991b1b)';
              duelBtn.onclick = () => {
                closeModal();
                BattleArena.activateSoulDrive(fieldSpirit.uid, 'player');
              };
            } else if (typeof BattleArena !== 'undefined' && BattleArena.hasSoulDriveKeyword && BattleArena.hasSoulDriveKeyword(fieldSpirit)) {
              duelBtn.textContent = `🔒 Soul Drive (${canSd.reason || 'Unavailable'})`;
              duelBtn.disabled = true;
              duelBtn.style.opacity = '0.5';
              duelBtn.style.background = '#475569';
              duelBtn.onclick = null;
            } else {
              duelBtn.textContent = '⚔️ Active on Battlefield';
              duelBtn.disabled = true;
              duelBtn.style.opacity = '0.6';
              duelBtn.style.background = '#3b82f6';
              duelBtn.onclick = null;
            }
          }
        } else {
          const canSd = (typeof BattleArena !== 'undefined' && BattleArena.canActivateSoulDrive && fieldSpirit)
            ? BattleArena.canActivateSoulDrive(fieldSpirit, 'player')
            : { allowed: false };
          if (canSd.allowed) {
            duelBtn.textContent = '🔥 Unleash Soul Drive';
            duelBtn.disabled = false;
            duelBtn.style.opacity = '1';
            duelBtn.style.background = 'linear-gradient(135deg, #ef4444, #991b1b)';
            duelBtn.onclick = () => {
              closeModal();
              BattleArena.activateSoulDrive(fieldSpirit.uid, 'player');
            };
          } else if (fieldSpirit && typeof BattleArena !== 'undefined' && BattleArena.hasSoulDriveKeyword && BattleArena.hasSoulDriveKeyword(fieldSpirit)) {
            duelBtn.textContent = `🔒 Soul Drive (${canSd.reason || 'Unavailable'})`;
            duelBtn.disabled = true;
            duelBtn.style.opacity = '0.5';
            duelBtn.style.background = '#475569';
            duelBtn.onclick = null;
          } else {
            duelBtn.textContent = '⚔️ Active on Battlefield';
            duelBtn.disabled = true;
            duelBtn.style.opacity = '0.6';
            duelBtn.style.background = '#3b82f6';
            duelBtn.onclick = null;
          }
        }
      }
    }
  } else {
    updateModalDeckButtons(name);
    if (duelBtn) duelBtn.style.display = 'none';
  }

  // Pre-fill immediately if already in duel memory to eliminate latency/flicker
  if (isInDuel) {
    const allCards = [
      ...(DuelState.player.hand || []),
      ...(DuelState.player.field || []),
      ...(DuelState.opponent.field || [])
    ];
    const memCard = allCards.find(c => (c.name || '').toLowerCase() === (name || '').toLowerCase());
    if (memCard) {
      if (memCard.image_url) document.getElementById('modalArt').src = window.cleanCardImageUrl(memCard.image_url);
      if (memCard.kanji) document.getElementById('modalJpName').textContent = memCard.kanji;
      if (memCard.raw_levels) {
        document.getElementById('modalLevels').textContent = memCard.raw_levels;
      } else if (memCard.levels && Array.isArray(memCard.levels)) {
        document.getElementById('modalLevels').textContent = memCard.levels.map(l => `Level ${l.level}: ${l.cores} core, ${l.bp} BP`).join('\n');
      }
      if (memCard.effect) {
        document.getElementById('modalEffect').innerHTML = formatEffectKeywordsInModal(memCard.effect);
        renderManualActionsIntoModal(memCard, fieldUnit, isPlayerField);
      }
      if (memCard.flavor) {
        const fl = document.getElementById('modalFlavor');
        fl.textContent = '"' + memCard.flavor + '"';
        fl.style.display = 'block';
      }
    }
  }

  try {
    const res = await fetch('/api/card?name=' + encodeURIComponent(name));
    const rawData = await res.json();
    const card = rawData.card || rawData;
    if (!card || card.error) {
      document.getElementById('modalEffect').textContent = (card && card.error) || 'Card not found.';
      return;
    }
    S.currentCard = card;
    updateModalDeckButtons(card.name || name);

    document.getElementById('modalTitle').textContent = card.name || name;
    document.getElementById('modalJpName').textContent = card.kanji || card.jpname || '';
    const cleanedModalArt = window.cleanCardImageUrl(card.image_url || './assets/card_back.png');
    document.getElementById('modalArt').src = cleanedModalArt;
    document.getElementById('modalDownload').href = cleanedModalArt || ('./api/download-art?name=' + encodeURIComponent(card.name || name));
    const wikiHref = 'https://battle-spirits.fandom.com/wiki/' + encodeURIComponent((card.name || name || '').replace(/ /g, '_'));
    document.getElementById('modalWikiLink').href = wikiHref;
    document.getElementById('modalWikiLinkBottom').href = wikiHref;

    const bb = document.getElementById('modalBadges');
    bb.innerHTML = '';
    if (card.card_number) bb.innerHTML += `<span class="badge badge-number"># ${esc(card.card_number)}</span>`;
    if (card.cost !== null && card.cost !== undefined) bb.innerHTML += `<span class="badge badge-cost">Cost ${esc(card.cost)}</span>`;
    const colors = card.colors || (card.color ? [card.color] : []);
    colors.forEach(c => bb.innerHTML += `<span class="badge badge-color-${esc(c)} badge-color">${esc(c)}</span>`);
    if (card.type) bb.innerHTML += `<span class="badge badge-type">${esc(card.type)}</span>`;
    if (card.rarity) bb.innerHTML += `<span class="badge badge-rarity">${esc(card.rarity)}</span>`;
    const families = card.families || (card.family ? [card.family] : []);
    families.forEach(f => bb.innerHTML += `<a class="badge badge-family" href="./browse.html?family=${encodeURIComponent(f)}" style="cursor:pointer;text-decoration:none;" title="Explore ${esc(f)} family">${esc(f)} ↗</a>`);

    document.getElementById('modalLevels').textContent = card.levels || 'No level data.';
    document.getElementById('modalEffect').innerHTML = formatEffectKeywordsInModal(card.effect || card.summary || '');
    renderManualActionsIntoModal(card, fieldUnit, isPlayerField);

    if (card.flavor) {
      const fl = document.getElementById('modalFlavor');
      fl.textContent = '"' + card.flavor + '"';
      fl.style.display = 'block';
    }

    const setsEl = document.getElementById('modalSets');
    const sets = card.sets || [];
    if (sets.length) {
      setsEl.innerHTML = sets.map(s => `<a class="badge badge-set" href="./browse.html?set=${encodeURIComponent(s)}" style="cursor:pointer;text-decoration:none;" title="Explore set ${esc(s)}">${esc(s)} ↗</a>`).join('');
    } else {
      setsEl.innerHTML = '<span style="color:var(--muted);font-size:0.82rem;">No set data available.</span>';
    }
  } catch (err) {
    document.getElementById('modalEffect').textContent = 'Failed to load card details.';
  }
}

function updateModalDeckButtons(cardName) {
  if (typeof document === 'undefined') return;
  const name = cardName || (S.currentCard ? S.currentCard.name : '') || (ModalCardNavigator ? ModalCardNavigator.currentCardName : '');
  const isInDuel = typeof DuelState !== 'undefined' && DuelState.inDuel;
  const deckBtn = document.getElementById('modalDeckBtn');
  const removeBtn = document.getElementById('modalRemoveDeckBtn');
  if (!deckBtn) return;
  if (isInDuel) {
    deckBtn.style.display = 'none';
    if (removeBtn) removeBtn.style.display = 'none';
    return;
  }
  deckBtn.style.display = 'inline-flex';
  const inDeck = (S.deck && name && S.deck[name]) || 0;
  if (inDeck > 0) {
    deckBtn.textContent = `+ Add to Deck (${inDeck}/3)`;
    deckBtn.disabled = inDeck >= 3;
    deckBtn.style.opacity = inDeck >= 3 ? '0.6' : '1';
    if (removeBtn) {
      removeBtn.style.display = 'inline-flex';
      removeBtn.textContent = `- Remove (${inDeck} in deck)`;
    }
  } else {
    deckBtn.textContent = '+ Add to Deck';
    deckBtn.disabled = false;
    deckBtn.style.opacity = '1';
    if (removeBtn) {
      removeBtn.style.display = 'none';
    }
  }
}

function closeModal() {
  const modal = document.getElementById('cardModal');
  if (modal) modal.classList.remove('open');
  S.currentCard = null;
  ModalCardNavigator.currentList = [];
  ModalCardNavigator.currentIndex = -1;
  ModalCardNavigator.updateNavUI();
  const removeBtn = document.getElementById('modalRemoveDeckBtn');
  if (removeBtn) removeBtn.style.display = 'none';
  const modalBraveBtn = document.getElementById('modalDuelBraveBtn');
  if (modalBraveBtn) modalBraveBtn.style.display = 'none';
}

function closeModalBg(e) {
  if (e.target.id === 'cardModal') closeModal();
}

function addModalCardToDeck() {
  const cardName = S.currentCard ? S.currentCard.name : (ModalCardNavigator ? ModalCardNavigator.currentCardName : '');
  if (cardName) {
    addToDeck(cardName);
    updateModalDeckButtons(cardName);
  }
}

function removeModalCardFromDeck() {
  const cardName = S.currentCard ? S.currentCard.name : (ModalCardNavigator ? ModalCardNavigator.currentCardName : '');
  if (cardName) {
    removeFromDeck(cardName);
    updateModalDeckButtons(cardName);
  }
}

// ═══════════════════ DECK IMPORT MODAL & PARSER ═══════════════════
function openDeckImportModal() {
  const modal = document.getElementById('deckImportModal');
  if (!modal) return;
  modal.classList.add('open');
  S.parsedImportDeck = null;
  document.getElementById('importPasteArea').value = '';
  document.getElementById('fileUploadStatus').style.display = 'none';
  document.getElementById('fileUploadStatus').innerHTML = '';
  document.getElementById('importPreviewBox').style.display = 'none';
  document.getElementById('btnExecuteImport').disabled = true;
  document.getElementById('btnExecuteImport').textContent = '📥 Load into Deck Builder';
  document.getElementById('deckFileInput').value = '';
  switchImportTab('file');
}

function closeDeckImportModal() {
  const modal = document.getElementById('deckImportModal');
  if (modal) modal.classList.remove('open');
}

function closeImportModalBg(e) {
  if (e.target.id === 'deckImportModal') closeDeckImportModal();
}

function switchImportTab(tab) {
  const isFile = (tab === 'file');
  const isPaste = (tab === 'paste');
  const isStd = (tab === 'std');
  const isLocal = (tab === 'local');

  const tabFile = document.getElementById('importTabFile');
  const tabPaste = document.getElementById('importTabPaste');
  const tabStd = document.getElementById('importTabStd');
  const tabLocal = document.getElementById('importTabLocal');
  if (tabFile) tabFile.classList.toggle('active', isFile);
  if (tabPaste) tabPaste.classList.toggle('active', isPaste);
  if (tabStd) tabStd.classList.toggle('active', isStd);
  if (tabLocal) tabLocal.classList.toggle('active', isLocal);

  const panelFile = document.getElementById('importPanelFile');
  const panelPaste = document.getElementById('importPanelPaste');
  const panelStd = document.getElementById('importPanelStd');
  const panelLocal = document.getElementById('importPanelLocal');
  if (panelFile) panelFile.style.display = isFile ? 'block' : 'none';
  if (panelPaste) panelPaste.style.display = isPaste ? 'block' : 'none';
  if (panelStd) panelStd.style.display = isStd ? 'block' : 'none';
  if (panelLocal) panelLocal.style.display = isLocal ? 'block' : 'none';

  if (isLocal) {
    loadLocalDecksForImport();
  }
}

function handleImportDragOver(e) {
  e.preventDefault();
  const dz = document.getElementById('importDropzone');
  if (dz) dz.classList.add('dragover');
}

function handleImportDragLeave(e) {
  e.preventDefault();
  const dz = document.getElementById('importDropzone');
  if (dz) dz.classList.remove('dragover');
}

function handleImportDrop(e) {
  e.preventDefault();
  const dz = document.getElementById('importDropzone');
  if (dz) dz.classList.remove('dragover');
  const files = e.dataTransfer ? e.dataTransfer.files : null;
  if (files && files.length > 0) {
    readFileContent(files[0]);
  }
}

function handleDeckFileSelect(e) {
  const files = e.target.files;
  if (files && files.length > 0) {
    readFileContent(files[0]);
  }
}

function readFileContent(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target.result;
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    document.getElementById('importDeckName').value = baseName || 'Imported Deck';

    const statusEl = document.getElementById('fileUploadStatus');
    statusEl.style.display = 'flex';
    statusEl.innerHTML = `<span>📄 Selected: <strong>${esc(file.name)}</strong> (${(file.size / 1024).toFixed(1)} KB)</span><span>✓ Ready</span>`;

    const parsed = parseDeckInput(content);
    if (!parsed.name || parsed.name === 'Imported Deck') {
      parsed.name = baseName;
    }
    updateImportPreview(parsed);
  };
  reader.onerror = () => {
    showToast('Failed to read file from computer.', 'error');
  };
  reader.readAsText(file);
}

function handlePasteInput() {
  const text = document.getElementById('importPasteArea').value;
  const parsed = parseDeckInput(text);
  updateImportPreview(parsed);
}

function cleanCardLine(str) {
  let cleaned = (str || '').trim().replace(/^\[[A-Za-z0-9-]+\]\s*/i, '');
  cleaned = cleaned.replace(/\s*\([A-Za-z0-9-]+\)$/i, '');
  return cleaned.trim();
}

function parseDeckInput(text) {
  text = (text || '').trim();
  if (!text) return { name: '', cards: {}, total: 0, errors: [] };

  let deckName = 'Imported Deck';
  const cards = {};
  const errors = [];

  // 1. JSON Parsing
  if (text.startsWith('{') || text.startsWith('[')) {
    try {
      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        for (const item of data) {
          if (typeof item === 'string') {
            const trimmed = cleanCardLine(item);
            if (trimmed) cards[trimmed] = (cards[trimmed] || 0) + 1;
          } else if (item && typeof item === 'object') {
            const name = cleanCardLine(item.name || item.card_name || item.card || item.code || '');
            const count = parseInt(item.count || item.qty || item.quantity || 1) || 1;
            if (name) cards[name] = (cards[name] || 0) + count;
          }
        }
      } else if (typeof data === 'object' && data !== null) {
        if (data.name) deckName = String(data.name);
        if (Array.isArray(data.cards)) {
          for (const item of data.cards) {
            const name = cleanCardLine(item.name || item.card_name || item.card || item.code || '');
            const count = parseInt(item.count || item.qty || item.quantity || 1) || 1;
            if (name) cards[name] = (cards[name] || 0) + count;
          }
        } else if (data.cards && typeof data.cards === 'object') {
          for (const [k, v] of Object.entries(data.cards)) {
            const name = cleanCardLine(k);
            const count = parseInt(v) || 1;
            if (name) cards[name] = (cards[name] || 0) + count;
          }
        } else {
          for (const [k, v] of Object.entries(data)) {
            if (['name', 'exported_at', 'total_cards', 'unique_cards'].includes(k)) continue;
            const name = cleanCardLine(k);
            const count = parseInt(v) || 1;
            if (name) cards[name] = (cards[name] || 0) + count;
          }
        }
      }
      return finalizeParsedDeck(deckName, cards, errors);
    } catch (e) {}
  }

  // 2. Line by line parsing (.txt / CSV / list)
  const lines = text.split(/\r?\n/);
  for (let rawLine of lines) {
    let line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith('//') || line.startsWith(';')) continue;
    if (/^(count|quantity|qty|card|name)\s*[,;\t]/i.test(line)) continue;

    const deckHeaderMatch = line.match(/^deck\s*:\s*(.+)$/i);
    if (deckHeaderMatch) {
      deckName = deckHeaderMatch[1].trim();
      continue;
    }

    const csv1 = line.match(/^(\d+)\s*[,;\t]\s*['"]?([^'"]+)['"]?$/);
    const csv2 = line.match(/^['"]?([^'"]+)['"]?\s*[,;\t]\s*(\d+)$/);
    if (csv1) {
      const count = parseInt(csv1[1]) || 1;
      const name = cleanCardLine(csv1[2]);
      if (name) cards[name] = (cards[name] || 0) + count;
      continue;
    }
    if (csv2) {
      const name = cleanCardLine(csv2[1]);
      const count = parseInt(csv2[2]) || 1;
      if (name) cards[name] = (cards[name] || 0) + count;
      continue;
    }

    const preMatch = line.match(/^(\d+)\s*[xX*×\s-]\s*(.+)$/);
    if (preMatch) {
      const count = parseInt(preMatch[1]) || 1;
      const name = cleanCardLine(preMatch[2]);
      if (name) cards[name] = (cards[name] || 0) + count;
      continue;
    }

    const sufMatch = line.match(/^(.+?)\s*(?:[xX*×]\s*(\d+)|\((\d+)\)|\[(\d+)\])$/);
    if (sufMatch) {
      const name = cleanCardLine(sufMatch[1]);
      const count = parseInt(sufMatch[2] || sufMatch[3] || sufMatch[4] || 1) || 1;
      if (name) cards[name] = (cards[name] || 0) + count;
      continue;
    }

    const single = cleanCardLine(line);
    if (single) {
      cards[single] = (cards[single] || 0) + 1;
    }
  }

  return finalizeParsedDeck(deckName, cards, errors);
}

function finalizeParsedDeck(deckName, cards, errors) {
  const clamped = {};
  for (const [name, count] of Object.entries(cards)) {
    if (count > 3) {
      errors.push(`"${name}" was clamped from ${count} to 3 copies (max rule).`);
      clamped[name] = 3;
    } else {
      clamped[name] = count;
    }
  }
  const total = Object.values(clamped).reduce((a, b) => a + b, 0);
  return { name: deckName, cards: clamped, total, errors };
}

function updateImportPreview(parsed) {
  S.parsedImportDeck = parsed;
  const box = document.getElementById('importPreviewBox');
  const btn = document.getElementById('btnExecuteImport');
  const chipsEl = document.getElementById('previewChipsContainer');
  const warnEl = document.getElementById('previewWarnings');

  if (!parsed || parsed.total === 0) {
    box.style.display = 'none';
    btn.disabled = true;
    return;
  }

  box.style.display = 'flex';
  btn.disabled = false;

  const totalEl = document.getElementById('previewTotalCount');
  totalEl.textContent = `${parsed.total} Cards`;
  if (parsed.total >= 40) {
    totalEl.style.borderColor = 'rgba(16,185,129,0.5)';
    totalEl.style.color = '#34d399';
  } else {
    totalEl.style.borderColor = 'rgba(245,158,11,0.5)';
    totalEl.style.color = '#fbbf24';
  }

  document.getElementById('previewUniqueCount').textContent = `${Object.keys(parsed.cards).length} Unique`;
  if (parsed.name && parsed.name !== 'Imported Deck') {
    document.getElementById('importDeckName').value = parsed.name;
  }

  chipsEl.innerHTML = Object.entries(parsed.cards).map(([name, count]) => `
    <span class="preview-chip">
      <span class="preview-chip-count">${count}x</span>
      <span>${esc(name)}</span>
    </span>
  `).join('');

  if (parsed.errors && parsed.errors.length) {
    warnEl.style.display = 'block';
    warnEl.innerHTML = parsed.errors.map(e => `<div>⚠️ ${esc(e)}</div>`).join('');
  } else {
    warnEl.style.display = 'none';
  }
}

async function executeDeckImport() {
  if (!S.parsedImportDeck || S.parsedImportDeck.total === 0) return;

  const btn = document.getElementById('btnExecuteImport');
  btn.disabled = true;
  btn.textContent = 'Resolving cards…';

  const mode = document.querySelector('input[name="importMode"]:checked')?.value || 'replace';
  const deckName = document.getElementById('importDeckName').value.trim() || 'Imported Deck';

  let rawCards = S.parsedImportDeck.cards;

  try {
    const identifiers = Object.keys(rawCards);
    const res = await fetch('/api/resolve-cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: identifiers })
    });
    if (res.ok) {
      const data = await res.json();
      const mapping = data.resolved || {};
      const resolvedCards = {};
      for (const [ident, count] of Object.entries(rawCards)) {
        const canonical = mapping[ident] || ident;
        resolvedCards[canonical] = Math.min(3, (resolvedCards[canonical] || 0) + count);
      }
      rawCards = resolvedCards;
    }
  } catch (err) {
    console.warn('Card resolution fallback to local parsing:', err);
  }

  if (mode === 'replace') {
    S.deck = {};
  }

  for (const [name, count] of Object.entries(rawCards)) {
    S.deck[name] = Math.min(3, (S.deck[name] || 0) + count);
  }

  saveDeck();
  updateDeckBadge();

  try {
    const cardArray = Object.entries(S.deck).map(([name, count]) => ({ name, count }));
    await fetch('/api/decks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: deckName, cards: cardArray })
    });
  } catch (err) {}

  const finalTotal = Object.values(S.deck).reduce((a, b) => a + b, 0);
  closeDeckImportModal();

  // If we are currently on deck.html, re-render; otherwise redirect to deck.html
  if (window.location.pathname.endsWith('deck.html') || window.location.pathname.endsWith('/deck')) {
    if (typeof renderDeckView === 'function') renderDeckView();
    showToast(`🎉 Imported ${finalTotal} cards into "${deckName}"!`, 'success');
  } else {
    // Real page redirect to deck.html
    window.location.href = './deck.html';
  }
}


// ═══════════════════ STANDARD COLOR DECKS CONTROLLER ═══════════════════
async function fetchStandardDeckData(colorKey) {
  let deckData = null;
  try {
    const res = await fetch('/api/standard-decks?color=' + encodeURIComponent(colorKey));
    if (res.ok) deckData = await res.json();
  } catch (e) {}

  if (!deckData) {
    try {
      let stdRes = await fetch('./standard_decks_data.json');
      if (!stdRes.ok) stdRes = await fetch('/standard_decks_data.json');
      if (stdRes.ok) {
        const stdJson = await stdRes.json();
        const list = stdJson.decks || (Array.isArray(stdJson) ? stdJson : []);
        deckData = list.find(d => (d.color || '').toLowerCase() === colorKey.toLowerCase());
      }
    } catch (e) {}
  }
  return deckData;
}

async function loadStandardDeck(colorKey) {
  try {
    showToast(`Registering standard ${colorKey.toUpperCase()} deck…`, 'info');
    const deckData = await fetchStandardDeckData(colorKey);
    if (!deckData) throw new Error('Deck not found');

    // Register / load into DeckManager
    if (window.DeckManager) {
      await DeckManager.registerStandardDeck(colorKey, deckData);
    }

    // Set S.deck
    S.deck = {};
    if (Array.isArray(deckData.validated_cards) && deckData.validated_cards.length > 0) {
      for (const card of deckData.validated_cards) {
        S.deck[card.name] = card.count || 1;
      }
    } else if (Array.isArray(deckData.cards)) {
      for (const card of deckData.cards) {
        if (Array.isArray(card)) {
          S.deck[card[0]] = typeof card[1] === 'number' ? card[1] : 1;
        } else if (typeof card === 'object' && card !== null) {
          S.deck[card.name] = card.count || 1;
        } else if (typeof card === 'string') {
          S.deck[card] = 1;
        }
      }
    } else if (deckData.cards && typeof deckData.cards === 'object') {
      for (const [name, count] of Object.entries(deckData.cards)) {
        S.deck[name] = typeof count === 'number' ? count : (Array.isArray(count) ? (count[1] || 1) : 1);
      }
    }

    saveDeck();
    updateDeckBadge();

    // Auto-save to server deck library
    try {
      const cardArray = Object.entries(S.deck).map(([name, count]) => ({ name, count }));
      await fetch('/api/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `${deckData.name} (Standard ${deckData.color})`, cards: cardArray })
      });
    } catch (e) {}

    // If on deck page, re-render
    if (window.location.pathname.endsWith('deck.html') || window.location.pathname.endsWith('/deck')) {
      if (typeof DeckManagerUI !== 'undefined') DeckManagerUI.init();
      if (typeof renderDeckView === 'function') renderDeckView();
      const listEl = document.getElementById('deckList');
      if (listEl && typeof listEl.scrollIntoView === 'function') listEl.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = './deck.html';
    }

    showToast(`⚡ Registered & Loaded 40-Card Standard ${deckData.color} Deck: "${deckData.name}"!`, 'success');
  } catch (err) {
    console.error('Failed to load standard deck:', err);
    showToast('Failed to load standard deck.', 'error');
  }
}

async function previewStandardDeck(colorKey) {
  try {
    const deckData = await fetchStandardDeckData(colorKey);
    if (!deckData) throw new Error('Deck not found');

    openDeckImportModal();
    const parsed = {
      name: `${deckData.name} (Standard ${deckData.color})`,
      cards: {},
      total: 40,
      errors: []
    };
    if (Array.isArray(deckData.validated_cards) && deckData.validated_cards.length > 0) {
      for (const card of deckData.validated_cards) {
        parsed.cards[card.name] = card.count || 1;
      }
    } else if (Array.isArray(deckData.cards)) {
      for (const card of deckData.cards) {
        if (Array.isArray(card)) {
          parsed.cards[card[0]] = typeof card[1] === 'number' ? card[1] : 1;
        } else if (typeof card === 'object' && card !== null) {
          parsed.cards[card.name] = card.count || 1;
        }
      }
    }
    parsed.total = Object.values(parsed.cards).reduce((a, b) => a + b, 0);
    document.getElementById('importDeckName').value = parsed.name;
    updateImportPreview(parsed);
  } catch (err) {
    console.error('Failed to preview deck:', err);
    showToast('Failed to preview deck.', 'error');
  }
}

async function loadLocalDecksForImport() {
  const container = document.getElementById('importLocalDecksList');
  if (!container) return;
  try {
    const res = await fetch('/api/local-decks');
    if (!res.ok) throw new Error('Failed to fetch local decks');
    const data = await res.json();
    const decks = data.decks || [];
    if (!decks.length) {
      container.innerHTML = '<div style="color:#94a3b8;font-size:0.85rem;grid-column:1/-1;">No decks found in local-decks/.</div>';
      return;
    }
    window._localDecksImportCache = decks;
    container.innerHTML = decks.map(d => {
      const count = d.totalCards || 0;
      return `
        <button type="button" class="btn-page" style="text-align:left;display:flex;justify-content:space-between;align-items:center;padding:0.6rem 0.8rem;border-color:rgba(59,130,246,0.3);background:rgba(30,41,59,0.7);color:#f1f5f9;cursor:pointer;" onclick="previewLocalDeck('${esc(d.id)}')">
          <span style="font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-right:0.5rem;">🗂️ ${esc(d.name)}</span>
          <span style="font-size:0.75rem;padding:2px 6px;border-radius:4px;background:rgba(59,130,246,0.2);color:#60a5fa;white-space:nowrap;">${count} cards</span>
        </button>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = '<div style="color:#f87171;font-size:0.85rem;grid-column:1/-1;">Failed to load workspace decks.</div>';
  }
}

function previewLocalDeck(deckId) {
  const deck = (window._localDecksImportCache || []).find(d => d.id === deckId);
  if (!deck) return;
  const parsed = {
    name: deck.name,
    cards: { ...deck.cards },
    total: deck.totalCards,
    errors: []
  };
  document.getElementById('importDeckName').value = deck.name;
  updateImportPreview(parsed);
}

// ═══════════════════ INITIALIZATION ═══════════════════

// ═══════════════════ DUELIST AUTH MANAGER ═══════════════════
// ═══════════════════ DUELIST SOCIAL & PROFILE CONTROLLER ═══════════════════
const DuelistSocial = {
  PRESETS: [
    { id: 'dragon', icon: '🐉', name: 'Emperor Dragon', desc: 'Red Flame' },
    { id: 'thunder', icon: '⚡', name: 'Storm King', desc: 'Lightning' },
    { id: 'warrior', icon: '⚔️', name: 'Nova Warrior', desc: 'Sword Master' },
    { id: 'arcana', icon: '🔮', name: 'Violet Mage', desc: 'Purple Sorcery' },
    { id: 'mecha', icon: '🤖', name: 'Iron Fortress', desc: 'White Armor' },
    { id: 'fairy', icon: '🌸', name: 'Mystic Fairy', desc: 'Yellow Song' },
    { id: 'colossus', icon: '🌊', name: 'Tide Colossus', desc: 'Blue Surge' },
    { id: 'gryphon', icon: '🦅', name: 'Wind Gryphon', desc: 'Green Swift' },
    { id: 'fiend', icon: '💀', name: 'Underworld Lord', desc: 'Dark Realm' },
    { id: 'emperor', icon: '👑', name: 'Grandwalker', desc: 'God Realm' },
    { id: 'paladin', icon: '🛡️', name: 'Aegis Paladin', desc: 'Shield Defender' },
    { id: 'cosmic', icon: '🌌', name: 'Eternal Nexus', desc: 'Cosmic Core' }
  ],

  getAvatar() {
    return localStorage.getItem('bse_user_avatar') || '🐉';
  },

  setAvatar(icon) {
    localStorage.setItem('bse_user_avatar', icon);
    if (window.FirebaseService && window.FirebaseService.updateAvatar) {
      window.FirebaseService.updateAvatar(icon);
    }
    AuthManager.renderNavbar();
    this.closeAvatarPicker();
    if (typeof showToast === 'function') {
      showToast('Avatar updated to ' + icon + '!', 'success');
    }
  },

  getFriends() {
    try {
      const raw = localStorage.getItem('bse_duelist_friends');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  saveFriends(friends) {
    localStorage.setItem('bse_duelist_friends', JSON.stringify(friends));
    this.updateFriendsBadge();
  },

  addFriend(friend) {
    if (!friend || !friend.id) return { success: false, error: 'Invalid friend details.' };
    const friends = this.getFriends();
    const cleanId = String(friend.id).replace(/[^0-9]/g, '');
    let myId = '';
    if (window.FirebaseService && window.FirebaseService.getFormattedDuelistId) {
      myId = window.FirebaseService.getFormattedDuelistId().replace(/[^0-9]/g, '');
    }
    if (cleanId === myId && myId.length === 8) {
      return { success: false, error: 'You cannot add yourself as a friend.' };
    }
    if (friends.some(f => String(f.id).replace(/[^0-9]/g, '') === cleanId)) {
      return { success: false, error: 'Already in your friends list.' };
    }
    const formatted = friend.formattedId || (cleanId.slice(0, 4) + '-' + cleanId.slice(4));
    const newFriend = {
      id: formatted,
      name: friend.name || friend.username || ('Duelist #' + formatted),
      avatar: friend.avatar || '⚔️',
      addedAt: Date.now()
    };
    friends.unshift(newFriend);
    this.saveFriends(friends);
    this.renderFriendsList();
    if (window.FirebaseService && window.FirebaseService.syncFriends) {
      window.FirebaseService.syncFriends(friends);
    }
    return { success: true, friend: newFriend };
  },

  removeFriend(friendId) {
    const cleanId = String(friendId).replace(/[^0-9]/g, '');
    let friends = this.getFriends();
    friends = friends.filter(f => String(f.id).replace(/[^0-9]/g, '') !== cleanId);
    this.saveFriends(friends);
    this.renderFriendsList();
    if (window.FirebaseService && window.FirebaseService.syncFriends) {
      window.FirebaseService.syncFriends(friends);
    }
    if (typeof showToast === 'function') {
      showToast('Friend removed from your list.', 'info');
    }
  },

  updateFriendsBadge() {
    const count = this.getFriends().length;
    const badge = document.getElementById('ddFriendCount');
    if (badge) badge.textContent = count;
  },

  toggleDropdown(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const wrapper = document.getElementById('navAvatarWrapper');
    if (wrapper) {
      wrapper.classList.toggle('open');
    }
  },

  closeDropdown() {
    const wrapper = document.getElementById('navAvatarWrapper');
    if (wrapper) {
      wrapper.classList.remove('open');
    }
  },

  copyId(id) {
    if (!id) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(id).then(() => {
        if (typeof showToast === 'function') {
          showToast('Copied Duelist ID #' + id + ' to clipboard!', 'success');
        }
      });
    }
  },

  openAvatarPicker() {
    this.closeDropdown();
    this.ensureModals();
    const modal = document.getElementById('bseAvatarModal');
    if (modal) {
      this.renderAvatarPicker();
      modal.classList.add('open');
    }
  },

  closeAvatarPicker() {
    const modal = document.getElementById('bseAvatarModal');
    if (modal) modal.classList.remove('open');
  },

  renderAvatarPicker() {
    const grid = document.getElementById('bseAvatarGrid');
    if (!grid) return;
    const current = this.getAvatar();
    grid.innerHTML = this.PRESETS.map(p => `
      <button class="avatar-option-btn ${p.icon === current ? 'active' : ''}" onclick="DuelistSocial.setAvatar('${p.icon}')" title="${p.name} (${p.desc})">
        <span class="avatar-option-emoji">${p.icon}</span>
        <span class="avatar-option-label">${p.name}</span>
      </button>
    `).join('');
  },

  openFriendsModal() {
    this.closeDropdown();
    this.ensureModals();
    const modal = document.getElementById('bseFriendsModal');
    if (modal) {
      this.renderFriendsList();
      modal.classList.add('open');
    }
  },

  closeFriendsModal() {
    const modal = document.getElementById('bseFriendsModal');
    if (modal) modal.classList.remove('open');
  },

  renderFriendsList() {
    const container = document.getElementById('bseFriendsListContainer');
    if (!container) return;
    const friends = this.getFriends();
    this.updateFriendsBadge();

    if (friends.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:2rem 1rem;color:#94a3b8;font-size:0.85rem;">
          <div style="font-size:2.2rem;margin-bottom:0.5rem;opacity:0.6;">👥</div>
          <div style="font-weight:700;color:#cbd5e1;margin-bottom:0.25rem;">No Friends Added Yet</div>
          <div>Enter an 8-digit Duelist ID above to add friends and challenge them to 1v1 duels!</div>
        </div>
      `;
      return;
    }

    container.innerHTML = friends.map(f => `
      <div class="friend-item">
        <div class="friend-info">
          <span class="friend-avatar">${f.avatar || '⚔️'}</span>
          <div>
            <div class="friend-name">${f.name.replace(/[<>&"']/g, '')}</div>
            <div class="friend-id">#${f.id.replace(/[<>&"']/g, '')}</div>
          </div>
        </div>
        <div class="friend-actions">
          <button class="btn-friend-challenge" onclick="DuelistSocial.challengeFriend('${f.id}')" title="Challenge to 1v1 Duel">⚔️ Challenge</button>
          <button class="btn-friend-del" onclick="DuelistSocial.removeFriend('${f.id}')" title="Remove Friend">✕</button>
        </div>
      </div>
    `).join('');
  },

  async addFriendFromInput() {
    const input = document.getElementById('bseFriendIdInput');
    if (!input || !input.value.trim()) return;
    const rawId = input.value.trim().replace(/[^0-9]/g, '');
    if (rawId.length !== 8) {
      if (typeof showToast === 'function') showToast('Please enter an 8-digit Duelist ID (e.g. 8492-0153)', 'warning');
      return;
    }

    let friendName = 'Duelist #' + rawId.slice(0, 4) + '-' + rawId.slice(4);
    let friendAvatar = '⚔️';

    if (window.FirebaseService && window.FirebaseService.lookupDuelistById) {
      try {
        const res = await window.FirebaseService.lookupDuelistById(rawId);
        if (res && res.success && res.duelist) {
          friendName = res.duelist.username || friendName;
        }
      } catch (e) {}
    }

    const result = this.addFriend({
      id: rawId,
      name: friendName,
      avatar: friendAvatar
    });

    if (result.success) {
      input.value = '';
      if (typeof showToast === 'function') {
        showToast('🤝 Added ' + result.friend.name + ' to friends!', 'success');
      }
    } else {
      if (typeof showToast === 'function') {
        showToast(result.error || 'Failed to add friend', 'error');
      }
    }
  },

  challengeFriend(duelistId) {
    this.closeFriendsModal();
    const clean = String(duelistId).replace(/[^0-9]/g, '');
    window.location.href = './arena.html?duelWith=' + clean;
  },

  async signOut() {
    this.closeDropdown();
    await AuthManager.logout();
  },

  ensureModals() {
    if (document.getElementById('bseAvatarModal')) return;

    const overlay = document.createElement('div');
    overlay.innerHTML = `
      <!-- Avatar Picker Modal -->
      <div class="bse-modal-overlay" id="bseAvatarModal" onclick="if(event.target===this)DuelistSocial.closeAvatarPicker()">
        <div class="bse-modal-card">
          <div class="bse-modal-header">
            <div class="bse-modal-title">🎨 Choose Duelist Avatar</div>
            <button class="bse-modal-close" onclick="DuelistSocial.closeAvatarPicker()">✕</button>
          </div>
          <div class="avatar-grid" id="bseAvatarGrid"></div>
        </div>
      </div>

      <!-- Friends Modal -->
      <div class="bse-modal-overlay" id="bseFriendsModal" onclick="if(event.target===this)DuelistSocial.closeFriendsModal()">
        <div class="bse-modal-card">
          <div class="bse-modal-header">
            <div class="bse-modal-title">👥 My Duelist Friends</div>
            <button class="bse-modal-close" onclick="DuelistSocial.closeFriendsModal()">✕</button>
          </div>
          <div class="friends-input-row">
            <input type="text" class="friends-input" id="bseFriendIdInput" placeholder="Enter 8-digit ID (e.g. 8492-0153)" maxlength="9">
            <button class="btn-friends-add" onclick="DuelistSocial.addFriendFromInput()">+ Add</button>
          </div>
          <div class="friends-list" id="bseFriendsListContainer"></div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }
};

// ═════════════════════════════════════════════════════════════════
// VISUAL DECK SHEET CONTROLLER
// ═════════════════════════════════════════════════════════════════
const VisualDeckSheet = {
  _deckData: null,
  _overlay: null,

  ensureDom() {
    if (this._overlay) return;
    let el = document.getElementById('visualDeckSheetOverlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'visualDeckSheetOverlay';
      el.className = 'deck-sheet-overlay';
      el.onclick = (e) => {
        if (e.target === el) this.close();
      };
      el.innerHTML = `
        <div class="deck-sheet-box" role="dialog" aria-modal="true">
          <div class="deck-sheet-header">
            <div class="deck-sheet-title-group">
              <span style="font-size:1.8rem;">🖼️</span>
              <div>
                <h2 class="deck-sheet-title" id="deckSheetTitle">Visual Deck Sheet</h2>
                <div style="font-size:0.82rem;color:#94a3b8;" id="deckSheetSubtitle">Battle Spirits Eternal Format</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:0.5rem;">
              <button class="btn-modal-outline" onclick="window.print()" style="font-size:0.8rem;padding:0.4rem 0.8rem;" title="Print or save as PDF">🖨️ Print / Save PDF</button>
              <button class="modal-close" onclick="VisualDeckSheet.close()" style="position:static;">&times;</button>
            </div>
          </div>

          <div class="deck-sheet-meta-bar" id="deckSheetMetaBar"></div>

          <div id="deckSheetGroupsContainer" style="display:flex;flex-direction:column;gap:1rem;"></div>

          <div class="deck-sheet-actions">
            <button class="btn-page" onclick="VisualDeckSheet.copyCode()" style="font-size:0.82rem;">📋 Copy Decklist Code</button>
            <button class="btn-page" onclick="VisualDeckSheet.exportJson()" style="font-size:0.82rem;">💾 Export JSON</button>
            <button class="btn-start-duel" onclick="VisualDeckSheet.close()" style="padding:0.45rem 1.25rem;font-size:0.85rem;width:auto;">Done</button>
          </div>
        </div>
      `;
      document.body.appendChild(el);
    }
    this._overlay = el;

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this._overlay && this._overlay.classList.contains('open')) {
        this.close();
      }
    });
  },

  open(customDeck) {
    this.ensureDom();
    this.loadDeck(customDeck);
    this.render();
    this._overlay.classList.add('open');
    if (document.body) document.body.style.overflow = 'hidden';
  },

  close() {
    if (this._overlay) {
      this._overlay.classList.remove('open');
    }
    if (document.body) document.body.style.overflow = '';
  },

  loadDeck(customDeck) {
    if (customDeck && typeof customDeck === 'object') {
      this._deckData = customDeck;
      return;
    }

    try {
      const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('battle_spirits_deck') : null;
      this._deckData = stored ? JSON.parse(stored) : {};
    } catch (e) {
      this._deckData = {};
    }
  },

  render() {
    const titleEl = document.getElementById('deckSheetTitle');
    const subEl = document.getElementById('deckSheetSubtitle');
    const metaBar = document.getElementById('deckSheetMetaBar');
    const container = document.getElementById('deckSheetGroupsContainer');
    if (!container) return;

    const cardsMap = (this._deckData && this._deckData.cards) ? this._deckData.cards : (this._deckData || {});
    const deckName = (this._deckData && this._deckData.name) || 'My Battle Spirits Deck';
    if (titleEl) titleEl.textContent = deckName;

    // Collect list of cards with counts
    const entries = [];
    let totalCards = 0;
    const typeCounts = { Spirit: 0, Ultimate: 0, Brave: 0, Magic: 0, Nexus: 0 };
    const colorCounts = {};

    for (const [name, rawInfo] of Object.entries(cardsMap)) {
      if (!name || name === 'name' || name === 'id' || name === 'format' || name === 'author') continue;
      const count = typeof rawInfo === 'number' ? rawInfo : (rawInfo.count || 1);
      const info = typeof rawInfo === 'object' ? rawInfo : {};
      const cardType = info.type || 'Spirit';
      const color = info.color || 'Red';

      entries.push({
        name,
        count,
        cost: info.cost !== undefined ? info.cost : null,
        type: cardType,
        color,
        card_number: info.card_number || info.cardNumber || '',
        image_url: info.image_url || ''
      });

      totalCards += count;
      if (typeCounts[cardType] !== undefined) typeCounts[cardType] += count;
      else typeCounts.Spirit += count;

      colorCounts[color] = (colorCounts[color] || 0) + count;
    }

    if (subEl) subEl.textContent = `Eternal Format • ${totalCards} Total Cards`;

    // Render Meta Bar
    if (metaBar) {
      const colorsPills = Object.entries(colorCounts).map(([col, cnt]) => `
        <span class="deck-sheet-meta-pill" style="border-left:3px solid var(--accent, #6366f1);">${col}: <strong>${cnt}</strong></span>
      `).join('');

      metaBar.innerHTML = `
        <span class="deck-sheet-meta-pill" style="background:rgba(56,189,248,0.15);color:#38bdf8;">Total: <strong>${totalCards} Cards</strong></span>
        ${typeCounts.Spirit ? `<span class="deck-sheet-meta-pill">⚔️ Spirits: <strong>${typeCounts.Spirit}</strong></span>` : ''}
        ${typeCounts.Ultimate ? `<span class="deck-sheet-meta-pill">⚡ Ultimates: <strong>${typeCounts.Ultimate}</strong></span>` : ''}
        ${typeCounts.Brave ? `<span class="deck-sheet-meta-pill">🔗 Braves: <strong>${typeCounts.Brave}</strong></span>` : ''}
        ${typeCounts.Magic ? `<span class="deck-sheet-meta-pill">🔮 Magic: <strong>${typeCounts.Magic}</strong></span>` : ''}
        ${typeCounts.Nexus ? `<span class="deck-sheet-meta-pill">🏛️ Nexuses: <strong>${typeCounts.Nexus}</strong></span>` : ''}
        ${colorsPills}
      `;
    }

    if (!entries.length) {
      container.innerHTML = '<div style="text-align:center;padding:3rem;color:#94a3b8;">This deck is empty! Add cards in the Deck Builder to view your visual deck sheet.</div>';
      return;
    }

    // Group cards by type
    const groups = [
      { key: 'Spirit', title: '⚔️ Spirits' },
      { key: 'Ultimate', title: '⚡ Ultimates' },
      { key: 'Brave', title: '🔗 Braves' },
      { key: 'Magic', title: '🔮 Magic' },
      { key: 'Nexus', title: '🏛️ Nexuses' }
    ];

    container.innerHTML = groups.map(grp => {
      const groupCards = entries.filter(c => {
        if (grp.key === 'Spirit') return (c.type === 'Spirit' || (!c.type.includes('Ultimate') && !c.type.includes('Brave') && !c.type.includes('Magic') && !c.type.includes('Nexus')));
        return (c.type || '').includes(grp.key);
      }).sort((a, b) => (a.cost || 0) - (b.cost || 0));

      if (!groupCards.length) return '';
      const grpTotal = groupCards.reduce((acc, c) => acc + c.count, 0);

      const cardsHtml = groupCards.map(c => {
        const safeName = (c.name || '').replace(/"/g, '&quot;');
        const safeJs = (c.name || '').replace(/'/g, "\\'");
        let art = c.image_url || 'https://battle-spirits.fandom.com/wiki/Special:FilePath/Card_Back.jpg';
        if (art.includes('static.wikia.nocookie.net') && art.includes('/revision/latest')) {
          art = art.split('/revision/latest')[0];
        }

        return `
          <div class="deck-sheet-card" onclick="openCardDetail('${safeJs}')" title="Click to inspect ${safeName}">
            <div class="deck-sheet-art-wrap">
              <span class="deck-sheet-qty">x${c.count}</span>
              ${c.cost !== null && c.cost !== undefined ? `<span class="deck-sheet-cost">${c.cost}</span>` : ''}
              <img class="deck-sheet-art" src="${art}" alt="${safeName}" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='https://battle-spirits.fandom.com/wiki/Special:FilePath/Card_Back.jpg';" />
            </div>
            <div class="deck-sheet-card-info">
              <div class="deck-sheet-card-name">${safeName}</div>
              ${c.card_number ? `<div class="deck-sheet-card-num">#${c.card_number}</div>` : ''}
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="deck-sheet-group">
          <div class="deck-sheet-group-title">
            <span>${grp.title}</span>
            <span class="deck-sheet-group-count">${grpTotal}</span>
          </div>
          <div class="deck-sheet-grid">
            ${cardsHtml}
          </div>
        </div>
      `;
    }).join('');
  },

  copyCode() {
    const cardsMap = (this._deckData && this._deckData.cards) ? this._deckData.cards : (this._deckData || {});
    const lines = [];
    for (const [name, rawInfo] of Object.entries(cardsMap)) {
      if (!name || name === 'name' || name === 'id' || name === 'format' || name === 'author') continue;
      const count = typeof rawInfo === 'number' ? rawInfo : (rawInfo.count || 1);
      lines.push(`${count}x ${name}`);
    }
    const code = lines.join('\n');
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(() => {
        if (typeof showToast === 'function') showToast('📋 Decklist copied to clipboard!', 'success');
      });
    } else if (typeof prompt === 'function') {
      prompt('Copy deck list:', code);
    }
  },

  exportJson() {
    if (typeof exportDeckJson === 'function') {
      exportDeckJson();
    } else if (typeof document !== 'undefined') {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this._deckData, null, 2));
      const a = document.createElement('a');
      a.setAttribute('href', dataStr);
      a.setAttribute('download', `${(this._deckData.name || 'deck').replace(/\s+/g, '_')}.json`);
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  }
};

if (typeof window !== 'undefined') {
  window.DuelistSocial = DuelistSocial;
  document.addEventListener('click', (e) => {
    const wrapper = document.getElementById('navAvatarWrapper');
    if (wrapper && !wrapper.contains(e.target)) {
      wrapper.classList.remove('open');
    }
  });
}

const AuthManager = {
  STORAGE_KEY: 'bsp_duelist_user',

  getUser() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  setUser(user) {
    if (!user) {
      localStorage.removeItem(this.STORAGE_KEY);
    } else {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    }
    this.renderNavbar();
  },

  clearBrowserUserData() {
    // Normal cleanup of user profile, decks, friends, and session without wiping the offline card database
    const USER_KEYS = [
      'bsp_duelist_user',              // Current user auth session
      'bs_user_decks_v2',              // Stored user custom decks
      'battle_spirits_deck_v1',         // In-progress deck builder state
      'bs_deck',                       // Active deck cache
      'deckbuilder_selected_deck_id',  // Selected deck cursor
      'bse_user_avatar',               // Chosen avatar
      'bse_duelist_friends',           // Friends list
      'bse_local_duelist_id',          // Local assigned duelist ID
      'bse_keep_std_red',              // Seeding flag
      'colosseum_p1_deck_id',          // Selected arena player deck
      'colosseum_opponent_deck_id'     // Selected arena opponent deck
    ];

    USER_KEYS.forEach(k => {
      try { localStorage.removeItem(k); } catch(e) {}
      try { sessionStorage.removeItem(k); } catch(e) {}
    });

    // Reset in-memory deck state
    if (typeof S !== 'undefined') {
      S.deck = {};
    }
    if (typeof updateDeckBadge === 'function') {
      updateDeckBadge();
    }
    if (typeof renderDeckList === 'function') {
      renderDeckList();
    }
  },

  async logout() {
    this.clearBrowserUserData();
    if (window.FirebaseService) {
      try { await window.FirebaseService.logout(); } catch(e) {}
    }
    this.renderNavbar();
    if (typeof showToast === 'function') {
      showToast('Signed out. Local decks and user session data have been cleared.', 'info');
    }
    if (window.location.pathname.endsWith('login.html') || 
        window.location.pathname.endsWith('register.html') || 
        window.location.pathname.endsWith('deck.html') || 
        window.location.pathname.endsWith('arena.html')) {
      setTimeout(() => {
        window.location.reload();
      }, 350);
    }
  },

  renderNavbar() {
    const slot = document.getElementById('navAuthSlot');
    if (!slot) return;

    let fbUser = null;
    let duelistId = null;
    if (window.FirebaseService) {
      fbUser = window.FirebaseService.getUser();
      duelistId = window.FirebaseService.getFormattedDuelistId();
    }
    const localUser = this.getUser();
    const user = fbUser || localUser;

    if (user && (!user.isAnonymous || duelistId)) {
      const displayName = user.displayName || user.username || (user.email ? user.email.split('@')[0] : ('Duelist #' + (duelistId || '0000-0000')));
      const safeName = String(displayName).replace(/[<>&"']/g, '');
      const avatarIcon = window.DuelistSocial ? window.DuelistSocial.getAvatar() : '🐉';
      const friendCount = window.DuelistSocial ? window.DuelistSocial.getFriends().length : 0;
      const displayId = duelistId || '0000-0000';

      slot.innerHTML = `
        <div class="nav-avatar-wrapper" id="navAvatarWrapper">
          <button class="nav-avatar-btn" id="navAvatarBtn" onclick="DuelistSocial.toggleDropdown(event)" title="My Duelist Profile">
            <span class="nav-avatar-circle" id="navAvatarCircle">${avatarIcon}</span>
            <span class="nav-avatar-name">${safeName}</span>
            <span class="nav-avatar-caret">▼</span>
          </button>
          <div class="duelist-dropdown" id="duelistDropdown">
            <div class="dd-header">
              <div class="dd-avatar-row">
                <div class="dd-avatar-circle" id="ddAvatarCircle">${avatarIcon}</div>
                <div class="dd-user-meta">
                  <div class="dd-name">${safeName}</div>
                  <div class="dd-duelist-id">
                    <span>ID: #${displayId}</span>
                    <button class="dd-btn-copy" onclick="DuelistSocial.copyId('${displayId}')" title="Copy ID">📋</button>
                  </div>
                </div>
              </div>
            </div>
            <div class="dd-divider"></div>
            <div class="dd-menu">
              <button class="dd-item" onclick="DuelistSocial.openAvatarPicker()">
                <span class="dd-icon">🎨</span>
                <span>Change Avatar</span>
              </button>
              <button class="dd-item" onclick="DuelistSocial.openFriendsModal()">
                <span class="dd-icon">👥</span>
                <span>See Friends</span>
                <span class="dd-badge" id="ddFriendCount">${friendCount}</span>
              </button>
              <a class="dd-item" href="./deck.html">
                <span class="dd-icon">🃏</span>
                <span>Check Decks</span>
              </a>
              <div class="dd-divider"></div>
              <button class="dd-item dd-logout" onclick="DuelistSocial.signOut()">
                <span class="dd-icon">🚪</span>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      `;
      if (window.DuelistSocial) window.DuelistSocial.ensureModals();
    } else {
      const isLoginPage = window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('/login');
      const isRegPage = window.location.pathname.endsWith('register.html') || window.location.pathname.endsWith('/register');
      const activeClass = (isLoginPage || isRegPage) ? ' active' : '';
      slot.innerHTML = `
        <a class="tab-btn tab-btn-auth${activeClass}" id="tabAuth" href="./login.html">👤 Login</a>
      `;
    }
  },

  init() {
    this.renderNavbar();
    if (typeof window !== 'undefined') {
      window.addEventListener('bse_auth_state_change', () => {
        this.renderNavbar();
      });
    }
  }
};

function initCleanRouting() {
  if (typeof window === 'undefined' || !window.history || !window.location) return;
  const loc = window.location;
  if (loc.pathname && loc.pathname.endsWith('.html')) {
    let cleanPath = loc.pathname;
    if (cleanPath.endsWith('/index.html') || cleanPath === 'index.html') {
      cleanPath = cleanPath.replace(/\/index\.html$/, '/') || '/';
    } else {
      cleanPath = cleanPath.replace(/\.html$/, '/');
    }
    const newUrl = cleanPath + loc.search + loc.hash;
    try {
      window.history.replaceState(null, '', newUrl);
    } catch (e) {}
  }
}

// ═════════════════════════════════════════════════════════════════
// 3D CARD TILT & HOLOGRAPHIC FOIL CONTROLLER
// ═════════════════════════════════════════════════════════════════
function initCardFoilTilt() {
  if (typeof document === 'undefined') return;
  const modalArt = document.getElementById('modalArt');
  if (!modalArt) return;

  const parent = modalArt.parentElement;
  if (!parent) return;

  let foil = parent.querySelector('.modal-foil-sheen');
  if (!foil) {
    parent.classList.add('modal-art-wrapper');
    foil = document.createElement('div');
    foil.className = 'modal-foil-sheen';
    parent.appendChild(foil);
  }

  function handleMove(e) {
    const rect = modalArt.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    const rotX = (0.5 - y) * 22;
    const rotY = (x - 0.5) * 22;
    modalArt.style.transform = `perspective(800px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(1.025, 1.025, 1.025)`;
    modalArt.style.boxShadow = `${-rotY * 1.5}px ${rotX * 1.5 + 15}px 32px rgba(0,0,0,0.65)`;
    
    if (foil) {
      foil.style.opacity = '1';
      foil.style.background = `radial-gradient(circle at ${(x * 100).toFixed(1)}% ${(y * 100).toFixed(1)}%, rgba(255,255,255,0.45) 0%, rgba(244,114,182,0.25) 30%, rgba(56,189,248,0.25) 60%, transparent 85%)`;
    }
  }

  function handleReset() {
    modalArt.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    modalArt.style.boxShadow = '0 10px 30px rgba(0,0,0,0.6)';
    if (foil) {
      foil.style.opacity = '0';
    }
  }

  if (parent._foilMoveHandler) {
    parent.removeEventListener('mousemove', parent._foilMoveHandler);
    parent.removeEventListener('mouseleave', parent._foilResetHandler);
  }
  parent._foilMoveHandler = handleMove;
  parent._foilResetHandler = handleReset;
  parent.addEventListener('mousemove', handleMove);
  parent.addEventListener('mouseleave', handleReset);
  parent.addEventListener('touchmove', handleMove, { passive: true });
  parent.addEventListener('touchend', handleReset);
}

// ═════════════════════════════════════════════════════════════════
// SAMPLE OPENING HAND / DRAW SIMULATOR
// ═════════════════════════════════════════════════════════════════
const SampleHandSimulator = {
  _deckName: 'Active Deck',
  _allCards: [],
  _deckPool: [],
  _hand: [],
  _contractCard: null,
  _guaranteeContract: true,

  ensureModalInDom() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('sampleHandModal')) return;

    const overlay = document.createElement('div');
    overlay.className = 'sample-hand-overlay';
    overlay.id = 'sampleHandModal';
    overlay.onclick = (e) => SampleHandSimulator.onBgClick(e);

    overlay.innerHTML = `
      <div class="sample-hand-box" onclick="event.stopPropagation()">
        <div class="sample-hand-header">
          <div class="sample-hand-title-wrap">
            <span style="font-size:1.5rem;">🃏</span>
            <h2 class="sample-hand-title">Sample Opening Hand Simulator</h2>
            <span class="sample-hand-badge" id="sampleDeckNameBadge">Deck: Active</span>
          </div>
          <button class="sample-hand-close-btn" onclick="SampleHandSimulator.close()" title="Close (Esc)">&times;</button>
        </div>

        <div class="sample-hand-toolbar">
          <div class="sample-hand-actions">
            <button class="sample-hand-btn sample-hand-btn-primary" onclick="SampleHandSimulator.mulligan()" title="Shuffle and draw 4 cards (Shortcut: M or Space)">
              <span>🔄</span> Mulligan (4 Cards)
            </button>
            <button class="sample-hand-btn sample-hand-btn-draw" onclick="SampleHandSimulator.drawOne()" title="Draw +1 card from deck (Shortcut: D)">
              <span>➕</span> Draw +1 Card
            </button>
            <button class="sample-hand-btn" onclick="SampleHandSimulator.reset()" title="Reset back to initial opening hand">
              <span>🧹</span> Reset Hand
            </button>
          </div>
          
          <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
            <label class="sample-hand-toggle-label" title="Start with Contract card in opening hand (Battle Spirits Eternal Contract Rules)">
              <input type="checkbox" id="sampleContractToggle" onchange="SampleHandSimulator.toggleContractGuarantee(this.checked)" checked>
              <span>📜 Reveal Contract Card</span>
            </label>
            <div class="sample-hand-stats-bar" id="sampleHandStats"></div>
          </div>
        </div>

        <div class="sample-cards-grid" id="sampleCardsGrid"></div>
      </div>
    `;

    document.body.appendChild(overlay);

    window.addEventListener('keydown', (e) => {
      const modal = document.getElementById('sampleHandModal');
      if (!modal || !modal.classList.contains('open')) return;
      const targetTag = (e.target && e.target.tagName) ? e.target.tagName.toUpperCase() : '';
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || targetTag === 'SELECT') return;

      if (e.key === 'Escape') {
        e.preventDefault();
        SampleHandSimulator.close();
      } else if (e.key.toLowerCase() === 'm' || e.code === 'Space') {
        e.preventDefault();
        SampleHandSimulator.mulligan();
      } else if (e.key.toLowerCase() === 'd') {
        e.preventDefault();
        SampleHandSimulator.drawOne();
      }
    });
  },

  onBgClick(e) {
    if (e.target && e.target.id === 'sampleHandModal') {
      this.close();
    }
  },

  open(customDeck = null) {
    this.ensureModalInDom();
    this.loadDeck(customDeck);
    const modal = document.getElementById('sampleHandModal');
    if (modal) modal.classList.add('open');
    this.mulligan();
  },

  close() {
    const modal = document.getElementById('sampleHandModal');
    if (modal) modal.classList.remove('open');
  },

  toggleContractGuarantee(checked) {
    this._guaranteeContract = checked;
    this.mulligan();
  },

  loadDeck(customDeck = null) {
    let deckObj = customDeck;
    if (!deckObj) {
      if (typeof currentDeck !== 'undefined' && currentDeck && currentDeck.cards) {
        deckObj = currentDeck;
      } else if (typeof DeckManager !== 'undefined' && DeckManager.getActiveDeck) {
        deckObj = DeckManager.getActiveDeck();
      }
    }

    this._deckName = (deckObj && deckObj.name) ? deckObj.name : 'Active Deck';
    const badge = document.getElementById('sampleDeckNameBadge');
    if (badge) badge.textContent = `Deck: ${this._deckName}`;

    const cardsMap = (deckObj && deckObj.cards) ? deckObj.cards : {};
    const flattened = [];

    const getCardInfo = (name) => {
      if (typeof cachedCardsByName !== 'undefined' && cachedCardsByName[name.toLowerCase()]) {
        return cachedCardsByName[name.toLowerCase()];
      }
      if (typeof S !== 'undefined' && S.allCards) {
        const found = S.allCards.find(c => (c.name || '').toLowerCase() === name.toLowerCase());
        if (found) return found;
      }
      return { name, cost: 0, color: 'Red', type: 'Spirit' };
    };

    for (const [name, count] of Object.entries(cardsMap)) {
      const info = getCardInfo(name);
      const qty = typeof count === 'number' ? count : (count.count || 1);
      for (let i = 0; i < qty; i++) {
        flattened.push({ ...info, name });
      }
    }

    this._allCards = flattened;
    this._contractCard = this._allCards.find(c => {
      const fam = (c.family || '').toLowerCase();
      const typ = (c.type || '').toLowerCase();
      const eff = (c.effect || '').toLowerCase();
      const nam = (c.name || '').toLowerCase();
      return fam.includes('contract') || typ.includes('contract') || eff.includes('[contract') || eff.includes('契約') || nam.includes('partner') || fam.includes('partner');
    }) || null;

    const toggleWrap = document.getElementById('sampleContractToggle');
    if (toggleWrap) {
      if (!this._contractCard) {
        toggleWrap.disabled = true;
        toggleWrap.parentElement.style.opacity = '0.45';
        toggleWrap.parentElement.title = 'No Contract card found in this deck';
      } else {
        toggleWrap.disabled = false;
        toggleWrap.parentElement.style.opacity = '1';
        toggleWrap.parentElement.title = `Guaranteed start with: ${this._contractCard.name}`;
      }
    }
  },

  mulligan() {
    if (!this._allCards.length) {
      this._hand = [];
      this._deckPool = [];
      this.render();
      return;
    }

    let pool = [...this._allCards];
    this._hand = [];

    if (this._guaranteeContract && this._contractCard) {
      const cIdx = pool.findIndex(c => (c.name || '').toLowerCase() === (this._contractCard.name || '').toLowerCase());
      if (cIdx !== -1) {
        const contract = pool.splice(cIdx, 1)[0];
        contract._isContract = true;
        this._hand.push(contract);
      }
    }

    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    while (this._hand.length < 4 && pool.length > 0) {
      const drawn = pool.shift();
      drawn._drawOrder = this._hand.length + 1;
      this._hand.push(drawn);
    }

    this._deckPool = pool;
    this.render();
  },

  drawOne() {
    if (!this._deckPool.length) return;
    const drawn = this._deckPool.shift();
    drawn._drawOrder = this._hand.length + 1;
    this._hand.push(drawn);
    this.render();
  },

  reset() {
    this.mulligan();
  },

  render() {
    const grid = document.getElementById('sampleCardsGrid');
    const stats = document.getElementById('sampleHandStats');
    if (!grid) return;

    if (!this._hand.length) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:#94a3b8;font-size:0.95rem;">This deck is currently empty. Add cards in the Deck Builder to simulate opening hands!</div>';
      if (stats) stats.innerHTML = '';
      return;
    }

    const totalCost = this._hand.reduce((acc, c) => acc + (parseInt(c.cost, 10) || 0), 0);
    const avgCost = (totalCost / this._hand.length).toFixed(1);
    const hasTurnOnePlay = this._hand.some(c => (parseInt(c.cost, 10) || 0) <= 3);

    if (stats) {
      stats.innerHTML = `
        <div class="sample-hand-stat-item">Hand: <strong>${this._hand.length}</strong></div>
        <div class="sample-hand-stat-item">Deck: <strong>${this._deckPool.length}</strong> remaining</div>
        <div class="sample-hand-stat-item">Avg Cost: <strong>${avgCost}</strong></div>
        <div class="sample-hand-stat-item" style="color:${hasTurnOnePlay ? '#6ee7b7' : '#fca5a5'};">
          ${hasTurnOnePlay ? '✓ Turn 1 Play Available' : '⚠️ No Cost ≤ 3 Play'}
        </div>
      `;
    }

    grid.innerHTML = this._hand.map((card, idx) => {
      const safeName = (card.name || '').replace(/"/g, '&quot;');
      const col = (card.color || 'Yellow').toLowerCase();
      const typ = card.type || 'Spirit';
      const costStr = (card.cost !== null && card.cost !== undefined) ? `Cost ${card.cost}` : '';
      let art = card.image_url || 'https://battle-spirits.fandom.com/wiki/Special:FilePath/Card_Back.jpg';
      if (art.includes('static.wikia.nocookie.net') && art.includes('/revision/latest')) {
        art = art.split('/revision/latest')[0];
      }

      const contractTag = card._isContract ? '<span class="sample-card-contract-tag">📜 CONTRACT</span>' : '';
      const orderTag = `<span class="sample-card-draw-order">#${idx + 1}</span>`;

      return `
        <div class="sample-card-item card-theme-${col}" onclick="openCardDetail('${safeName}')" title="Click to view ${safeName}" style="animation-delay:${idx * 0.05}s;">
          ${contractTag}
          ${orderTag}
          <div class="sample-card-art-wrap">
            <img class="sample-card-art" src="${art}" alt="${safeName}" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='https://battle-spirits.fandom.com/wiki/Special:FilePath/Card_Back.jpg';" />
          </div>
          <div class="sample-card-info">
            <div class="sample-card-name">${safeName}</div>
            <div class="sample-card-sub">
              <span>${costStr}</span>
              <span>${typ}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
};

if (typeof window !== 'undefined') {
  window.SampleHandSimulator = SampleHandSimulator;
  window.openSampleHandModal = (customDeck) => SampleHandSimulator.open(customDeck);
  window.VisualDeckSheet = VisualDeckSheet;
  window.openVisualDeckSheetModal = (customDeck) => VisualDeckSheet.open(customDeck);
}

document.addEventListener('DOMContentLoaded', () => {
  initCleanRouting();
  updateDeckBadge();
  AuthManager.init();
  DeckQuickView.init();
  initCardFoilTilt();
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    S,
    DeckManager,
    DeckManagerUI: typeof DeckManagerUI !== 'undefined' ? DeckManagerUI : undefined,
    AuthManager,
    DuelistSocial,
    ModalCardNavigator,
    initCleanRouting,
    DeckQuickView,
    deleteFromDeck,
    addToDeck,
    removeFromDeck,
    updateModalDeckButtons,
    addModalCardToDeck,
    removeModalCardFromDeck,
    navigateCardModal,
    formatEffectKeywordsInModal,
    initCardFoilTilt,
    SampleHandSimulator
  };
}

