const assert = require('assert');
const fs = require('fs');

// Verify featured_x_rares.json exists and is valid
const staticFeatured = JSON.parse(fs.readFileSync('featured_x_rares.json', 'utf-8'));
assert(staticFeatured.cards && staticFeatured.cards.length > 0, 'Static featured cards should exist');
assert(staticFeatured.by_color && staticFeatured.by_color.Red.length > 0, 'Static Red featured cards should exist');
console.log('✅ featured_x_rares.json verified: ' + staticFeatured.cards.length + ' general cards, ' + Object.keys(staticFeatured.by_color).length + ' colors.');

// Check cards in deck like Curse of Hades, Bomburst
const colors = ['Red', 'Purple', 'Green', 'White', 'Yellow', 'Blue'];
for (const col of colors) {
  assert(staticFeatured.by_color[col] && staticFeatured.by_color[col].length >= 10, 'Each color must have at least 10 X-Rares');
}
console.log('✅ All 6 color X-Rare pools verified!');
