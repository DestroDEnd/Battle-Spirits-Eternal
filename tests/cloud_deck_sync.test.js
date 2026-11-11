import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

function getAppSource() {
  return fs.readFileSync(path.join(rootDir, 'app.js'), 'utf8');
}

function createMockEnvironment() {
  const store = new Map();
  const localStorage = {
    getItem(k) { return store.has(k) ? store.get(k) : null; },
    setItem(k, v) { store.set(k, String(v)); },
    removeItem(k) { store.delete(k); },
    clear() { store.clear(); }
  };
  const sessionStorage = {
    getItem(k) { return store.has('s_' + k) ? store.get('s_' + k) : null; },
    setItem(k, v) { store.set('s_' + k, String(v)); },
    removeItem(k) { store.delete('s_' + k); },
    clear() { }
  };

  const listeners = new Map();
  const windowObj = {
    localStorage,
    sessionStorage,
    addEventListener(evt, cb) {
      if (!listeners.has(evt)) listeners.set(evt, []);
      listeners.get(evt).push(cb);
    },
    removeEventListener(evt, cb) {
      if (listeners.has(evt)) {
        listeners.set(evt, listeners.get(evt).filter(fn => fn !== cb));
      }
    },
    dispatchEvent(event) {
      const cbs = listeners.get(event.type) || [];
      for (const cb of cbs) cb(event);
      return true;
    },
    location: {
      origin: 'http://localhost:3000',
      pathname: '/deck.html',
      href: 'http://localhost:3000/deck.html',
      reload() {}
    }
  };

  const bodyEl = {
    appendChild() {},
    removeChild() {},
    innerHTML: '',
    children: []
  };

  const documentObj = {
    readyState: 'complete',
    body: bodyEl,
    addEventListener(evt, cb) {},
    getElementById(id) { return null; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    createElement() {
      return {
        className: '',
        style: {},
        innerHTML: '',
        addEventListener() {},
        appendChild() {},
        classList: { add() {}, remove() {}, contains() { return false; } }
      };
    }
  };

  class CustomEvent {
    constructor(type, options = {}) {
      this.type = type;
      this.detail = options.detail || {};
    }
  }

  // Cloud Firestore Mock Store
  const cloudStore = new Map();
  let mockUser = { uid: 'user_123', email: 'duelist@example.com', displayName: 'HeroDuelist', isAnonymous: false };

  const FirebaseService = {
    getUser() { return mockUser; },
    getFormattedDuelistId() { return '1234-5678'; },
    setUser(u) { mockUser = u; },
    async syncDeck(deck) {
      if (!mockUser) return false;
      cloudStore.set(deck.id, {
        id: deck.id,
        name: deck.name,
        color: deck.color || 'Red',
        cards: { ...(deck.cards || {}) },
        isStandard: !!deck.isStandard,
        updatedAt: deck.updatedAt || Date.now()
      });
      return true;
    },
    async loadDecks() {
      if (!mockUser) return [];
      return Array.from(cloudStore.values());
    },
    async deleteDeck(deckId) {
      if (!mockUser) return false;
      return cloudStore.delete(deckId);
    },
    async logout() {
      mockUser = null;
    }
  };

  windowObj.window = windowObj;
  windowObj.document = documentObj;
  windowObj.CustomEvent = CustomEvent;
  windowObj.FirebaseService = FirebaseService;

  const sandbox = {
    window: windowObj,
    document: documentObj,
    localStorage,
    sessionStorage,
    CustomEvent,
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    module: { exports: {} },
    exports: {}
  };

  vm.createContext(sandbox);
  vm.runInContext(getAppSource(), sandbox);

  return {
    window: windowObj,
    DeckManager: sandbox.window.DeckManager,
    AuthManager: sandbox.window.AuthManager,
    FirebaseService,
    cloudStore,
    localStorage
  };
}

describe('Cloud Deck Synchronization & Persistence Suite', () => {

  it('1. DeckManager.getRegisteredDecks alias returns all decks', () => {
    const env = createMockEnvironment();
    assert.equal(typeof env.DeckManager.getRegisteredDecks, 'function', 'getRegisteredDecks must exist');
    const decks = env.DeckManager.getRegisteredDecks();
    assert.ok(Array.isArray(decks), 'Must return an array of decks');
  });

  it('2. Creating a deck automatically syncs to Firebase cloud when user is logged in', async () => {
    const env = createMockEnvironment();
    const newDeck = env.DeckManager.createDeck('Infernal Lord Deck', 'Purple', { 'The SevenShogun Desperado': 3 });
    
    // Give async background sync microtick
    await new Promise(r => setTimeout(r, 50));

    const cloudDecks = await env.FirebaseService.loadDecks();
    const synced = cloudDecks.find(d => d.name === 'Infernal Lord Deck');
    assert.ok(synced, 'Newly created deck must sync to cloud store');
    assert.equal(synced.cards['The SevenShogun Desperado'], 3);
  });

  it('3. Updating and saving active deck cards syncs changes to Firebase cloud', async () => {
    const env = createMockEnvironment();
    const deck = env.DeckManager.createDeck('Dragon Ramp', 'Red', { 'Goradon': 3 });
    
    // Modify active deck cards and save
    env.DeckManager.saveActiveDeckCards({ 'Goradon': 3, 'The HeroDragon Lord-Dragon': 3 });
    await new Promise(r => setTimeout(r, 50));

    const cloudDecks = await env.FirebaseService.loadDecks();
    const synced = cloudDecks.find(d => d.id === deck.id);
    assert.ok(synced, 'Updated deck cards must sync to cloud');
    assert.equal(synced.cards['The HeroDragon Lord-Dragon'], 3);
  });

  it('4. Deleting a deck locally also deletes it from Firebase cloud storage', async () => {
    const env = createMockEnvironment();
    const deck = env.DeckManager.createDeck('Temporary Deck', 'White', { 'Ray-Bullet': 2 });
    await new Promise(r => setTimeout(r, 50));

    // Confirm it exists in cloud
    let cloudDecks = await env.FirebaseService.loadDecks();
    assert.ok(cloudDecks.some(d => d.id === deck.id));

    // Delete deck
    env.DeckManager.deleteDeck(deck.id);
    await new Promise(r => setTimeout(r, 50));

    cloudDecks = await env.FirebaseService.loadDecks();
    assert.ok(!cloudDecks.some(d => d.id === deck.id), 'Deck must be removed from cloud store');
  });

  it('5. Full Logout & Login Lifecycle: Custom decks restore from cloud upon login', async () => {
    const env = createMockEnvironment();

    // 1. User is logged in and creates two custom decks
    const deck1 = env.DeckManager.createDeck('Tournament Red', 'Red', { 'The SengokuDragonEmperor Burning-Souldragon': 2 });
    const deck2 = env.DeckManager.createDeck('Control White', 'White', { 'The WingDeity Grand-Woden': 3 });
    await new Promise(r => setTimeout(r, 50));

    // Confirm decks are in cloud
    const initialCloudDecks = await env.FirebaseService.loadDecks();
    assert.equal(initialCloudDecks.length >= 2, true);

    // 2. User logs out: local custom decks are cleared
    await env.AuthManager.logout();
    const loggedOutDecks = env.DeckManager.getAllData().decks;
    assert.ok(!loggedOutDecks.some(d => d.name === 'Tournament Red'), 'Custom decks must be cleared on logout');

    // 3. User logs back in
    env.FirebaseService.setUser({ uid: 'user_123', email: 'duelist@example.com', displayName: 'HeroDuelist', isAnonymous: false });
    
    // 4. syncWithCloud() is called upon sign in
    await env.DeckManager.syncWithCloud();

    // 5. Verify decks are completely restored into DeckManager!
    const restoredData = env.DeckManager.getAllData();
    const restoredDecks = restoredData.decks || [];
    const restoredNames = restoredDecks.map(d => d.name);

    assert.ok(restoredNames.includes('Tournament Red'), 'Tournament Red deck must be restored from cloud');
    assert.ok(restoredNames.includes('Control White'), 'Control White deck must be restored from cloud');

    const tournamentDeck = restoredDecks.find(d => d.name === 'Tournament Red');
    assert.equal(tournamentDeck.cards['The SengokuDragonEmperor Burning-Souldragon'], 2);
  });

  it('6. Unsynced local decks created before logging in are pushed to cloud upon login', async () => {
    const env = createMockEnvironment();

    // Start with logged out user
    env.FirebaseService.setUser(null);
    env.cloudStore.clear();

    // User creates a deck locally while offline/guest
    const offlineDeck = env.DeckManager.createDeck('Offline Creation', 'Green', { 'The WingedBlade Gruid': 3 });
    
    // Now user signs in
    env.FirebaseService.setUser({ uid: 'user_456', email: 'newduelist@example.com', displayName: 'NewDuelist', isAnonymous: false });
    
    // Sync with cloud
    await env.DeckManager.syncWithCloud();

    // Cloud should now receive the offline-created deck!
    const cloudDecks = await env.FirebaseService.loadDecks();
    const synced = cloudDecks.find(d => d.name === 'Offline Creation');
    assert.ok(synced, 'Offline-created deck must be automatically uploaded to cloud on login');
    assert.equal(synced.cards['The WingedBlade Gruid'], 3);
  });

});
