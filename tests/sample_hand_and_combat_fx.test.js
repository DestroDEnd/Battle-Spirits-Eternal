import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const appSource = fs.readFileSync(path.join(rootDir, 'app.js'), 'utf8');
const battleArenaSource = fs.readFileSync(path.join(rootDir, 'battle_arena.js'), 'utf8');

function createTestDomEnvironment() {
  const elements = new Map();

  function createElement(tagName) {
    const el = {
      tagName: tagName.toUpperCase(),
      className: '',
      classList: {
        _classes: new Set(),
        add(c) { this._classes.add(c); el.className = Array.from(this._classes).join(' '); },
        remove(c) { this._classes.delete(c); el.className = Array.from(this._classes).join(' '); },
        contains(c) {
          if (this._classes.has(c)) return true;
          return (el.className || '').split(/\s+/).includes(c);
        }
      },
      style: {},
      children: [],
      dataset: {},
      innerHTML: '',
      textContent: '',
      parentElement: null,
      appendChild(child) {
        this.children.push(child);
        child.parentElement = this;
        return child;
      },
      removeChild(child) {
        const idx = this.children.indexOf(child);
        if (idx !== -1) this.children.splice(idx, 1);
        child.parentElement = null;
        return child;
      },
      querySelector(selector) {
        if (selector.startsWith('.')) {
          const cls = selector.slice(1);
          return this.children.find(c => c.classList.contains(cls)) || null;
        }
        if (selector.startsWith('#')) {
          const id = selector.slice(1);
          return this.children.find(c => c.id === id) || null;
        }
        return null;
      },
      querySelectorAll(selector) {
        const results = [];
        const check = (node) => {
          if (selector.startsWith('.')) {
            if (node.classList.contains(selector.slice(1))) results.push(node);
          }
          if (node.children) node.children.forEach(check);
        };
        this.children.forEach(check);
        return results;
      },
      getBoundingClientRect() {
        return { left: 100, top: 100, width: 200, height: 300, right: 300, bottom: 400 };
      },
      removeEventListener: () => {},
      addEventListener: () => {}
    };
    return el;
  }

  const document = {
    body: createElement('body'),
    createElement,
    getElementById(id) {
      if (id === 'sampleHandModal') return this.body.querySelector('#sampleHandModal');
      if (id === 'arenaBoard') return this.body.querySelector('#arenaBoard');
      if (id === 'combatFloatContainer') return this.body.querySelector('#combatFloatContainer');
      let found = null;
      const search = (node) => {
        if (node.id === id) { found = node; return; }
        if (node.children) node.children.forEach(search);
      };
      search(this.body);
      return found;
    },
    querySelector(sel) {
      return this.body.querySelector(sel);
    },
    querySelectorAll(sel) {
      return this.body.querySelectorAll(sel);
    },
    addEventListener: () => {}
  };

  const localStorage = {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; }
  };

  const window = {
    document,
    localStorage,
    innerWidth: 1200,
    innerHeight: 800,
    addEventListener: () => {},
    removeEventListener: () => {},
    AudioContext: class {
      createOscillator() {
        return {
          type: 'sine',
          frequency: { setValueAtTime: () => {} },
          connect: () => {},
          start: () => {},
          stop: () => {}
        };
      }
      createGain() {
        return {
          gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
          connect: () => {}
        };
      }
      get destination() { return {}; }
      get currentTime() { return 0; }
    }
  };

  const sandbox = {
    window,
    document,
    localStorage,
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    Math
  };
  sandbox.window.window = window;

  vm.createContext(sandbox);
  return sandbox;
}

