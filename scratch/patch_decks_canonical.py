import sys

with open('app.js', 'r', encoding='utf-8') as f:
    app_js = f.read()

# 1. Add CANONICAL_STANDARD_DECKS to DeckManager in app.js
canonical_decks_js = """  CANONICAL_STANDARD_DECKS: {
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
  },"""

# Target 1: Place CANONICAL_STANDARD_DECKS right after STANDARD_DECK_NAMES
target1 = """  STANDARD_DECK_NAMES: {
    red: "Hero Dragon's Blazing Soul (Standard Red)",
    purple: "Netherworld Curse & Seven Shoguns (Standard Purple)",
    green: "Emerald Gale of Insect Sovereigns (Standard Green)",
    white: "Armed Fortress & Mobile Machine Deity (Standard White)",
    yellow: "Celestial Symphony of Seraphs (Standard Yellow)",
    blue: "Colosseum Titans & Golem Mill (Standard Blue)"
  },"""

replacement1 = target1 + "\n\n" + canonical_decks_js

if target1 not in app_js:
    print('Error: target1 not found in app.js')
    sys.exit(1)

app_js = app_js.replace(target1, replacement1, 1)

# Target 2: Update getAllData and _migrateInitialDecks
target2 = """    if (!data || !Array.isArray(data.decks) || data.decks.length === 0) {
      data = this._migrateInitialDecks();
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

    // Always ensure at least the Red Starter Deck is registered by default
    decks.push({
      id: 'deck_std_red',
      name: this.STANDARD_DECK_NAMES.red,
      color: 'Red',
      isStandard: true,
      standardKey: 'red',
      cards: {},
      updatedAt: Date.now()
    });"""

replacement2 = """    if (!data || !Array.isArray(data.decks) || data.decks.length === 0) {
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
    });"""

if target2 not in app_js:
    print('Error: target2 not found in app.js')
    sys.exit(1)

app_js = app_js.replace(target2, replacement2, 1)

# Target 3: Update getActiveDeck
target3 = """  getActiveDeck(data) {
    if (!data) data = this.getAllData();
    const activeId = this.getActiveDeckId();
    return data.decks.find(d => d.id === activeId) || data.decks[0] || null;
  },"""

replacement3 = """  getActiveDeck(data) {
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
  },"""

if target3 not in app_js:
    print('Error: target3 not found in app.js')
    sys.exit(1)

app_js = app_js.replace(target3, replacement3, 1)

# Target 4: Update registerStandardDeck
target4 = """  async registerStandardDeck(colorKey, stdData = null) {
    colorKey = (colorKey || 'red').toLowerCase();
    const data = this.getAllData();

    // Check if already registered
    const existing = data.decks.find(d => d.isStandard && d.standardKey === colorKey);
    if (existing) {
      data.activeDeckId = existing.id;
      localStorage.setItem(this.ACTIVE_KEY, existing.id);
      this.saveAllData(data);
      return existing;
    }

    let deckInfo = stdData;
    if (!deckInfo) {
      try {
        const res = await fetch('/api/standard-decks?color=' + encodeURIComponent(colorKey));
        if (res.ok) deckInfo = await res.json();
      } catch (e) {
        console.warn('Failed to fetch standard deck:', e);
      }
    }

    const cardsMap = {};
    if (deckInfo && deckInfo.validated_cards) {
      deckInfo.validated_cards.forEach(c => {
        cardsMap[c.name] = c.count;
      });
    }

    const id = 'deck_std_' + colorKey + '_' + Date.now();
    const name = deckInfo ? `${deckInfo.name} (Standard ${deckInfo.color})` : (this.STANDARD_DECK_NAMES[colorKey] || `${colorKey.toUpperCase()} Standard Deck`);
    const newDeck = {
      id,
      name,
      color: (deckInfo?.color || colorKey.charAt(0).toUpperCase() + colorKey.slice(1)),
      isStandard: true,
      standardKey: colorKey,
      cards: cardsMap,
      updatedAt: Date.now()
    };"""

replacement4 = """  async registerStandardDeck(colorKey, stdData = null) {
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
    if (!deckInfo) {
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
    };"""

if target4 not in app_js:
    print('Error: target4 not found in app.js')
    sys.exit(1)

app_js = app_js.replace(target4, replacement4, 1)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(app_js)

print('app.js updated successfully!')
