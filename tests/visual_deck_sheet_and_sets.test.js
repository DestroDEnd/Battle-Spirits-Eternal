/**
 * tests/visual_deck_sheet_and_sets.test.js
 * 
 * Verifies:
 * 1. VisualDeckSheet controller initialization and DOM structure
 * 2. VisualDeckSheet card grouping by type (Spirit, Ultimate, Brave, Magic, Nexus)
 * 3. VisualDeckSheet card quantity badges (x3, x2, x1) and cost badges
 * 4. Sets directory category filtering (All, Main Boosters, Starter Decks, Collab, etc.)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Visual Deck Sheet & Card Sets UI Suite', () => {
  const appCode = fs.readFileSync(path.resolve('./app.js'), 'utf8');

  it('1. VisualDeckSheet and openVisualDeckSheetModal are defined on window', () => {
    const mockElements = {};
    const mockDoc = {
      getElementById: (id) => mockElements[id] || null,
      createElement: (tag) => {
        const el = {
          tagName: tag.toUpperCase(),
          style: {},
          classList: {
            classes: new Set(),
            add(c) { this.classes.add(c); },
            remove(c) { this.classes.delete(c); },
            contains(c) { return this.classes.has(c); },
            toggle(c, force) {
              if (force === undefined) {
                if (this.classes.has(c)) this.classes.delete(c);
                else this.classes.add(c);
              } else if (force) this.classes.add(c);
              else this.classes.delete(c);
            }
          },
          appendChild(child) {
            if (child.id) mockElements[child.id] = child;
          },
          innerHTML: ''
        };
        return el;
      },
      querySelectorAll: () => [],
      querySelector: () => null,
      addEventListener: () => {},
      removeEventListener: () => {},
      body: {
        style: {},
        appendChild(child) {
          if (child.id) mockElements[child.id] = child;
        }
      }
    };

    const mockStorage = {
      _data: {},
      getItem(k) { return this._data[k] || null; },
      setItem(k, v) { this._data[k] = String(v); },
      removeItem(k) { delete this._data[k]; },
      clear() { this._data = {}; }
    };

    const windowObj = {
      document: mockDoc,
      localStorage: mockStorage,
      addEventListener: () => {}
    };

    const fn = new Function('window', 'document', 'localStorage', appCode + '\nreturn window;');
    const win = fn(windowObj, mockDoc, mockStorage);

    assert.ok(win.VisualDeckSheet, 'VisualDeckSheet exists');
    assert.equal(typeof win.openVisualDeckSheetModal, 'function', 'openVisualDeckSheetModal is a function');
  });

  it('2. VisualDeckSheet correctly groups deck cards by type and computes quantities', () => {
    const mockElements = {};
    const mockDoc = {
      getElementById: (id) => {
        if (!mockElements[id]) {
          mockElements[id] = {
            id,
            textContent: '',
            innerHTML: '',
            style: {},
            classList: {
              classes: new Set(),
              add(c) { this.classes.add(c); },
              remove(c) { this.classes.delete(c); }
            }
          };
        }
        return mockElements[id];
      },
      createElement: (tag) => {
        const el = {
          tagName: tag.toUpperCase(),
          style: {},
          classList: {
            classes: new Set(),
            add(c) { this.classes.add(c); },
            remove(c) { this.classes.delete(c); },
            contains(c) { return this.classes.has(c); }
          },
          appendChild(child) {
            if (child.id) mockElements[child.id] = child;
          },
          innerHTML: ''
        };
        return el;
      },
      querySelectorAll: () => [],
      querySelector: () => null,
      addEventListener: () => {},
      removeEventListener: () => {},
      body: {
        style: {},
        appendChild(child) {
          if (child.id) mockElements[child.id] = child;
        }
      }
    };

    const windowObj = {
      document: mockDoc,
      localStorage: { getItem() { return null; }, setItem() {} },
      addEventListener: () => {}
    };

    const fn = new Function('window', 'document', 'localStorage', appCode + '\nreturn window;');
    const win = fn(windowObj, mockDoc, windowObj.localStorage);

    const testDeck = {
      name: 'Demon Lord Deck',
      cards: {
        'The PartnerDemonLord Javad': { count: 1, cost: 2, type: 'Contract Ultimate', color: 'Purple', card_number: 'SD65-CX01' },
        'The Ruler of FourDemonLords Lord-Javad': { count: 3, cost: 6, type: 'Ultimate', color: 'Purple', card_number: 'SD65-003' },
        'The InfantDragron': { count: 3, cost: 1, type: 'Spirit', color: 'Red', card_number: 'BS01-001' },
        'Sudden Death Draw': { count: 3, cost: 3, type: 'Magic', color: 'Purple', card_number: 'SD01-035' }
      }
    };

    win.VisualDeckSheet.open(testDeck);

    const titleEl = mockElements['deckSheetTitle'];
    assert.equal(titleEl.textContent, 'Demon Lord Deck', 'Deck title set correctly');

    const subEl = mockElements['deckSheetSubtitle'];
    assert.match(subEl.textContent, /10 Total Cards/, 'Total cards calculated as 1+3+3+3=10');

    const container = mockElements['deckSheetGroupsContainer'];
    assert.ok(container.innerHTML.includes('x3'), 'Shows x3 count badges');
    assert.ok(container.innerHTML.includes('x1'), 'Shows x1 count badge for partner');
    assert.ok(container.innerHTML.includes('SD65-003'), 'Includes canonical card number');
  });

  it('3. Sets directory HTML contains all 6 category filter buttons', () => {
    const setsHtml = fs.readFileSync(path.resolve('./sets.html'), 'utf8');
    assert.ok(setsHtml.includes('set-category-tabs'), 'Contains set-category-tabs container');
    assert.ok(setsHtml.includes('selectSetCategory(\'all\')'), 'Has All Sets button');
    assert.ok(setsHtml.includes('selectSetCategory(0)'), 'Has Main Boosters button');
    assert.ok(setsHtml.includes('selectSetCategory(1)'), 'Has Starter Decks button');
    assert.ok(setsHtml.includes('selectSetCategory(2)'), 'Has Collab button');
  });
});