describe('Sample Opening Hand Simulator & Arena Combat Polish Suite', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = createTestDomEnvironment();
    vm.runInContext(appSource, sandbox);
    vm.runInContext(battleArenaSource, sandbox);
  });

  it('1. SampleHandSimulator creates modal in DOM with required controls', () => {
    const simulator = sandbox.window.SampleHandSimulator;
    assert.ok(simulator, 'SampleHandSimulator should be available globally');

    simulator.ensureModalInDom();
    const modal = sandbox.document.getElementById('sampleHandModal');
    assert.ok(modal, 'Modal should exist in DOM');
    assert.ok(modal.classList.contains('sample-hand-overlay'), 'Should have sample-hand-overlay class');
  });

  it('2. SampleHandSimulator properly flattens deck and detects Contract partner', () => {
    const simulator = sandbox.window.SampleHandSimulator;
    const testDeck = {
      name: 'Hell Contract Test Deck',
      cards: {
        'The PartnerDemonLord Javad': 1,
        'The Hellsea FourDemonLords': 3,
        'Dark Knight': 3,
        'Sudden Death Draw': 3
      }
    };

    simulator.loadDeck(testDeck);
    assert.equal(simulator._deckName, 'Hell Contract Test Deck');
    assert.equal(simulator._allCards.length, 10, 'Deck should flatten to 10 total card instances');
    assert.ok(simulator._contractCard, 'Contract card should be detected');
    assert.equal(simulator._contractCard.name, 'The PartnerDemonLord Javad');
  });

  it('3. SampleHandSimulator guarantees Contract card in opening 4 cards when enabled', () => {
    const simulator = sandbox.window.SampleHandSimulator;
    const testDeck = {
      name: 'Test Deck',
      cards: {
        'The PartnerDemonLord Javad': 1,
        'Demon Spirit A': 3,
        'Demon Spirit B': 3,
        'Demon Spirit C': 3,
        'Demon Spirit D': 3
      }
    };

    simulator.loadDeck(testDeck);
    simulator._guaranteeContract = true;
    simulator.mulligan();

    assert.equal(simulator._hand.length, 4, 'Opening hand must draw exactly 4 cards');
    const hasContract = simulator._hand.some(c => c.name === 'The PartnerDemonLord Javad');
    assert.ok(hasContract, 'Opening hand must contain the Contract card');
    assert.equal(simulator._deckPool.length, 9, 'Remaining deck should have 9 cards');
  });

  it('4. SampleHandSimulator drawOne increments hand and decrements deck', () => {
    const simulator = sandbox.window.SampleHandSimulator;
    const testDeck = {
      name: 'Test Deck',
      cards: {
        'Card 1': 3,
        'Card 2': 3,
        'Card 3': 3
      }
    };

    simulator.loadDeck(testDeck);
    simulator.mulligan();
    assert.equal(simulator._hand.length, 4);
    assert.equal(simulator._deckPool.length, 5);

    simulator.drawOne();
    assert.equal(simulator._hand.length, 5, 'Hand size should increase to 5 after drawing');
    assert.equal(simulator._deckPool.length, 4, 'Deck size should decrease to 4');
  });

  it('5. BattleArena.triggerScreenShake adds shake-screen class to arena board', () => {
    const arena = sandbox.window.BattleArena;
    assert.ok(arena.triggerScreenShake, 'triggerScreenShake should be exported on BattleArena');

    const board = sandbox.document.createElement('div');
    board.id = 'arenaBoard';
    sandbox.document.body.appendChild(board);

    arena.triggerScreenShake();
    assert.ok(board.classList.contains('shake-screen'), 'Board should have shake-screen class applied');
  });

  it('6. BattleArena.spawnFloatingCombatText spawns floating text elements', () => {
    const arena = sandbox.window.BattleArena;
    assert.ok(arena.spawnFloatingCombatText, 'spawnFloatingCombatText should be exported on BattleArena');

    arena.spawnFloatingCombatText('player', '-1 LIFE 💔', 'damage');
    const container = sandbox.document.getElementById('combatFloatContainer');
    assert.ok(container, 'Floating combat container should be created');
    assert.equal(container.children.length, 1);

    const textEl = container.children[0];
    assert.equal(textEl.textContent, '-1 LIFE 💔');
    assert.ok(textEl.classList.contains('combat-float-text'));
    assert.ok(textEl.classList.contains('type-damage'));
  });

  it('7. AudioFX.lifeDamage triggers screen shake and floating text automatically', () => {
    const arena = sandbox.window.BattleArena;
    const audio = arena.AudioFX;
    assert.ok(audio, 'AudioFX should exist on BattleArena');

    const board = sandbox.document.createElement('div');
    board.id = 'arenaBoard';
    sandbox.document.body.appendChild(board);

    audio.lifeDamage();
    assert.ok(board.classList.contains('shake-screen'), 'Life damage should trigger screen shake');
    const container = sandbox.document.getElementById('combatFloatContainer');
    assert.ok(container && container.children.length > 0, 'Life damage should spawn combat text');
  });
});
