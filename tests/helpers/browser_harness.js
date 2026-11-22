/**
 * tests/helpers/browser_harness.js
 * 
 * Lightweight headless DOM harness for testing battle_arena.js and real UI interaction flows in Node.js.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');

export function createBrowserEnvironment() {
  const elementsById = new Map();
  const elementsByClass = new Map();
  const storage = new Map();

  class MockDOMElement {
    constructor(tagName = 'div') {
      this.tagName = tagName.toUpperCase();
      this.children = [];
      this.parentNode = null;
      this.style = {};
      this.classList = {
        _classes: new Set(),
        add: (...cls) => cls.forEach(c => this.classList._classes.add(c)),
        remove: (...cls) => cls.forEach(c => this.classList._classes.delete(c)),
        contains: (c) => this.classList._classes.has(c)
      };
      this.attributes = new Map();
      this._innerHTML = '';
      this.textContent = '';
      this.onclick = null;
      this.dataset = {};
    }

    set id(val) {
      this.attributes.set('id', val);
      elementsById.set(val, this);
    }
    get id() {
      return this.attributes.get('id') || '';
    }

    set className(val) {
      this.attributes.set('class', val);
      this.classList._classes = new Set(val.split(/\s+/).filter(Boolean));
    }
    get className() {
      return Array.from(this.classList._classes).join(' ');
    }

    set innerHTML(html) {
      this._innerHTML = html;
      this.children = [];
      // Parse child data-act, data-uid, id, and button tags simply
      const tagRegex = /<([a-z0-9]+)([^>]*)>(.*?)<\/\1>|<([a-z0-9]+)([^>]*)\/>/gis;
      let match;
      while ((match = tagRegex.exec(html)) !== null) {
        const tagName = match[1] || match[4];
        const attrStr = match[2] || match[5] || '';
        const child = new MockDOMElement(tagName);
        child.parentNode = this;

        // Parse attributes
        const attrRegex = /([a-z0-9_-]+)=["']([^"']*)["']/gi;
        let aMatch;
        while ((aMatch = attrRegex.exec(attrStr)) !== null) {
          const aName = aMatch[1];
          const aVal = aMatch[2];
          child.setAttribute(aName, aVal);
          if (aName === 'id') child.id = aVal;
          if (aName === 'class') child.className = aVal;
          if (aName.startsWith('data-')) {
            const prop = aName.slice(5).replace(/-([a-z])/g, (_, l) => l.toUpperCase());
            child.dataset[prop] = aVal;
          }
        }
        child.textContent = (match[3] || '').replace(/<[^>]+>/g, '').trim();
        this.children.push(child);
      }
    }
    get innerHTML() {
      return this._innerHTML;
    }

    setAttribute(name, val) {
      this.attributes.set(name, String(val));
    }
    getAttribute(name) {
      return this.attributes.get(name) || null;
    }
    removeAttribute(name) {
      this.attributes.delete(name);
    }

    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
      if (child.id) elementsById.set(child.id, child);
      return child;
    }

    removeChild(child) {
      const idx = this.children.indexOf(child);
      if (idx !== -1) {
        this.children.splice(idx, 1);
        child.parentNode = null;
      }
      return child;
    }

    querySelector(sel) {
      return this.querySelectorAll(sel)[0] || null;
    }

    querySelectorAll(sel) {
      const matches = [];
      const traverse = (node) => {
        if (!node || !node.children) return;
        for (const child of node.children) {
          if (sel.startsWith('#') && child.id === sel.slice(1)) {
            matches.push(child);
          } else if (sel.startsWith('.') && child.classList.contains(sel.slice(1))) {
            matches.push(child);
          } else if (sel.startsWith('[') && sel.endsWith(']')) {
            const attrExp = sel.slice(1, -1);
            if (attrExp.includes('=')) {
              const [k, v] = attrExp.split('=').map(s => s.replace(/["']/g, '').trim());
              if (child.getAttribute(k) === v || child.dataset[k.replace('data-', '')] === v) {
                matches.push(child);
              }
            } else if (child.attributes.has(attrExp)) {
              matches.push(child);
            }
          } else if (child.tagName.toLowerCase() === sel.toLowerCase()) {
            matches.push(child);
          }
          traverse(child);
        }
      };
      traverse(this);
      return matches;
    }

    click() {
      if (typeof this.onclick === 'function') {
        this.onclick({ target: this, preventDefault: () => {}, stopPropagation: () => {} });
      }
    }

    getBoundingClientRect() {
      return { top: 100, left: 100, width: 200, height: 100, bottom: 200, right: 300 };
    }
  }

  const documentMock = {
    createElement: (tag) => new MockDOMElement(tag),
    getElementById: (id) => elementsById.get(id) || null,
    querySelector: (sel) => {
      if (sel.startsWith('#')) return elementsById.get(sel.slice(1)) || null;
      return documentMock.body.querySelector(sel);
    },
    querySelectorAll: (sel) => documentMock.body.querySelectorAll(sel),
    body: new MockDOMElement('body'),
    head: new MockDOMElement('head'),
    location: { href: 'http://localhost/arena.html', pathname: '/arena.html', search: '' }
  };

  const windowMock = {
    document: documentMock,
    location: documentMock.location,
    localStorage: {
      getItem: (k) => storage.get(k) || null,
      setItem: (k, v) => storage.set(k, String(v)),
      removeItem: (k) => storage.delete(k),
      clear: () => storage.clear()
    },
    sessionStorage: {
      getItem: (k) => storage.get('s_' + k) || null,
      setItem: (k, v) => storage.set('s_' + k, String(v)),
      removeItem: (k) => storage.delete('s_' + k),
      clear: () => storage.clear()
    },
    innerWidth: 1280,
    innerHeight: 800,
    AudioContext: class {
      constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; }
      createOscillator() { return { type: '', frequency: { setValueAtTime: () => {} }, connect: () => {}, start: () => {}, stop: () => {} }; }
      createGain() { return { gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => {} }; }
      resume() {}
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
    setInterval: globalThis.setInterval,
    clearInterval: globalThis.clearInterval
  };

  // Pre-populate core elements found in arena.html
  const arenaBoard = documentMock.createElement('div');
  arenaBoard.id = 'arenaBoard';
  documentMock.body.appendChild(arenaBoard);

  const playerLifeZone = documentMock.createElement('div');
  playerLifeZone.id = 'playerLifeZone';
  documentMock.body.appendChild(playerLifeZone);

  const opponentLifeZone = documentMock.createElement('div');
  opponentLifeZone.id = 'opponentLifeZone';
  documentMock.body.appendChild(opponentLifeZone);

  const playerHandZone = documentMock.createElement('div');
  playerHandZone.id = 'battlePlayerHand';
  documentMock.body.appendChild(playerHandZone);

  return { window: windowMock, document: documentMock };
}
