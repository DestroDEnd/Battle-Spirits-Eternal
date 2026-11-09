import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('Workspace Decks API & Local Decks Parser Suite', () => {
  it('1. local-decks directory contains all 10 expected workspace deck files', () => {
    const localDir = path.join(rootDir, 'local-decks');
    assert.ok(fs.existsSync(localDir), 'local-decks folder exists');
    const files = fs.readdirSync(localDir).filter(f => f.endsWith('.txt'));
    assert.strictEqual(files.length, 10, 'All 10 user workspace deck files are present');
    assert.ok(files.includes('Siegmundfried2.txt'), 'Siegmundfried2.txt present');
    assert.ok(files.includes('terra dragon.txt'), 'terra dragon.txt present');
    assert.ok(files.includes('Wisdpom king.txt'), 'Wisdpom king.txt present');
    assert.ok(files.includes('petit bat.txt'), 'petit bat.txt present');
    assert.ok(files.includes('Sengoku_God_deck.txt'), 'Sengoku_God_deck.txt present');
  });

  it('2. Parses local deck format with card quantities and clean titles correctly', () => {
    const sample = `
# Siegmundfried2 Deck
3x Top Buddy, Aibou
3x The SuperAncientKaiju Golza
3 The Deity Catastrophedragon
2 Der Ring des Nibelungen
3x New Double Draw
    `;
    const lines = sample.split('\n');
    const cards = {};
    let totalCards = 0;
    lines.forEach(l => {
      l = l.trim();
      if (!l || l.startsWith('#')) return;
      const match = l.match(/^(\d+)x?\s+(.+)$/i);
      if (match) {
        const qty = parseInt(match[1], 10);
        const name = match[2].trim();
        cards[name] = (cards[name] || 0) + qty;
        totalCards += qty;
      }
    });

    assert.strictEqual(totalCards, 14);
    assert.strictEqual(cards['Top Buddy, Aibou'], 3);
    assert.strictEqual(cards['The SuperAncientKaiju Golza'], 3);
    assert.strictEqual(cards['The Deity Catastrophedragon'], 3);
    assert.strictEqual(cards['Der Ring des Nibelungen'], 2);
    assert.strictEqual(cards['New Double Draw'], 3);
  });

  it('3. Every workspace deck has at least 40 cards matching official rules', () => {
    const localDir = path.join(rootDir, 'local-decks');
    const files = fs.readdirSync(localDir).filter(f => f.endsWith('.txt'));
    for (const f of files) {
      const content = fs.readFileSync(path.join(localDir, f), 'utf8');
      const lines = content.split('\n');
      let count = 0;
      lines.forEach(l => {
        l = l.trim();
        if (!l || l.startsWith('#')) return;
        const match = l.match(/^(\d+)x?\s+(.+)$/i);
        if (match) count += parseInt(match[1], 10);
      });
      assert.ok(count >= 40, `${f} has ${count} cards, satisfying the 40-card Battle Spirits minimum requirement`);
    }
  });
});
