// ═══════════════════ GLOBAL APP STATE & SHARED UTILS ═══════════════════
const FALLBACK_CARD_ART = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='215' height='301' viewBox='0 0 215 301'><rect width='215' height='301' fill='%230f172a'/><rect x='8' y='8' width='199' height='285' rx='10' fill='%23141e33' stroke='%23f59e0b' stroke-width='1.5' stroke-opacity='0.4'/><circle cx='107' cy='125' r='36' fill='%231e293b' stroke='%23f59e0b' stroke-width='1.2'/><text x='107' y='133' font-size='22' text-anchor='middle' fill='%23fbbf24' font-family='sans-serif'>⚔️</text><text x='107' y='185' font-size='11' font-weight='bold' text-anchor='middle' fill='%23fbbf24' font-family='sans-serif' letter-spacing='1'>BATTLE SPIRITS</text><text x='107' y='205' font-size='10' text-anchor='middle' fill='%2394a3b8' font-family='sans-serif'>Card Art Pending</text></svg>";

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
      // Auto-repair any standard decks that have 0 cards (e.g. from previous empty migration)
      let repaired = false;
      for (const d of data.decks) {
        if (d.isStandard) {
          const colorKey = (d.standardKey || 'red').toLowerCase();
          const canon = this.CANONICAL_STANDARD_DECKS[colorKey];
          const count = Object.values(d.cards || {}).reduce((a, b) => a + b, 0);
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
    }
    return data;
  },

  _migrateInitialDecks() {
    let legacyCards = {};
    try {
      legacyCards = JSON.parse(localStorage.getItem('bs_deck') || localStorage.getItem('battle_spirits_deck_v1') || '{}');
    } catch (e) {}

    const legacyTotal = Object.values(legacyCards).reduce((a, b) => a + b, 0);
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
    }

    // Always ensure at least the Red Starter Deck is registered by default with all 40 cards!
    const redPreset = this.CANONICAL_STANDARD_DECKS.red;
    decks.push({
      id: 'deck_std_red',
      name: redPreset.name,
      color: redPreset.color,
      isStandard: true,
      standardKey: 'red',
      cards: { ...redPreset.cards },
      updatedAt: Date.now()
    });

    const activeId = decks[0].id;
    const battleDeck = decks.find(d => Object.values(d.cards || {}).reduce((a, b) => a + b, 0) >= 40) || decks[decks.length - 1];
    const battleId = battleDeck ? battleDeck.id : activeId;
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
      const count = Object.values(deck.cards || {}).reduce((a, b) => a + b, 0);
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
    const countCards = (d) => Object.values(d?.cards || {}).reduce((a, b) => a + b, 0);

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
    const count = Object.values(deck.cards || {}).reduce((a, b) => a + b, 0);
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
      const existingCount = Object.values(existing.cards || {}).reduce((a, b) => a + b, 0);
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

  // 1. Highlight Level tags like [LV1], [LV2][LV3]
  safe = safe.replace(/\[(LV\d+(?:[-~]LV\d+)*)\]/gi, '<span class="effect-keyword-pill kw-level">[$1]</span>');

  // 2. Highlight Timing and Step triggers
  safe = safe.replace(/\((When Attacks(?:\/[^)]+)?|When Summoned(?:\/[^)]+)?|When Advents(?:\/[^)]+)?|When Battles(?:\/[^)]+)?|When Blocks(?:\/[^)]+)?|When Manifests(?:\/[^)]+)?|When Reborn(?:\/[^)]+)?|When Destroyed(?:\/[^)]+)?|When Brave Attacks(?:\/[^)]+)?|After Your Burst Activates|After a Burst Activates|After your Burst activates|After an? opposing [^)]+|Twinkle Necromancy|Your Attack Step|Opponent's Attack Step|Opposing Attack Step|Either Attack Step|Main Step|Refresh Step|Start Step|Core Step|Draw Step|End Step)\)/gi, (match) => {
    return `<span class="effect-keyword-pill kw-timing">${match}</span>`;
  });

  // 3. Highlight Flash - [Advent: ...]
  safe = safe.replace(/Flash\s*-\s*\[Advent:\s*([^\]]+)\]/gi, (match) => {
    return `<span class="effect-keyword-pill kw-advent">${match}</span>`;
  });

  // 4. Highlight all 102 Official Battle Spirits Wiki Keywords
  const allKwPattern = /\[(A\.T\.\s*Field|Accel|Advent(?::[^\]]+)?|Amplify|Appeal|Armed Intervention|Armor(?::[^\]]+)?|Assault(?::\s*\d+)?|Assemble|Awaken|Barrage|Bombardment|Brilliance|Buddy|Bunshin|Burst(?::[^\]]+)?|Bushido|Cast Off|Catalyze|Change|Charge|Clash|Clock Up|Consecutive Blade|Contract Armor|Contract Awaken|Contract Unleash|Core Charge|Count Break|Crush|Curse|Dispersion|Diva Rush|Double Drive|Draw Lock|Emperor Road|Fast Draw|Fierce Windstorm|Flashing Swift|Fortress|Friend|God Strike|Grand Assault|Grand Field|Grand Ice Wall|Grand Skill|Grandphosis|Great Assault|Great Crush|Heavenly Light|Heavy Armor(?::[^\]]+)?|High Speed|Holy Life|Ice Wall(?::[^\]]+)?|Immortality(?::[^\]]+)?|Infinite Blade|Infinite Flame|Kagemusha|Leap|Level Up|Manifest|Mirage(?::[^\]]+)?|My Unit|NT-D|On Stage|Plunder|Poison Blade|PS Armor|Pursuit|Rebirth|Reload|Resonance|Revive|Rush|Seal|Shamanism|Show Up|Six Heaven Rush|Soar|Solo Part|Soul Awaken|Soul Drive|Soul Magic|Sound Speed|Spellbind|Spirit Soul|Stampede|Super Boost|Super Unleash|Supreme Clash|Tribute(?::[^\]]+)?|Trigger Counter|True-Awaken|True-Clash|True-Curse|Twinkle(?::[^\]]+)?|Ultra Armor(?::[^\]]+)?|Ultra Holy Life|Unleash|Unsheathe|Windstorm(?::\s*\d+)?|Zero Counter|Soul Core(?::[^\]]+)?|Flash|Twinkle Necromancy)\]/gi;

  safe = safe.replace(allKwPattern, (match) => {
    let cls = 'kw-generic';
    const low = match.toLowerCase();
    if (low.includes('advent') || low.includes('twinkle')) cls = 'kw-advent';
    else if (low.includes('clash')) cls = 'kw-clash';
    else if (low.includes('curse')) cls = 'kw-curse';
    else if (low.includes('crush')) cls = 'kw-crush';
    else if (low.includes('holy life') || low.includes('heavenly light')) cls = 'kw-holylife';
    else if (low.includes('windstorm') || low.includes('whirlwind')) cls = 'kw-windstorm';
    else if (low.includes('assault')) cls = 'kw-assault';
    else if (low.includes('high speed') || low.includes('swift') || low.includes('sound speed')) cls = 'kw-highspeed';
    else if (low.includes('awaken')) cls = 'kw-awaken';
    else if (low.includes('immortality') || low.includes('revive')) cls = 'kw-immortality';
    else if (low.includes('soul drive')) cls = 'kw-souldrive';
    else if (low.includes('soul core')) cls = 'kw-soul-core';
    else if (low.includes('ice wall')) cls = 'kw-icewall';
    else if (low.includes('armor') || low.includes('field')) cls = 'kw-armor';
    else if (low.includes('burst')) cls = 'kw-burst';
    else if (low.includes('flash')) cls = 'kw-flash';
    else if (low.includes('tribute')) cls = 'kw-tribute';
    else if (low.includes('consecutive blade')) cls = 'kw-consecutive';
    else if (low.includes('mirage')) cls = 'kw-mirage';
    else if (low.includes('spellbind')) cls = 'kw-spellbind';
    else if (low.includes('accel')) cls = 'kw-accel';
    else if (low.includes('change')) cls = 'kw-change';
    else if (low.includes('charge')) cls = 'kw-charge';
    else if (low.includes('rush')) cls = 'kw-rush';
    else if (low.includes('rebirth')) cls = 'kw-rebirth';
    else if (low.includes('unleash')) cls = 'kw-unleash';
    else if (low.includes('grand')) cls = 'kw-grand';
    return `<span class="effect-keyword-pill ${cls}">${match}</span>`;
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
      const count = Object.values(d.cards || {}).reduce((a, b) => a + b, 0);
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

async function openCardDetail(name, contextList) {
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

  // Setup Duel Action Button vs Deck Builder Button
  const duelBtn = document.getElementById('modalDuelSummonBtn');
  const deckBtn = document.getElementById('modalDeckBtn');
  const isInDuel = typeof DuelState !== 'undefined' && DuelState.inDuel;

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
      if (memCard.image_url) document.getElementById('modalArt').src = memCard.image_url;
      if (memCard.kanji) document.getElementById('modalJpName').textContent = memCard.kanji;
      if (memCard.raw_levels) {
        document.getElementById('modalLevels').textContent = memCard.raw_levels;
      } else if (memCard.levels && Array.isArray(memCard.levels)) {
        document.getElementById('modalLevels').textContent = memCard.levels.map(l => `Level ${l.level}: ${l.cores} core, ${l.bp} BP`).join('\n');
      }
      if (memCard.effect) document.getElementById('modalEffect').innerHTML = formatEffectKeywordsInModal(memCard.effect);
      if (memCard.flavor) {
        const fl = document.getElementById('modalFlavor');
        fl.textContent = '"' + memCard.flavor + '"';
        fl.style.display = 'block';
      }
    }
  }

  try {
    const res = await fetch('/api/card?name=' + encodeURIComponent(name));
    const card = await res.json();
    if (card.error) {
      document.getElementById('modalEffect').textContent = card.error;
      return;
    }
    S.currentCard = card;
    updateModalDeckButtons(card.name);

    document.getElementById('modalTitle').textContent = card.name;
    document.getElementById('modalJpName').textContent = card.kanji || card.jpname || '';
    document.getElementById('modalArt').src = card.image_url || '';
    document.getElementById('modalDownload').href = '/api/download-art?name=' + encodeURIComponent(card.name);
    const wikiHref = 'https://battle-spirits.fandom.com/wiki/' + encodeURIComponent((card.name || '').replace(/ /g, '_'));
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

  const tabFile = document.getElementById('importTabFile');
  const tabPaste = document.getElementById('importTabPaste');
  const tabStd = document.getElementById('importTabStd');
  if (tabFile) tabFile.classList.toggle('active', isFile);
  if (tabPaste) tabPaste.classList.toggle('active', isPaste);
  if (tabStd) tabStd.classList.toggle('active', isStd);

  const panelFile = document.getElementById('importPanelFile');
  const panelPaste = document.getElementById('importPanelPaste');
  const panelStd = document.getElementById('importPanelStd');
  if (panelFile) panelFile.style.display = isFile ? 'block' : 'none';
  if (panelPaste) panelPaste.style.display = isPaste ? 'block' : 'none';
  if (panelStd) panelStd.style.display = isStd ? 'block' : 'none';
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
  let cleaned = str.replace(/^\[[A-Za-z0-9-]+\]\s*/i, '');
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
async function loadStandardDeck(colorKey) {
  try {
    showToast(`Registering standard ${colorKey.toUpperCase()} deck…`, 'info');
    const res = await fetch('/api/standard-decks?color=' + encodeURIComponent(colorKey));
    if (!res.ok) throw new Error('Deck not found');
    const deckData = await res.json();

    // Register / load into DeckManager
    if (window.DeckManager) {
      await DeckManager.registerStandardDeck(colorKey, deckData);
    }

    // Set S.deck
    S.deck = {};
    for (const card of deckData.validated_cards) {
      S.deck[card.name] = card.count;
    }

    saveDeck();
    updateDeckBadge();

    // Auto-save to server deck library
    try {
      const cardArray = deckData.validated_cards.map(c => ({ name: c.name, count: c.count }));
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
    const res = await fetch('/api/standard-decks?color=' + encodeURIComponent(colorKey));
    if (!res.ok) throw new Error('Deck not found');
    const deckData = await res.json();

    openDeckImportModal();
    const parsed = {
      name: `${deckData.name} (Standard ${deckData.color})`,
      cards: {},
      total: 40,
      errors: []
    };
    for (const card of deckData.validated_cards) {
      parsed.cards[card.name] = card.count;
    }
    document.getElementById('importDeckName').value = parsed.name;
    updateImportPreview(parsed);
  } catch (err) {
    console.error('Failed to preview deck:', err);
    showToast('Failed to preview deck.', 'error');
  }
}

// ═══════════════════ INITIALIZATION ═══════════════════

// ═══════════════════ DUELIST AUTH MANAGER ═══════════════════
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

  logout() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.renderNavbar();
    if (typeof showToast === 'function') {
      showToast('🛡️ Signed out of Colosseum account.', 'info');
    }
    if (window.location.pathname === '/login' || window.location.pathname === '/login.html' ||
        window.location.pathname === '/register' || window.location.pathname === '/register.html') {
      window.location.reload();
    }
  },

  renderNavbar() {
    const slot = document.getElementById('navAuthSlot');
    if (!slot) return;
    const user = this.getUser();
    if (user && user.username) {
      const safeName = String(user.username || 'Duelist').replace(/[<>&"']/g, '');
      const safeLogin = String(user.login || '').replace(/[<>&"']/g, '');
      slot.innerHTML = `
        <span class="nav-user-pill" title="Logged in as ${safeName} (${safeLogin})">
          <span class="user-shield">🛡️</span>
          <span class="user-name">${safeName}</span>
        </span>
        <button class="tab-btn-logout" id="btnLogout" onclick="AuthManager.logout()" title="Logout of Colosseum">
          <span>🚪 Logout</span>
        </button>
      `;
    } else {
      const isLoginPage = window.location.pathname === '/login' || window.location.pathname === '/login.html';
      const isRegPage = window.location.pathname === '/register' || window.location.pathname === '/register.html';
      const activeClass = (isLoginPage || isRegPage) ? ' active' : '';
      slot.innerHTML = `
        <a class="tab-btn tab-btn-auth${activeClass}" id="tabAuth" href="/login">👤 Login</a>
      `;
    }
  },

  init() {
    this.renderNavbar();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  updateDeckBadge();
  AuthManager.init();
  DeckQuickView.init();
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    S,
    DeckManager,
    DeckManagerUI: typeof DeckManagerUI !== 'undefined' ? DeckManagerUI : undefined,
    AuthManager,
    ModalCardNavigator,
    DeckQuickView,
    deleteFromDeck,
    addToDeck,
    removeFromDeck,
    updateModalDeckButtons,
    addModalCardToDeck,
    removeModalCardFromDeck,
    navigateCardModal,
    formatEffectKeywordsInModal
  };
}

