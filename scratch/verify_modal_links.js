const fs = require('fs');

const appJs = fs.readFileSync('app.js', 'utf-8');

// Extract formatEffectKeywordsInModal from app.js
const fnStart = appJs.indexOf('function formatEffectKeywordsInModal(text) {');
const fnEnd = appJs.indexOf('\nfunction deleteFromDeck(');
const fnCode = appJs.slice(fnStart, fnEnd);

function esc(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const evalContext = new Function('esc', `
  ${fnCode}
  return formatEffectKeywordsInModal;
`);

const formatModal = evalContext(esc);

// Card 1: Nouvelle-Vague
const nvEffect = `[Summon Condition: You have one or more counters]

Flash - (Either Attack Step)
(Once per Turn: Same Name) Including being in Soul State/pre-advent condition, if you control any “The PartnerDemonLord Javad”, by sending two cores from your Reserve to the Trash, summon this card from the Hand, without paying the cost.

[LV3][LV4][LV5] (When Summoned/Attacks)
Put a core from the Void to this Ultimate, and exhaust an opposing Spirit. Then, if you have six counters or more, you can return an opposing exhausted Spirit to the deckbottom.`;

console.log("=== Nouvelle-Vague Formatted HTML ===");
const html1 = formatModal(nvEffect);
console.log(html1);

// Card 2: Magnazappah
const mzEffect = `[Summon Condition: You control one or more "The PartnerDemonLord Javad", including being in Soul State/pre-advent condition]

(Once per Turn: Same Name) When your "Evil God" family Ultimates would leave the Field due to the opponent, you can summon this card from the Hand, without paying the cost.`;

console.log("\n=== Magnazappah Formatted HTML ===");
const html2 = formatModal(mzEffect);
console.log(html2);

// Assertions
if (!html1.includes('openCardDetail(\'The PartnerDemonLord Javad\')')) {
  console.error("FAIL: Javad link missing in Nouvelle-Vague!");
  process.exit(1);
}
if (!html2.includes('openCardDetail(\'The PartnerDemonLord Javad\')')) {
  console.error("FAIL: Javad link missing in Magnazappah!");
  process.exit(1);
}
console.log("\nALL TESTS PASSED! Both cards now have clickable links for 'The PartnerDemonLord Javad'!");
